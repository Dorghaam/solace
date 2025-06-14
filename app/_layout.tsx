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
  // --- Zustand Store Slicing ---
  const supabaseUser = useUserStore((state) => state.supabaseUser);
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  const userName = useUserStore((state) => state.userName);
  // Select actions separately (they are stable)
  const setSupabaseUser = useUserStore((state) => state.setSupabaseUser);
  const resetState = useUserStore((state) => state.resetState);
  const setTargetQuote = useUserStore((state) => state.setTargetQuote);

  // --- Local State for Loading Conditions ---
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [zustandReady, setZustandReady] = useState(useUserStore.persist.hasHydrated());
  const [initialSessionCheckDone, setInitialSessionCheckDone] = useState(false);

  // --- Effects for Setup and Listeners ---

  // 1. Wait for Zustand rehydration - FIXED: Only run once
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
  }, []); // FIXED: Empty dependency array to run only once

  // 2. Configure Google SDK exactly once with error handling
  useEffect(() => {
    console.log('_layout.tsx: Configuring Google Sign-In SDK...');
    try {
      configureGoogleSignIn();
    } catch (error) {
      console.error('_layout.tsx: Error configuring Google Sign-In:', error);
    }
  }, []); // Empty dependency array: runs once

  // 2.5. Initialize RevenueCat SDK once on app mount with error handling
  useEffect(() => {
    console.log('_layout.tsx: Initializing RevenueCat SDK...');
    try {
      initRevenueCat();
    } catch (error) {
      console.error('_layout.tsx: Error initializing RevenueCat:', error);
    }
  }, []); // Empty dependency array: runs once

  // 3. Initial session fetch - FIXED: Removed setSupabaseUser from dependencies
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
      setTimeout(async () => {
        await checkAuthenticationSync();
        
        // Also trigger a subscription sync to ensure tier is correct on app startup
        const { subscriptionSyncService } = await import('@/services/subscriptionSyncService');
        await subscriptionSyncService.syncSubscriptionTier('auth_sync');
      }, 3000);
    }).catch((error) => {
      console.error('_layout.tsx: Error fetching session:', error);
      setInitialSessionCheckDone(true); // Still mark as done to prevent infinite loading
    });
  }, [zustandReady]); // FIXED: Removed setSupabaseUser from dependencies

  // 4. Real-time auth listener - FIXED: Removed actions from dependencies
  useEffect(() => {
    if (!zustandReady) {
      return;
    }
    console.log('_layout.tsx: Supabase onAuthStateChange - Setting up listener.');
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log('_layout.tsx: Supabase onAuthStateChange - Event:', _event, 'Session User ID:', session?.user?.id || 'null');
        setSupabaseUser(session?.user ?? null);

        if (_event === 'SIGNED_IN' && session?.user) {
          fetchAndSetUserProfile(session.user.id);
        }

        if (!session?.user && _event === 'SIGNED_OUT') {
           console.log('_layout.tsx: onAuthStateChange - SIGNED_OUT. Resetting state.');
           resetState();
        }
      }
    );
    return () => {
      console.log('_layout.tsx: Supabase onAuthStateChange - Unsubscribing listener.');
      authListener?.subscription?.unsubscribe();
    };
  }, [zustandReady]); // FIXED: Removed setSupabaseUser and resetState from dependencies

  // 4.5. Sync RevenueCat authentication with Supabase user state
  useEffect(() => {
    if (supabaseUser) {
      console.log(`_layout.tsx: Supabase user detected (${supabaseUser.id}), logging into RevenueCat.`);
      rcLogIn(supabaseUser.id);
    } else {
      console.log('_layout.tsx: No Supabase user, logging out of RevenueCat.');
      rcLogOut();
    }
  }, [supabaseUser]);

  // --- Other Effects ---
  useEffect(() => { if (fontError) throw fontError; }, [fontError]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active' && useUserStore.getState().supabaseUser) {
        await supabase.auth.refreshSession();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const subscription = setupNotificationResponseListener((response: ExpoNotifications.NotificationResponse) => {
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
  }, []); // FIXED: Removed setTargetQuote from dependencies

  // --- App Readiness and Splash Screen ---
  const isAppReadyToRender = fontsLoaded && zustandReady && initialSessionCheckDone;

  useEffect(() => {
    if (isAppReadyToRender) {
      SplashScreen.hideAsync();
      console.log('_layout.tsx: App is ready to render, hiding splash screen.');
      reviewService.trackAppOpen();
    }
  }, [isAppReadyToRender]);

  // --- Early Returns for Loading States ---
  if (!fontsLoaded) {
    return null;
  }
  
  if (!isAppReadyToRender) {
    return null;
  }

  // --- SIMPLE Navigation Logic (NO MEMOIZATION) ---
  console.log("_layout.tsx: Navigation decision:", {
    supabaseUserExists: !!supabaseUser,
    hasCompletedOnboarding,
  });

  // Simple navigation without memoization to prevent infinite loops
  if (supabaseUser && hasCompletedOnboarding) {
    return (
      <GestureHandlerRootView key="main-root" style={{ flex: 1 }}>
        <NativeBaseProvider theme={solaceTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(main)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="dark" backgroundColor={solaceTheme.colors.miracleBackground} />
        </NativeBaseProvider>
      </GestureHandlerRootView>
    );
  } else {
    return (
      <GestureHandlerRootView key="onboarding-root" style={{ flex: 1 }}>
        <NativeBaseProvider theme={solaceTheme}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(onboarding)" />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="dark" backgroundColor={solaceTheme.colors.miracleBackground} />
        </NativeBaseProvider>
      </GestureHandlerRootView>
    );
  }
}
