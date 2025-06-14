import { SubscriptionTier, useUserStore } from '@/store/userStore';
import { supabase } from './supabaseClient';

/**
 * Fetches the user's profile from the 'profiles' table and updates the Zustand store.
 * This should be called after the user has been authenticated.
 * @param userId The ID of the authenticated user.
 */
export const fetchAndSetUserProfile = async (userId: string) => {
  console.log('profileService: Fetching profile for user ID:', userId);
  try {
    const { data, error, status } = await supabase
      .from('profiles')
      .select(`username, subscription_tier`)
      .eq('id', userId)
      .single();

    if (error && status !== 406) {
      throw error;
    }

    if (data) {
      console.log('profileService: Profile found. Database tier:', data.subscription_tier);
      
      // Update the username if it exists in the profile
      if (data.username) {
        const { setUserName } = useUserStore.getState();
        setUserName(data.username);
      }
      
      // IMPROVED: Robust subscription tier checking with retry logic
      await checkAndSyncSubscriptionTier(data.subscription_tier);
      
    } else {
        console.warn('profileService: No profile found for user, checking RevenueCat before defaulting to free tier.');
        
        // IMPROVED: No profile found, robust RevenueCat check
        await checkAndSyncSubscriptionTier(null);
    }
  } catch (error: any) {
    console.error('profileService: Error fetching user profile:', error.message);
    
    // IMPROVED: On error, still attempt robust subscription check
    await checkAndSyncSubscriptionTier(null);
  }
};

/**
 * Robust subscription tier checking with retry logic and better error handling
 * RevenueCat is the single source of truth
 */
const checkAndSyncSubscriptionTier = async (databaseTier: string | null, retryCount = 0): Promise<void> => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000; // 2 seconds
  
  try {
    console.log(`profileService: Checking RevenueCat subscription (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
    
    const { checkPremiumStatus } = await import('./revenueCatService');
    const hasPremiumEntitlement = await checkPremiumStatus();
    const revenueCatTier: SubscriptionTier = hasPremiumEntitlement ? 'premium' : 'free';
    
    console.log('profileService: RevenueCat tier:', revenueCatTier, 'Database tier:', databaseTier);
    
    // Update local state with RevenueCat's authoritative information
    const { setSubscriptionTier } = useUserStore.getState();
    setSubscriptionTier(revenueCatTier);
    
    // If database disagrees with RevenueCat, update database to match
    if (databaseTier !== null && revenueCatTier !== databaseTier) {
      console.log('profileService: Subscription tier mismatch detected. Updating database to match RevenueCat.');
      const { syncSubscriptionTier } = await import('./authService');
      await syncSubscriptionTier(revenueCatTier);
    }
    
    console.log(`profileService: ✅ Successfully set subscription tier to: ${revenueCatTier}`);
    
  } catch (rcError) {
    console.warn(`profileService: RevenueCat check failed (attempt ${retryCount + 1}):`, rcError);
    
    // CRITICAL CHANGE: Only retry, don't fallback to potentially stale database data
    if (retryCount < MAX_RETRIES) {
      console.log(`profileService: Retrying RevenueCat check in ${RETRY_DELAY}ms...`);
      setTimeout(() => {
        checkAndSyncSubscriptionTier(databaseTier, retryCount + 1);
      }, RETRY_DELAY);
    } else {
      console.error('profileService: ❌ All RevenueCat checks failed. Keeping current local state.');
      
      // Don't change the subscription tier if RevenueCat is completely unavailable
      // This prevents overriding a valid premium state with a potentially stale free state
      const currentTier = useUserStore.getState().subscriptionTier;
      console.log(`profileService: Maintaining current subscription tier: ${currentTier}`);
      
      // Schedule a background retry in 30 seconds
      setTimeout(() => {
        console.log('profileService: Background retry of RevenueCat check...');
        checkAndSyncSubscriptionTier(databaseTier, 0);
      }, 30000);
    }
  }
}; 