import { Ionicons } from '@expo/vector-icons';
import { Box, Icon, Pressable, Text } from 'native-base';
import React from 'react';

export const MultiSelectionCard: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => {
  return (
    <Pressable onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: isSelected }}>
      <Box
        bg={isSelected ? "primary.100" : "backgroundFocused"}
        borderColor={isSelected ? "primary.500" : "textTertiary"}
        borderWidth={isSelected ? 2 : 1}
        p={4}
        rounded="lg"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
      >
        <Text fontWeight={isSelected ? "bold" : "normal"} color={isSelected ? "primary.600" : "textPrimary"}>
          {label}
        </Text>
        <Icon
          as={Ionicons}
          name={isSelected ? "checkbox" : "square-outline"}
          color={isSelected ? "primary.500" : "textTertiary"}
          size="md"
        />
      </Box>
    </Pressable>
  );
}; 