import { Ionicons } from '@expo/vector-icons';
import { Box, HStack, Icon, Pressable, Text, useTheme } from 'native-base';
import React from 'react';

export const MultiSelectionCard: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
  isPremium?: boolean;
  isLocked?: boolean;
}> = ({ label, isSelected, onPress, isPremium, isLocked }) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected, disabled: isLocked }}
      disabled={isLocked && !isSelected}
    >
      <Box
        bg={theme.colors.miracleCardBackground}
        py={4}
        px={3}
        borderBottomWidth={1}
        borderColor="gray.200"
        rounded="lg"
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        mb={2}
        opacity={isLocked ? 0.7 : 1}
      >
        <HStack alignItems="center" space={2} flex={1}>
          <Text
            fontSize="md"
            fontWeight="medium"
            color={isLocked ? theme.colors.textTertiary : theme.colors.textPrimary}
            flex={1}
            mr={1}
          >
            {label}
          </Text>
          {isLocked && (
            <Icon
              as={Ionicons}
              name="lock-closed-outline"
              color={theme.colors.textTertiary}
              size="sm"
            />
          )}
        </HStack>
        <Icon
          as={Ionicons}
          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
          color={isSelected ? (isLocked ? theme.colors.textTertiary : theme.colors.primary[500]) : theme.colors.textTertiary}
          size="lg"
          ml={3}
        />
      </Box>
    </Pressable>
  );
}; 