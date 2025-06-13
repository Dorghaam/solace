import { SocialSignInButton } from '@/components/onboarding';
import { loginWithApple, loginWithGoogle } from '@/services/authService';
import { hapticService } from '@/services/hapticService';
// Removed unused import since we're no longer setting onboarding completion here
import { Ionicons } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { Box, Icon, IconButton, Text, VStack } from 'native-base';
import React, { useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';

export default function LoginScreen() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    hapticService.medium();
    try {
      console.log('LoginScreen: Initiating Google Sign-In...');
      await loginWithGoogle();
      
      // onAuthStateChange in _layout handles user state.
      // Onboarding is NOT complete yet. Navigate to the paywall.
      console.log('LoginScreen: loginWithGoogle successful. Navigating to paywall.');
      
      // Navigate to paywall screen
      requestAnimationFrame(() => router.replace('./paywall'));

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
    setIsAppleLoading(true);
    hapticService.medium();
    try {
      console.log('LoginScreen: Initiating Apple Sign-In...');
      await loginWithApple();
      
      // Onboarding is NOT complete yet. Navigate to the paywall.
      console.log('LoginScreen: loginWithApple successful. Navigating to paywall.');
      
      requestAnimationFrame(() => router.replace('./paywall'));

    } catch (err: any) {
      // Don't show an alert if the user just cancelled
      if (err.code !== 'ERR_REQUEST_CANCELED') {
         console.error("LoginScreen: Apple Sign-In Error caught:", err.message);
         Alert.alert(
          "Sign-In Failed",
          err.message || 'Could not sign in with Apple. Please try again.',
          [{ text: "OK" }]
        );
      }
    } finally {
      setIsAppleLoading(false);
    }
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
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={{ width: '100%', height: 52 }}
                onPress={handleAppleSignIn}
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
            onPress={() => Linking.openURL('https://sites.google.com/view/solace-app/home?authuser=0')}
          >
            Terms & Conditions
          </Text>
          {' and '}
          <Text
            underline
            onPress={() => Linking.openURL('https://sites.google.com/view/solace-app/privacy-policy?authuser=0')}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </VStack>
    </Box>
  );
} 