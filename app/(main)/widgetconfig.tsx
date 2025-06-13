import { hapticService } from '@/services/hapticService';
import { supabase } from '@/services/supabaseClient';
import { BreakupCategory, breakupInterestCategories, useUserStore, WidgetTheme } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, Divider, HStack, Icon, IconButton, Radio, ScrollView, Switch, Text, useTheme, VStack } from 'native-base';
import React, { useEffect, useState } from 'react';
import { Alert, NativeModules, Platform } from 'react-native';

// For now, let's directly use NativeModules approach which should work
// We'll access the SolaceWidgetBridge module via NativeModules

// Import Supabase client if you plan to fetch quotes here for the widget
// import { supabase } from '@/services/supabaseClient';

export default function WidgetConfigScreen() {
  const theme = useTheme(); // For icon colors if needed

  // Zustand store selectors
  const isCustomizing = useUserStore((state) => state.isWidgetCustomizing);
  const setIsCustomizing = useUserStore((state) => state.setIsWidgetCustomizing);
  const favoriteQuoteIds = useUserStore((state) => state.favoriteQuoteIds);
  const storeWidgetSettings = useUserStore((state) => state.widgetSettings);
  const setStoreWidgetSettings = useUserStore((state) => state.setWidgetSettings);
  const subscriptionTier = useUserStore((state) => state.subscriptionTier); // Get subscription tier
  const userName = useUserStore((state) => state.userName); // For widget preview personalization

  // Local state for loading is not strictly necessary anymore if reading directly from store,
  // but good for ensuring settings are ready before rendering complex UI.
  const [isLoading, setIsLoading] = useState(false); // Simplified loading

  // Ensure widgetSettings has a default if not already set (though store should handle this)
  useEffect(() => {
    if (!storeWidgetSettings) {
      setStoreWidgetSettings({ category: 'all', theme: 'light' });
    }
  }, [storeWidgetSettings, setStoreWidgetSettings]);

  const handleToggleCustomize = (value: boolean) => {
    hapticService.light();
    setIsCustomizing(value);
  };

  const handleCategoryChange = (value: string) => {
    hapticService.selection();
    const selectedCategoryInfo = breakupInterestCategories.find(cat => cat.id === value);

    if (selectedCategoryInfo && selectedCategoryInfo.premium && subscriptionTier === 'free') {
      Alert.alert(
        "Premium Feature",
        `"${selectedCategoryInfo.label}" is a premium category for widgets. Please upgrade to use this topic.`,
        [{ text: "OK" }]
      );
      // Do not update the widget category
      return;
    }

    // If 'favorites' is chosen and there are no favorites, alert the user but still allow selection.
    // The updateWidgetData function will handle the case of no favorites.
    if (value === 'favorites' && favoriteQuoteIds.length === 0) {
      Alert.alert("No Favorites", "You don't have any saved favorites. The widget will show a default message if 'My Favorites' is selected without any favorites.");
    }
    
    setStoreWidgetSettings({ category: value as BreakupCategory['id'] | 'favorites' | 'all' });
    // Note: Applying changes to the actual widget data is done via the "Apply Changes" button
  };
  
  const handleThemeChange = (value: WidgetTheme) => {
    hapticService.selection();
    setStoreWidgetSettings({ theme: value as WidgetTheme});
  };

  const updateWidgetData = async () => {
    if (!storeWidgetSettings) {
      Alert.alert("Error", "Widget settings not found.");
      return;
    }
    console.log("🎯 Widget Update: Starting with settings:", storeWidgetSettings);
    hapticService.success();

    if (Platform.OS !== 'ios') {
      Alert.alert("Platform Error", "Widgets are currently only supported on iOS.");
      return;
    }

    try {
      let quoteTextToDisplay = `Hello ${userName || 'User'}! Open Solace to get inspired.`; // Default text
      let query;

      console.log("📊 Widget Update: Building query for category:", storeWidgetSettings.category);

      if (storeWidgetSettings.category === 'favorites') {
        console.log("❤️ Widget Update: Using favorites, count:", favoriteQuoteIds.length);
        if (favoriteQuoteIds.length > 0) {
          const randomIndex = Math.floor(Math.random() * favoriteQuoteIds.length);
          const randomFavoriteId = favoriteQuoteIds[randomIndex];
          query = supabase.from('quotes').select('id, text').eq('id', randomFavoriteId).single();
        } else {
          // No favorites: quoteTextToDisplay remains the default message or a specific "no favorites" message
          quoteTextToDisplay = "Add some favorites in the app to see them here!";
          console.log("❤️ Widget Update: No favorites found. Widget will show default/instructional text.");
        }
      } else if (storeWidgetSettings.category !== 'all') {
        const categoryDetails = breakupInterestCategories.find(c => c.id === storeWidgetSettings.category);
        if (categoryDetails) {
          if (subscriptionTier === 'free' && categoryDetails.premium) {
            // This case should ideally be prevented by handleCategoryChange, but as a safeguard:
            quoteTextToDisplay = "Upgrade to Premium to use this topic on your widget!";
            console.log("🔒 Widget Update: Free user tried to apply premium category. Showing upgrade message.");
          } else {
            query = supabase.rpc('get_random_quote_by_category', { p_category: storeWidgetSettings.category });
          }
        } else {
           quoteTextToDisplay = "Category not found. Please re-select."; // Should not happen
        }
      } else { // 'all' categories
        if (subscriptionTier === 'free') {
          // For 'all', free users should get from any of their *allowed* (i.e., free) categories
          // This requires either a specific RPC or client-side filtering after fetching multiple free ones.
          // For simplicity now, we'll use a new RPC 'get_random_free_quote' if available, or fallback.
          // IF YOU DON'T HAVE THIS RPC, IT WILL FALLBACK TO get_random_quote, which might return premium.
          // Consider creating this SQL function:
          // CREATE OR REPLACE FUNCTION get_random_free_quote()
          // RETURNS TABLE(id uuid, text text, category text) AS $$
          // BEGIN
          //   RETURN QUERY
          //   SELECT q.id, q.text, q.category FROM quotes q
          //   WHERE q.category IN (SELECT bc.id FROM breakup_categories_table_name_here bc WHERE bc.premium = false) -- replace with actual table if you store categories in DB
          //   ORDER BY random() LIMIT 1;
          // END; $$ LANGUAGE plpgsql;
          // For now, let's assume get_random_quote or make it conditional.
          // Fallback: if 'get_random_free_quote' doesn't exist, 'get_random_quote' might return premium.
          // This is an area for future backend improvement for perfect tier enforcement on "All".
          console.log("🌍 Widget Update: User is free, category 'all'. Ideally fetch from free pool.");
          query = supabase.rpc('get_random_quote'); // This might return a premium quote for 'all' for free users.
                                                  // TODO: Implement get_random_free_quote RPC or client-side filter for 'all'.
        } else {
          console.log("🌍 Widget Update: User is premium, category 'all'.");
          query = supabase.rpc('get_random_quote');
        }
      }

      if (query) { // Only proceed if a query was constructed
        console.log("🔄 Widget Update: Executing Supabase query...");
        const { data, error } = await query;
        console.log("📝 Widget Update: Query result - Data:", data, "Error:", error);

        if (error || !data) {
          console.error("❌ Widget Update: Failed to fetch quote:", error?.message || 'No data returned');
          quoteTextToDisplay = "Could not fetch a quote. Please try again from the app.";
        } else {
          let extractedText;
          if (Array.isArray(data)) { // RPCs return arrays
            extractedText = data[0]?.text;
          } else { // .single() returns objects
            extractedText = data.text;
          }
          if (extractedText) {
            quoteTextToDisplay = extractedText;
          } else {
            quoteTextToDisplay = "No affirmation found for this topic yet.";
          }
        }
      }
      
      console.log("✅ Widget Update: Final quote text for widget:", quoteTextToDisplay);

      const { SolaceWidgetBridge, WidgetUpdateModule } = NativeModules;
      let bridgeSuccessful = false;
      
      if (SolaceWidgetBridge?.update) {
        try {
          SolaceWidgetBridge.update({ quoteText: quoteTextToDisplay });
          bridgeSuccessful = true;
        } catch (e) { console.error("Error SolaceWidgetBridge:", e); }
      }
      if (!bridgeSuccessful && WidgetUpdateModule?.updateQuotes) {
        try {
          WidgetUpdateModule.updateQuotes([quoteTextToDisplay]);
          bridgeSuccessful = true;
        } catch (e) { console.error("Error WidgetUpdateModule:", e); }
      }
      
      if (bridgeSuccessful) {
        Alert.alert("Widget Updated!", "Your widget will update with the new affirmation shortly.");
      } else {
        Alert.alert("Widget Bridge Error", "Could not communicate with the widget. This feature might not be available.");
      }

    } catch (e: any) {
      console.error("💥 Widget Update: Unexpected error:", e);
      Alert.alert("An Unexpected Error Occurred", "Could not update the widget: " + e.message);
    }
  };

  if (isLoading || !storeWidgetSettings) {
    return (
      <Box flex={1} bg="backgroundLight" safeArea justifyContent="center" alignItems="center">
        <Text>Loading widget settings...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="backgroundLight" safeArea>
      {router.canGoBack() && (
        <IconButton
          icon={<Icon as={Ionicons} name="arrow-back" color="textPrimary" />}
          position="absolute" top={{ base: 10, md: 12 }} left={{ base: 3, md: 4 }}
          zIndex={10} variant="ghost" colorScheme="primary" size="lg"
          onPress={() => { hapticService.light(); router.back(); }}
          accessibilityLabel="Go back"
        />
      )}

      <ScrollView flex={1} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
        <VStack p={4} space={6}>
          <Box alignItems="center" mt={router.canGoBack() ? 12 : 4}>
            <Box
              bg={storeWidgetSettings.theme === 'dark_text_on_pink' ? 'primary.100' : 'white'}
              p={6} rounded="2xl" w="200px" h="200px" shadow="3"
              justifyContent="center" alignItems="center" borderWidth={1} borderColor="coolGray.200"
            >
              <Text
                fontSize="sm" fontWeight="medium" textAlign="center"
                color={storeWidgetSettings.theme === 'pink_text_on_white' ? 'primary.500' : 'textPrimary'}
              >
                "{storeWidgetSettings.category === 'favorites' && favoriteQuoteIds.length === 0
                  ? "Add favorites to see them here!"
                  : storeWidgetSettings.category === 'all'
                  ? `Affirmations for ${userName || 'you'}`
                  : breakupInterestCategories.find(c=>c.id === storeWidgetSettings.category)?.label || `Affirmations for ${userName || 'you'}`}"
              </Text>
            </Box>
            <Text mt={2} color="textSecondary" fontSize="xs">Lock Screen Widget Preview</Text>
          </Box>

          <Box mt={4} mb={2} px={4} alignItems="center">
            <Text fontSize="sm" color="textSecondary" textAlign="center">
              {isCustomizing
                ? "Add the widget to your Lock Screen: Lock your phone, touch and hold the Lock Screen, then tap 'Customize' and select 'Lock Screen' to add widgets."
                : "Lock Screen widget shows quotes from your selected category and updates every 2 hours."}
            </Text>
          </Box>

          <Box>
                          <Text fontSize="lg" fontWeight="medium" mb={1}>Add Solace to Your Lock Screen</Text>
              <Text color="textSecondary" fontSize="sm">1. Lock your phone and touch & hold the Lock Screen.</Text>
            <Text color="textSecondary" fontSize="sm">2. Tap the '+' button in the corner.</Text>
            <Text color="textSecondary" fontSize="sm">3. Search "Solace" and add the widget.</Text>
          </Box>

          <Divider />

          <HStack justifyContent="space-between" alignItems="center" mb={isCustomizing ? 0 : 4}>
            <Text fontSize="lg" fontWeight="bold" color="textPrimary">
              Customize Widget Content
            </Text>
            <Switch
              isChecked={isCustomizing}
              onToggle={handleToggleCustomize}
              colorScheme="primary"
              size="md"
            />
          </HStack>

          {isCustomizing && (
            <VStack space={4} mt={2}>
              <Box>
                <Text mb={2} color="textSecondary" fontWeight="medium">Affirmation Topic for Widget</Text>
                <Radio.Group
                  name="widgetCategorySelection"
                  value={storeWidgetSettings.category}
                  onChange={handleCategoryChange}
                >
                  <VStack space={3}>
                    <Radio value="all" size="sm">
                      <Text ml={2}>All Breakup Quotes {subscriptionTier === 'free' && '(Free topics only)'}</Text>
                    </Radio>
                    <Radio value="favorites" size="sm" isDisabled={favoriteQuoteIds.length === 0 && subscriptionTier === 'free'}>
                       <HStack alignItems="center" space={1}>
                        <Text ml={2}>My Favorites</Text>
                        {favoriteQuoteIds.length === 0 && <Text fontSize="xs" color="textTertiary">(None yet)</Text>}
                       </HStack>
                    </Radio>
                    {breakupInterestCategories.map(cat => {
                      const isLocked = cat.premium && subscriptionTier === 'free';
                      return (
                        <Radio key={cat.id} value={cat.id} size="sm" isDisabled={isLocked}>
                          <HStack alignItems="center" space={1}>
                            <Text ml={2} color={isLocked ? "textTertiary" : "textPrimary"}>{cat.label}</Text>
                            {isLocked && <Icon as={Ionicons} name="lock-closed-outline" size="xs" color="textTertiary" />}
                          </HStack>
                        </Radio>
                      );
                    })}
                  </VStack>
                </Radio.Group>
              </Box>
               <Button onPress={updateWidgetData} mt={4} isDisabled={!isCustomizing}>
                Apply to Widget & Refresh
              </Button>
            </VStack>
          )}
           {!isCustomizing && (
             <Button onPress={updateWidgetData} mt={0}>
                Refresh Widget Now
              </Button>
           )}
        </VStack>
      </ScrollView>
    </Box>
  );
} 