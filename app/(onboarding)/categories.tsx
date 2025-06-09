import { MultiSelectionCard } from '@/components/onboarding';
import { hapticService } from '@/services/hapticService';
import { BreakupCategory, breakupInterestCategories, useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Box, Button, HStack, Icon, IconButton, ScrollView, Text, VStack, useTheme } from 'native-base';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Keyboard, StyleSheet, TextInput, View } from 'react-native';

export default function InterestCategoriesScreen() {
  const selectedCategories = useUserStore((state) => state.interestCategories);
  const toggleInterestCategory = useUserStore((state) => state.toggleInterestCategory);
  const setInterestCategories = useUserStore((state) => state.setInterestCategories);
  const subscriptionTier = useUserStore((state) => state.subscriptionTier);
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

  const handleCategoryPress = (category: BreakupCategory) => {
    hapticService.selection();
    if (category.premium && subscriptionTier === 'free') {
      Alert.alert(
        "Premium Feature",
        `"${category.label}" is a premium category. Unlock all categories with Solace Premium!`,
        [{ text: "OK" }]
      );
      console.log(`Paywall: User tried to access premium category: ${category.label}`);
    } else {
      toggleInterestCategory(category.id);
    }
  };

  const handleNext = () => {
    hapticService.medium();
    Keyboard.dismiss();

    const freeSelectedCategories = selectedCategories.filter(id => {
        const cat = breakupInterestCategories.find(c => c.id === id);
        return cat && !cat.premium;
    });

    if (subscriptionTier === 'free' && freeSelectedCategories.length === 0 && selectedCategories.length > 0) {
        Alert.alert(
            "Select a Category",
            "Please select at least one free category to continue, or upgrade to Premium to access all categories."
        );
        return;
    }
     if (selectedCategories.length === 0) {
       Alert.alert(
            "Select a Category",
            "Please select at least one category to continue."
        );
        return;
    }

    if (editing === 'true') {
      router.replace('/(main)/settings');
    } else {
      requestAnimationFrame(() => {
        router.push('/(onboarding)/notifications');
      });
    }
  };

  const handleSelectAll = () => {
    hapticService.light();
    const allFreeCategoryIds = breakupInterestCategories
      .filter(cat => !cat.premium)
      .map(cat => cat.id);

    const allPremiumCategoryIds = breakupInterestCategories
      .filter(cat => cat.premium)
      .map(cat => cat.id);

    const currentlySelectedFree = selectedCategories.filter(id => allFreeCategoryIds.includes(id));
    const currentlySelectedPremium = selectedCategories.filter(id => allPremiumCategoryIds.includes(id));

    if (subscriptionTier === 'free') {
      if (currentlySelectedFree.length === allFreeCategoryIds.length) {
        setInterestCategories(selectedCategories.filter(id => !allFreeCategoryIds.includes(id)));
      } else {
        setInterestCategories([...new Set([...selectedCategories, ...allFreeCategoryIds])]);
      }
    } else {
      const allCategoryIds = breakupInterestCategories.map(cat => cat.id);
      if (selectedCategories.length === allCategoryIds.length) {
        setInterestCategories([]);
      } else {
        setInterestCategories(allCategoryIds);
      }
    }
  };

  const getSelectAllText = () => {
    if (subscriptionTier === 'free') {
      const allFreeCategoryIds = breakupInterestCategories.filter(cat => !cat.premium).map(cat => cat.id);
      const currentlySelectedFree = selectedCategories.filter(id => allFreeCategoryIds.includes(id));
      return currentlySelectedFree.length === allFreeCategoryIds.length && allFreeCategoryIds.length > 0
        ? "Deselect All Free"
        : "Select All Free";
    } else {
      const allCategoryIds = breakupInterestCategories.map(cat => cat.id);
      return selectedCategories.length === allCategoryIds.length && allCategoryIds.length > 0
        ? "Deselect All"
        : "Select All";
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
          Affirmation Topics
        </Text>
        <Text 
          variant="subtitle"
          textAlign="left" 
          color="textSecondary" 
          fontSize="md"
          lineHeight="sm"
          mb={4}
        >
          {subscriptionTier === 'free'
            ? "Select the free topics you'd like to see, or upgrade to unlock all."
            : "Select the types of affirmations you'd like to see."}
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
            {getSelectAllText()}
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
              onPress={() => handleCategoryPress(category)}
              isPremium={category.premium}
              isLocked={category.premium && subscriptionTier === 'free'}
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
          w="100%"
        >
          <Text color="primaryButtonText" fontWeight="semibold" fontSize="md">
            {editing === 'true' ? 'Save Changes' : 'Continue →'}
          </Text>
        </Button>
      </Box>
    </Box>
  );
} 