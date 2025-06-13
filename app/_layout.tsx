import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { NativeBaseProvider } from 'native-base';
import 'react-native-get-random-values'; // MUST BE AT THE TOP
import 'react-native-reanimated';

import { solaceTheme } from '@/constants/theme';
import { checkAuthenticationSync } from '@/services/authService';
import { configureGoogleSignIn } from '@/services/googleAuthService';
import { setupNotificationResponseListener } from '@/services/notificationService';
import { fetchAndSetUserProfile } from '@/services/profileService';
import { initRevenueCat, rcLogIn, rcLogOut } from '@/services/revenueCatService';
import { reviewService } from '@/services/reviewService';
import { supabase } from '@/services/supabaseClient';
import { useUserStore } from '@/store/userStore';
import * as ExpoNotifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // --- Zustand Store Slicing (Engineer's Fix Point 1 & 2) ---
  // Select data values separately to avoid creating new objects on every render
  const supabaseUser = useUserStore((state) => state.supabaseUser);
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  const userName = useUserStore((state) => state.userName);
  // Select actions separately (they are stable)
  const setSupabaseUser = useUserStore((state) => state.setSupabaseUser);
  const resetState = useUserStore((state) => state.resetState);
  const setTargetQuote = useUserStore((state) => state.setTargetQuote);

  // --- Local State for Loading Conditions ---
  const [fontsLoaded, fontError] = useFonts({ // Engineer's Fix Point 5 (part 1)
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [zustandReady, setZustandReady] = useState(useUserStore.persist.hasHydrated());
  const [initialSessionCheckDone, setInitialSessionCheckDone] = useState(false);

  // --- Effects for Setup and Listeners ---

  // 1. Wait for Zustand rehydration
  useEffect(() => {
    if (zustandReady) {
      console.log('_layout.tsx: Zustand was already hydrated on mount.');
      return;
    }
    console.log('_layout.tsx: Waiting for Zustand store to rehydrate...');
    const unsubHydrate = useUserStore.persist.onFinishHydration(() => {
      console.log('_layout.tsx: Zustand store rehydrated.');
      setZustandReady(true);
    });
    return () => unsubHydrate?.();
  }, [zustandReady]); // Only re-run if zustandReady itself changes (e.g. from false to true)

  // 2. Configure Google SDK exactly once
  useEffect(() => {
    console.log('_layout.tsx: Configuring Google Sign-In SDK...');
    configureGoogleSignIn();
  }, []); // Empty dependency array: runs once

  // 2.5. Initialize RevenueCat SDK once on app mount
  useEffect(() => {
    console.log('_layout.tsx: Initializing RevenueCat SDK...');
    initRevenueCat();
  }, []); // Empty dependency array: runs once

  // 3. Initial session fetch (Engineer's Fix Point 3)
  useEffect(() => {
    if (!zustandReady) {
      return;
    }
    console.log('_layout.tsx: Supabase getSession - Attempting to fetch...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('_layout.tsx: Supabase getSession - Fetched. Session User ID:', session?.user?.id || 'null');
      setSupabaseUser(session?.user ?? null);
      
      if (session?.user) {
        fetchAndSetUserProfile(session.user.id);
      }
      
      setInitialSessionCheckDone(true);
      
      // Check authentication sync after initial session check with sufficient delay
      // This ensures RevenueCat has time to properly determine subscription status
      setTimeout(() => {
        checkAuthenticationSync();
      }, 3000); // Increased delay to ensure both services are fully initialized
    });
  }, [zustandReady, setSupabaseUser]); // setSupabaseUser is stable

  // 4. Real-time auth listener (Engineer's Fix Point 4)
  useEffect(() => {
    if (!zustandReady) { // Ensure zustand is ready before setting up listeners that might call its actions
      return;
    }
    console.log('_layout.tsx: Supabase onAuthStateChange - Setting up listener.');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('_layout.tsx: Supabase onAuthStateChange - Event:', _event, 'Session User ID:', session?.user?.id || 'null');
        setSupabaseUser(session?.user ?? null); // Update Zustand store

        if (_event === 'SIGNED_IN' && session?.user) {
          fetchAndSetUserProfile(session.user.id);
        }

        if (!session?.user && _event === 'SIGNED_OUT') {
           console.log('_layout.tsx: onAuthStateChange - SIGNED_OUT. Resetting state.');
           resetState();
           // The layout will automatically re-render and show OnboardingStack when user state changes
        }
        // Other navigation logic is handled by the main conditional render
      }
    );
    return () => {
      console.log('_layout.tsx: Supabase onAuthStateChange - Unsubscribing listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, [zustandReady, setSupabaseUser, resetState]); // Dependencies are stable or controlled

  // 4.5. Sync RevenueCat authentication with Supabase user state
  useEffect(() => {
    if (supabaseUser) {
      console.log(`_layout.tsx: Supabase user detected (${supabaseUser.id}), logging into RevenueCat.`);
      rcLogIn(supabaseUser.id);
    } else {
      console.log('_layout.tsx: No Supabase user, logging out of RevenueCat.');
      rcLogOut();
    }
  }, [supabaseUser]); // Re-run whenever the supabaseUser object changes

  // --- Other Effects (Keep these as they were, ensuring stable dependencies) ---
  useEffect(() => { if (fontError) throw fontError; }, [fontError]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && useUserStore.getState().supabaseUser) {
        await supabase.auth.refreshSession();
      }
    });
    return () => subscription.remove();
  }, []); // AppState listener runs once

  useEffect(() => {
    const subscription = setupNotificationResponseListener((response: ExpoNotifications.NotificationResponse) => {
      // ... your notification handling logic ...
       const data = response.notification.request.content.data;
      if (data && typeof data === 'object' && 'type' in data && data.type === 'quote' && 'quoteId' in data) {
        setTargetQuote({
          id: String(data.quoteId),
          text: String(data.quoteText || ''),
          category: data.quoteCategory ? String(data.quoteCategory) : undefined
        });
      }
    });
    return () => subscription.remove();
  }, [setTargetQuote]); // setTargetQuote is stable

  // --- App Readiness and Splash Screen ---
  const isAppReadyToRender = fontsLoaded && zustandReady && initialSessionCheckDone;

  useEffect(() => {
    if (isAppReadyToRender) {
      SplashScreen.hideAsync();
      console.log('_layout.tsx: App is ready to render, hiding splash screen.');
      reviewService.trackAppOpen();
    }
  }, [isAppReadyToRender]);

  // Engineer's Fix Point 5 (part 2) - Short-circuit render if fonts not loaded
  if (!fontsLoaded) {
    console.log('_layout.tsx: Fonts not loaded, rendering null (or ExpoRouterSplashScreen).');
    // return <ExpoRouterSplashScreen />; // Or just null to keep manual splash visible
    return null;
  }
  // Also wait for zustand and initial session check before deciding navigation
  if (!isAppReadyToRender) {
      console.log('_layout.tsx: App not fully ready (zustand or session check pending), rendering null.');
      return null; // Or <ExpoRouterSplashScreen />;
  }

  // --- Navigation Logic ---
  console.log("_layout.tsx: Navigation check", {
    isAppReadyToRender,
    supabaseUserExists: !!supabaseUser,
    hasCompletedOnboardingFromStore: hasCompletedOnboarding,
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

  // Final navigation decision
  if (supabaseUser && hasCompletedOnboarding) {
    console.log("_layout.tsx: Rendering (main) stack.");
    return (
      <GestureHandlerRootView key="main-root" style={{ flex: 1 }}>
        <NativeBaseProvider theme={solaceTheme}>
          <MainStack />
          <StatusBar style="dark" backgroundColor={solaceTheme.colors.miracleBackground} />
        </NativeBaseProvider>
      </GestureHandlerRootView>
    );
  } else {
    console.log("_layout.tsx: Rendering (onboarding) stack.");
    return (
      <GestureHandlerRootView key="onboarding-root" style={{ flex: 1 }}>
        <NativeBaseProvider theme={solaceTheme}>
          <OnboardingStack />
          <StatusBar style="dark" backgroundColor={solaceTheme.colors.miracleBackground} />
        </NativeBaseProvider>
      </GestureHandlerRootView>
    );
  }
}
