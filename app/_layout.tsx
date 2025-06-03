import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider } from 'native-base';
import { BackHandler } from 'react-native';
import 'react-native-reanimated';

import { solaceTheme } from '@/constants/theme';
import { setupNotificationResponseListener } from '@/services/notificationService';
import { reviewService } from '@/services/reviewService';
import { useUserStore } from '@/store/userStore';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

// Polyfill for BackHandler compatibility with newer React Native versions
if (BackHandler && !(BackHandler as any).removeEventListener) {
  (BackHandler as any).removeEventListener = (eventType: string, handler: () => boolean) => {
    // For newer versions, the add method returns a remove function
    // This is a simple fallback - in practice the remove function should be stored
    console.warn('BackHandler.removeEventListener is deprecated. Using noop as fallback.');
  };
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // TODO: Add other custom fonts here when chosen for 'heading' and 'body'
  });

  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  const userName = useUserStore((state) => state.userName);
  const zustandHasRehydrated = useUserStore.persist.hasHydrated();
  const setTargetQuote = useUserStore((state) => state.setTargetQuote);

  // More robust onboarding check - if store is hydrated but user has no name and hasn't completed onboarding,
  // we should definitely show onboarding
  const shouldShowOnboarding = zustandHasRehydrated && (!hasCompletedOnboarding || !userName);

  // Debug logging
  useEffect(() => {
    console.log('RootLayout Debug:', {
      hasCompletedOnboarding,
      userName,
      zustandHasRehydrated,
      loaded,
      shouldShowOnboarding
    });
  }, [hasCompletedOnboarding, userName, zustandHasRehydrated, loaded, shouldShowOnboarding]);

  useEffect(() => {
    if (loaded && zustandHasRehydrated) {
      // Hide splash screen after everything is loaded
      SplashScreen.hideAsync();
      // Track app open for review prompt
      reviewService.trackAppOpen();
      
      // Additional logging for debugging App Store issues
      console.log('App initialized - Store state:', {
        hasCompletedOnboarding,
        userName,
        timestamp: new Date().toISOString()
      });
    }
  }, [loaded, zustandHasRehydrated, hasCompletedOnboarding, userName]);

  // Set up notification response listener
  useEffect(() => {
    const subscription = setupNotificationResponseListener((response: Notifications.NotificationResponse) => {
      console.log('Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      if (data && typeof data === 'object' && 'type' in data && data.type === 'quote' && 'quoteId' in data) {
        // Set the target quote for navigation
        setTargetQuote({
          id: String(data.quoteId),
          text: String(data.quoteText || ''),
          category: data.quoteCategory ? String(data.quoteCategory) : undefined
        });
        console.log('Target quote set from notification:', data.quoteId);
      }
    });

    return () => subscription.remove();
  }, [setTargetQuote]);

  if (!loaded || !zustandHasRehydrated) {
    return null;
  }

  // Final decision logic - be very explicit about when to show onboarding
  const showMainApp = hasCompletedOnboarding && userName && userName.trim().length > 0;
  
  console.log('Navigation decision:', {
    showMainApp,
    hasCompletedOnboarding,
    userName,
    hasUserName: !!userName
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NativeBaseProvider theme={solaceTheme}>
        {showMainApp ? (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(main)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        ) : (
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="+not-found" />
          </Stack>
        )}
        <StatusBar style="dark" backgroundColor={solaceTheme.colors.miracleBackground} />
      </NativeBaseProvider>
    </GestureHandlerRootView>
  );
}
