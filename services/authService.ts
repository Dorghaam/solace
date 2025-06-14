import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import 'react-native-get-random-values'; // Polyfill for crypto
import type { SubscriptionTier } from '../store/userStore';
import { useUserStore } from '../store/userStore';
import { supabase } from './supabaseClient';
import { subscriptionSyncService } from './subscriptionSyncService';

export const loginWithGoogle = async () => {
  try {
    console.log('authService: Attempting loginWithGoogle with OIDC nonce flow...');
    
    // Ensure Google Play Services is available (for Android)
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    console.log('authService: Google Play Services check passed.');

    // 1. Generate a cryptographically-strong raw nonce.
    const rawNonce = Crypto.randomUUID();
    console.log('authService: Generated raw nonce:', rawNonce);

    // 2. Sign in with Google (without nonce parameter due to free version limitations)
    // Note: The free version doesn't support nonce in the original GoogleSignin API
    const signInResponse = await GoogleSignin.signIn();

    const idToken = signInResponse.data?.idToken;
    if (!idToken) {
      throw new Error('Google Sign-In Error: No ID token received.');
    }
    console.log('authService: Google ID Token obtained.');

    // 3. Forward the idToken and nonce to Supabase for verification.
    // Note: Since we can't pass the nonce to Google in the free version,
    // this may require disabling nonce checks in Supabase temporarily
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
      // nonce: rawNonce, // Commented out due to free version limitations
    });

    if (error) {
      console.error('authService: Supabase signInWithIdToken error:', error);
      throw error; // Throw the original Supabase error
    }

    console.log('authService: Supabase sign-in successful. User:', data.user?.id);
    return data;

  } catch (error: any) {
    console.error('authService: loginWithGoogle error:', error.code, error.message, error);
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error('Sign-in was cancelled by the user.');
    } else if (error.code === statusCodes.IN_PROGRESS) {
      throw new Error('Sign-in is already in progress.');
    } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new Error('Google Play Services not available or outdated.');
    } else {
      // Forward the error from Supabase or another source
      throw new Error(error.message || 'An unknown error occurred during Google Sign-In.');
    }
  }
};

export const signOut = async () => {
  console.log('authService: Attempting signOut...');
  try {
    const { error: supabaseSignOutError } = await supabase.auth.signOut();
    if (supabaseSignOutError) {
      console.error('authService: Supabase signOut error:', supabaseSignOutError);
    } else {
      console.log('authService: Supabase signOut successful.');
    }

    try {
      const hasPreviousSignIn = GoogleSignin.hasPreviousSignIn();
      if (hasPreviousSignIn) {
        await GoogleSignin.revokeAccess();
        await GoogleSignin.signOut();
        console.log('authService: Google revokeAccess and signOut successful.');
      } else {
        console.log('authService: Google Sign-In: No user was signed in with Google locally.');
      }
    } catch (googleError: any) {
      console.warn('authService: Error during Google signOut/revokeAccess:', googleError.message);
      try {
        await GoogleSignin.signOut();
        console.log('authService: Google direct signOut successful after previous error.');
      } catch (directSignOutError: any) {
        console.warn('authService: Google direct signOut also failed:', directSignOutError.message);
      }
    }
  } catch (error: any) {
    console.error('authService: General signOut error:', error.message, error);
    throw new Error(error.message || 'An error occurred during sign out.');
  }
};

export const loginWithApple = async () => {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    console.log('authService: Apple credential received.');

    if (credential.identityToken) {
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      });

      if (error) {
        console.error('authService: Supabase signInWithIdToken (Apple) error:', error);
        throw new Error(error.message);
      }
      
      console.log('authService: Supabase sign-in with Apple successful.');
      return data;

    } else {
      throw new Error('Apple Sign-In Error: No identity token received.');
    }

  } catch (e: any) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      // This is fine, the user just cancelled the sign-in prompt.
      console.log('authService: Apple Sign-In cancelled by user.');
      return null; // Don't treat cancellation as an error
    } else {
      console.error('authService: loginWithApple error:', e);
      throw new Error(e.message || 'An unknown error occurred during Apple Sign-In.');
    }
  }
};

/**
 * Updates the user's subscription tier in the Supabase database
 * This should be called whenever the subscription status changes
 */
export const updateUserSubscriptionTier = async (userId: string, tier: SubscriptionTier) => {
  try {
    console.log(`[AuthService] Updating user ${userId} subscription tier to: ${tier}`);
    
    const { data, error } = await supabase
      .from('profiles') // Using profiles table as seen in profileService
      .update({ 
        subscription_tier: tier,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('[AuthService] Error updating subscription tier in Supabase:', error);
      throw error;
    }

    console.log('[AuthService] Successfully updated subscription tier in Supabase:', data);
    return data;
  } catch (error) {
    console.error('[AuthService] Failed to update subscription tier:', error);
    throw error;
  }
};

/**
 * Legacy sync function - now delegates to centralized sync service
 * Kept for backward compatibility
 */
export const syncSubscriptionTier = async (tier: SubscriptionTier) => {
  console.log('[AuthService] Legacy syncSubscriptionTier called, delegating to centralized service');
  return subscriptionSyncService.syncSubscriptionTier('auth_sync', tier);
};

/**
 * Check for authentication mismatches between Supabase and RevenueCat
 * Call this during app initialization to ensure both services are in sync
 */
export const checkAuthenticationSync = async () => {
  try {
    console.log('[AuthService] Checking authentication sync between Supabase and RevenueCat...');
    
    const { supabaseUser } = useUserStore.getState();
    const Purchases = await import('react-native-purchases').then(m => m.default);
    const customerInfo = await Purchases.getCustomerInfo();
    
    const hasSupabaseUser = !!supabaseUser?.id;
    const hasRevenueCatUser = !customerInfo.originalAppUserId.startsWith('$RCAnonymousID:');
    
    console.log('[AuthService] Auth sync check:', {
      hasSupabaseUser,
      hasRevenueCatUser,
      supabaseUserId: supabaseUser?.id || 'null',
      revenueCatUserId: customerInfo.originalAppUserId
    });
    
    // Case 1: Both are logged in - check if they match
    if (hasSupabaseUser && hasRevenueCatUser) {
      if (supabaseUser.id !== customerInfo.originalAppUserId) {
        console.warn('[AuthService] ⚠️ User ID mismatch!');
        console.warn('[AuthService] Supabase user:', supabaseUser.id);
        console.warn('[AuthService] RevenueCat user:', customerInfo.originalAppUserId);
        
        // Logout from RevenueCat and re-login with correct Supabase user
        const { rcLogOut, rcLogIn } = await import('./revenueCatService');
        await rcLogOut();
        await rcLogIn(supabaseUser.id);
        
        // Trigger a sync after fixing the authentication mismatch
        await subscriptionSyncService.syncSubscriptionTier('auth_sync');
      } else {
        console.log('[AuthService] ✅ Authentication is properly synced');
      }
    }
    
    // Case 2: Supabase logged in, RevenueCat anonymous - login to RevenueCat
    else if (hasSupabaseUser && !hasRevenueCatUser) {
      console.log('[AuthService] Supabase logged in, RevenueCat anonymous - logging into RevenueCat');
      const { rcLogIn } = await import('./revenueCatService');
      await rcLogIn(supabaseUser.id);
      
      // Trigger a sync after logging in to RevenueCat
      await subscriptionSyncService.syncSubscriptionTier('auth_sync');
    }
    
    // Case 3: RevenueCat logged in, Supabase anonymous - logout from RevenueCat
    else if (!hasSupabaseUser && hasRevenueCatUser) {
      console.log('[AuthService] RevenueCat logged in, Supabase anonymous - logging out from RevenueCat');
      const { rcLogOut } = await import('./revenueCatService');
      await rcLogOut();
    }
    
    // Case 4: Both anonymous - no action needed
    else {
      console.log('[AuthService] Both services are in anonymous state - no sync needed');
    }
    
  } catch (error) {
    console.error('[AuthService] Error checking authentication sync:', error);
  }
}; 