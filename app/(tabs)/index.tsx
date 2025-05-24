import { Box, Text, VStack, Button } from 'native-base';

export default function HomeScreen() {
  return (
    <Box flex={1} bg="backgroundLight" safeArea>
      <VStack space={4} alignItems="center" justifyContent="center" flex={1}>
        <Text variant="title">Welcome to Solace</Text>
        <Text variant="subtitle">Your mindfulness companion</Text>
        <Button onPress={() => console.log('Button pressed!')} mt={4}>
          Test NativeBase Button
        </Button>
      </VStack>
    </Box>
  );
} 