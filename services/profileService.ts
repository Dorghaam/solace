import { SubscriptionTier, useUserStore } from '@/store/userStore';
import { supabase } from './supabaseClient';
import { subscriptionSyncService } from './subscriptionSyncService';

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
      
      // Use centralized sync service for subscription tier validation
      await subscriptionSyncService.syncSubscriptionTier('profile_fetch');
      
    } else {
        console.warn('profileService: No profile found for user, syncing with RevenueCat.');
        
        // Use centralized sync service 
        await subscriptionSyncService.syncSubscriptionTier('profile_fetch');
    }
  } catch (error: any) {
    console.error('profileService: Error fetching user profile:', error.message);
    
    // On error, still attempt subscription sync (but don't await to prevent blocking)
    subscriptionSyncService.syncSubscriptionTier('profile_fetch').catch(console.warn);
  }
};

// Legacy retry logic removed - now using centralized subscriptionSyncService 