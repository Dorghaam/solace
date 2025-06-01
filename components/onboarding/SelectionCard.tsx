import { Box, Pressable, Text, useTheme } from 'native-base';
import React from 'react';

export const SelectionCard: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => {
  const theme = useTheme();

  return (
    <Pressable 
      onPress={onPress} 
      accessibilityRole="radio" 
      accessibilityState={{ checked: isSelected }}
    >
      <Box
        bg={isSelected ? theme.colors.primary[500] : theme.colors.miracleCardBackground}
        borderColor={isSelected ? theme.colors.primary[500] : theme.colors.primary[300]}
        borderWidth={1.5}
        py={3}
        px={5}
        rounded="full"
        alignItems="center"
        justifyContent="center"
      >
        <Text 
          fontWeight={isSelected ? "semibold" : "medium"}
          color={isSelected ? theme.colors.onboardingButtonText : theme.colors.primary[500]}
          textAlign="center"
        >
          {label}
        </Text>
      </Box>
    </Pressable>
  );
}; 