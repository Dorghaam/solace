import { hapticService } from '@/services/hapticService';
import { supabase } from '@/services/supabaseClient';
import { BreakupCategory, breakupInterestCategories, useUserStore, WidgetSettings, WidgetTheme } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, Divider, HStack, Icon, IconButton, Radio, ScrollView, Switch, Text, VStack } from 'native-base';
import React, { useEffect, useState } from 'react';
import { Alert, NativeModules, Platform } from 'react-native';

// For now, let's directly use NativeModules approach which should work
// We'll access the SolaceWidgetBridge module via NativeModules

// Import Supabase client if you plan to fetch quotes here for the widget
// import { supabase } from '@/services/supabaseClient';

export default function WidgetConfigScreen() {
  // Local state to control the "Customize" toggle, distinct from persisted settings
  const isCustomizing = useUserStore((state) => state.isWidgetCustomizing);
  const setIsCustomizing = useUserStore((state) => state.setIsWidgetCustomizing);
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

  // This function will fetch a quote and send it to the widget
  const updateWidgetData = async () => {
    if (!storeWidgetSettings) {
      Alert.alert("Error", "Widget settings not found.");
      return;
    }
    console.log("🎯 Widget Update: Starting with settings:", storeWidgetSettings);
    hapticService.success();

    try {
      // Only proceed on iOS
      if (Platform.OS !== 'ios') {
        Alert.alert("Error", "Widgets are only available on iOS.");
        return;
      }

      let query;
      console.log("📊 Widget Update: Building query for category:", storeWidgetSettings.category);

      if (storeWidgetSettings.category === 'favorites') {
        console.log("❤️ Widget Update: Using favorites, count:", favoriteQuoteIds.length);
        if (favoriteQuoteIds.length > 0) {
          const randomIndex = Math.floor(Math.random() * favoriteQuoteIds.length);
          const randomFavoriteId = favoriteQuoteIds[randomIndex];
          console.log("🎲 Widget Update: Selected favorite ID:", randomFavoriteId);
          query = supabase.from('quotes').select('id, text').eq('id', randomFavoriteId).single();
        } else {
          Alert.alert("No Favorites", "You don't have any saved favorites to display on the widget.");
          return;
        }
      } else if (storeWidgetSettings.category !== 'all') {
        console.log("🏷️ Widget Update: Using category RPC:", storeWidgetSettings.category);
        query = supabase.rpc('get_random_quote_by_category', { p_category: storeWidgetSettings.category });
      } else {
        console.log("🌍 Widget Update: Using random quote RPC");
        query = supabase.rpc('get_random_quote');
      }

      console.log("🔄 Widget Update: Executing Supabase query...");
      const { data, error } = await query;

      console.log("📝 Widget Update: Query result - Data:", data, "Error:", error);

      if (error || !data) {
        console.error("❌ Widget Update: Failed to fetch quote:", error?.message || 'No data returned');
        Alert.alert("Error", "Could not fetch a quote. Please try again.");
        return;
      }
      
      // Handle both single objects (from .single()) and arrays (from RPC functions)
      let quoteText;
      if (Array.isArray(data)) {
        // RPC functions return arrays
        quoteText = data[0]?.text;
        console.log("📊 Widget Update: Extracted from array - Quote text:", quoteText);
      } else {
        // .single() returns objects directly
        quoteText = data.text;
        console.log("📊 Widget Update: Extracted from object - Quote text:", quoteText);
      }
      
      if (!quoteText) {
        console.error("❌ Widget Update: No quote text found in response");
        Alert.alert("Error", "Quote text not found in response.");
        return;
      }
      
      console.log("✅ Widget Update: Final quote text:", quoteText);

      // Try both bridge methods to ensure compatibility
      const { SolaceWidgetBridge, WidgetUpdateModule } = NativeModules;
      
      let bridgeSuccessful = false;
      
      // Try the Expo module bridge first
      if (SolaceWidgetBridge?.update) {
        try {
          console.log("🌉 Widget Update: Trying SolaceWidgetBridge...");
          SolaceWidgetBridge.update({
            quoteText: quoteText
          });
          bridgeSuccessful = true;
          console.log("✅ Widget updated successfully via SolaceWidgetBridge");
        } catch (bridgeError: any) {
          console.error("❌ Widget Update: Error calling SolaceWidgetBridge:", bridgeError);
        }
      }
      
      // Try the React Native bridge as fallback
      if (!bridgeSuccessful && WidgetUpdateModule?.updateQuotes) {
        try {
          console.log("🌉 Widget Update: Trying WidgetUpdateModule...");
          WidgetUpdateModule.updateQuotes([quoteText]);
          bridgeSuccessful = true;
          console.log("✅ Widget updated successfully via WidgetUpdateModule");
        } catch (bridgeError: any) {
          console.error("❌ Widget Update: Error calling WidgetUpdateModule:", bridgeError);
        }
      }
      
      if (bridgeSuccessful) {
        Alert.alert("Widget Updated!", "Your widget will update shortly.");
        console.log("🎉 Widget Update: Complete success!");
      } else {
        Alert.alert("Error", "Widget bridge is not available on this platform.");
        console.error("❌ Widget Update: No widget bridge methods were available");
      }

    } catch (e: any) {
      console.error("💥 Widget Update: Unexpected error:", e);
      Alert.alert("An Unexpected Error Occurred", "Could not update the widget: " + e.message);
    }
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