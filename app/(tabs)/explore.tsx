import { Box, Text, VStack } from 'native-base';

export default function ExploreScreen() {
  return (
    <Box flex={1} bg="backgroundLight" safeArea>
      <VStack space={4} alignItems="center" justifyContent="center" flex={1}>
        <Text variant="title">Explore</Text>
        <Text variant="subtitle">Discover new mindfulness practices</Text>
      </VStack>
    </Box>
  );
} 