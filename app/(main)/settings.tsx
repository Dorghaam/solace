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
    
    // Simplified: just update enabled status. Token registration/unregistration
    // would happen here in a full implementation or in the notification settings screen.
    setNotificationSettings({ enabled: isEnabled });
    console.log('🔔 Updated notification settings to enabled:', isEnabled);
    
    if (!isEnabled) {
      setPushToken(null); // Clear token if user disables
      console.log('🔔 Push token cleared due to notifications being disabled');
      // TODO: Optionally unregister from push notifications server-side if applicable
    } else {
      console.log('🔔 Notifications enabled - token should be preserved or re-registered');
      // TODO: Re-trigger registerForPushNotificationsAsync if enabling from here and token is null
      // For now, assume token was obtained during onboarding if enabled.
      // If not, user might need to go to a dedicated notification settings screen
      // to re-attempt registration.
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
            <SettingItem label="Name" value={userName || "Not set"} onPress={() => router.push('/(onboarding)/name')} />
          </Box>
          <Box>
            <Text fontWeight="semibold" fontSize="sm" color="textSecondary" mt={4} mb={1} px={4}>CONTENT & PREFERENCES</Text>
            <SettingItem label="My Favorites" onPress={() => router.push('/(main)/favorites')} />
            <SettingItem
              label="Affirmation Topics"
              value={interestCategories.length > 0 ? `${interestCategories.length} selected` : "None selected"}
              onPress={() => router.push('/(onboarding)/categories')}
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
            {/* TODO: Add item to configure frequency, navigating to a new or onboarding/notifications screen */}
            {/* <SettingItem label="Reminder Frequency" value={notificationSettings.frequency} onPress={() => router.push('/(onboarding)/notifications')} /> */}
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