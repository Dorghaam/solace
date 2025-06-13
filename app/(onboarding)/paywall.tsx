import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import { Box, Spinner, Text } from 'native-base';
import React, { Suspense, useCallback, useEffect, useRef } from 'react';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

/**
 * This component now ONLY handles state changes.
 * It does not perform any navigation.
 */
function PaywallContent() {
  const setHasCompletedOnboarding = useUserStore((s) => s.setHasCompletedOnboarding);
  const setSubscriptionTier = useUserStore((s) => s.setSubscriptionTier);
  const hasCompletedRef = useRef(false);

  /**
   * NUCLEAR OPTION: Force navigation directly since stack switching is broken.
   * This bypasses the broken root layout logic.
   */
  const completeOnboarding = useCallback(() => {
    console.log('[Paywall] Onboarding is being marked as complete.');
    setHasCompletedOnboarding(true);
    // Force direct navigation to bypass broken stack switching
    setTimeout(() => {
      console.log('[Paywall] Force navigating to main feed');
      router.replace('/(main)/');
    }, 100);
  }, [setHasCompletedOnboarding]);

  /**
   * Handles successful purchase/restore and navigates to main feed.
   * Updates subscription tier and syncs purchases.
   */
  const handleSuccess = useCallback(async () => {
    console.log('[Paywall] Purchase/Restore success. Processing...');
    
    // Update subscription tier immediately
    setSubscriptionTier('premium');
    console.log('[Paywall] Subscription tier updated to premium');
    
    try {
      await Purchases.syncPurchases();
      console.log('[Paywall] Purchases synced successfully');
    } catch (err) {
      console.error('[Paywall] Error syncing purchases after success:', err);
    }
    
    console.log('[Paywall] Completing onboarding after purchase');
    completeOnboarding();
  }, [completeOnboarding, setSubscriptionTier]);

  const handleDismiss = useCallback(() => {
    console.log('[Paywall] Paywall dismissed via onDismiss');
    completeOnboarding();
  }, [completeOnboarding]);

  // Fallback: Listen for purchase state changes if callbacks fail
  useEffect(() => {
    const checkPurchaseStatus = async () => {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0;
        
        if (hasActiveSubscription && !hasCompletedRef.current) {
          console.log('[Paywall] Fallback: Detected active subscription, completing onboarding');
          hasCompletedRef.current = true;
          handleSuccess();
        }
      } catch (error) {
        console.log('[Paywall] Error checking purchase status:', error);
      }
    };

    const interval = setInterval(checkPurchaseStatus, 2000);
    return () => clearInterval(interval);
  }, [handleSuccess]);

  return (
    <RevenueCatUI.Paywall
      onPurchaseCompleted={(customerInfo) => {
        console.log('[Paywall] onPurchaseCompleted called:', customerInfo?.entitlements?.active);
        handleSuccess();
      }}
      onRestoreCompleted={(customerInfo) => {
        console.log('[Paywall] onRestoreCompleted called:', customerInfo?.entitlements?.active);
        handleSuccess();
      }}
      onDismiss={() => {
        console.log('[Paywall] onDismiss called');
        handleDismiss();
      }}
    />
  );
}

/**
 * The outer screen component, which uses Suspense to show a loading state
 * while the PaywallContent fetches its data.
 */
export default function PaywallScreen() {
  return (
    <Suspense
      fallback={
        <Box flex={1} justifyContent="center" alignItems="center" bg="backgroundLight">
          <Spinner size="lg" />
          <Text mt={4}>Loading Offers...</Text>
        </Box>
      }
    >
      <PaywallContent />
    </Suspense>
  );
}