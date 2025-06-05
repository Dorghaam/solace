import { hapticService } from '@/services/hapticService';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import { Box, Icon, Text, VStack, useTheme } from 'native-base';
import { useEffect } from 'react';

export default function MainAppTabLayout() {
  const theme = useTheme();
  const supabaseUser = useUserStore((state) => state.supabaseUser);
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);

  // Authentication guard: redirect to onboarding if not authenticated or onboarding not completed
  useEffect(() => {
    if (!supabaseUser || !hasCompletedOnboarding) {
      console.log('MainAppTabLayout: User not authenticated or onboarding not completed, redirecting...');
      router.replace('/(onboarding)');
    }
  }, [supabaseUser, hasCompletedOnboarding]);

  // Show loading or redirect message while checking authentication
  if (!supabaseUser || !hasCompletedOnboarding) {
    return (
      <Box flex={1} bg="miracleBackground" justifyContent="center" alignItems="center">
        <VStack space={3} alignItems="center">
          <Text fontSize="lg" color="textSecondary">
            Checking authentication...
          </Text>
        </VStack>
      </Box>
    );
  }

  const handleTabPress = () => {
    hapticService.light();
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary[600],
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.colors.backgroundFocused,
          borderTopWidth: 0,
          elevation: 0,
        },
        headerShown: false,
      }}
      screenListeners={{
        tabPress: () => {
          handleTabPress();
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Icon as={Ionicons} name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, size }) => (
            <Icon as={Ionicons} name="heart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Icon as={Ionicons} name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="widgetconfig"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="moodSelection"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
} 