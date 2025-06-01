import { MultiSelectionCard, OnboardingStepLayout } from '@/components/onboarding';
import { breakupInterestCategories, useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, HStack, Icon, VStack, useTheme } from 'native-base';
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
    Keyboard.dismiss();
    if (editing === 'true') {
      router.replace('/(main)/settings');
    } else {
      router.push('/(onboarding)/notifications');
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
      backgroundColor: theme.colors.miracleCardBackground || '#FFFFFF',
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
    <OnboardingStepLayout
      title="Affirmation Categories"
      subtitle="Select the types of affirmations you'd like to see."
      onNext={handleNext}
      isNextDisabled={selectedCategories.length === 0}
      showBackButton={editing === 'true'}
      nextButtonText="Continue →"
    >
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

      <HStack justifyContent="flex-end" mb={3}>
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
      
      <VStack space={0}>
        {filteredCategories.map((category) => (
          <MultiSelectionCard
            key={category.id}
            label={category.label}
            isSelected={selectedCategories.includes(category.id)}
            onPress={() => toggleInterestCategory(category.id)}
          />
        ))}
      </VStack>
    </OnboardingStepLayout>
  );
} 