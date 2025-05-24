import { Box, Text, VStack, Button } from 'native-base';
import { router } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <Box flex={1} bg="backgroundLight" safeArea>
      <VStack space={4} alignItems="center" justifyContent="center" flex={1}>
        <Text variant="title">Oops!</Text>
        <Text variant="subtitle">This screen doesn't exist.</Text>
        <Button onPress={() => router.replace('/')}>
          Go to home screen!
        </Button>
      </VStack>
    </Box>
  );
} 