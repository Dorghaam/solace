import Constants from 'expo-constants';
import Purchases, { CustomerInfo } from 'react-native-purchases';
import { subscriptionSyncService } from './subscriptionSyncService';

// Ensure your RevenueCat public API key is in .env and app.config.js
const apiKey = Constants.expoConfig?.extra?.RC_API_KEY as string;

// Add a periodic check timer
let subscriptionCheckTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Initializes the RevenueCat SDK with the API key.
 * Sets up a listener to automatically update the subscription tier in the Zustand store
 * AND sync it to Supabase database whenever the user's subscription status changes.
 */
export const initRevenueCat = () => {
  console.log('[RevenueCat] Checking API key configuration...');
  
  if (apiKey) {
    console.log('[RevenueCat] API key found, configuring SDK. Key starts with:', apiKey.substring(0, 8) + '...');
    Purchases.configure({ apiKey });

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
      
      // Use the centralized sync service with the definitive tier from RevenueCat
      subscriptionSyncService.syncSubscriptionTier('revenuecat_listener', newTier);
    });
    
    // Start periodic subscription checking
    startPeriodicSubscriptionCheck();
    
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
    
    // Use centralized sync service
    await subscriptionSyncService.syncSubscriptionTier('auth_sync', tier);
    
    // Restart periodic checking after login
    startPeriodicSubscriptionCheck();
    
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
    
    // Stop periodic checking after logout
    stopPeriodicSubscriptionCheck();
    
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
 * Get current customer info and check entitlements with improved error handling
 */
export const checkPremiumStatus = async (timeoutMs: number = 10000): Promise<boolean> => {
  const timeoutPromise = new Promise<boolean>((_, reject) => {
    setTimeout(() => reject(new Error('RevenueCat timeout')), timeoutMs);
  });

  const checkPromise = async (): Promise<boolean> => {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const hasPremiumEntitlement = customerInfo.entitlements.active['premium']?.isActive || false;
      
      console.log('[RevenueCat] Premium status check:', {
        hasPremiumEntitlement,
        activeEntitlements: Object.keys(customerInfo.entitlements.active),
        timestamp: new Date().toISOString()
      });
      
      return hasPremiumEntitlement;
    } catch (error) {
      console.error('[RevenueCat] Error checking premium status:', error);
      throw error;
    }
  };

  try {
    return await Promise.race([checkPromise(), timeoutPromise]);
  } catch (error) {
    console.error('[RevenueCat] Premium status check failed:', error);
    return false;
  }
};

/**
 * Start periodic subscription status checking
 * This helps catch subscription changes that might not trigger the listener
 */
const startPeriodicSubscriptionCheck = () => {
  // Clear any existing timer
  stopPeriodicSubscriptionCheck();
  
  console.log('[RevenueCat] Starting periodic subscription check (every 10 minutes)');
  
  subscriptionCheckTimer = setInterval(async () => {
    try {
      console.log('[RevenueCat] Starting periodic subscription check...');
      
      // Use centralized sync service for periodic checks
      await subscriptionSyncService.syncSubscriptionTier('periodic_check');
      
      console.log('[RevenueCat] ✅ Periodic check completed');
    } catch (error) {
      console.warn('[RevenueCat] Periodic subscription check failed:', error);
    }
  }, 10 * 60 * 1000); // Check every 10 minutes (reduced frequency)
};

/**
 * Stop periodic subscription checking
 */
const stopPeriodicSubscriptionCheck = () => {
  if (subscriptionCheckTimer) {
    console.log('[RevenueCat] Stopping periodic subscription check');
    clearInterval(subscriptionCheckTimer);
    subscriptionCheckTimer = null;
  }
};

/**
 * Force refresh subscription status (useful for debugging)
 */
export const forceRefreshSubscriptionStatus = async (): Promise<void> => {
  console.log('[RevenueCat] 🔄 Force refreshing subscription status...');
  try {
    await Purchases.syncPurchases();
    
    // Use centralized sync service with force refresh
    await subscriptionSyncService.syncSubscriptionTier('manual_refresh');
    
    console.log('[RevenueCat] ✅ Force refresh completed');
  } catch (error) {
    console.error('[RevenueCat] Force refresh failed:', error);
    throw error;
  }
};