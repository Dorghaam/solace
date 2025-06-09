import { MultiSelectionCard } from '@/components/onboarding';
import { hapticService } from '@/services/hapticService';
import { breakupInterestCategories, useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Box, Button, HStack, Icon, IconButton, ScrollView, Text, VStack, useTheme } from 'native-base';
import React, { useEffect, useRef, useState } from 'react';
import { Keyboard, StyleSheet, TextInput, View } from 'react-native';

export default function InterestCategoriesScreen() {
  const selectedCategories = useUserStore((state) => state.interestCategories);
  const toggleInterestCategory = useUserStore((state) => state.toggleInterestCategory);
  const { editing } = useLocalSearchParams<{ editing?: string }>();
  const [searchText, setSearchText] = useState('');
  
  const theme = useTheme();

  const searchInputRef = useRef<TextInput>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const handleNext = () => {
    hapticService.medium();
    Keyboard.dismiss();
    if (editing === 'true') {
      router.replace('/(main)/settings');
    } else {
      // Use requestAnimationFrame to ensure navigation happens after render cycle
      requestAnimationFrame(() => {
        router.push('/(onboarding)/notifications');
      });
    }
  };

  const handleSelectAll = () => {
    const allCategoryIds = breakupInterestCategories.map(cat => cat.id);
    const allSelected = allCategoryIds.every(id => selectedCategories.includes(id));

    if (allSelected) {
      allCategoryIds.forEach(id => {
        if (selectedCategories.includes(id)) {
          toggleInterestCategory(id);
        }
      });
    } else {
      allCategoryIds.forEach(id => {
        if (!selectedCategories.includes(id)) {
          toggleInterestCategory(id);
        }
      });
    }
  };

  const handleBack = () => {
    hapticService.light();
    router.back();
  };
  
  const filteredCategories = breakupInterestCategories.filter(category =>
    category.label.toLowerCase().includes(searchText.toLowerCase())
  );

  const styles = StyleSheet.create({
    searchInput: {
      height: 55,
      borderWidth: 1,
      borderColor: theme.colors.primary[200],
      borderRadius: 28,
      paddingHorizontal: 50,
      fontSize: 18,
      backgroundColor: theme.colors.solaceCardBackground || '#FFFFFF',
      color: theme.colors.textPrimary || '#333333',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    searchInputContainer: {
      position: 'relative',
      marginTop: 16,
      marginBottom: 12,
    },
    searchIcon: {
      position: 'absolute',
      left: 16,
      top: 18,
      zIndex: 1,
    }
  });

  return (
    <Box flex={1} bg="solaceBackground" safeArea>
      {/* Back Button */}
      {(editing === 'true') && router.canGoBack() && (
        <IconButton
          icon={<Icon as={Ionicons} name="arrow-back" color="textPrimary" />}
          position="absolute"
          top={{ base: 10, md: 12 }}
          left={{ base: 3, md: 4 }}
          zIndex={10}
          variant="ghost"
          colorScheme="primary"
          size="lg"
          onPress={handleBack}
          accessibilityLabel="Go back"
        />
      )}

      {/* Fixed Header */}
      <Box 
        px={6} 
        pt={(editing === 'true') && router.canGoBack() ? { base: 16, md: 20 } : { base: 6, md: 8 }}
        pb={4}
      >
        <Text 
          variant="title"
          textAlign="left" 
          fontSize={{ base: "2xl", md: "3xl" }}
          color="textPrimary"
          mb={1}
        >
          Affirmation Categories
        </Text>
        <Text 
          variant="subtitle"
          textAlign="left" 
          color="textSecondary" 
          fontSize="md"
          lineHeight="sm"
          mb={4}
        >
          Select the types of affirmations you'd like to see.
        </Text>

        {/* Search Input */}
        <View style={styles.searchInputContainer}>
          <View style={styles.searchIcon}>
            <Icon
              as={Ionicons}
              name="search-outline"
              size={5}
              color="textTertiary"
            />
          </View>
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search categories"
            placeholderTextColor={theme.colors.textSecondary || '#AEAEAE'}
            value={searchText}
            onChangeText={setSearchText}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
          />
        </View>

        {/* Select All Button */}
        <HStack justifyContent="flex-end" mt={3}>
          <Button
            variant="outline"
            colorScheme="primary"
            size="sm"
            rounded="full"
            onPress={handleSelectAll}
          >
            {breakupInterestCategories.every(cat => selectedCategories.includes(cat.id)) && breakupInterestCategories.length > 0 ? "Deselect All" : "Select All"}
          </Button>
        </HStack>
      </Box>

      {/* Scrollable Categories */}
      <ScrollView 
        flex={1}
        px={6}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <VStack space={0} pb={4}>
          {filteredCategories.map((category) => (
            <MultiSelectionCard
              key={category.id}
              label={category.label}
              isSelected={selectedCategories.includes(category.id)}
              onPress={() => toggleInterestCategory(category.id)}
            />
          ))}
        </VStack>
      </ScrollView>

      {/* Sticky Footer with Continue Button */}
      <Box 
        bg="solaceBackground" 
        px={6} 
        py={4}
        borderTopWidth={1}
        borderTopColor="gray.100"
      >
        <Button 
          onPress={handleNext} 
          isDisabled={selectedCategories.length === 0}
          w="100%"
        >
          <Text color="primaryButtonText" fontWeight="semibold" fontSize="md">
            Continue →
          </Text>
        </Button>
      </Box>
    </Box>
  );
} 