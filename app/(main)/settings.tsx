import { Box, Text, VStack } from 'native-base';
import React from 'react';

export default function SettingsScreen() {
  return (
    <Box flex={1} bg="backgroundLight" safeArea>
      <VStack space={4} alignItems="center" justifyContent="center" flex={1}>
        <Text variant="title">Settings</Text>
        <Text variant="subtitle">Settings screen coming soon</Text>
      </VStack>
    </Box>
  );
} 