import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import { Box, Button, Text, VStack } from 'native-base';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TextInput } from 'react-native';

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

const styles = StyleSheet.create({
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    backgroundColor: '#FFFFFF',
  }
});

export default function NameInputScreen() {
  const [name, setName] = useState('');
  const setUserName = useUserStore((state) => state.setUserName);
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);
  const inputRef = useRef<TextInput>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    // Multiple attempts with different timing strategies
    console.log('NameInputScreen mounted, attempting focus...');
    
    // Attempt 1: Immediate next frame
    requestAnimationFrame(() => {
      if (mountedRef.current) {
        console.log('Attempt 1: requestAnimationFrame focus');
        inputRef.current?.focus();
      }
    });

    // Attempt 2: Small delay
    const timer1 = setTimeout(() => {
      if (mountedRef.current) {
        console.log('Attempt 2: 100ms delay focus');
        inputRef.current?.focus();
      }
    }, 100);

    // Attempt 3: Longer delay as fallback
    const timer2 = setTimeout(() => {
      if (mountedRef.current) {
        console.log('Attempt 3: 300ms delay focus');
        inputRef.current?.focus();
      }
    }, 300);

    return () => {
      mountedRef.current = false;
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

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

      // Explicitly navigate to the main app's initial route AFTER state update
      router.replace('/(main)');
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
      <TextInput
        ref={inputRef}
        style={styles.textInput}
        placeholder="Your name or nickname"
        value={name}
        onChangeText={setName}
        returnKeyType={Platform.OS === 'ios' ? 'done' : 'next'}
        onSubmitEditing={handleNext}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="name"
      />
      <Text variant="small" mt={2}>
        This helps us personalize your affirmations.
      </Text>
    </OnboardingStepLayout>
  );
} 