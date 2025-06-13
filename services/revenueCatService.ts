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
  if (apiKey) {
    Purchases.configure({ apiKey }); // Configure with API key

    // Add a listener for customer info updates
    Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
      // Check for the 'premium' entitlement instead of just active subscriptions
      const hasPremiumEntitlement = info.entitlements.active['premium']?.isActive || false;
      const newTier = hasPremiumEntitlement ? 'premium' : 'free';
      
      console.log('[RevenueCat] Customer info updated:', {
        hasPremiumEntitlement,
        newTier,
        activeEntitlements: Object.keys(info.entitlements.active),
        activeSubscriptions: info.activeSubscriptions
      });
      
      // Sync subscription tier to both local state AND Supabase database
      syncSubscriptionTier(newTier);
    });
  } else {
    console.warn('[RevenueCat] API key is missing. RevenueCat will not be configured.');
  }
};

/**
 * Logs the user into RevenueCat using their unique Supabase user ID.
 * This links their purchase history to their Supabase account.
 * @param userId The unique ID of the user from Supabase.
 */
export const rcLogIn = async (userId: string) => {
  try {
    const { customerInfo } = await Purchases.logIn(userId);
    console.log('[RevenueCat] User logged in successfully.');
    
    // Check entitlements after login and sync to database
    const hasPremiumEntitlement = customerInfo.entitlements.active['premium']?.isActive || false;
    const tier = hasPremiumEntitlement ? 'premium' : 'free';
    
    console.log('[RevenueCat] Login entitlement check:', {
      hasPremiumEntitlement,
      tier
    });
    
    // Sync subscription tier to both local state AND Supabase database
    await syncSubscriptionTier(tier);
    
  } catch (e) {
    console.warn('[RevenueCat] Login failed:', e);
  }
};

/**
 * Logs the user out of RevenueCat. This should be called when the user signs out of Supabase.
 */
export const rcLogOut = async () => {
  try {
    // Check if user is already anonymous before attempting logout
    const customerInfo = await Purchases.getCustomerInfo();
    if (customerInfo.originalAppUserId.startsWith('$RCAnonymousID:')) {
      console.log('[RevenueCat] User is already anonymous, skipping logout.');
      return;
    }
    
    await Purchases.logOut();
    console.log('[RevenueCat] User logged out successfully.');
  } catch (e) {
    console.warn('[RevenueCat] Logout failed:', e);
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