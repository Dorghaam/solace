import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons'; // Or your preferred icon set
import { router } from 'expo-router';
import { Box, Button, HStack, Icon, Pressable, Text, VStack } from 'native-base';
import React, { useState } from 'react';

// Reusable OnboardingStepLayout (if you haven't moved it to components/ yet)
// If you have, import it instead. For now, defining it here for completeness.
const OnboardingStepLayout: React.FC<{
  title: string;
  children: React.ReactNode;
  onNext: () => void;
  isNextDisabled?: boolean;
  onSkip?: () => void;
  nextButtonText?: string;
}> = ({ title, children, onNext, isNextDisabled, onSkip, nextButtonText = "Continue" }) => {
  return (
    <Box flex={1} bg="backgroundLight" safeArea p={6} justifyContent="space-between">
      <VStack space={5} mt={8}> {/* Added mt for back button spacing */}
        {router.canGoBack() && (
          <Button
            onPress={() => router.back()}
            variant="outline" // Change to outline to ensure it's not an icon issue for now
            size="sm"
            position="absolute" // Keep positioning for layout test
            top={-6}
            left={-3}
            zIndex={1}
          >
            <Text>Back</Text>
          </Button>
        )}
        <Text variant="title" textAlign="left" fontSize="3xl">{title}</Text>
        {children}
      </VStack>
      <VStack space={3} mb={2}>
        {onSkip && (
          <Button variant="ghost" onPress={onSkip}>
            <Text color="textSecondary">Skip for now</Text>
          </Button>
        )}
        <Button onPress={onNext} isDisabled={isNextDisabled}>
          <Text>{nextButtonText}</Text>
        </Button>
      </VStack>
    </Box>
  );
};

// Reusable SelectionCard component
const SelectionCard: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: isSelected }}>
      <Box
        bg={isSelected ? "primary.100" : "backgroundFocused"}
        borderColor={isSelected ? "primary.500" : "textTertiary"}
        borderWidth={isSelected ? 2 : 1}
        p={4}
        rounded="lg"
        shadow={isSelected ? "2" : "0"}
      >
        <HStack justifyContent="space-between" alignItems="center">
          <Text fontWeight={isSelected ? "bold" : "normal"} color={isSelected ? "primary.600" : "textPrimary"}>
            {label}
          </Text>
          {isSelected && (
             // @ts-ignore
            <Icon as={Ionicons} name="checkmark-circle" color="primary.500" size="md" />
          )}
        </HStack>
      </Box>
    </Pressable>
  );
};


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
      // router.push('/(onboarding)/interestCategories'); // Next Step
      // For now, complete onboarding to test this screen in isolation
      const setHasCompletedOnboarding = useUserStore.getState().setHasCompletedOnboarding;
      setHasCompletedOnboarding(true);
      router.replace('/(main)');
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