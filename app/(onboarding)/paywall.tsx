import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import { Box, Spinner, Text } from 'native-base';
import React, { Suspense, useCallback } from 'react';
import Purchases from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';

/**
 * A separate, stable component to hold the paywall logic.
 * This prevents the main export from having complex logic and satisfies ESLint.
 */
function PaywallContent() {
  const setHasCompletedOnboarding = useUserStore((s) => s.setHasCompletedOnboarding);

  /**
   * Creates a stable function to navigate to the main app.
   * It only gets re-created if `setHasCompletedOnboarding` changes (which it won't).
   */
  const navigateToMainApp = useCallback(() => {
    console.log('[PaywallContent] Completing onboarding and navigating to main');
    setHasCompletedOnboarding(true);
    router.replace('/(main)');
  }, [setHasCompletedOnboarding]);

  /**
   * Creates a stable function to handle a successful purchase or restore.
   * It depends on `navigateToMainApp`, which is also stable.
   */
  const handleSuccess = useCallback(async () => {
    console.log('[PaywallContent] Purchase/Restore completed');
    try {
      await Purchases.syncPurchases();
    } catch (err) {
      console.error('[PaywallContent] Error syncing purchases after success:', err);
    }
    navigateToMainApp();
  }, [navigateToMainApp]);

  const handleDismiss = useCallback(() => {
    console.log('[PaywallContent] Paywall dismissed via onDismiss');
    navigateToMainApp();
  }, [navigateToMainApp]);

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