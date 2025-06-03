import { hapticService } from '@/services/hapticService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, Icon, IconButton, ScrollView, Text, VStack, useTheme } from 'native-base';
import React from 'react';

export const OnboardingStepLayout: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onNext: () => void;
  isNextDisabled?: boolean;
  onSkip?: () => void;
  nextButtonText?: string;
  showBackButton?: boolean;
}> = ({ 
  title, 
  subtitle, 
  children, 
  onNext, 
  isNextDisabled, 
  onSkip, 
  nextButtonText = "Continue →",
  showBackButton = true 
}) => {
  const theme = useTheme();

  const handleNext = () => {
    hapticService.medium();
    onNext();
  };

  const handleSkip = () => {
    hapticService.light();
    if (onSkip) onSkip();
  };

  const handleBack = () => {
    hapticService.light();
    router.back();
  };

  return (
    <Box flex={1} bg="miracleBackground" safeArea>
      {showBackButton && router.canGoBack() && (
        <IconButton
          icon={<Icon as={Ionicons} name="arrow-back" color="textPrimary" />}
          position="absolute"
          top={{ base: 10, md: 12 }}
          left={{ base: 3, md: 4 }}
          zIndex={10}
          variant="ghost"
          colorScheme="primary"
          size="lg"
          onPress={handleBack}
          accessibilityLabel="Go back"
        />
      )}
      
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <VStack 
          p={6} 
          space={5} 
          flexGrow={1} 
          justifyContent="space-between"
        >
          <VStack 
            space={2} 
            pt={showBackButton && router.canGoBack() ? { base: 16, md: 20 } : { base: 6, md: 8 }}
          >
            <Text 
              variant="title"
              textAlign="left" 
              fontSize={{ base: "2xl", md: "3xl" }}
              color="textPrimary"
              mb={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text 
                variant="subtitle"
                textAlign="left" 
                color="textSecondary" 
                fontSize="md"
                lineHeight="sm"
              >
                {subtitle}
              </Text>
            )}
            <Box mt={6}>{children}</Box>
          </VStack>

          <VStack space={3} mt={6}>
            {onSkip && (
              <Button 
                variant="ghost"
                colorScheme="primary"
                onPress={handleSkip}
              >
                Skip for now 
              </Button>
            )}
            <Button 
              onPress={handleNext} 
              isDisabled={isNextDisabled}
            >
              <Text color="onboardingButtonText" fontWeight="semibold" fontSize="md">
                {nextButtonText}
              </Text>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}; 