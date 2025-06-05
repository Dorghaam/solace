import { router } from 'expo-router';
import { useEffect } from 'react';

export default function OnboardingIndex() {
  useEffect(() => {
    // Immediately redirect to welcome screen
    router.push('/(onboarding)/welcome');
  }, []);

  return null; // This component doesn't render anything since it immediately redirects
} 