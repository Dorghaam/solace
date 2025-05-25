import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, Divider, HStack, Icon, Pressable, Text, VStack } from 'native-base';
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
    <Box flex={1} bg="backgroundLight" safeArea>
      {/* Header */}
      <HStack px={4} py={3} justifyContent="center" alignItems="center" borderBottomWidth={1} borderColor="gray.100" mb={4}>
        <Text fontSize="xl" fontWeight="semibold">Settings</Text>
      </HStack>

      <VStack space={3} divider={<Divider />}>
        <Pressable onPress={() => router.push('/(main)/favorites')}>
          <HStack justifyContent="space-between" alignItems="center" p={4}>
            <Text fontSize="md">My Favorites</Text>
            <Icon as={Ionicons} name="chevron-forward" color="textTertiary" />
          </HStack>
        </Pressable>

        {/* Placeholder for other settings */}
        <Pressable onPress={() => alert("Notification settings coming soon!")}>
          <HStack justifyContent="space-between" alignItems="center" p={4}>
            <Text fontSize="md">Notification Preferences</Text>
            <Icon as={Ionicons} name="chevron-forward" color="textTertiary" />
          </HStack>
        </Pressable>
      </VStack>

      {/* Development Tools */}
      <Box px={4} mt={6}>
        <Text fontSize="sm" color="textSecondary" mb={2}>
          Development Tools:
        </Text>
        <VStack space={2}>
          <Button
            variant="outline"
            colorScheme="red"
            onPress={handleResetOnboarding}
          >
            Reset Onboarding (Dev)
          </Button>
          <Button
            variant="outline"
            colorScheme="orange"
            onPress={handleHardReset}
          >
            Force App Restart (Dev)
          </Button>
        </VStack>
      </Box>
    </Box>
  );
} 