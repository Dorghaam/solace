import { useUserStore } from '@/store/userStore'; // Assuming store is at @/store
import { router } from 'expo-router';
import { Box, Button, Text, VStack, HStack, Spacer, Icon } from 'native-base';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);
  const resetState = useUserStore((state) => state.resetState);

  const handleGetStarted = () => {
    router.push('/(onboarding)/name');
  };

  const handleResetAndRestartOnboarding = () => {
    resetState();
    setHasCompletedOnboarding(false); 
    router.push('/(onboarding)');
  };

  return (
    <Box 
      flex={1} 
      bg="miracleBackground" // From updated theme
      safeArea 
      justifyContent="space-around"
      alignItems="center" 
      p={6}
    >
      <Spacer flex={1} />
      
      <VStack space={5} alignItems="center" width="100%">
        {/* Solace App Title - Styled like "Miracle" title */}
        <Text 
          variant="title" 
          fontSize={{ base: "5xl", md: "6xl" }} // Large, prominent title
          color="primary.500" // miracleBlue
          fontWeight="bold"
          textAlign="center"
          mb={4} // Space before subtitle
        >
          Find Your Solace 
        </Text>
        
        {/* Solace App Subtitle - Styled like "Miracle" subtitle */}
        <Text 
          variant="subtitle" 
          px={5} 
          fontSize="md" 
          color="textSecondary"
          textAlign="center"
          mb={6} // Space before dots
        >
          Heal and grow with affirmations designed for your journey through breakup.
        </Text>

        {/* Progression Dots - Styled like "Miracle" */}
        <HStack space={2} mb={10}>
          <Box bg="primary.500" width={2.5} height={2.5} borderRadius="full" />
          <Box bg="primary.200" width={2.5} height={2.5} borderRadius="full" />
          <Box bg="primary.200" width={2.5} height={2.5} borderRadius="full" />
        </HStack>
      </VStack>

      <Spacer flex={2} />

      <VStack space={3} w="100%" alignItems="center" mb={4}>
        {/* Main Action Button - Styled like "Miracle" */}
        <Button 
          onPress={handleGetStarted} 
          w="80%"
          py={3.5}
          rightIcon={<Icon as={Ionicons} name="arrow-forward" size="sm" color="white" />}
        >
          <Text color="onboardingButtonText" fontWeight="semibold" fontSize="md">
            Continue 
          </Text>
        </Button>

        {/* Development-only button to reset and view onboarding */}
        {__DEV__ && (
          <Button 
            mt={2}
            variant="outline" 
            onPress={handleResetAndRestartOnboarding} 
            w="80%"
            borderColor="primary.300" // Use a theme color
            _text={{ color: "primary.500" }} // Use a theme color
          >
            Dev: Reset & View Onboarding
          </Button>
        )}
      </VStack>
    </Box>
  );
} 