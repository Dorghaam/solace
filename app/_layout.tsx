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

// Polyfill for BackHandler - ensure it's still needed or correctly implemented if you rely on it.
// Modern React Navigation handles back presses well. This might be legacy.
if (BackHandler && !(BackHandler as any).removeEventListener) {
  (BackHandler as any).removeEventListener = (eventType: string, handler: () => boolean) => {
    console.warn('BackHandler.removeEventListener is deprecated. Using noop as fallback.');
  };
}

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // TODO: Add other custom fonts here when chosen for 'heading' and 'body'
  });

  // Get all necessary state from Zustand
  const { 
    hasCompletedOnboarding, 
    userName, 
    setTargetQuote 
  } = useUserStore(
    (state) => ({
      hasCompletedOnboarding: state.hasCompletedOnboarding,
      userName: state.userName,
      setTargetQuote: state.setTargetQuote,
    })
  );
  const zustandHasRehydrated = useUserStore.persist.hasHydrated();

  useEffect(() => {
    if (loaded && zustandHasRehydrated) {
      SplashScreen.hideAsync();
      reviewService.trackAppOpen();
      console.log('App initialized in RootLayout - Store state after rehydration:', {
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
    console.log('RootLayout: Waiting for fonts to load or store to rehydrate...');
    return null; // Keep showing splash screen (or a loading component)
  }

  // Definitive check for proceeding to main app
  const isUserActuallyOnboarded = hasCompletedOnboarding && userName && userName.trim().length > 0;

  console.log('RootLayout - Final Navigation Decision:', {
    loaded,
    zustandHasRehydrated,
    hasCompletedOnboardingFromStore: hasCompletedOnboarding,
    userNameFromStore: userName,
    isUserActuallyOnboardedLogic: isUserActuallyOnboarded,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NativeBaseProvider theme={solaceTheme}>
        {isUserActuallyOnboarded ? (
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
