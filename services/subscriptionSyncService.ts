import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionTier, useUserStore } from '@/store/userStore';

/**
 * Centralized subscription synchronization service
 * This service coordinates all subscription state changes to prevent race conditions
 */
class SubscriptionSyncService {
  private static instance: SubscriptionSyncService;
  private syncInProgress = false;
  private lastSyncTimestamp = 0;
  private syncDebounceTimer: NodeJS.Timeout | null = null;
  private cachedRevenueCatStatus: { tier: SubscriptionTier; timestamp: number } | null = null;
  
  // Cache TTL: 2 minutes for RevenueCat status
  private readonly CACHE_TTL = 2 * 60 * 1000;
  // Debounce time: prevent rapid sync calls
  private readonly DEBOUNCE_TIME = 1000;
  // Minimum time between syncs: prevent too frequent API calls
  private readonly MIN_SYNC_INTERVAL = 10 * 1000;

  private constructor() {}

  static getInstance(): SubscriptionSyncService {
    if (!SubscriptionSyncService.instance) {
      SubscriptionSyncService.instance = new SubscriptionSyncService();
    }
    return SubscriptionSyncService.instance;
  }

  /**
   * Main subscription sync method - debounced and coordinated
   */
  public async syncSubscriptionTier(
    source: 'revenuecat_listener' | 'profile_fetch' | 'auth_sync' | 'manual_refresh' | 'periodic_check',
    forcedTier?: SubscriptionTier
  ): Promise<void> {
    console.log(`[SubscriptionSync] Sync requested from: ${source}${forcedTier ? ` with forced tier: ${forcedTier}` : ''}`);

    // Clear any existing debounce timer
    if (this.syncDebounceTimer) {
      clearTimeout(this.syncDebounceTimer);
    }

    // Debounce the sync operation
    return new Promise((resolve) => {
      this.syncDebounceTimer = setTimeout(async () => {
        try {
          await this.performSync(source, forcedTier);
          resolve();
        } catch (error) {
          console.error(`[SubscriptionSync] Sync failed for source ${source}:`, error);
          resolve(); // Don't throw - let other sync operations continue
        }
      }, this.DEBOUNCE_TIME);
    });
  }

  /**
   * Internal sync method that does the actual work
   */
  private async performSync(source: string, forcedTier?: SubscriptionTier): Promise<void> {
    // Prevent concurrent syncs
    if (this.syncInProgress) {
      console.log(`[SubscriptionSync] Sync already in progress, skipping ${source}`);
      return;
    }

    // Check minimum sync interval (except for manual refresh)
    const now = Date.now();
    if (source !== 'manual_refresh' && (now - this.lastSyncTimestamp) < this.MIN_SYNC_INTERVAL) {
      console.log(`[SubscriptionSync] Too soon since last sync, skipping ${source}`);
      return;
    }

    this.syncInProgress = true;
    this.lastSyncTimestamp = now;

    try {
      console.log(`[SubscriptionSync] Starting sync from: ${source}`);
      
      let actualTier: SubscriptionTier;

      // If a tier is forced (from RevenueCat listener), use it
      if (forcedTier) {
        actualTier = forcedTier;
        console.log(`[SubscriptionSync] Using forced tier: ${forcedTier}`);
      } else {
        // Otherwise, get the current tier from RevenueCat (with caching)
        actualTier = await this.getRevenueCatTierWithCache(source === 'manual_refresh');
      }

      // Get current state
      const currentTier = useUserStore.getState().subscriptionTier;
      const supabaseUser = useUserStore.getState().supabaseUser;

      console.log(`[SubscriptionSync] Current tier: ${currentTier}, RevenueCat tier: ${actualTier}`);

      // Only proceed if tier actually changed
      if (currentTier === actualTier) {
        console.log(`[SubscriptionSync] No tier change needed, staying at: ${actualTier}`);
        return;
      }

      // Update local state immediately for responsive UI
      useUserStore.getState().setSubscriptionTier(actualTier);
      console.log(`[SubscriptionSync] Updated local state to: ${actualTier}`);

      // Update Supabase database if user is authenticated
      if (supabaseUser?.id) {
        await this.updateSupabaseSubscriptionTier(supabaseUser.id, actualTier);
      } else {
        console.log(`[SubscriptionSync] No authenticated user, skipping database update`);
      }

      // Cache the successful result
      await this.cacheSubscriptionState(actualTier);

      console.log(`[SubscriptionSync] ✅ Successfully synced subscription tier to: ${actualTier}`);

    } catch (error) {
      console.error(`[SubscriptionSync] Sync failed:`, error);
      
      // For critical errors (like network issues), try to maintain current state
      // rather than falling back to a potentially incorrect state
      console.log(`[SubscriptionSync] Maintaining current state due to sync error`);
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Get RevenueCat tier with caching to reduce API calls
   */
  private async getRevenueCatTierWithCache(forceRefresh = false): Promise<SubscriptionTier> {
    const now = Date.now();
    
    // Use cache if it's fresh and not forcing refresh
    if (!forceRefresh && this.cachedRevenueCatStatus && 
        (now - this.cachedRevenueCatStatus.timestamp) < this.CACHE_TTL) {
      console.log(`[SubscriptionSync] Using cached RevenueCat status: ${this.cachedRevenueCatStatus.tier}`);
      return this.cachedRevenueCatStatus.tier;
    }

    try {
      console.log(`[SubscriptionSync] Fetching fresh RevenueCat status...`);
      const { checkPremiumStatus } = await import('./revenueCatService');
      const hasPremiumEntitlement = await checkPremiumStatus(8000); // 8 second timeout
      const tier: SubscriptionTier = hasPremiumEntitlement ? 'premium' : 'free';
      
      // Update cache
      this.cachedRevenueCatStatus = { tier, timestamp: now };
      
      console.log(`[SubscriptionSync] RevenueCat returned: ${tier}`);
      return tier;
    } catch (error) {
      console.error(`[SubscriptionSync] RevenueCat check failed:`, error);
      
      // If we have a cached result, use it rather than defaulting to free
      if (this.cachedRevenueCatStatus) {
        console.log(`[SubscriptionSync] Using stale cached result due to error: ${this.cachedRevenueCatStatus.tier}`);
        return this.cachedRevenueCatStatus.tier;
      }
      
      // As a last resort, keep the current local state rather than assuming free
      const currentTier = useUserStore.getState().subscriptionTier;
      console.log(`[SubscriptionSync] Keeping current local state due to RevenueCat error: ${currentTier}`);
      return currentTier;
    }
  }

  /**
   * Update Supabase database subscription tier
   */
  private async updateSupabaseSubscriptionTier(userId: string, tier: SubscriptionTier): Promise<void> {
    try {
      const { supabase } = await import('./supabaseClient');
      
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          subscription_tier: tier,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) {
        console.error('[SubscriptionSync] Supabase update error:', error);
        throw error;
      }

      console.log('[SubscriptionSync] Successfully updated Supabase subscription tier:', data);
    } catch (error) {
      console.error('[SubscriptionSync] Failed to update Supabase subscription tier:', error);
      // Don't throw - we want local state to still work even if DB update fails
    }
  }

  /**
   * Cache subscription state to AsyncStorage for offline resilience
   */
  private async cacheSubscriptionState(tier: SubscriptionTier): Promise<void> {
    try {
      const cacheData = {
        tier,
        timestamp: Date.now(),
        version: '1.0'
      };
      await AsyncStorage.setItem('subscription_cache', JSON.stringify(cacheData));
    } catch (error) {
      console.warn('[SubscriptionSync] Failed to cache subscription state:', error);
    }
  }

  /**
   * Get cached subscription state for offline scenarios
   */
  public async getCachedSubscriptionState(): Promise<SubscriptionTier | null> {
    try {
      const cached = await AsyncStorage.getItem('subscription_cache');
      if (cached) {
        const data = JSON.parse(cached);
        const age = Date.now() - data.timestamp;
        
        // Use cached data if it's less than 24 hours old
        if (age < 24 * 60 * 60 * 1000) {
          console.log(`[SubscriptionSync] Using cached subscription state: ${data.tier}`);
          return data.tier;
        }
      }
      return null;
    } catch (error) {
      console.warn('[SubscriptionSync] Failed to get cached subscription state:', error);
      return null;
    }
  }

  /**
   * Clear all caches (useful for testing)
   */
  public clearCache(): void {
    this.cachedRevenueCatStatus = null;
    AsyncStorage.removeItem('subscription_cache').catch(console.warn);
    console.log('[SubscriptionSync] Cache cleared');
  }

  /**
   * Get sync status info (useful for debugging)
   */
  public getSyncStatus() {
    return {
      syncInProgress: this.syncInProgress,
      lastSyncTimestamp: this.lastSyncTimestamp,
      cachedStatus: this.cachedRevenueCatStatus,
      timeSinceLastSync: Date.now() - this.lastSyncTimestamp
    };
  }
}

// Export singleton instance
export const subscriptionSyncService = SubscriptionSyncService.getInstance();

// Legacy function for backward compatibility
export const syncSubscriptionTier = (tier: SubscriptionTier) => {
  return subscriptionSyncService.syncSubscriptionTier('manual_refresh', tier);
};