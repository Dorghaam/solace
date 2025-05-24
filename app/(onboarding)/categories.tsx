import { MultiSelectionCard, OnboardingStepLayout } from '@/components/onboarding';
import { breakupInterestCategories, useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import { VStack } from 'native-base';
import React from 'react';

export default function InterestCategoriesScreen() {
  const selectedCategories = useUserStore((state) => state.interestCategories);
  const toggleInterestCategory = useUserStore((state) => state.toggleInterestCategory);

  const handleNext = () => {
    // Next step would be notification preferences or completing onboarding
    // router.push('/(onboarding)/notifications');
    
    // For now, complete onboarding
    const setHasCompletedOnboarding = useUserStore.getState().setHasCompletedOnboarding;
    setHasCompletedOnboarding(true);
    router.replace('/(main)');
  };

  return (
    <OnboardingStepLayout
      title="Which topics resonate?"
      subtitle="Select a few areas you'd like to focus on. This will help us personalize your affirmations."
      onNext={handleNext}
      isNextDisabled={selectedCategories.length === 0} // Example: require at least one selection
    >
      <VStack space={3}>
        {breakupInterestCategories.map((category) => (
          <MultiSelectionCard
            key={category.id}
            label={category.label}
            isSelected={selectedCategories.includes(category.id)}
            onPress={() => toggleInterestCategory(category.id)}
          />
        ))}
      </VStack>
    </OnboardingStepLayout>
  );
} 