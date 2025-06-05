import { router } from 'expo-router';
import { useEffect } from 'react';

export default function OnboardingIndex() {
  // Immediately redirect to welcome screen
  router.replace('/welcome');
  
  // Fallback useEffect in case immediate redirect doesn't work
  useEffect(() => {
    router.replace('/welcome');
  }, []);

  return null; // This component doesn't render anything since it immediately redirects
} 