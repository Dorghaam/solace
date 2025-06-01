import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider } from 'native-base';
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

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // TODO: Add other custom fonts here when chosen for 'heading' and 'body'
  });

  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  const zustandHasRehydrated = useUserStore.persist.hasHydrated();
  const setTargetQuote = useUserStore((state) => state.setTargetQuote);

  // Debug logging
  useEffect(() => {
    console.log('RootLayout Debug:', {
      hasCompletedOnboarding,
      zustandHasRehydrated,
      loaded
    });
  }, [hasCompletedOnboarding, zustandHasRehydrated, loaded]);

  useEffect(() => {
    if (loaded && zustandHasRehydrated) {
      // Hide splash screen after everything is loaded
      SplashScreen.hideAsync();
      // Track app open for review prompt
      reviewService.trackAppOpen();
    }
  }, [loaded, zustandHasRehydrated]);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NativeBaseProvider theme={solaceTheme}>
        {hasCompletedOnboarding ? (
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
