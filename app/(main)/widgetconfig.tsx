import { hapticService } from '@/services/hapticService';
import { BreakupCategory, breakupInterestCategories, useUserStore, WidgetSettings, WidgetTheme } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, Divider, HStack, Icon, IconButton, Radio, ScrollView, Switch, Text, VStack } from 'native-base';
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-native';

// Import Supabase client if you plan to fetch quotes here for the widget
// import { supabase } from '@/services/supabaseClient';

export default function WidgetConfigScreen() {
  // Local state to control the "Customize" toggle, distinct from persisted settings
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [favoriteQuoteIds, setFavoriteQuoteIds] = useState<string[]>([]);
  const [storeWidgetSettings, setStoreWidgetSettings] = useState<WidgetSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Safely access store data
  useEffect(() => {
    try {
      const store = useUserStore.getState();
      setFavoriteQuoteIds(store.favoriteQuoteIds || []);
      setStoreWidgetSettings(store.widgetSettings || { category: 'all', theme: 'light' });
      setIsLoading(false);
    } catch (error) {
      console.error('Error accessing store:', error);
      // Set default values if store access fails
      setFavoriteQuoteIds([]);
      setStoreWidgetSettings({ category: 'all', theme: 'light' });
      setIsLoading(false);
    }
  }, []);

  // Function to update store settings
  const updateStoreWidgetSettings = (settings: Partial<WidgetSettings>) => {
    try {
      useUserStore.getState().setWidgetSettings(settings);
      setStoreWidgetSettings(prev => prev ? { ...prev, ...settings } : { category: 'all', theme: 'light', ...settings });
    } catch (error) {
      console.error('Error updating store:', error);
    }
  };

  // Show loading state
  if (isLoading || !storeWidgetSettings) {
    return (
      <Box flex={1} bg="backgroundLight" safeArea justifyContent="center" alignItems="center">
        <Text>Loading widget settings...</Text>
      </Box>
    );
  }

  const handleToggleCustomize = (value: boolean) => {
    setIsCustomizing(value);
  };

  const handleCategoryChange = (value: string) => {
    hapticService.selection();
    updateStoreWidgetSettings({ category: value as BreakupCategory | 'favorites' | 'all' });
    // TODO: When category changes, update shared data for the native widget
    console.log("Widget category changed to:", value);
    Alert.alert("Category Saved", "Widget will now show affirmations from this category (once native widget is built).");
  };
  
  const handleThemeChange = (value: WidgetTheme) => {
    hapticService.selection();
    updateStoreWidgetSettings({ theme: value as WidgetTheme});
    console.log("Widget theme changed to:", value);
    Alert.alert("Theme Saved", `Widget theme set to ${value} (once native widget is built).`);
  };

  // This function would eventually write data to App Group storage
  const updateWidgetData = () => {
    console.log("Updating widget data with settings from store:", storeWidgetSettings);
    Alert.alert("Widget Data Updated", "Native widget would now refresh with new data (placeholder).");
    // 1. Fetch relevant quotes based on widgetSettings.category (from Supabase)
    // 2. Select a few (e.g., 5-10) or one primary quote.
    // 3. Write these quotes + theme preference to App Group storage.
    // 4. Trigger widget timeline reload (WidgetCenter.reloadTimelines).
  };

  return (
    <Box flex={1} bg="backgroundLight" safeArea>
      {router.canGoBack() && (
        <IconButton
          icon={<Icon as={Ionicons} name="arrow-back" color="textPrimary" />}
          position="absolute"
          top={{ base: 10, md: 12 }}
          left={{ base: 3, md: 4 }}
          zIndex={10}
          variant="ghost"
          colorScheme="primary"
          size="lg"
          onPress={() => {
            hapticService.light();
            router.back();
          }}
          accessibilityLabel="Go back"
        />
      )}

      <ScrollView flex={1} showsVerticalScrollIndicator={false}>
        <VStack p={4} pb={8} space={6}>
          <Box alignItems="center">
            {/* Widget Preview Placeholder */}
            <Box
              bg={storeWidgetSettings.theme === 'dark_text_on_pink' ? 'primary.100' : 'white'} // Use storeWidgetSettings for preview
              p={6}
              rounded="2xl" 
              w="200px" // Fixed width for widget preview
              h="200px" // Fixed height to make it square
              shadow="3"
              justifyContent="center"
              alignItems="center"
              borderWidth={1}
              borderColor="coolGray.200"
            >
              <Text 
                fontSize="sm" 
                fontWeight="medium" 
                textAlign="center"
                color={storeWidgetSettings.theme === 'pink_text_on_white' ? 'primary.500' : 'textPrimary'}
              >
                "Your affirmation will appear here."
              </Text>
            </Box>
            <Text mt={2} color="textSecondary" fontSize="xs">Small Widget Preview</Text>
          </Box>

          {/* Insert this new Box for the conditional informational text */}
          <Box mt={4} mb={2} px={4} alignItems="center">
            <Text fontSize="sm" color="textSecondary" textAlign="center">
              {isCustomizing
                ? "Touch and hold the widget on your phone's Home Screen to choose this widget"
                : "Reflects the theme and category you're currently using"}
            </Text>
          </Box>

          <Box>
            <Text fontSize="lg" fontWeight="medium" mb={1}>Add Solace to Your Home Screen</Text>
            <Text color="textSecondary" fontSize="sm">
              1. On your Home Screen, touch and hold an empty area until the apps jiggle.
            </Text>
            <Text color="textSecondary" fontSize="sm">
              2. Tap the '+' button in the upper corner.
            </Text>
            <Text color="textSecondary" fontSize="sm">
              3. Search for "Solace" and select your desired widget size.
            </Text>
          </Box>

          <Divider />

          <HStack justifyContent="space-between" alignItems="center" mb={4}>
            <Text fontSize="lg" fontWeight="bold" color="textPrimary">
              Customize Widget
            </Text>
            <Switch
              isChecked={isCustomizing}
              onToggle={(value) => {
                hapticService.light();
                setIsCustomizing(value);
              }}
              colorScheme="primary"
              size="md"
            />
          </HStack>

          {isCustomizing && (
            <VStack space={4} mt={2}>
              <Box>
                <Text mb={1} color="textSecondary" fontWeight="medium">Affirmation Category</Text>
                <Radio.Group 
                  name="categorySelection" 
                  value={storeWidgetSettings.category} 
                  onChange={(value: string) => handleCategoryChange(value)}
                >
                  <VStack space={2}>
                    <Radio value="all" size="sm">
                      <Text>All Breakup Quotes</Text>
                    </Radio>
                    <Radio value="favorites" size="sm" isDisabled={favoriteQuoteIds.length === 0}>
                      <Text>
                        My Favorites{favoriteQuoteIds.length === 0 ? " (No favorites yet)" : ""}
                      </Text>
                    </Radio>
                    {breakupInterestCategories.map(cat => (
                      <Radio key={cat.id} value={cat.id} size="sm">
                        <Text>{cat.label}</Text>
                      </Radio>
                    ))}
                  </VStack>
                </Radio.Group>
              </Box>
              <Box>
                <Text mb={1} color="textSecondary" fontWeight="medium">Widget Theme</Text>
                 <Radio.Group 
                    name="widgetTheme" 
                    value={storeWidgetSettings.theme} 
                    onChange={(value: string) => handleThemeChange(value as WidgetTheme)}
                  >
                    <HStack space={4} alignItems="center">
                        <Radio value="light" size="sm">
                          <Text>Light</Text>
                        </Radio>
                        <Radio value="dark_text_on_pink" size="sm">
                          <Text>Pink Bg</Text>
                        </Radio>
                        <Radio value="pink_text_on_white" size="sm">
                          <Text>Pink Text</Text>
                        </Radio>
                    </HStack>
                </Radio.Group>
              </Box>
              <Button onPress={updateWidgetData} mt={4}>
                Apply Changes to Widget
              </Button>
            </VStack>
          )}
        </VStack>
      </ScrollView>
    </Box>
  );
} 