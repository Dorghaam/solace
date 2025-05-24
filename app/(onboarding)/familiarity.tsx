import { OnboardingStepLayout, SelectionCard } from '@/components/onboarding';
import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
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
  const [selectedOption, setSelectedOption] = useState<FamiliarityOption | null>(currentFamiliarity);

  const handleSelectOption = (option: FamiliarityOption) => {
    setSelectedOption(option);
  };

  const handleNext = () => {
    if (selectedOption) {
      setAffirmationFamiliarity(selectedOption);
      router.push('/(onboarding)/categories'); // Navigate to categories screen
    }
  };

  return (
    <OnboardingStepLayout
      title="How familiar are you with affirmations?"
      onNext={handleNext}
      isNextDisabled={!selectedOption}
      // onSkip={() => { /* Handle skip logic if needed */ }} // Optional
    >
      <VStack space={4}>
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