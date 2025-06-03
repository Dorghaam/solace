import { hapticService } from '@/services/hapticService';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Icon, useTheme } from 'native-base';

export default function MainAppTabLayout() {
  const theme = useTheme();

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