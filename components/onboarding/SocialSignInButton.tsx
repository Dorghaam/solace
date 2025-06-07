import { Ionicons } from '@expo/vector-icons';
import { HStack, Icon, Pressable, Text, useTheme } from 'native-base';
import React from 'react';

interface SocialSignInButtonProps {
  onPress: () => void;
  isLoading?: boolean;
  iconName: string;
  iconColor: string;
  label: string;
}

export const SocialSignInButton: React.FC<SocialSignInButtonProps> = ({
  onPress,
  isLoading,
  iconName,
  iconColor,
  label,
}) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      w="100%"
      _pressed={{ opacity: 0.8 }}
    >
      <HStack
        alignItems="center"
        justifyContent="center"
        space={3}
        bg="white"
        py={3.5}
        px={6}
        rounded="xl" // Softer rounding than "full"
        borderWidth={1}
        borderColor="coolGray.200"
        shadow="1"
      >
        <Icon as={Ionicons} name={iconName} color={iconColor} size="md" />
        <Text color="textPrimary" fontWeight="medium" fontSize="md">
          {label}
        </Text>
      </HStack>
    </Pressable>
  );
}; 