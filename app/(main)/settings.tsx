import { signOut } from '@/services/authService';
import { hapticService } from '@/services/hapticService';
import { cancelAllScheduledAffirmationReminders, getPushTokenAndPermissionsAsync, scheduleDailyAffirmationReminders } from '@/services/notificationService';
import { reviewService } from '@/services/reviewService';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Badge, Box, Divider, HStack, Icon, Pressable, ScrollView, Switch, Text, useToast, VStack } from 'native-base';
import React from 'react';
import { Alert, Linking, Platform } from 'react-native';
import Purchases from 'react-native-purchases';

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
    supabaseUser,
    hasCompletedOnboarding,
    interestCategories,
    notificationSettings,
    setNotificationSettings, // For toggling directly
    setPushToken, // For clearing token if notifications disabled
    resetState,
    setHasCompletedOnboarding,
    subscriptionTier // Add subscription tier
  } = useUserStore();

  const toast = useToast();

  // Authentication guard: redirect to onboarding if not authenticated
  React.useEffect(() => {
    if (!supabaseUser || !hasCompletedOnboarding) {
      console.log('SettingsScreen: User not authenticated or onboarding not completed, redirecting...');
      router.replace('/(onboarding)');
    }
  }, [supabaseUser, hasCompletedOnboarding]);

  // Don't render main content if not authenticated
  if (!supabaseUser || !hasCompletedOnboarding) {
    return (
      <Box flex={1} bg="backgroundLight" justifyContent="center" alignItems="center">
        <VStack space={3} alignItems="center">
          <Text fontSize="lg" color="textSecondary">
            Checking authentication...
          </Text>
        </VStack>
      </Box>
    );
  }

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

  const handleUpgradeToPremium = () => {
    hapticService.medium();
    console.log('Settings: Navigating to paywall for upgrade');
    router.push('/(onboarding)/paywall');
  };

  const handleManageSubscription = async () => {
    hapticService.light();
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      const managementURL = customerInfo.managementURL;
      
      if (managementURL) {
        await Linking.openURL(managementURL);
      } else {
        // Fallback to platform-specific subscription management
        const url = Platform.OS === 'ios' 
          ? 'https://apps.apple.com/account/subscriptions'
          : 'https://play.google.com/store/account/subscriptions';
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error opening subscription management:', error);
      toast.show({
        title: "Unable to Open",
        description: "Could not open subscription management. Please check your device's app store.",
        duration: 3000,
      });
    }
  };

  const handleRestorePurchases = async () => {
    hapticService.medium();
    try {
      toast.show({
        title: "Restoring Purchases...",
        description: "Please wait while we restore your purchases.",
        duration: 2000,
      });

      const customerInfo = await Purchases.restorePurchases();
      const hasActiveSubscription = Object.keys(customerInfo.entitlements.active).length > 0;
      
      if (hasActiveSubscription) {
        toast.show({
          title: "Purchases Restored!",
          description: "Your premium subscription has been restored.",
          duration: 3000,
        });
      } else {
        toast.show({
          title: "No Purchases Found",
          description: "No active subscriptions were found to restore.",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Error restoring purchases:', error);
      toast.show({
        title: "Restore Failed",
        description: "Could not restore purchases. Please try again later.",
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

          {/* Subscription Management Section */}
          <Box>
            <Text fontWeight="bold" fontSize="xs" color="textSecondary" mb={3} px={4} letterSpacing="0.5">
              SUBSCRIPTION
            </Text>
            <Box bg="white" rounded="lg" mx={4} shadow="1">
              <SettingItem
                label="Current Plan"
                rightContent={
                  <Badge
                    colorScheme={subscriptionTier === 'premium' ? 'success' : 'gray'}
                    variant="subtle"
                    rounded="full"
                  >
                    {subscriptionTier?.toUpperCase() || 'FREE'}
                  </Badge>
                }
              />
              {subscriptionTier === 'free' && (
                <>
                  <Divider />
                  <SettingItem
                    label="Upgrade to Premium"
                    value="Unlock all categories"
                    onPress={handleUpgradeToPremium}
                  />
                </>
              )}
              {subscriptionTier === 'premium' && (
                <>
                  <Divider />
                  <SettingItem
                    label="Manage Subscription"
                    value="Billing & cancellation"
                    onPress={handleManageSubscription}
                  />
                </>
              )}
              <Divider />
              <SettingItem
                label="Restore Purchases"
                value="Sync previous purchases"
                onPress={handleRestorePurchases}
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
                onPress={() => router.push('/(main)/widgetconfig')}
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
        </VStack>
      </ScrollView>
    </Box>
  );
} 