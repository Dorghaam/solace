import { cancelAllScheduledAffirmationReminders, getPushTokenAndPermissionsAsync, getReminderTimesForFrequency, scheduleDailyAffirmationReminders, setupNotificationChannelsAsync } from '@/services/notificationService';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, HStack, Icon, Radio, Switch, Text, VStack, useTheme } from 'native-base';
import React, { useEffect, useState } from 'react';

export default function NotificationPreferencesScreen() {
  const storeNotificationSettings = useUserStore((state) => state.notificationSettings);
  const setStoreNotificationSettings = useUserStore((state) => state.setNotificationSettings);
  const setPushToken = useUserStore((state) => state.setPushToken);
  const interestCategories = useUserStore((state) => state.interestCategories);
  const supabaseUser = useUserStore((state) => state.supabaseUser);
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(storeNotificationSettings?.enabled ?? false);
  const [selectedFrequency, setSelectedFrequency] = useState<'1x' | '3x' | '5x' | '10x'>(
    (storeNotificationSettings?.frequency as '1x' | '3x' | '5x' | '10x') || '3x'
  );

  const theme = useTheme();

  useEffect(() => {
    setupNotificationChannelsAsync();
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      const token = await getPushTokenAndPermissionsAsync();
      if (token) {
        setPushToken(token);
        setStoreNotificationSettings({ enabled: true, frequency: selectedFrequency });
        await scheduleDailyAffirmationReminders(selectedFrequency, undefined, interestCategories);
      } else {
        setNotificationsEnabled(false);
        setStoreNotificationSettings({ enabled: false });
        await cancelAllScheduledAffirmationReminders();
      }
    } else {
      setStoreNotificationSettings({ enabled: false });
      setPushToken(null);
      await cancelAllScheduledAffirmationReminders();
    }
  };

  const handleFrequencyChange = async (value: string) => {
    const frequency = value as '1x' | '3x' | '5x' | '10x';
    setSelectedFrequency(frequency);
    if (notificationsEnabled) {
      setStoreNotificationSettings({ enabled: true, frequency });
      await scheduleDailyAffirmationReminders(frequency, undefined, interestCategories);
    }
  };

  const handleContinue = async () => {
    // Save notification preferences
    if (notificationsEnabled) {
      setStoreNotificationSettings({ enabled: true, frequency: selectedFrequency });
      await scheduleDailyAffirmationReminders(selectedFrequency, undefined, interestCategories);
      console.log('Notification preferences saved and reminders scheduled.');
    } else {
      setStoreNotificationSettings({ enabled: false, frequency: selectedFrequency });
      await cancelAllScheduledAffirmationReminders();
      console.log('Notification preferences saved (disabled) and reminders cancelled.');
    }

    // Check if user is already logged in and completed onboarding
    if (supabaseUser && hasCompletedOnboarding) {
      // User came from settings, navigate back to settings
      console.log('Navigating back to settings from notification preferences.');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(main)/settings');
      }
    } else {
      // User is in onboarding flow, continue to login
      console.log('Navigating from notifications to login screen.');
      // Use requestAnimationFrame to ensure navigation happens after render cycle
      requestAnimationFrame(() => {
        router.push('/(onboarding)/login');
      });
    }
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const reminderTimes = getReminderTimesForFrequency(selectedFrequency);

  return (
    <Box flex={1} bg="miracleBackground" safeArea px={6}>
      <VStack flex={1} justifyContent="space-between">
        <VStack space={6} mt={{base: 8, md: 12}}>
          <VStack space={3} alignItems="center">
            <Text 
              fontSize={{ base: "2xl", md: "3xl" }} 
              fontWeight="bold" 
              textAlign="center"
              color="primary.500"
            >
              Stay Connected with Daily Reminders
            </Text>
            <Text 
              fontSize="md" 
              color="textSecondary" 
              textAlign="center" 
              lineHeight="sm"
              px={4}
            >
              Get gentle reminders throughout the day to pause, reflect, and nurture your healing journey.
            </Text>
          </VStack>

          <VStack space={5} mt={6}>
            <Box 
              p={5}
              bg="miracleCardBackground" 
              rounded="xl"
              shadow="2"
            >
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1} mr={2}>
                  <Text fontSize="lg" fontWeight="semibold" color="textPrimary">
                    Daily Affirmation Reminders
                  </Text>
                  <Text fontSize="sm" color="textSecondary" mt={1}>
                    Receive gentle reminders
                  </Text>
                </VStack>
                <Switch
                  isChecked={notificationsEnabled}
                  onToggle={handleNotificationToggle}
                  colorScheme="primary"
                  size="lg"
                />
              </HStack>
            </Box>

            {notificationsEnabled && (
              <VStack space={5}>
                <Box 
                  p={5} 
                  bg="miracleCardBackground" 
                  rounded="xl"
                  shadow="2"
                >
                  <Text fontSize="md" fontWeight="semibold" mb={4} color="textPrimary">
                    How often would you like reminders?
                  </Text>
                  <Radio.Group
                    name="frequency"
                    value={selectedFrequency}
                    onChange={handleFrequencyChange}
                  >
                    <VStack space={4}>
                      {['1x', '3x', '5x', '10x'].map(freq => (
                        <Radio key={freq} value={freq} size="md">
                          <Text ml={2} color="textPrimary" fontSize="md">
                            {freq === '1x' && 'Once a day'}
                            {freq === '3x' && '3 times a day (recommended)'}
                            {freq === '5x' && '5 times a day'}
                            {freq === '10x' && '10 times a day'}
                          </Text>
                        </Radio>
                      ))}
                    </VStack>
                  </Radio.Group>
                </Box>

                <Box 
                  p={4} 
                  bg="primary.100"
                  rounded="xl"
                  shadow="1"
                >
                  <Text fontSize="sm" fontWeight="semibold" color="primary.700" mb={1.5}>
                    ✨ Your reminder times:
                  </Text>
                  <Text fontSize="sm" color="primary.600" lineHeight="xs">
                    {reminderTimes.map((time) => 
                      formatTime(time.hour, time.minute)
                    ).join('  •  ')}
                  </Text>
                </Box>
              </VStack>
            )}
          </VStack>
        </VStack>

        <VStack space={3} mb={{base: 6, md: 8}}>
          <Button 
            onPress={handleContinue} 
            size="lg"
            py={3.5}
            rightIcon={<Icon as={Ionicons} name="arrow-forward" size="sm" color="white" />}
          >
             <Text color="onboardingButtonText" fontWeight="semibold" fontSize="md">
              Continue
            </Text>
          </Button>
          {!notificationsEnabled && (
            <Text fontSize="xs" color="textSecondary" textAlign="center" mt={1}>
              You can always enable notifications later in Settings.
            </Text>
          )}
        </VStack>
      </VStack>
    </Box>
  );
} 