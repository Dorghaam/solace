import { useFonts } from 'expo-font';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider } from 'native-base';
import 'react-native-reanimated';

import { solaceTheme } from '@/constants/theme';
import { configureGoogleSignIn } from '@/services/googleAuthService';
import { setupNotificationResponseListener } from '@/services/notificationService';
import { reviewService } from '@/services/reviewService';
import { supabase } from '@/services/supabaseClient';
import { useUserStore } from '@/store/userStore';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    // TODO: Add other custom fonts here when chosen for 'heading' and 'body'
  });

  const {
    hasCompletedOnboarding,
    supabaseUser,
    setSupabaseUser,
    resetState,
    userName,
    setTargetQuote,
  } = useUserStore((state) => ({
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    supabaseUser: state.supabaseUser,
    setSupabaseUser: state.setSupabaseUser,
    resetState: state.resetState,
    userName: state.userName,
    setTargetQuote: state.setTargetQuote,
  }));

  const [zustandReady, setZustandReady] = useState(useUserStore.persist.hasHydrated());
  const [initialSessionCheckDone, setInitialSessionCheckDone] = useState(false);

  // 1. Wait for Zustand rehydration
  useEffect(() => {
    let unsubHydrate: (() => void) | undefined;
    if (!zustandReady) {
      console.log('_layout.tsx: Waiting for Zustand store to rehydrate...');
      unsubHydrate = useUserStore.persist.onFinishHydration(() => {
        console.log('_layout.tsx: Zustand store rehydrated.');
        setZustandReady(true);
      });
    } else {
       console.log('_layout.tsx: Zustand store already rehydrated on mount.');
    }
    return () => unsubHydrate?.();
  }, [zustandReady]);

  // 2. Configure Google SDK exactly once
  useEffect(() => {
    console.log('_layout.tsx: Configuring Google Sign-In SDK...');
    configureGoogleSignIn();
  }, []);

  // 3. Supabase session on cold start (after Zustand is ready)
  useEffect(() => {
    if (!zustandReady || initialSessionCheckDone) {
      console.log('_layout.tsx: Supabase getSession - Skipping or already done.', { zustandReady, initialSessionCheckDone });
      return;
    }
    console.log('_layout.tsx: Supabase getSession - Zustand ready, fetching session.');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('_layout.tsx: Supabase getSession - Fetched. Session User ID:', session?.user?.id || 'null');
      setSupabaseUser(session?.user ?? null);
      setInitialSessionCheckDone(true);
    }).catch(error => {
      console.error('_layout.tsx: Supabase getSession - Error:', error);
      setSupabaseUser(null);
      setInitialSessionCheckDone(true);
    });
  }, [zustandReady, setSupabaseUser, initialSessionCheckDone]);

  // 4. Real-time auth listener (after Zustand is ready)
  useEffect(() => {
    if (!zustandReady) {
      console.log('_layout.tsx: Supabase onAuthStateChange - Waiting for Zustand.');
      return;
    }
    console.log('_layout.tsx: Supabase onAuthStateChange - Setting up listener.');
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('_layout.tsx: Supabase onAuthStateChange - Event:', _event, 'Session User ID:', session?.user?.id || 'null');
        setSupabaseUser(session?.user ?? null);

        if (!session?.user) {
          if (_event === 'SIGNED_OUT') {
             console.log('_layout.tsx: onAuthStateChange - SIGNED_OUT. Resetting state and routing to onboarding.');
             resetState();
             router.replace('/(onboarding)');
          } else if (_event !== 'SIGNED_IN' && _event !== 'INITIAL_SESSION' && _event !== 'TOKEN_REFRESHED' && _event !== 'USER_UPDATED' && !session) {
            console.log('_layout.tsx: onAuthStateChange - Session became null without explicit sign out. Resetting state.');
            resetState();
            router.replace('/(onboarding)');
          }
        }
      }
    );
    return () => {
      console.log('_layout.tsx: Supabase onAuthStateChange - Unsubscribing listener.');
      listener?.subscription?.unsubscribe();
    };
  }, [zustandReady, setSupabaseUser, resetState, router]);

  // Handle font errors
  useEffect(() => { if (fontError) throw fontError; }, [fontError]);

  // Handle AppState changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && supabaseUser) {
        console.log('_layout.tsx: App to foreground, attempting session refresh.');
        await supabase.auth.refreshSession();
      }
    });
    return () => subscription.remove();
  }, [supabaseUser]);

  // Notification response listener
  useEffect(() => {
    const subscription = setupNotificationResponseListener((response: Notifications.NotificationResponse) => {
      console.log('Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      if (data && typeof data === 'object' && 'type' in data && data.type === 'quote' && 'quoteId' in data) {
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

  // 5. Decide when app is truly "ready" to make routing decisions
  const isAppReady = fontsLoaded && zustandReady && initialSessionCheckDone;

  // Hide splash screen once app is ready
  useEffect(() => {
    if (isAppReady) {
      SplashScreen.hideAsync();
      console.log('_layout.tsx: App is ready, hiding splash screen.');
      reviewService.trackAppOpen();
    }
  }, [isAppReady]);

  if (!isAppReady) {
    console.log('_layout.tsx: Rendering null (App not fully ready).', { fontsLoaded, zustandReady, initialSessionCheckDone });
    return null;
  }

  // --- Navigation Logic ---
  console.log("_layout.tsx: Navigation check", {
    supabaseUser: !!supabaseUser,
    hasCompletedOnboardingFromStore: hasCompletedOnboarding,
    userNameFromStore: userName,
  });

  // Stacks for clarity
  const MainStack = () => (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(main)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );

  const OnboardingStack = () => (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(onboarding)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
  
  // THE CRITICAL DECISION:
  if (supabaseUser && hasCompletedOnboarding) {
    console.log("_layout.tsx: User is authenticated and onboarding is complete. Rendering (main) stack.");
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NativeBaseProvider theme={solaceTheme}>
          <MainStack />
          <StatusBar style="dark" backgroundColor={solaceTheme.colors.miracleBackground} />
        </NativeBaseProvider>
      </GestureHandlerRootView>
    );
  } else {
    console.log("_layout.tsx: User not authenticated or onboarding not complete. Rendering (onboarding) stack.");
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NativeBaseProvider theme={solaceTheme}>
          <OnboardingStack />
          <StatusBar style="dark" backgroundColor={solaceTheme.colors.miracleBackground} />
        </NativeBaseProvider>
      </GestureHandlerRootView>
    );
  }
}
