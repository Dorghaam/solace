import { MultiSelectionCard, OnboardingStepLayout } from '@/components/onboarding';
import { breakupInterestCategories, useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import { VStack } from 'native-base';
import React from 'react';

export default function InterestCategoriesScreen() {
  const selectedCategories = useUserStore((state) => state.interestCategories);
  const toggleInterestCategory = useUserStore((state) => state.toggleInterestCategory);

  const handleNext = () => {
    // Navigate to notifications preferences
    router.push('/(onboarding)/notifications');
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