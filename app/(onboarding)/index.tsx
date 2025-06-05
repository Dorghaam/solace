import { router } from 'expo-router';
import { useEffect } from 'react';

export default function OnboardingIndex() {
  useEffect(() => {
    // Using the full path to navigate to the welcome screen
    // within the (onboarding) layout group.
    router.replace('/(onboarding)/welcome');
  }, []); // Empty dependency array ensures this runs once after the component mounts

  return null; // This component doesn't render anything itself as it redirects
} 