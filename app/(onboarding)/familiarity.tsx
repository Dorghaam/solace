import { OnboardingStepLayout, SelectionCard } from '@/components/onboarding';
import { useUserStore } from '@/store/userStore';
import { router, useLocalSearchParams } from 'expo-router';
import { VStack } from 'native-base';
import React, { useState } from 'react';

type FamiliarityOption = 'new' | 'occasional' | 'regular';
const options: { value: FamiliarityOption; label: string }[] = [
  { value: 'new', label: 'This is new for me' },
  { value: 'occasional', label: 'I\'ve used them occasionally' },
  { value: 'regular', label: 'I use them regularly' },
];

export default function AffirmationFamiliarityScreen() {
  const currentFamiliarity = useUserStore((state) => state.affirmationFamiliarity);
  const setAffirmationFamiliarity = useUserStore((state) => state.setAffirmationFamiliarity);
  const { editing } = useLocalSearchParams<{ editing?: string }>();
  const [selectedOption, setSelectedOption] = useState<FamiliarityOption | null>(currentFamiliarity);

  const handleSelectOption = (option: FamiliarityOption) => {
    setSelectedOption(option);
  };

  const handleNext = () => {
    if (selectedOption) {
      setAffirmationFamiliarity(selectedOption);
      if (editing === 'true') {
        router.replace('/(main)/settings'); // Go back to settings if editing
      } else {
        router.push('/(onboarding)/categories'); // Continue onboarding
      }
    }
  };

  return (
    <OnboardingStepLayout
      title="How familiar are you with affirmations?"
      onNext={handleNext}
      isNextDisabled={!selectedOption}
      showBackButton={editing === 'true'}
      nextButtonText="Continue →"
    >
      <VStack space={4} mt={4}>
        {options.map((opt) => (
          <SelectionCard
            key={opt.value}
            label={opt.label}
            isSelected={selectedOption === opt.value}
            onPress={() => handleSelectOption(opt.value)}
          />
        ))}
      </VStack>
    </OnboardingStepLayout>
  );
} 