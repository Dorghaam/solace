import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="welcome" />
      <Stack.Screen name="name" />
      <Stack.Screen name="familiarity" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="login" />
    </Stack>
  );
} 