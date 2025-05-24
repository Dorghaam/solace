import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Icon, Pressable, Text } from 'native-base';
import React from 'react';

export const SelectionCard: React.FC<{
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