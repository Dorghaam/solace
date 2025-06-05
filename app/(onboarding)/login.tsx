import { OnboardingStepLayout } from '@/components/onboarding';
import { loginWithGoogle } from '@/services/authService';
import { hapticService } from '@/services/hapticService';
// Note: We don't directly setSupabaseUser or setHasCompletedOnboarding here.
// That logic is centralized in app/_layout.tsx's onAuthStateChange listener.
import { Ionicons } from '@expo/vector-icons';
import { Button, Icon, Text, useToast, VStack } from 'native-base';
import React, { useState } from 'react';
import { Alert, Platform } from 'react-native';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    hapticService.medium();
    try {
      console.log('LoginScreen: Initiating Google Sign-In...');
      await loginWithGoogle();
      // On successful loginWithGoogle, Supabase will trigger the onAuthStateChange
      // listener in app/_layout.tsx. That listener will then:
      // 1. Set the supabaseUser in Zustand.
      // 2. Check if all other onboarding data is present.
      // 3. If yes, set hasCompletedOnboarding = true.
      // 4. The main conditional rendering in _layout.tsx will then route to /(main).
      // No need to setIsLoading(false) here if navigation occurs on success.
      // If loginWithGoogle throws, the catch block will handle setIsLoading.
      console.log('LoginScreen: loginWithGoogle service call completed (or threw an error).');
    } catch (err: any) {
      console.error("LoginScreen: Google Sign-In Error caught:", err.message);
      Alert.alert(
        "Sign-In Failed",
        err.message || 'Could not sign in with Google. Please try again.',
        [{ text: "OK" }]
      );
      setIsLoading(false); // Set loading to false only on error
    }
  };

  return (
    <OnboardingStepLayout
      title="Create Your Account"
      subtitle="Sign in to save your preferences and journey with Solace."
      onNext={() => {}} // Default "Next" button is not used for primary action
      showBackButton={true} // Allow going back to previous onboarding step (e.g., notifications)
      nextButtonText="Sign In with Google" // Text for default button (but it's disabled)
      isNextDisabled={true} // Disable the default OnboardingStepLayout's next button
    >
      <VStack space={5} flex={1} justifyContent="center" alignItems="center" mt={Platform.OS === 'ios' ? 4 : 8}>
        <Button
          w="90%" // Make button wider
          py={3.5}
          bg="white" // Google's recommended style often involves a white background
          _pressed={{ bg: 'coolGray.100' }}
          _text={{ color: 'coolGray.700', fontWeight: 'medium', fontSize: 'md' }}
          leftIcon={<Icon as={Ionicons} name="logo-google" color="red.500" size="md" />}
          isLoading={isLoading}
          isLoadingText="Signing in..."
          onPress={handleGoogleSignIn}
          shadow="1" // Subtle shadow
          rounded="full"
          variant="outline" // Could also be outline or solid with custom styling
          borderColor="coolGray.300" // If using outline
        >
          Continue with Google
        </Button>

        <Text fontSize="xs" color="textSecondary" textAlign="center" mt={6} px={4}>
          By signing in, you agree to our (yet to be linked) Terms of Service and Privacy Policy.
        </Text>
      </VStack>
    </OnboardingStepLayout>
  );
} 