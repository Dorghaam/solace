import { cancelAllScheduledAffirmationReminders, getPushTokenAndPermissionsAsync, scheduleDailyAffirmationReminders } from '@/services/notificationService';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, Divider, HStack, Icon, Pressable, ScrollView, Switch, Text, VStack } from 'native-base';
import React from 'react';

// Reusable Setting Item Component
const SettingItem: React.FC<{label: string, value?: string, onPress?: () => void, rightContent?: React.ReactNode }> = 
({ label, value, onPress, rightContent }) => (
  <Pressable onPress={onPress} disabled={!onPress} _pressed={{bg: "coolGray.50"}}>
    <HStack justifyContent="space-between" alignItems="center" py={4} px={4} minH="56px">
      <Text fontSize="md" color="textPrimary" fontWeight="medium">{label}</Text>
      <HStack alignItems="center" space={2}>
        {rightContent ? rightContent : (
          <Text color="textSecondary" fontSize="sm" numberOfLines={1} ellipsizeMode="tail" textAlign="right">
            {value || ''}
          </Text>
        )}
        {onPress && !rightContent && <Icon as={Ionicons} name="chevron-forward" color="textTertiary" size="sm" />}
      </HStack>
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
      <Box px={4} py={4} justifyContent="center" alignItems="center" borderBottomWidth={1} borderColor="gray.100">
        <Text fontSize="xl" fontWeight="bold" color="textPrimary">Settings</Text>
      </Box>
      <ScrollView>
        <VStack space={6} py={2}>
          <Box>
            <Text fontWeight="bold" fontSize="xs" color="textSecondary" mt={4} mb={3} px={4} letterSpacing="0.5">
              ACCOUNT
            </Text>
            <Box bg="white" rounded="lg" mx={4} shadow="1">
              <SettingItem 
                label="Name" 
                value={userName || "Not set"} 
                onPress={() => router.push({ pathname: '/(onboarding)/name', params: { editing: 'true' } })} 
              />
            </Box>
          </Box>

          <Box>
            <Text fontWeight="bold" fontSize="xs" color="textSecondary" mb={3} px={4} letterSpacing="0.5">
              CONTENT & PREFERENCES
            </Text>
            <Box bg="white" rounded="lg" mx={4} shadow="1">
              <SettingItem label="My Favorites" onPress={() => router.push('/(main)/favorites')} />
              <Divider />
              <SettingItem
                label="Affirmation Topics"
                value={interestCategories.length > 0 ? `${interestCategories.length} selected` : "None selected"}
                onPress={() => router.push({ pathname: '/(onboarding)/categories', params: { editing: 'true' } })}
              />
            </Box>
          </Box>

          <Box>
            <Text fontWeight="bold" fontSize="xs" color="textSecondary" mb={3} px={4} letterSpacing="0.5">
              NOTIFICATIONS
            </Text>
            <Box bg="white" rounded="lg" mx={4} shadow="1">
              <SettingItem
                label="Daily Reminders"
                rightContent={
                  <Switch
                    isChecked={notificationSettings.enabled}
                    onToggle={handleToggleNotifications}
                    colorScheme="primary"
                    size="md"
                  />
                }
              />
              <Divider />
              <SettingItem 
                label="Reminder Frequency" 
                value={notificationSettings.frequency} 
                onPress={() => router.push('/(onboarding)/notifications')} 
              />
            </Box>
          </Box>

          {/* Development Tools */}
          <Box px={4} mt={4} mb={6}>
            <Text fontWeight="bold" fontSize="xs" color="textSecondary" mb={3} letterSpacing="0.5">
              DEVELOPMENT TOOLS
            </Text>
            <VStack space={3}>
              <Button 
                variant="outline" 
                colorScheme="coolGray" 
                onPress={handleResetOnboarding}
                rounded="lg"
                _text={{ fontSize: "sm", fontWeight: "medium" }}
              >
                Reset & Re-Onboard (Dev)
              </Button>
              <Button 
                variant="outline" 
                colorScheme="orange" 
                onPress={handleHardReset}
                rounded="lg"
                _text={{ fontSize: "sm", fontWeight: "medium" }}
              >
                Force App Restart (Dev)
              </Button>
            </VStack>
          </Box>
        </VStack>
      </ScrollView>
    </Box>
  );
} 