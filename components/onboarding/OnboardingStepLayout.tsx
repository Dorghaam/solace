import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, Icon, IconButton, ScrollView, Text, VStack } from 'native-base';
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
  nextButtonText = "Continue",
  showBackButton = true 
}) => {
  return (
    <Box flex={1} bg="backgroundLight" safeArea>
      {/* Back Button - positioned absolutely at top-left */}
      {showBackButton && router.canGoBack() && (
        <IconButton
          icon={<Icon as={Ionicons} name="arrow-back" color="textPrimary" />}
          position="absolute"
          top={12}
          left={4}
          zIndex={10}
          variant="ghost"
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        />
      )}
      
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <VStack p={6} space={5} flexGrow={1} justifyContent="space-between">
          <VStack space={2} pt={showBackButton && router.canGoBack() ? 8 : 0}>
            <Text variant="title" textAlign="left" fontSize="3xl">{title}</Text>
            {subtitle && (
              <Text variant="subtitle" textAlign="left" color="textSecondary" fontSize="md">
                {subtitle}
              </Text>
            )}
            <Box mt={4}>{children}</Box>
          </VStack>

          <VStack space={3} mt={6}>
            {onSkip && (
              <Button variant="ghost" onPress={onSkip}>
                <Text color="textSecondary">Skip for now</Text>
              </Button>
            )}
            <Button onPress={onNext} isDisabled={isNextDisabled}>
              <Text>{nextButtonText}</Text>
            </Button>
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
}; 