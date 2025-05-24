import { Box, Button, Text, VStack } from 'native-base';

export default function FeedScreen() {
  return (
    <Box flex={1} bg="backgroundLight" safeArea>
      <VStack space={4} alignItems="center" justifyContent="center" flex={1}>
        <Text variant="title">Your Feed</Text>
        <Text variant="subtitle">Affirmations and content tailored for your healing journey</Text>
        <Button onPress={() => console.log('Feed interaction!')} mt={4}>
          Coming Soon
        </Button>
      </VStack>
    </Box>
  );
} 