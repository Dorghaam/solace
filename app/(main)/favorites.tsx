import { hapticService } from '@/services/hapticService';
import { reviewService } from '@/services/reviewService';
import { supabase } from '@/services/supabaseClient';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Box, Button, Icon, IconButton, Spinner, Text, useTheme, VStack } from 'native-base';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, FlatList, Share, StyleSheet } from 'react-native';

interface Quote {
  id: string;
  text: string;
  category?: string;
}

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function FavoritesScreen() {
  const theme = useTheme();
  const userName = useUserStore((state) => state.userName);
  const supabaseUser = useUserStore((state) => state.supabaseUser);
  const hasCompletedOnboarding = useUserStore((state) => state.hasCompletedOnboarding);
  const favoriteQuoteIds = useUserStore((state) => state.favoriteQuoteIds);
  const addFavorite = useUserStore((state) => state.addFavoriteQuoteId);
  const removeFavorite = useUserStore((state) => state.removeFavoriteQuoteId);
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [optimisticFavorites, setOptimisticFavorites] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);

  // Authentication guard: redirect to onboarding if not authenticated
  useEffect(() => {
    if (!supabaseUser || !hasCompletedOnboarding) {
      console.log('FavoritesScreen: User not authenticated or onboarding not completed, redirecting...');
      router.replace('/(onboarding)');
    }
  }, [supabaseUser, hasCompletedOnboarding]);

  // Don't render main content if not authenticated
  if (!supabaseUser || !hasCompletedOnboarding) {
    return (
      <Box flex={1} bg="miracleBackground" justifyContent="center" alignItems="center">
        <Spinner color="primary.500" size="lg" />
      </Box>
    );
  }

  // Create infinite scroll data by repeating quotes multiple times
  // Use more repetitions if we have fewer quotes to ensure smooth infinite scrolling
  const repetitions = quotes.length > 0 ? Math.max(10, Math.ceil(100 / quotes.length)) : 0;
  const infiniteQuotes = quotes.length > 0 ? Array(repetitions).fill(quotes).flat() : [];
  const currentQuote = quotes.length > 0 ? quotes[currentIndex % quotes.length] : null;

  // Helper function to check if current quote is favorited (with optimistic updates)
  const isCurrentQuoteFavorited = useCallback(() => {
    if (!currentQuote) return false;
    const inStore = favoriteQuoteIds.includes(currentQuote.id);
    const optimisticState = optimisticFavorites.has(currentQuote.id);
    // If quote is in optimistic state, return that; otherwise return store state
    return optimisticFavorites.size > 0 ? optimisticState : inStore;
  }, [currentQuote, favoriteQuoteIds, optimisticFavorites]);

  const fetchFavoriteQuotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log('Fetching favorite quotes for IDs:', favoriteQuoteIds);

    try {
      if (favoriteQuoteIds.length === 0) {
        setQuotes([]);
        setIsLoading(false);
        return;
      }

      const { data, error: dbError } = await supabase
        .from('quotes')
        .select('id, text, category')
        .in('id', favoriteQuoteIds)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      console.log('Raw favorite data from Supabase:', data);

      if (data && data.length > 0) {
        // Randomize the favorite quotes for variety instead of keeping them in favoriteQuoteIds order
        const shuffledFavorites = [...data].sort(() => Math.random() - 0.5);
        
        setQuotes(shuffledFavorites);
        console.log('Successfully set favorite quotes:', shuffledFavorites.length, 'quotes loaded and shuffled');
      } else {
        setQuotes([]);
        console.log('No favorite quotes returned from database');
      }
    } catch (e: any) {
      console.error("Failed to fetch favorite quotes:", e);
      setError('Could not load your favorite affirmations. Please try again.');
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [favoriteQuoteIds]);

  useEffect(() => {
    fetchFavoriteQuotes();
  }, [fetchFavoriteQuotes]);

  const handleToggleFavorite = useCallback(async () => {
    if (!currentQuote) return;
    
    const isCurrentlyFavorite = isCurrentQuoteFavorited();
    
    // Optimistic update - immediate visual feedback
    setOptimisticFavorites(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyFavorite) {
        newSet.delete(currentQuote.id);
      } else {
        newSet.add(currentQuote.id);
      }
      return newSet;
    });

    // Then update the store
    if (isCurrentlyFavorite) {
      // Removing from favorites - light haptic
      hapticService.light();
      removeFavorite(currentQuote.id);
      console.log('Removed from favorites:', currentQuote.id);
    } else {
      // Adding to favorites - success haptic for positive action
      hapticService.success();
      addFavorite(currentQuote.id);
      console.log('Added to favorites:', currentQuote.id);
      // Track favorite added for review prompt
      reviewService.trackFavoriteAdded();
    }

    // Clear optimistic state after a short delay to let store update
    setTimeout(() => {
      setOptimisticFavorites(new Set());
    }, 100);
  }, [currentQuote, isCurrentQuoteFavorited, addFavorite, removeFavorite]);

  const handleShare = useCallback(async () => {
    if (!currentQuote) {
      console.log('Share pressed, but no current quote to share.');
      return;
    }
    
    // Light haptic for share action
    hapticService.light();
    console.log('Attempting to share quote:', currentQuote.text);

    try {
      const result = await Share.share({
        message: `"${currentQuote.text}" - via Solace App`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared with activity type:', result.activityType);
        } else {
          console.log('Shared successfully');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error: any) {
      Alert.alert("Error", error.message);
      console.error('Error sharing:', error.message);
    }
  }, [currentQuote]);

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="miracleBackground">
        <Spinner size="lg" color="primary.500" />
        <Text mt={2} color="textSecondary">Loading your favorites...</Text>
      </Box>
    );
  }

  console.log('FavoritesScreen - Number of quotes to render:', quotes.length, 'Infinite quotes:', infiniteQuotes.length);

  return (
    <Box flex={1} bg="miracleBackground">
      {/* Error States */}
      {error && !isLoading && quotes.length === 0 && (
        <VStack flex={1} justifyContent="center" alignItems="center" p={6} space={3}>
          <Icon as={Ionicons} name="sad-outline" size="6xl" color="textTertiary" />
          <Text textAlign="center" color="textSecondary">{error}</Text>
          <Button variant="outline" onPress={fetchFavoriteQuotes} mt={4}>Try Again</Button>
        </VStack>
      )}

      {!error && quotes.length === 0 && !isLoading && (
        <VStack flex={1} justifyContent="center" alignItems="center" p={6} space={3}>
          <Icon as={Ionicons} name="heart-dislike-outline" size="6xl" color="textTertiary" />
          <Text textAlign="center" color="textSecondary" fontSize="lg">No favorites yet.</Text>
          <Text textAlign="center" color="textTertiary">Tap the heart on affirmations you love to save them here!</Text>
          <Button variant="outline" onPress={() => router.canGoBack() ? router.back() : router.replace('/(main)')} mt={4}>
            Browse Affirmations
          </Button>
        </VStack>
      )}
      
      {/* Main Quote Display - Full screen, clean layout */}
      {quotes.length > 0 && (
        <VStack flex={1}>
          {/* Full screen quote swiper - vertical with proper page snapping */}
          <LinearGradient
            colors={[theme.colors.miracleBackground, theme.colors.miracleBackground]}
            style={StyleSheet.absoluteFill}
          />
          <Box flex={1} position="relative">
            <FlatList
              ref={flatListRef}
              data={infiniteQuotes}
              keyExtractor={(item, index) => `${item.id}-repeat-${index}`}
              initialScrollIndex={currentIndex}
              horizontal={false}
              pagingEnabled={true}
              showsVerticalScrollIndicator={false}
              snapToInterval={screenHeight}
              snapToAlignment="start"
              decelerationRate="fast"
              bounces={false}
              getItemLayout={(data, index) => ({
                length: screenHeight,
                offset: screenHeight * index,
                index,
              })}
              onMomentumScrollEnd={(event) => {
                const newIndex = Math.round(event.nativeEvent.contentOffset.y / screenHeight);
                if (newIndex !== currentIndex) {
                  setCurrentIndex(newIndex);
                  console.log('Favorites swiper index changed to:', newIndex);
                }
              }}
              renderItem={({ item, index }: { item: Quote; index: number }) => {
                console.log(`Rendering favorite item at index ${index}:`, item.id);
                return (
                  <Box
                    width={screenWidth}
                    height={screenHeight}
                    justifyContent="center"
                    alignItems="center"
                    px={6}
                  >
                    <Box
                      bg="transparent"
                      rounded="3xl"
                      p={6}
                      maxWidth="92%"
                      minH="200px"
                      maxH="400px"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text 
                        variant="quote"
                        allowFontScaling={false}
                        adjustsFontSizeToFit={false}
                        numberOfLines={0}
                        textBreakStrategy="simple"
                      >
                        {item.text}
                      </Text>
                    </Box>
                  </Box>
                );
              }}
            />
          </Box>

          {/* Floating bottom action buttons - positioned over the content */}
          <Box
            position="absolute"
            bottom={8}
            right={4}
            zIndex={10}
            safeAreaBottom
          >
            <VStack space={4} alignItems="center">
              <IconButton
                icon={<Icon as={Ionicons} name="refresh-outline" />}
                size="lg"
                variant="solid"
                colorScheme="primary"
                rounded="full"
                bg="miracleBackground"
                _icon={{ color: "primary.500" }}
                onPress={() => {
                  hapticService.medium();
                  fetchFavoriteQuotes();
                }}
                accessibilityLabel="Refresh favorites"
              />
              <IconButton
                icon={<Icon as={Ionicons} name="share-social-outline" />}
                size="lg"
                variant="solid"
                colorScheme="primary"
                rounded="full"
                bg="miracleBackground"
                _icon={{ color: "primary.500" }}
                onPress={handleShare}
                accessibilityLabel="Share affirmation"
              />
              <IconButton
                icon={
                  <Icon
                    as={Ionicons}
                    name={isCurrentQuoteFavorited() ? "heart" : "heart-outline"}
                    color="primary.500"
                  />
                }
                size="lg"
                variant="solid"
                colorScheme="primary"
                rounded="full"
                bg="miracleBackground"
                onPress={handleToggleFavorite}
                accessibilityLabel="Favorite affirmation"
              />
            </VStack>
          </Box>
        </VStack>
      )}
    </Box>
  );
} 