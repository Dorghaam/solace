import Constants from 'expo-constants';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { syncSubscriptionTier } from './authService';

// Ensure your RevenueCat public API key is in .env and app.config.js
const apiKey = Constants.expoConfig?.extra?.RC_API_KEY as string;

/**
 * Initializes the RevenueCat SDK with the API key.
 * Sets up a listener to automatically update the subscription tier in the Zustand store
 * AND sync it to Supabase database whenever the user's subscription status changes.
 */
export const initRevenueCat = () => {
  console.log('[RevenueCat] Checking API key configuration...');
  
  if (apiKey) {
    console.log('[RevenueCat] API key found, configuring SDK. Key starts with:', apiKey.substring(0, 8) + '...');
    Purchases.configure({ apiKey }); // Configure with API key

    // Add a listener for customer info updates
    Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
      // Check for the 'premium' entitlement instead of just active subscriptions
      const hasPremiumEntitlement = info.entitlements.active['premium']?.isActive || false;
      const newTier = hasPremiumEntitlement ? 'premium' : 'free';
      
      console.log('[RevenueCat] Customer info updated:', {
        originalAppUserId: info.originalAppUserId,
        hasPremiumEntitlement,
        newTier,
        activeEntitlements: Object.keys(info.entitlements.active),
        activeSubscriptions: info.activeSubscriptions,
        timestamp: new Date().toISOString()
      });
      
      // Only sync if this represents a meaningful change
      const currentTier = require('../store/userStore').useUserStore.getState().subscriptionTier;
      if (currentTier !== newTier) {
        console.log('[RevenueCat] Subscription tier changed from', currentTier, 'to', newTier, '- syncing...');
        // Sync subscription tier to both local state AND Supabase database
        syncSubscriptionTier(newTier);
      } else {
        console.log('[RevenueCat] Subscription tier unchanged (', newTier, ') - no sync needed');
      }
    });
    
    console.log('[RevenueCat] SDK configured successfully with customer info listener');
  } else {
    console.warn('[RevenueCat] API key is missing. RevenueCat will not be configured.');
    console.warn('[RevenueCat] Check your .env file for EXPO_PUBLIC_RC_API_KEY');
  }
};

/**
 * Logs the user into RevenueCat using their unique Supabase user ID.
 * This links their purchase history to their Supabase account.
 * @param userId The unique ID of the user from Supabase.
 */
export const rcLogIn = async (userId: string) => {
  try {
    console.log('[RevenueCat] Attempting to login user:', userId);
    
    // Check current user state before login
    const currentCustomerInfo = await Purchases.getCustomerInfo();
    console.log('[RevenueCat] Current user before login:', currentCustomerInfo.originalAppUserId);
    
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('[RevenueCat] User logged in successfully. New user ID:', customerInfo.originalAppUserId);
    
    // Check entitlements after login and sync to database
    const hasPremiumEntitlement = customerInfo.entitlements.active['premium']?.isActive || false;
    const tier = hasPremiumEntitlement ? 'premium' : 'free';
    
    console.log('[RevenueCat] Login entitlement check:', {
      hasPremiumEntitlement,
      tier,
      activeEntitlements: Object.keys(customerInfo.entitlements.active),
      originalAppUserId: customerInfo.originalAppUserId
    });
    
    // Sync subscription tier to both local state AND Supabase database
    await syncSubscriptionTier(tier);
    
  } catch (e: any) {
    console.error('[RevenueCat] Login failed for user:', userId, 'Error:', e);
    
    // Check if the error is network related
    if (e.message && (e.message.includes('network') || e.message.includes('internet'))) {
      console.warn('[RevenueCat] Network error during login - user will remain anonymous temporarily');
    }
    
    // Don't throw the error to prevent app crashes during login
    // The user can still use the app, just without RevenueCat features
  }
};

/**
 * Logs the user out of RevenueCat. This should be called when the user signs out of Supabase.
 */
export const rcLogOut = async () => {
  try {
    // Check if user is already anonymous before attempting logout
    const customerInfo = await Purchases.getCustomerInfo();
    const originalUserId = customerInfo.originalAppUserId;
    
    console.log('[RevenueCat] Checking user state before logout. User ID:', originalUserId);
    
    if (originalUserId.startsWith('$RCAnonymousID:')) {
      console.log('[RevenueCat] User is already anonymous, skipping logout.');
      return;
    }
    
    console.log('[RevenueCat] Attempting to logout user:', originalUserId);
    await Purchases.logOut();
    console.log('[RevenueCat] User logged out successfully.');
  } catch (e: any) {
    // Check if the error is specifically about anonymous user
    if (e.message && e.message.includes('anonymous')) {
      console.log('[RevenueCat] Logout skipped - user was already anonymous:', e.message);
      return; // Don't treat this as an error
    }
    
    console.warn('[RevenueCat] Logout failed:', e);
    // Don't throw the error to prevent app crashes during logout
  }
};

/**
 * Get current customer info and check entitlements
 */
export const checkPremiumStatus = async (): Promise<boolean> => {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const hasPremiumEntitlement = customerInfo.entitlements.active['premium']?.isActive || false;
    
    console.log('[RevenueCat] Premium status check:', {
      hasPremiumEntitlement,
      activeEntitlements: Object.keys(customerInfo.entitlements.active)
    });
    
    return hasPremiumEntitlement;
  } catch (error) {
    console.error('[RevenueCat] Error checking premium status:', error);
    return false;
  }
};