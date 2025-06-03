import { DailyMood, useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, HStack, Icon, Pressable, ScrollView, Text, useTheme, VStack } from 'native-base';
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
      <VStack flex={1} p={6} space={5}>
        <HStack alignItems="center" mb={4}>
          {router.canGoBack() && (
             <Pressable onPress={() => router.back()} p={2} mr={2}>
              <Icon as={Ionicons} name="arrow-back" size="xl" color="textPrimary" />
            </Pressable>
          )}
          <Text fontSize="2xl" fontWeight="bold" color="textPrimary">
            How are you feeling today?
          </Text>
        </HStack>
        
        <Text fontSize="md" color="textSecondary" textAlign="center" mb={3}>
          Select a mood that best describes how you feel right now.
        </Text>

        {/* Scrollable Mood Cards */}
        <ScrollView flex={1} showsVerticalScrollIndicator={false}>
          <VStack space={3} pb={6}>
            {moodOptions.map((mood) => (
              <Pressable 
                key={mood.label} 
                onPress={() => handleSelectMood(mood)}
                // Basic card styling for now, will be refined
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
        </ScrollView>

      </VStack>
    </Box>
  );
} 