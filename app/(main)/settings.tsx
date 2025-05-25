import { cancelAllScheduledAffirmationReminders, getPushTokenAndPermissionsAsync, scheduleDailyAffirmationReminders } from '@/services/notificationService';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, Divider, HStack, Icon, Pressable, ScrollView, Switch, Text, VStack } from 'native-base';
import React from 'react';

// Reusable Setting Item Component
const SettingItem: React.FC<{label: string, value?: string, onPress?: () => void, rightContent?: React.ReactNode }> = 
({ label, value, onPress, rightContent }) => (
  <Pressable onPress={onPress} disabled={!onPress} _pressed={{bg: "coolGray.100"}}>
    <HStack justifyContent="space-between" alignItems="center" p={4} minH="50px">
      <Text fontSize="md">{label}</Text>
      {rightContent ? rightContent : <Text color="textSecondary" numberOfLines={1} ellipsizeMode="tail">{value || ''}</Text>}
      {onPress && !rightContent && <Icon as={Ionicons} name="chevron-forward" color="textTertiary" size="sm" />}
    </HStack>
  </Pressable>
);

export default function SettingsScreen() {
  const resetState = useUserStore((state) => state.resetState);
  const setHasCompletedOnboarding = useUserStore((state) => state.setHasCompletedOnboarding);

  const handleResetOnboarding = () => {
    resetState();
    // Set hasCompletedOnboarding to false AFTER state has been reset
    // and router has had a chance to potentially react if needed.
    // The timeout helps ensure navigation occurs after state update propagation.
    setHasCompletedOnboarding(false);
    // Force navigation to onboarding
    setTimeout(() => {
      router.replace('/(onboarding)');
    }, 100);
  };

  const handleHardReset = () => {
    resetState();
    setHasCompletedOnboarding(false);
    // Navigate to root and then to onboarding
    router.dismissAll(); // Clears navigation stack
    router.replace('/'); // Go to root, which will then go to (onboarding)
  };

  const {
    userName,
    interestCategories,
    notificationSettings,
    setNotificationSettings, // For toggling directly
    setPushToken // For clearing token if notifications disabled
  } = useUserStore();

  const handleToggleNotifications = async (isEnabled: boolean) => {
    console.log('🔔 Toggle notifications called with:', isEnabled);
    console.log('🔔 Current notification settings:', notificationSettings);
    
    if (!isEnabled) {
      setNotificationSettings({ ...notificationSettings, enabled: false });
      setPushToken(null); // Clear token if user disables
      await cancelAllScheduledAffirmationReminders();
      console.log('🔔 Push token cleared due to notifications being disabled');
      // TODO: Optionally unregister from push notifications server-side if applicable
    } else {
      const token = await getPushTokenAndPermissionsAsync(); // Request permission & get token
      if (token) {
        setPushToken(token);
        setNotificationSettings({ ...notificationSettings, enabled: true, frequency: notificationSettings.frequency || '3x' });
        await scheduleDailyAffirmationReminders(notificationSettings.frequency || '3x');
        console.log('🔔 Notifications enabled and scheduled.');
      } else {
        // Permission denied or failed to get token, revert switch in UI
        setNotificationSettings({ ...notificationSettings, enabled: false });
        // The getPushTokenAndPermissionsAsync function should alert the user.
        console.log('🔔 Failed to enable notifications (no token or permission).');
      }
    }
  };

  return (
    <Box flex={1} bg="backgroundLight" safeArea>
      <HStack px={4} py={3} justifyContent="center" alignItems="center" borderBottomWidth={1} borderColor="gray.100">
        <Text fontSize="xl" fontWeight="semibold">Settings</Text>
      </HStack>
      <ScrollView>
        <VStack divider={<Divider />}>
          <Box>
            <Text fontWeight="semibold" fontSize="sm" color="textSecondary" mt={4} mb={1} px={4}>ACCOUNT</Text>
            <SettingItem label="Name" value={userName || "Not set"} onPress={() => router.push({ pathname: '/(onboarding)/name', params: { editing: 'true' } })} />
          </Box>
          <Box>
            <Text fontWeight="semibold" fontSize="sm" color="textSecondary" mt={4} mb={1} px={4}>CONTENT & PREFERENCES</Text>
            <SettingItem label="My Favorites" onPress={() => router.push('/(main)/favorites')} />
            <SettingItem
              label="Affirmation Topics"
              value={interestCategories.length > 0 ? `${interestCategories.length} selected` : "None selected"}
              onPress={() => router.push({ pathname: '/(onboarding)/categories', params: { editing: 'true' } })}
            />
          </Box>
          <Box>
            <Text fontWeight="semibold" fontSize="sm" color="textSecondary" mt={4} mb={1} px={4}>NOTIFICATIONS</Text>
            <SettingItem
              label="Daily Reminders"
              rightContent={
                <Switch
                  isChecked={notificationSettings.enabled}
                  onToggle={handleToggleNotifications}
                  colorScheme="primary"
                />}
            />
            <SettingItem label="Reminder Frequency" value={notificationSettings.frequency} onPress={() => router.push('/(onboarding)/notifications')} />
          </Box>
          {/* Temporary reset button for testing */}
          <Box px={4} mt={8} mb={6}>
            <Text fontSize="sm" color="textSecondary" mb={2}>Development Tools:</Text>
            <VStack space={2}>
              <Button variant="outline" colorScheme="coolGray" onPress={handleResetOnboarding}>
                Reset & Re-Onboard (Dev)
              </Button>
              <Button variant="outline" colorScheme="orange" onPress={handleHardReset}>
                Force App Restart (Dev)
              </Button>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
} 