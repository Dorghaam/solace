import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* The initial route is (onboarding)/index.tsx (WelcomeScreen) by convention */}
      <Stack.Screen name="index" />
      <Stack.Screen name="name" />
      {/* We'll add more screens like 'affirmationFamiliarity', 'interestCategories' here later */}
    </Stack>
  );
} 