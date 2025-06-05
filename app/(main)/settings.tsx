import { signOut } from '@/services/authService';
import { hapticService } from '@/services/hapticService';
import { cancelAllScheduledAffirmationReminders, getPushTokenAndPermissionsAsync, scheduleDailyAffirmationReminders } from '@/services/notificationService';
import { reviewService } from '@/services/reviewService';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Divider, HStack, Icon, Pressable, ScrollView, Switch, Text, useToast, VStack } from 'native-base';
import React from 'react';
import { Alert } from 'react-native';

// Reusable Setting Item Component
const SettingItem: React.FC<{label: string, value?: string, onPress?: () => void, rightContent?: React.ReactNode }> = 
({ label, value, onPress, rightContent }) => (
  <Pressable 
    onPress={() => {
      if (onPress) {
        hapticService.light();
        onPress();
      }
    }} 
    disabled={!onPress} 
    _pressed={{bg: "coolGray.50"}}
  >
    <HStack justifyContent="space-between" alignItems="center" py={4} px={4} minH="56px">
      <Text fontSize="md" color={(onPress || rightContent) ? "textPrimary" : "textSecondary"} fontWeight="medium">{label}</Text>
      <HStack alignItems="center" space={2}>
        {rightContent ? rightContent : (
          <Text color={onPress ? "textSecondary" : "textTertiary"} fontSize="sm" numberOfLines={1} ellipsizeMode="tail" textAlign="right">
            {value || ''}
          </Text>
        )}
        {onPress && !rightContent && <Icon as={Ionicons} name="chevron-forward" color="textTertiary" size="sm" />}
      </HStack>
    </HStack>
  </Pressable>
);

export default function SettingsScreen() {
  const {
    userName,
    interestCategories,
    notificationSettings,
    setNotificationSettings, // For toggling directly
    setPushToken, // For clearing token if notifications disabled
    resetState,
    setHasCompletedOnboarding
  } = useUserStore();

  const toast = useToast();

  const handleToggleNotifications = async (isEnabled: boolean) => {
    // Medium haptic for important toggle action
    hapticService.medium();
    
    console.log('🔔 Toggle notifications called with:', isEnabled);
    console.log('🔔 Current notification settings:', notificationSettings);
    
    if (!isEnabled) {
      setNotificationSettings({ ...(notificationSettings || {}), enabled: false });
      setPushToken(null); // Clear token if user disables
      await cancelAllScheduledAffirmationReminders();
      console.log('🔔 Push token cleared due to notifications being disabled');
      // TODO: Optionally unregister from push notifications server-side if applicable
    } else {
      const token = await getPushTokenAndPermissionsAsync(); // Request permission & get token
      if (token) {
        setPushToken(token);
        setNotificationSettings({ ...(notificationSettings || {}), enabled: true, frequency: (notificationSettings?.frequency) || '3x' });
        await scheduleDailyAffirmationReminders((notificationSettings?.frequency) || '3x', undefined, interestCategories);
        console.log('🔔 Notifications enabled and scheduled.');
      } else {
        // Permission denied or failed to get token, revert switch in UI
        setNotificationSettings({ ...(notificationSettings || {}), enabled: false });
        // The getPushTokenAndPermissionsAsync function should alert the user.
        console.log('🔔 Failed to enable notifications (no token or permission).');
      }
    }
  };

  const handleResetAndRestartOnboarding = () => {
    resetState();
    setHasCompletedOnboarding(false); 
    router.replace('/(onboarding)');
  };

  const handleSignOut = async () => {
    hapticService.medium();
    console.log('SettingsScreen: Initiating sign out...');
    try {
      await signOut();
      // Successful signOut will trigger onAuthStateChange in _layout.tsx,
      // which will call resetState() and navigate to '/(onboarding)'.
      console.log('SettingsScreen: signOut service call completed.');
      // Optionally, show a success toast, though navigation will be quick.
      // toast.show({ title: "Signed Out", description: "You have been signed out." });
    } catch (error: any) {
      console.error("SettingsScreen: Error during sign out:", error.message);
      toast.show({
        title: "Sign Out Failed",
        description: error.message || "Could not sign out. Please try again.",
        duration: 3000,
      });
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
              <Divider />
              <SettingItem 
                label="Home Screen Widget" 
                value="Coming Soon"
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
                    isChecked={notificationSettings?.enabled || false}
                    onToggle={handleToggleNotifications}
                    colorScheme="primary"
                    size="md"
                  />
                }
              />
              <Divider />
              <SettingItem 
                label="Reminder Frequency" 
                value={notificationSettings?.frequency || 'Not set'} 
                onPress={() => router.push('/(onboarding)/notifications')} 
              />
            </Box>
          </Box>

          <Box>
            <Text fontWeight="bold" fontSize="xs" color="textSecondary" mb={3} px={4} letterSpacing="0.5">
              SUPPORT
            </Text>
            <Box bg="white" rounded="lg" mx={4} shadow="1">
              <SettingItem 
                label="Rate Solace" 
                value="Help us improve"
                onPress={() => reviewService.requestReview()} 
              />
            </Box>
          </Box>

          {/* Sign Out Section */}
          <Box>
            <Text fontWeight="bold" fontSize="xs" color="textSecondary" mb={3} px={4} letterSpacing="0.5">
              MANAGE ACCOUNT
            </Text>
            <Box bg="white" rounded="lg" mx={4} shadow="1">
              <SettingItem
                label="Sign Out"
                onPress={() => {
                  // Optional: Add a confirmation dialog
                  Alert.alert(
                    "Sign Out",
                    "Are you sure you want to sign out?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Sign Out", style: "destructive", onPress: handleSignOut }
                    ]
                  );
                }}
              />
            </Box>
          </Box>

          {/* Development-only section */}
          {__DEV__ && (
            <Box>
              <Text fontWeight="bold" fontSize="xs" color="textSecondary" mb={3} px={4} letterSpacing="0.5">
                DEVELOPMENT
              </Text>
              <Box bg="white" rounded="lg" mx={4} shadow="1">
                <SettingItem 
                  label="Reset & View Onboarding" 
                  value="Dev only"
                  onPress={handleResetAndRestartOnboarding} 
                />
              </Box>
            </Box>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
} 