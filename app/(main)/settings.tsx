import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import { Box, Button, Text, VStack } from 'native-base';
import React from 'react';

export default function SettingsScreen() {
  const resetState = useUserStore((state) => state.resetState);
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);

  const handleResetOnboarding = () => {
    resetState();
    setHasCompletedOnboarding(false);
    // Force navigation to onboarding
    setTimeout(() => {
      router.replace('/(onboarding)');
    }, 100);
  };

  const handleHardReset = () => {
    resetState();
    setHasCompletedOnboarding(false);
    // Navigate to root and then to onboarding
    router.dismissAll();
    router.replace('/');
  };

  return (
    <Box flex={1} bg="backgroundLight" safeArea p={6}>
      <VStack space={4} alignItems="center" justifyContent="center" flex={1}>
        <Text variant="title">Settings</Text>
        <Text variant="subtitle">Settings screen coming soon</Text>
        
        {/* Temporary reset button for testing */}
        <VStack space={3} mt={8} w="100%">
          <Text variant="body" textAlign="center" color="gray.600">
            Development Tools:
          </Text>
          <Button 
            variant="outline" 
            colorScheme="red" 
            onPress={handleResetOnboarding}
            w="100%"
          >
            Reset Onboarding (Dev)
          </Button>
          <Button 
            variant="solid" 
            colorScheme="red" 
            onPress={handleHardReset}
            w="100%"
          >
            Hard Reset (Dev)
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
} 