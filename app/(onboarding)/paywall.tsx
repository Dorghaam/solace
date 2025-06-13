import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import { Box, Spinner, Text } from 'native-base';
import React, { Suspense, useCallback } from 'react';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

/**
 * This component now ONLY handles state changes.
 * It does not perform any navigation.
 */
function PaywallContent() {
  const setHasCompletedOnboarding = useUserStore((s) => s.setHasCompletedOnboarding);

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
   * This function now also just calls completeOnboarding.
   * We still sync purchases as a best practice.
   */
  const handleSuccess = useCallback(async () => {
    console.log('[Paywall] Purchase/Restore success. Syncing purchases.');
    try {
      await Purchases.syncPurchases();
    } catch (err) {
      console.error('[Paywall] Error syncing purchases after success:', err);
    }
    completeOnboarding();
  }, [completeOnboarding]);

  const handleDismiss = useCallback(() => {
    console.log('[Paywall] Paywall dismissed via onDismiss');
    completeOnboarding();
  }, [completeOnboarding]);

  return (
    <RevenueCatUI.Paywall
      onPurchaseCompleted={handleSuccess}
      onRestoreCompleted={handleSuccess}
      onDismiss={handleDismiss}
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