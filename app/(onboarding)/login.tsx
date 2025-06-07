import { SocialSignInButton } from '@/components/onboarding';
import { loginWithGoogle } from '@/services/authService';
import { hapticService } from '@/services/hapticService';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Icon, IconButton, Text, useToast, VStack } from 'native-base';
import React, { useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

export default function LoginScreen() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const toast = useToast();
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    hapticService.medium();
    try {
      console.log('LoginScreen: Initiating Google Sign-In...');
      await loginWithGoogle();
      
      // onAuthStateChange in _layout should handle user state.
      // We can now mark onboarding as complete and navigate.
      setHasCompletedOnboarding(true);
      console.log('LoginScreen: loginWithGoogle successful. Onboarding marked as complete.');
      
      // Use replace to prevent going back to the login screen
      requestAnimationFrame(() => router.replace('/(main)'));

    } catch (err: any) {
      console.error("LoginScreen: Google Sign-In Error caught:", err.message);
      Alert.alert(
        "Sign-In Failed",
        err.message || 'Could not sign in with Google. Please try again.',
        [{ text: "OK" }]
      );
      setIsGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    // TODO: Implement Apple Sign-In logic here
    setIsAppleLoading(true);
    hapticService.medium();
    Alert.alert("Coming Soon", "Sign in with Apple will be available in a future update.");
    setIsAppleLoading(false);
  };
  
  return (
    <Box flex={1} bg="miracleBackground" safeArea>
      {/* Back Button */}
      {router.canGoBack() && (
        <IconButton
          icon={<Icon as={Ionicons} name="arrow-back" color="textPrimary" />}
          position="absolute"
          top={{ base: 10, md: 12 }}
          left={{ base: 3, md: 4 }}
          zIndex={10}
          variant="ghost"
          size="lg"
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        />
      )}

      <VStack flex={1} p={6} justifyContent="space-between">
        {/* Main Content Area */}
        <Box>
          {/* Headlines */}
          <VStack space={2} alignItems="center" mt={16} mb={8}>
            <Text
              fontSize="3xl"
              fontWeight="bold"
              color="textPrimary"
              textAlign="center"
            >
              Sign in to Solace
            </Text>
            <Text
              fontSize="md"
              color="textSecondary"
              textAlign="center"
              px={4}
              lineHeight="lg"
            >
              Keep your content and settings secure, even if you switch to a new device.
            </Text>
          </VStack>

          {/* Auth Buttons */}
          <VStack space={4} mt={12}>
            {Platform.OS === 'ios' && (
              <SocialSignInButton
                label="Sign in with Apple"
                iconName="logo-apple"
                iconColor="black"
                onPress={handleAppleSignIn}
                isLoading={isAppleLoading}
              />
            )}
            <SocialSignInButton
              label="Sign in with Google"
              iconName="logo-google"
              iconColor="red.500"
              onPress={handleGoogleSignIn}
              isLoading={isGoogleLoading}
            />
          </VStack>
        </Box>

        {/* Footer */}
        <Text fontSize="xs" color="textSecondary" textAlign="center" mb={2}>
          By signing in, you agree to our{' '}
          <Text
            underline
            onPress={() => Linking.openURL('https://your-website.com/terms')}
          >
            Terms & Conditions
          </Text>
          {' and '}
          <Text
            underline
            onPress={() => Linking.openURL('https://your-website.com/privacy')}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </VStack>
    </Box>
  );
} 