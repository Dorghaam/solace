import { useUserStore } from '@/store/userStore'; // Assuming store is at @/store
import { router } from 'expo-router';
import { Box, Button, Text, VStack } from 'native-base';
import React from 'react';

export default function WelcomeScreen() {
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);
  const resetState = useUserStore((state) => state.resetState);

  const handleGetStarted = () => {
    // For now, let's just skip to the main app to test navigation.
    // Later, this will navigate to the next onboarding step.
    router.push('/(onboarding)/name'); // Navigate to the name input screen
  };

  const handleReset = () => {
    resetState();
    // Force a re-render by setting onboarding to false explicitly
    setHasCompletedOnboarding(false);
  };

  return (
    <Box flex={1} bg="backgroundLight" safeArea justifyContent="space-around" alignItems="center" p={6}>
      <VStack space={5} alignItems="center">
        {/* TODO: Add a nice Solace logo or illustration */}
        {/* <Image source={require('@/assets/images/solace-logo.png')} alt="Solace Logo" size="xl" /> */}
        <Text variant="title" fontSize="4xl">
          Find Your Solace
        </Text>
        <Text variant="subtitle" px={5}>
          Heal and grow with affirmations designed for your journey through breakup.
        </Text>
      </VStack>
      <VStack space={3} w="100%">
        <Button onPress={handleGetStarted} w="100%">
          Get Started
        </Button>
        {/* Temporary reset button for testing */}
        <Button variant="outline" onPress={handleReset} w="100%" size="sm">
          Reset Store (Dev)
        </Button>
      </VStack>
    </Box>
  );
} 