import { useUserStore } from '@/store/userStore';
import { Box, Spinner, Text } from 'native-base';
import React from 'react';
import Purchases from 'react-native-purchases';
import { AppState } from 'react-native';

// Import the actual RevenueCat Paywall component
import RevenueCatUI from 'react-native-purchases-ui';

// Global flag to prevent multiple presentations
let hasGloballyPresented = false;

export default function PaywallScreen() {
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);
  const [paywallDismissed, setPaywallDismissed] = React.useState(false);

  console.log('[PaywallScreen] PaywallScreen mounted, globallyPresented:', hasGloballyPresented);

  const completeOnboarding = React.useCallback(() => {
    if (!paywallDismissed) {
      console.log('[PaywallScreen] Completing onboarding and navigating to main');
      setPaywallDismissed(true);
      setHasCompletedOnboarding(true);
    }
  }, [paywallDismissed, setHasCompletedOnboarding]);

  React.useEffect(() => {
    // Only present once globally
    if (hasGloballyPresented) {
      console.log('[PaywallScreen] Already presented globally, completing onboarding');
      completeOnboarding();
      return;
    }

    const presentPaywall = async () => {
      hasGloballyPresented = true;
      console.log('[PaywallScreen] Presenting RevenueCat paywall...');
      
      try {
        await RevenueCatUI.presentPaywall({
          onPurchaseCompleted: async () => {
            console.log('[PaywallScreen] Purchase completed');
            await Purchases.syncPurchases();
            completeOnboarding();
          },
          onRestoreCompleted: async () => {
            console.log('[PaywallScreen] Restore completed');
            await Purchases.syncPurchases();
            completeOnboarding();
          },
          onDismiss: () => {
            console.log('[PaywallScreen] Paywall dismissed via onDismiss');
            completeOnboarding();
          },
        });
        
        // Add a fallback - if we reach here without callbacks, assume dismissed
        console.log('[PaywallScreen] RevenueCat presentPaywall promise resolved');
        setTimeout(() => {
          if (!paywallDismissed) {
            console.log('[PaywallScreen] Fallback: Assuming paywall was dismissed');
            completeOnboarding();
          }
        }, 1000);
        
      } catch (error) {
        console.error('[PaywallScreen] Error presenting paywall:', error);
        completeOnboarding();
      }
    };

    // Small delay to ensure component is fully mounted
    const timer = setTimeout(presentPaywall, 100);
    return () => clearTimeout(timer);
  }, [completeOnboarding, paywallDismissed]);

  // Monitor app state changes to detect when user returns from paywall
  React.useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && hasGloballyPresented && !paywallDismissed) {
        console.log('[PaywallScreen] App became active after paywall, completing onboarding');
        completeOnboarding();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [completeOnboarding, paywallDismissed]);

  // If onboarding is completed, show nothing to allow navigation
  if (paywallDismissed) {
    console.log('[PaywallScreen] Paywall dismissed, allowing navigation');
    return null;
  }

  // Simple loading view
  return (
    <Box flex={1} justifyContent="center" alignItems="center" bg="miracleBackground">
      <Spinner size="lg" />
      <Text mt={4}>Loading...</Text>
    </Box>
  );
}