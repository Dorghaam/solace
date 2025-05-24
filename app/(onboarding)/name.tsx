import { useUserStore } from '@/store/userStore';
import { Box, Button, Input, Text, VStack } from 'native-base';
import React, { useState } from 'react';
import { Platform } from 'react-native';

// A simple layout component for onboarding steps (can be expanded later)
const OnboardingStepLayout: React.FC<{
  title: string;
  children: React.ReactNode;
  onNext: () => void;
  isNextDisabled?: boolean;
  onSkip?: () => void; // Optional skip
}> = ({ title, children, onNext, isNextDisabled, onSkip }) => {
  return (
    <Box flex={1} bg="backgroundLight" safeArea p={6} justifyContent="space-between">
      <VStack space={5}>
        {/* Can add a back button here if needed: <Button onPress={() => router.back()}>Back</Button> */}
        <Text variant="title" textAlign="left" fontSize="3xl">{title}</Text>
        {children}
      </VStack>
      <VStack space={3}>
        {onSkip && (
          <Button variant="ghost" onPress={onSkip}>
            Skip for now
          </Button>
        )}
        <Button onPress={onNext} isDisabled={isNextDisabled}>
          Continue
        </Button>
      </VStack>
    </Box>
  );
};

export default function NameInputScreen() {
  const [name, setName] = useState('');
  const setUserName = useUserStore((state) => state.setUserName);

  const handleNext = () => {
    if (name.trim()) {
      setUserName(name.trim());
      // router.push('/(onboarding)/affirmationFamiliarity'); // Next step
      // For now, let's go to main app to test this step in isolation
      const setHasCompletedOnboarding = useUserStore.getState().setHasCompletedOnboarding;
      setHasCompletedOnboarding(true);
    }
  };

  return (
    <OnboardingStepLayout
      title="What should we call you?"
      onNext={handleNext}
      isNextDisabled={!name.trim()}
    >
      <Input
        placeholder="Your name or nickname"
        value={name}
        onChangeText={setName}
        size="xl" // Uses theme's defaultProps for Input
        autoFocus
        // Enforce single line and handle submission for better UX
        blurOnSubmit={false}
        onSubmitEditing={handleNext} // Allow "Enter" key to submit
        returnKeyType={Platform.OS === 'ios' ? 'done' : 'next'}
      />
      <Text variant="small" mt={2}>
        This helps us personalize your affirmations.
      </Text>
    </OnboardingStepLayout>
  );
} 