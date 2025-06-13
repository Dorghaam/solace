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
      
      // For subscription tier, check RevenueCat first to avoid overriding accurate subscription status
      try {
        const { checkPremiumStatus } = await import('./revenueCatService');
        const hasPremiumEntitlement = await checkPremiumStatus();
        const revenueCatTier: SubscriptionTier = hasPremiumEntitlement ? 'premium' : 'free';
        
        console.log('profileService: RevenueCat tier:', revenueCatTier, 'Database tier:', data.subscription_tier);
        
        // If RevenueCat and database disagree, trust RevenueCat and update the database
        if (revenueCatTier !== data.subscription_tier) {
          console.log('profileService: Subscription tier mismatch detected. Using RevenueCat status and updating database.');
          
          // Update local state with RevenueCat's accurate information
          const { setSubscriptionTier } = useUserStore.getState();
          setSubscriptionTier(revenueCatTier);
          
          // Update the database to match RevenueCat
          const { syncSubscriptionTier } = await import('./authService');
          await syncSubscriptionTier(revenueCatTier);
        } else {
          // Both agree, just update local state
          const { setSubscriptionTier } = useUserStore.getState();
          setSubscriptionTier(data.subscription_tier as SubscriptionTier);
        }
        
      } catch (rcError) {
        console.warn('profileService: Could not check RevenueCat status, falling back to database tier:', rcError);
        // If RevenueCat check fails, fall back to database value
        const { setSubscriptionTier } = useUserStore.getState();
        setSubscriptionTier(data.subscription_tier as SubscriptionTier);
      }
      
    } else {
        console.warn('profileService: No profile found for user, checking RevenueCat before defaulting to free tier.');
        
        // No profile found, but check RevenueCat before defaulting to free
        try {
          const { checkPremiumStatus } = await import('./revenueCatService');
          const hasPremiumEntitlement = await checkPremiumStatus();
          const tier: SubscriptionTier = hasPremiumEntitlement ? 'premium' : 'free';
          
          console.log('profileService: No database profile, using RevenueCat tier:', tier);
          useUserStore.getState().setSubscriptionTier(tier);
          
          // Sync to database for future use
          const { syncSubscriptionTier } = await import('./authService');
          await syncSubscriptionTier(tier);
          
        } catch (rcError) {
          console.warn('profileService: Could not check RevenueCat, defaulting to free tier:', rcError);
          useUserStore.getState().setSubscriptionTier('free');
        }
    }
  } catch (error: any) {
    console.error('profileService: Error fetching user profile:', error.message);
    
    // On error, check RevenueCat before defaulting to free
    try {
      const { checkPremiumStatus } = await import('./revenueCatService');
      const hasPremiumEntitlement = await checkPremiumStatus();
      const tier: SubscriptionTier = hasPremiumEntitlement ? 'premium' : 'free';
      
      console.log('profileService: Profile fetch error, using RevenueCat tier:', tier);
      useUserStore.getState().setSubscriptionTier(tier);
      
    } catch (rcError) {
      console.warn('profileService: Could not check RevenueCat after profile error, defaulting to free tier:', rcError);
      useUserStore.getState().setSubscriptionTier('free');
    }
  }
}; 