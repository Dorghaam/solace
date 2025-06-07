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
      console.log('profileService: Profile found. Tier:', data.subscription_tier);
      // Update the Zustand store with the fetched data
      const { setSubscriptionTier, setUserName } = useUserStore.getState();
      setSubscriptionTier(data.subscription_tier as SubscriptionTier);
      // Also update the username if it exists in the profile
      if (data.username) {
        setUserName(data.username);
      }
    } else {
        console.warn('profileService: No profile found for user, defaulting to free tier in state.');
        // This case might happen if the trigger fails or RLS is misconfigured.
        // Defaulting to 'free' is a safe fallback.
        useUserStore.getState().setSubscriptionTier('free');
    }
  } catch (error: any) {
    console.error('profileService: Error fetching user profile:', error.message);
    // On error, default to 'free' tier in the store for security.
    useUserStore.getState().setSubscriptionTier('free');
  }
}; 