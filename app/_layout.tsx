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
import * as ExpoNotifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Use a combined state for initial async operations
  const [appLoadingState, setAppLoadingState] = useState({
    fontsLoaded: false,
    fontError: null as Error | null,
    zustandReady: useUserStore.persist.hasHydrated(),
    initialSessionCheckDone: false,
  });

  const {
    hasCompletedOnboarding,
    supabaseUser,
    userName,
    setSupabaseUser,
    resetState,
    setTargetQuote,
  } = useUserStore(
    useCallback(
      (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        supabaseUser: state.supabaseUser,
        userName: state.userName,
        setSupabaseUser: state.setSupabaseUser,
        resetState: state.resetState,
        setTargetQuote: state.setTargetQuote,
      }),
      []
    )
  );

  // 1. Load fonts
  const [fontsActuallyLoaded, fontActualError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsActuallyLoaded || fontActualError) {
      setAppLoadingState(prev => ({
        ...prev,
        fontsLoaded: fontsActuallyLoaded,
        fontError: fontActualError
      }));
    }
  }, [fontsActuallyLoaded, fontActualError]);

  // 2. Wait for Zustand rehydration
  useEffect(() => {
    if (appLoadingState.zustandReady) {
      console.log('_layout.tsx: Zustand was already hydrated.');
      return;
    }
    console.log('_layout.tsx: Waiting for Zustand store to rehydrate...');
    const unsubHydrate = useUserStore.persist.onFinishHydration(() => {
      console.log('_layout.tsx: Zustand store rehydrated.');
      setAppLoadingState(prev => ({ ...prev, zustandReady: true }));
    });
    return () => unsubHydrate?.();
  }, [appLoadingState.zustandReady]);

  // 3. Configure Google SDK exactly once
  useEffect(() => {
    console.log('_layout.tsx: Configuring Google Sign-In SDK...');
    configureGoogleSignIn();
  }, []);

  // 4. Supabase session on cold start (after Zustand is ready)
  useEffect(() => {
    if (!appLoadingState.zustandReady || appLoadingState.initialSessionCheckDone) {
      return;
    }
    console.log('_layout.tsx: Supabase getSession - Zustand ready, fetching session.');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('_layout.tsx: Supabase getSession - Fetched. Session User ID:', session?.user?.id || 'null');
      setSupabaseUser(session?.user ?? null);
      setAppLoadingState(prev => ({ ...prev, initialSessionCheckDone: true }));
    }).catch(error => {
      console.error('_layout.tsx: Supabase getSession - Error:', error);
      setSupabaseUser(null);
      setAppLoadingState(prev => ({ ...prev, initialSessionCheckDone: true }));
    });
  }, [appLoadingState.zustandReady, appLoadingState.initialSessionCheckDone, setSupabaseUser]);

  // 5. Real-time auth listener (after Zustand is ready)
  useEffect(() => {
    if (!appLoadingState.zustandReady) {
      return;
    }
    console.log('_layout.tsx: Supabase onAuthStateChange - Setting up listener.');
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('_layout.tsx: Supabase onAuthStateChange - Event:', _event, 'Session User ID:', session?.user?.id || 'null');
        const currentSupabaseUser = useUserStore.getState().supabaseUser;
        if (currentSupabaseUser?.id !== session?.user?.id || (!currentSupabaseUser && session?.user) || (currentSupabaseUser && !session?.user) ) {
            setSupabaseUser(session?.user ?? null);
        }

        if (!session?.user) {
          if (_event === 'SIGNED_OUT') {
             console.log('_layout.tsx: onAuthStateChange - SIGNED_OUT. Resetting state and routing to onboarding.');
             resetState();
             router.replace('/(onboarding)');
          } else if (!session && _event !== 'SIGNED_IN' && _event !== 'INITIAL_SESSION' && _event !== 'TOKEN_REFRESHED' && _event !== 'USER_UPDATED') {
            console.log('_layout.tsx: onAuthStateChange - Session became null without explicit sign out. Resetting state and routing to onboarding.');
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
  }, [appLoadingState.zustandReady, resetState, router, setSupabaseUser]);

  // Handle font errors
  useEffect(() => { if (appLoadingState.fontError) throw appLoadingState.fontError; }, [appLoadingState.fontError]);

  // AppState changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && useUserStore.getState().supabaseUser) {
        console.log('_layout.tsx: App to foreground, attempting session refresh.');
        await supabase.auth.refreshSession();
      }
    });
    return () => subscription.remove();
  }, []);

  // Notification response listener
  useEffect(() => {
    const subscription = setupNotificationResponseListener((response: ExpoNotifications.NotificationResponse) => {
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

  // Determine overall app readiness
  const isAppFullyReady = appLoadingState.fontsLoaded && appLoadingState.zustandReady && appLoadingState.initialSessionCheckDone;

  useEffect(() => {
    if (isAppFullyReady) {
      SplashScreen.hideAsync();
      console.log('_layout.tsx: App is fully ready, hiding splash screen.');
      reviewService.trackAppOpen();
    }
  }, [isAppFullyReady]);

  if (!isAppFullyReady) {
    console.log('_layout.tsx: Rendering null (App not fully ready).', appLoadingState);
    return null;
  }

  // --- Navigation Logic ---
  console.log("_layout.tsx: Navigation check", {
    isAppFullyReady,
    supabaseUserExists: !!supabaseUser,
    hasCompletedOnboarding,
    userNameExists: !!userName,
  });

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

  if (supabaseUser && hasCompletedOnboarding) {
    console.log("_layout.tsx: Rendering (main) stack.");
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <NativeBaseProvider theme={solaceTheme}>
          <MainStack />
          <StatusBar style="dark" backgroundColor={solaceTheme.colors.miracleBackground} />
        </NativeBaseProvider>
      </GestureHandlerRootView>
    );
  } else {
    console.log("_layout.tsx: Rendering (onboarding) stack.");
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
