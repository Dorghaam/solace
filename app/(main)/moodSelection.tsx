import { hapticService } from '@/services/hapticService'; // Import haptic service
import { DailyMood, useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, HStack, Icon, IconButton, Pressable, ScrollView, Text, useTheme, VStack } from 'native-base';
import React from 'react';

// Define mood options here or import from a constants file
const moodOptions = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '😌', label: 'Calm' },
  { emoji: '😔', label: 'Sad' },
  { emoji: '😟', label: 'Worried' }, // Example, adjust as needed
  { emoji: '😠', label: 'Frustrated' }, // Example
  { emoji: '🧘', label: 'Peaceful' }, // Example
  { emoji: '✨', label: 'Hopeful' }, // Example
  { emoji: '🌿', label: 'Grateful' }, // Example
];


export default function MoodSelectionScreen() {
  const theme = useTheme();
  const setDailyMood = useUserStore((state) => state.setDailyMood);
  const currentDailyMood = useUserStore((state) => state.dailyMood);

  const todayDateString = new Date().toISOString().split('T')[0];

  const handleSelectMood = (mood: { emoji: string; label: string }) => {
    // Selection haptic for choosing a mood
    hapticService.selection();
    
    const newMood: DailyMood = {
      emoji: mood.emoji,
      mood: mood.label,
      date: todayDateString,
    };
    setDailyMood(newMood);
    console.log('Mood selected for today:', newMood);
    // Navigate back to the feed or previous screen
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)'); // Fallback to feed
    }
  };

  // If a mood is already selected for today, you might want to display it 
  // or prevent re-selection, but for now, the page will always show options.
  // Logic for blocking re-selection or showing selected mood can be added later.

  return (
    <Box flex={1} bg="miracleBackground" safeArea>
      {/* Back button positioned absolutely like in OnboardingStepLayout */}
      {router.canGoBack() && (
        <IconButton
          icon={<Icon as={Ionicons} name="arrow-back" color="textPrimary" />}
          position="absolute"
          top={{ base: 10, md: 12 }}
          left={{ base: 3, md: 4 }}
          zIndex={10}
          variant="ghost"
          colorScheme="primary"
          size="lg"
          onPress={() => {
            hapticService.light();
            router.back();
          }}
          accessibilityLabel="Go back"
        />
      )}
      
      {/* Make the whole page scrollable with animation optimization */}
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bounces={true}
        decelerationRate="normal"
        scrollEventThrottle={16}
      >
        <VStack 
          p={6} 
          space={5} 
          flexGrow={1}
          pt={{ base: 16, md: 20 }} // Top padding to account for back button
        >
          {/* Title and subtitle aligned left like OnboardingStepLayout */}
          <VStack space={2}>
            <Text 
              variant="title"
              textAlign="left" 
              fontSize={{ base: "2xl", md: "3xl" }}
              color="textPrimary"
              mb={1}
            >
              How are you feeling today?
            </Text>
            <Text 
              variant="subtitle"
              textAlign="left" 
              color="textSecondary" 
              fontSize="md"
              lineHeight="sm"
            >
              Select a mood that best describes how you feel right now.
            </Text>
          </VStack>

          {/* Mood Cards */}
          <VStack space={3} mt={6}>
            {moodOptions.map((mood) => (
              <Pressable 
                key={mood.label} 
                onPress={() => handleSelectMood(mood)}
                bg="miracleCardBackground"
                p={4}
                rounded="lg"
                shadow={1}
                _pressed={{ bg: 'primary.100' }}
              >
                <HStack alignItems="center" space={3}>
                  <Text fontSize="2xl">{mood.emoji}</Text>
                  <Text fontSize="lg" color="textPrimary">{mood.label}</Text>
                </HStack>
              </Pressable>
            ))}
          </VStack>
        </VStack>
      </ScrollView>
    </Box>
  );
} 