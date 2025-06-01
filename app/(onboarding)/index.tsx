import { useUserStore } from '@/store/userStore'; // Assuming store is at @/store
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, Icon, Text, VStack } from 'native-base';
import React from 'react';

export default function WelcomeScreen() {
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);

  const handleGetStarted = () => {
    router.push('/(onboarding)/name');
  };

  return (
    <Box 
      flex={1} 
      bg="miracleBackground" // From updated theme
      safeArea 
      justifyContent="center"
      alignItems="center" 
      p={6}
    >
      
      <VStack space={3} alignItems="center" width="100%" flex={1} justifyContent="center">
        {/* Solace App Title - Styled like "Miracle" title */}
        <Text 
          variant="title" 
          fontSize={{ base: "5xl", md: "6xl" }} // Large, prominent title
          color="primary.500" // miracleBlue
          fontWeight="bold"
          textAlign="center"
          mb={2} // Reduced space before subtitle
          lineHeight={{ base: "48px", md: "60px" }} // Tighter line height
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
        >
          Heal and grow with affirmations designed for your journey through breakup.
        </Text>
      </VStack>

      <VStack space={3} w="100%" alignItems="center" mb={8}>
        {/* Main Action Button - Styled like "Miracle" */}
        <Button 
          onPress={handleGetStarted} 
          w="80%"
          py={3.5}
          rightIcon={<Icon as={Ionicons} name="arrow-forward" size="sm" color="white" />}
          _text={{ color: "white" }}
        >
          Continue 
        </Button>
      </VStack>
    </Box>
  );
} 