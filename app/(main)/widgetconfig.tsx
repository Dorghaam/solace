import { BreakupCategory, breakupInterestCategories, useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, Divider, HStack, Icon, IconButton, Radio, ScrollView, Select, Switch, Text, useTheme, VStack } from 'native-base';
import React, { useState } from 'react';
import { Alert } from 'react-native';

// Placeholder for widget preferences in store (can be expanded)
interface WidgetSettings {
  isEnabled: boolean; // Is customization enabled
  category: BreakupCategory | 'favorites' | 'all'; // Which quotes to show
  theme: 'light' | 'dark_text_on_pink' | 'pink_text_on_white'; // Simple theme options
}

export default function WidgetConfigScreen() {
  const theme = useTheme();
  // TODO: Persist widgetSettings in userStore or a dedicated widgetStore
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>({
    isEnabled: false,
    category: 'all',
    theme: 'light',
  });
  const { favoriteQuoteIds } = useUserStore(); // To know if "favorites" is a viable option

  const handleToggleCustomize = (value: boolean) => {
    setWidgetSettings(prev => ({ ...prev, isEnabled: value }));
  };

  const handleCategoryChange = (value: string) => {
    setWidgetSettings(prev => ({ ...prev, category: value as BreakupCategory | 'favorites' | 'all' }));
    // TODO: When category changes, update shared data for the native widget
    console.log("Widget category changed to:", value);
    Alert.alert("Category Saved", "Widget will now show affirmations from this category (once native widget is built).");
  };
  
  const handleThemeChange = (value: WidgetSettings['theme']) => {
     setWidgetSettings(prev => ({ ...prev, theme: value }));
     // TODO: Update shared theme data for native widget
     console.log("Widget theme changed to:", value);
     Alert.alert("Theme Saved", `Widget theme set to ${value} (once native widget is built).`);
  };

  // This function would eventually write data to App Group storage
  const updateWidgetData = () => {
    console.log("Updating widget data with settings:", widgetSettings);
    Alert.alert("Widget Data Updated", "Native widget would now refresh with new data (placeholder).");
    // 1. Fetch relevant quotes based on widgetSettings.category (from Supabase)
    // 2. Select a few (e.g., 5-10) or one primary quote.
    // 3. Write these quotes + theme preference to App Group storage.
    // 4. Trigger widget timeline reload (WidgetCenter.reloadTimelines).
  };

  return (
    <Box flex={1} bg="backgroundLight" safeArea>
      <HStack px={4} py={3} justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderColor="gray.100">
        <IconButton
          icon={<Icon as={Ionicons} name="arrow-back" />}
          variant="ghost"
          onPress={() => router.back()}
        />
        <Text fontSize="xl" fontWeight="semibold">Home Screen Widget</Text>
        <Box w="40px" /> {/* Spacer */}
      </HStack>

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <VStack p={4} space={6}>
          <Box alignItems="center">
            {/* Widget Preview Placeholder */}
            <Box
              bg={widgetSettings.theme === 'dark_text_on_pink' ? 'primary.100' : 'white'}
              p={6}
              rounded="2xl" // Matches iOS widget rounding
              w="60%" // Approximate small widget size relative to screen
              h="60%" // Square for small widget
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
                color={widgetSettings.theme === 'pink_text_on_white' ? 'primary.500' : 'textPrimary'}
              >
                "Your affirmation will appear here."
              </Text>
            </Box>
            <Text mt={2} color="textSecondary" fontSize="xs">Small Widget Preview</Text>
          </Box>

          <Box>
            <Text fontSize="lg" fontWeight="medium" mb={1}>Add Solace to Your Home Screen</Text>
            <Text color="textSecondary" fontSize="sm" lineHeight="xs">
              1. On your Home Screen, touch and hold an empty area until the apps jiggle.
            </Text>
            <Text color="textSecondary" fontSize="sm" lineHeight="xs">
              2. Tap the '+' button in the upper corner.
            </Text>
            <Text color="textSecondary" fontSize="sm" lineHeight="xs">
              3. Search for "Solace" and select your desired widget size.
            </Text>
          </Box>

          <Divider />

          <HStack justifyContent="space-between" alignItems="center">
            <Text fontSize="lg" fontWeight="medium">Customize Widget</Text>
            <Switch
              isChecked={widgetSettings.isEnabled}
              onToggle={handleToggleCustomize}
              colorScheme="primary"
            />
          </HStack>

          {widgetSettings.isEnabled && (
            <VStack space={4} mt={2}>
              <Box>
                <Text mb={1} color="textSecondary" fontWeight="medium">Affirmation Category</Text>
                <Select
                  selectedValue={widgetSettings.category}
                  minWidth="200"
                  accessibilityLabel="Choose Category"
                  placeholder="Choose Category"
                  _selectedItem={{
                    bg: "primary.100",
                    endIcon: <Icon as={Ionicons} name="checkmark" size={5} />,
                  }}
                  mt={1}
                  onValueChange={handleCategoryChange}
                >
                  <Select.Item label="All Breakup Quotes" value="all" />
                  <Select.Item label="My Favorites" value="favorites" isDisabled={favoriteQuoteIds.length === 0} />
                  {breakupInterestCategories.map(cat => (
                    <Select.Item key={cat.id} label={cat.label} value={cat.id} />
                  ))}
                </Select>
              </Box>
              <Box>
                <Text mb={1} color="textSecondary" fontWeight="medium">Widget Theme</Text>
                 <Radio.Group 
                    name="widgetTheme" 
                    value={widgetSettings.theme} 
                    onChange={(value: string) => handleThemeChange(value as WidgetSettings['theme'])}
                  >
                    <HStack space={4} alignItems="center">
                        <Radio value="light" size="sm">Light</Radio>
                        <Radio value="dark_text_on_pink" size="sm">Pink Bg</Radio>
                        <Radio value="pink_text_on_white" size="sm">Pink Text</Radio>
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