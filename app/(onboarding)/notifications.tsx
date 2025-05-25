import { cancelAllScheduledAffirmationReminders, getPushTokenAndPermissionsAsync, getReminderTimesForFrequency, scheduleDailyAffirmationReminders, setupNotificationChannelsAsync } from '@/services/notificationService';
import { useUserStore } from '@/store/userStore';
import { router } from 'expo-router';
import { Box, Button, HStack, Radio, Switch, Text, VStack } from 'native-base';
import React, { useEffect, useState } from 'react';

export default function NotificationPreferencesScreen() {
  const storeNotificationSettings = useUserStore((state) => state.notificationSettings);
  const setStoreNotificationSettings = useUserStore((state) => state.setNotificationSettings);
  const setPushToken = useUserStore((state) => state.setPushToken);
  const interestCategories = useUserStore((state) => state.interestCategories);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(storeNotificationSettings.enabled);
  const [selectedFrequency, setSelectedFrequency] = useState<'1x' | '3x' | '5x'>(
    (storeNotificationSettings.frequency as '1x' | '3x' | '5x') || '3x'
  );

  useEffect(() => {
    setupNotificationChannelsAsync(); // Ensure channel is set up when screen loads
  }, []);

  const handleNotificationToggle = async (value: boolean) => {
    setNotificationsEnabled(value);
    
    if (value) {
      // User wants notifications
      const token = await getPushTokenAndPermissionsAsync();
      if (token) {
        setPushToken(token);
        setStoreNotificationSettings({ enabled: true, frequency: selectedFrequency }); // Set in store
        await scheduleDailyAffirmationReminders(selectedFrequency, undefined, interestCategories); // Schedule them
      } else {
        // Failed to get token or permission, revert UI
        setNotificationsEnabled(false);
        setStoreNotificationSettings({ enabled: false });
        await cancelAllScheduledAffirmationReminders(); // Ensure none are scheduled
      }
    } else {
      // User turned off notifications
      setStoreNotificationSettings({ enabled: false });
      setPushToken(null); // Clear token if notifications are disabled
      await cancelAllScheduledAffirmationReminders();
    }
  };

  const handleFrequencyChange = async (value: string) => {
    const frequency = value as '1x' | '3x' | '5x';
    setSelectedFrequency(frequency);
    
    // If notifications are currently enabled, reschedule with new frequency
    if (notificationsEnabled) {
      setStoreNotificationSettings({ enabled: true, frequency });
      await scheduleDailyAffirmationReminders(frequency, undefined, interestCategories);
    }
  };

  const handleContinue = () => {
    // Complete onboarding and navigate to main app
    const setHasCompletedOnboarding = useUserStore.getState().setHasCompletedOnboarding;
    setHasCompletedOnboarding(true);
    router.replace('/(main)');
  };

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const reminderTimes = getReminderTimesForFrequency(selectedFrequency);

  return (
    <Box flex={1} bg="backgroundLight" safeArea px={6}>
      <VStack flex={1} justifyContent="space-between">
        <VStack space={8} mt={12}>
          <VStack space={4} alignItems="center">
            <Text fontSize="2xl" fontWeight="bold" textAlign="center">
              Stay Connected with Daily Reminders
            </Text>
            <Text fontSize="md" color="textSecondary" textAlign="center" lineHeight="sm">
              Get gentle reminders throughout the day to pause, reflect, and nurture your healing journey.
            </Text>
          </VStack>

          <VStack space={6} mt={8}>
            <HStack justifyContent="space-between" alignItems="center" p={4} bg="white" rounded="lg">
              <VStack flex={1}>
                <Text fontSize="lg" fontWeight="semibold">
                  Daily Affirmation Reminders
                </Text>
                <Text fontSize="sm" color="textSecondary">
                  Receive gentle reminders throughout the day
                </Text>
              </VStack>
              <Switch
                isChecked={notificationsEnabled}
                onToggle={handleNotificationToggle}
                colorScheme="primary"
                size="lg"
              />
            </HStack>

            {notificationsEnabled && (
              <VStack space={4}>
                <Box p={4} bg="white" rounded="lg">
                  <Text fontSize="md" fontWeight="semibold" mb={3}>
                    How often would you like reminders?
                  </Text>
                  <Radio.Group
                    name="frequency"
                    value={selectedFrequency}
                    onChange={handleFrequencyChange}
                  >
                    <VStack space={3}>
                      <Radio value="1x">
                        <Text ml={2}>Once a day</Text>
                      </Radio>
                      <Radio value="3x">
                        <Text ml={2}>3 times a day (recommended)</Text>
                      </Radio>
                      <Radio value="5x">
                        <Text ml={2}>5 times a day</Text>
                      </Radio>
                    </VStack>
                  </Radio.Group>
                </Box>

                <Box p={4} bg="primary.50" rounded="lg">
                  <Text fontSize="sm" fontWeight="semibold" color="primary.700" mb={2}>
                    ✨ Your reminder times:
                  </Text>
                  <Text fontSize="sm" color="primary.700">
                    {reminderTimes.map((time, index) => 
                      formatTime(time.hour, time.minute)
                    ).join(' • ')}
                  </Text>
                </Box>
              </VStack>
            )}
          </VStack>
        </VStack>

        <VStack space={3} mb={8}>
          <Button onPress={handleContinue} size="lg">
            Continue
          </Button>
          {!notificationsEnabled && (
            <Text fontSize="sm" color="textSecondary" textAlign="center">
              You can always enable notifications later in Settings
            </Text>
          )}
        </VStack>
      </VStack>
    </Box>
  );
} 