import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider } from 'native-base';
import 'react-native-reanimated';

import { solaceTheme } from '@/constants/theme';
import { useUserStore } from '@/store/userStore';
import { SplashScreen } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // TODO: Add other custom fonts here when chosen for 'heading' and 'body'
  });

  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  const zustandHasRehydrated = useUserStore.persist.hasHydrated();

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
      SplashScreen.hideAsync();
    }
  }, [loaded, zustandHasRehydrated]);

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
        <StatusBar style="dark" backgroundColor={solaceTheme.colors.backgroundLight} />
      </NativeBaseProvider>
    </GestureHandlerRootView>
  );
}
