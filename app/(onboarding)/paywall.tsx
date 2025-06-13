import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import { Box, Spinner, Text } from 'native-base';
import React, { Suspense } from 'react';
import Purchases from 'react-native-purchases';

// Import the actual RevenueCat Paywall component
import RevenueCatUI from 'react-native-purchases-ui';

const PaywallContent = () => {
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);
  const [isPresented, setIsPresented] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);

  console.log('[PaywallScreen] PaywallContent component mounted');

  const handleNavigation = React.useCallback(() => {
    if (!isCompleted) {
      setIsCompleted(true);
      setHasCompletedOnboarding(true);
      setTimeout(() => router.replace('/(main)'), 100);
    }
  }, [isCompleted, setHasCompletedOnboarding]);

  React.useEffect(() => {
    if (isPresented || isCompleted) return; // Prevent multiple presentations
    
    const showPaywall = async () => {
      try {
        setIsPresented(true);
        console.log('[PaywallScreen] Presenting RevenueCat paywall...');
        
        await RevenueCatUI.presentPaywall({
          options: {
            offering: null, // Uses current offering
          },
          onPurchaseCompleted: async () => {
            console.log('[PaywallScreen] Purchase completed successfully');
            await Purchases.syncPurchases();
            handleNavigation();
          },
          onRestoreCompleted: async () => {
            console.log('[PaywallScreen] Restore completed successfully');
            await Purchases.syncPurchases();
            handleNavigation();
          },
          onDismiss: () => {
            console.log('[PaywallScreen] Paywall dismissed, allowing free tier access');
            handleNavigation();
          },
        });
      } catch (error) {
        console.error('[PaywallScreen] Error presenting paywall:', error);
        // Fallback: let user continue with free tier
        handleNavigation();
      }
    };

    showPaywall();
  }, [isPresented, isCompleted, handleNavigation]);

  // If already completed, show nothing (navigation in progress)
  if (isCompleted) {
    return null;
  }

  // Return a minimal loading view while the paywall is being presented
  return (
    <Box flex={1} justifyContent="center" alignItems="center" bg="miracleBackground">
      <Spinner size="lg" />
      <Text mt={4}>Loading paywall...</Text>
    </Box>
  );
};

export default function PaywallScreen() {
  console.log('[PaywallScreen] PaywallScreen wrapper component mounted');
  
  return (
    // The <PaywallView /> component performs async operations.
    // Using Suspense provides a fallback UI while it loads offerings.
    <Suspense
      fallback={
        <Box flex={1} justifyContent="center" alignItems="center" bg="miracleBackground">
          <Spinner size="lg" />
          <Text mt={4}>Loading offers...</Text>
        </Box>
      }
    >
      <PaywallContent />
    </Suspense>
  );
}