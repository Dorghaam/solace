import Purchases, { CustomerInfo } from 'react-native-purchases';
import Constants from 'expo-constants';
import { useUserStore } from '../store/userStore';

// Ensure your RevenueCat public API key is in .env and app.config.js
const apiKey = Constants.expoConfig?.extra?.RC_API_KEY as string;

/**
 * Initializes the RevenueCat SDK with the API key.
 * Sets up a listener to automatically update the subscription tier in the Zustand store
 * whenever the user's subscription status changes.
 */
export const initRevenueCat = () => {
  if (apiKey) {
    Purchases.configure({ apiKey }); // Configure with API key

    // Add a listener for customer info updates
    Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
      const entitlements = info.activeSubscriptions || []; // Or you can check for specific entitlements: info.entitlements.active['your-entitlement-name']
      
      // Update the global state with the user's subscription tier.
      // If there are any active subscriptions, they are considered 'premium'.
      useUserStore.getState().setSubscriptionTier(
        entitlements.length > 0 ? 'premium' : 'free'
      );
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
    await Purchases.logIn(userId);
    console.log('[RevenueCat] User logged in successfully.');
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