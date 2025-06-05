import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* The initial route is (onboarding)/index.tsx (WelcomeScreen) by convention */}
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="name" />
      <Stack.Screen name="familiarity" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="login" />
      {/* We'll add more screens like 'affirmationFamiliarity', 'interestCategories' here later */}
    </Stack>
  );
} 