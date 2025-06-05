import { OnboardingStepLayout } from '@/components/onboarding';
import { loginWithGoogle } from '@/services/authService';
import { hapticService } from '@/services/hapticService';
import { useUserStore } from '@/store/userStore';
// Note: We don't directly setSupabaseUser here.
// That logic is centralized in app/_layout.tsx's onAuthStateChange listener.
import { Ionicons } from '@expo/vector-icons';
import { Button, Icon, Text, useToast, VStack } from 'native-base';
import React, { useState } from 'react';
import { Alert, Platform } from 'react-native';

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    hapticService.medium();
    try {
      console.log('LoginScreen: Initiating Google Sign-In...');
      await loginWithGoogle();
      // After successful login, onAuthStateChange in _layout.tsx updates supabaseUser.
      // Now, mark onboarding as complete.
      setHasCompletedOnboarding(true);
      // _layout.tsx will then automatically navigate to the (main) stack.
      console.log('LoginScreen: loginWithGoogle service call completed. Onboarding marked as complete.');
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