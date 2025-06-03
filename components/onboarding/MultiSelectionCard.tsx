import { hapticService } from '@/services/hapticService';
import { Ionicons } from '@expo/vector-icons';
import { Box, Icon, Pressable, Text, useTheme } from 'native-base';
import React from 'react';

export const MultiSelectionCard: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => {
  const theme = useTheme();

  const handlePress = () => {
    hapticService.selection();
    onPress();
  };

  return (
    <Pressable 
      onPress={handlePress} 
      accessibilityRole="checkbox" 
      accessibilityState={{ checked: isSelected }}
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
      >
        <Text 
          fontSize="md"
          fontWeight="medium"
          color={theme.colors.textPrimary}
          flex={1}
        >
          {label}
        </Text>
        <Icon
          as={Ionicons}
          name={isSelected ? "checkmark-circle" : "ellipse-outline"}
          color={isSelected ? theme.colors.primary[500] : theme.colors.textTertiary}
          size="lg"
          ml={3}
        />
      </Box>
    </Pressable>
  );
}; 