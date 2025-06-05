import { OnboardingStepLayout } from '@/components/onboarding';
import { useUserStore } from '@/store/userStore';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme } from 'native-base';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, StyleSheet, TextInput } from 'react-native';

export default function NameInputScreen() {
  const [name, setName] = useState('');
  const setUserName = useUserStore((state) => state.setUserName);
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);
  const { editing } = useLocalSearchParams<{ editing?: string }>();
  const inputRef = useRef<TextInput>(null);
  const mountedRef = useRef(true);

  const theme = useTheme();

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
      
      if (editing === 'true') {
        router.replace('/(main)/settings'); // Go back to settings if editing
      } else {
        // Use correct TypeScript route path
        router.push('/(onboarding)/familiarity'); // Continue onboarding
      }
    } else {
      console.log('❌ Name is empty');
    }
  };

  // Define styles dynamically using theme colors
  const styles = StyleSheet.create({
    textInput: {
      height: 55,
      borderWidth: 1,
      borderColor: theme.colors.primary[200],
      borderRadius: 16,
      paddingHorizontal: 20,
      fontSize: 18,
      backgroundColor: theme.colors.miracleCardBackground || '#FFFFFF',
      color: theme.colors.textPrimary || '#333333',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    }
  });

  return (
    <OnboardingStepLayout
      title="What should we call you?"
      subtitle="This helps us personalize your affirmations."
      onNext={handleNext}
      isNextDisabled={!name.trim()}
      showBackButton={editing === 'true'}
      nextButtonText="Continue →"
    >
      <TextInput
        ref={inputRef}
        style={styles.textInput}
        placeholder="Your name or nickname"
        placeholderTextColor={theme.colors.textSecondary || '#AEAEAE'}
        value={name}
        onChangeText={setName}
        returnKeyType={Platform.OS === 'ios' ? 'done' : 'next'}
        onSubmitEditing={handleNext}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="name"
      />
    </OnboardingStepLayout>
  );
} 