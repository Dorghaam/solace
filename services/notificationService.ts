import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Alert, Platform } from 'react-native';

// Configure notification handler (important for foreground notifications)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true, // Consider making this a user setting
    shouldSetBadge: false, // Consider making this a user setting
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const REMINDER_CHANNEL_ID = 'solaceDailyReminders';

// Call this once, e.g., when app starts or when notifications are first enabled
export const setupNotificationChannelsAsync = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: 'Daily Affirmation Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C', // Your app's primary color could go here
    });
    console.log('Notification channel set up (Android)');
  }
};

// Default reminder times for different frequencies
const defaultReminderTimes = {
  '1x': [
    { hour: 14, minute: 0 }, // 2:00 PM
  ],
  '3x': [
    { hour: 9, minute: 0 },  // 9:00 AM
    { hour: 14, minute: 0 }, // 2:00 PM
    { hour: 19, minute: 0 }, // 7:00 PM
  ],
  '5x': [
    { hour: 8, minute: 0 },  // 8:00 AM
    { hour: 11, minute: 0 }, // 11:00 AM
    { hour: 14, minute: 0 }, // 2:00 PM
    { hour: 17, minute: 0 }, // 5:00 PM
    { hour: 20, minute: 0 }, // 8:00 PM
  ],
  'custom': [] as { hour: number; minute: number }[]
};

export const scheduleDailyAffirmationReminders = async (frequency: '1x' | '3x' | '5x' | 'custom' = '3x', customTimes?: { hour: number; minute: number }[]) => {
  await setupNotificationChannelsAsync(); // Ensure channel exists
  await Notifications.cancelAllScheduledNotificationsAsync(); // Clear existing Solace reminders first
  console.log(`Scheduling ${frequency} daily reminders...`);

  const reminderTimes = frequency === 'custom' && customTimes ? customTimes : defaultReminderTimes[frequency];

  const reminderPromises = reminderTimes.map(async (time, index) => {
    const identifier = `dailyAffirmationReminder-${index}`;
    try {
      const trigger: Notifications.DailyTriggerInput = {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
      };

      // Add channelId for Android
      if (Platform.OS === 'android') {
        (trigger as any).channelId = REMINDER_CHANNEL_ID;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "💖 Your Daily Solace Reminder",
          body: "Time for a moment of peace and self-reflection. Open Solace for an affirmation.",
          // data: { type: 'affirmationReminder' }, // Optional data for handling notification tap
          sound: 'default', // Or custom sound
        },
        trigger,
        // identifier: identifier, // Useful for managing specific notifications, but cancelAll works for now
      });
      console.log(`Scheduled daily reminder for ${time.hour}:${time.minute < 10 ? '0' : ''}${time.minute}`);
    } catch (e) {
      console.error(`Failed to schedule reminder ${identifier}`, e);
    }
  });
  await Promise.all(reminderPromises);
  console.log(`All ${frequency} daily reminders scheduled.`);
};

// Helper function to get the reminder times for a given frequency
export const getReminderTimesForFrequency = (frequency: '1x' | '3x' | '5x' | 'custom') => {
  return defaultReminderTimes[frequency];
};

export const cancelAllScheduledAffirmationReminders = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  console.log('All scheduled affirmation reminders cancelled.');
};

// You already have a version of this in onboarding/notifications.tsx
// This is a more generic one.
export async function getPushTokenAndPermissionsAsync(): Promise<string | null> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for push notification (permission denied)!');
    Alert.alert('Permissions Needed', 'To receive reminders, please enable notifications for Solace in your device settings.');
    return null;
  }

  // For local notifications, we don't actually need a push token
  // Push tokens are only needed for remote push notifications
  // Since we're using local scheduled notifications, we can return a placeholder token
  // to indicate that permissions were granted
  
  // Only try to get push token if we have a valid project ID
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId || projectId === "your-eas-project-id") {
      console.log('No valid EAS project ID found. Using local notifications only.');
      return 'local-notifications-enabled'; // Placeholder token to indicate permissions granted
    }
    
    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log('Expo Push Token obtained:', token);
    return token;
  } catch (e) {
    console.warn("Could not get push token, but local notifications will still work:", e);
    return 'local-notifications-enabled'; // Still allow local notifications
  }
} 