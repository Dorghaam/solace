import { useUserStore } from '@/store/userStore';
import { Box, Button, Text, VStack } from 'native-base';
import React, { useState } from 'react';
import { Keyboard, TextInput } from 'react-native';

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
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);

  const handleNext = () => {
    console.log('🔄 handleNext called with name:', name);
    
    if (name.trim()) {
      console.log('✅ Name is valid, processing...');
      
      // First dismiss keyboard
      Keyboard.dismiss();
      console.log('⌨️ Keyboard dismissed');
      
      // Save the name
      setUserName(name.trim());
      console.log('💾 Name saved to store');
      
      // Complete onboarding
      setHasCompletedOnboarding(true);
      console.log('🎉 Onboarding completed!');
    } else {
      console.log('❌ Name is empty');
    }
  };

  return (
    <OnboardingStepLayout
      title="What should we call you?"
      onNext={handleNext}
      isNextDisabled={!name.trim()}
    >
      <Box
        borderWidth={1}
        borderColor="gray.300"
        borderRadius="md"
        px={4}
        py={3}
        bg="white"
      >
        <TextInput
          placeholder="Your name or nickname"
          value={name}
          onChangeText={(text) => {
            console.log('📝 Text changed:', text);
            setName(text);
          }}
          style={{
            fontSize: 18,
            color: '#000',
            minHeight: 40,
          }}
          returnKeyType="done"
          onSubmitEditing={() => {
            console.log('🚀 onSubmitEditing triggered');
            handleNext();
          }}
          blurOnSubmit={true}
        />
      </Box>
      <Text variant="small" mt={2}>
        This helps us personalize your affirmations.
      </Text>
    </OnboardingStepLayout>
  );
} 