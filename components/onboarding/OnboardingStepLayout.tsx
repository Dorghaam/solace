import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, Icon, ScrollView, Text, VStack } from 'native-base';
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
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <VStack p={6} space={5} flexGrow={1} justifyContent="space-between">
          <VStack space={2}>
            {/* Back Button */}
            {showBackButton && router.canGoBack() && (
              <Button
                variant="ghost"
                onPress={() => router.back()}
                leftIcon={<Icon as={Ionicons} name="arrow-back" color="textPrimary" size="md" />}
                alignSelf="flex-start"
                mb={2}
              >
                <Text color="textPrimary">Back</Text>
              </Button>
            )}
            
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