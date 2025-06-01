import { reviewService } from '@/services/reviewService';
import { supabase } from '@/services/supabaseClient';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Box, Button, HStack, Icon, IconButton, Spinner, Text, useTheme, VStack } from 'native-base';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Share, StyleSheet } from 'react-native';
import { SwiperFlatList } from 'react-native-swiper-flatlist';

interface Quote {
  id: string;
  text: string;
  category?: string;
}

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function FavoritesScreen() {
  const theme = useTheme();
  const userName = useUserStore((state) => state.userName);
  const favoriteQuoteIds = useUserStore((state) => state.favoriteQuoteIds);
  const addFavorite = useUserStore((state) => state.addFavoriteQuoteId);
  const removeFavorite = useUserStore((state) => state.removeFavoriteQuoteId);
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Create infinite scroll data by repeating quotes multiple times
  // Use more repetitions if we have fewer quotes to ensure smooth infinite scrolling
  const repetitions = quotes.length > 0 ? Math.max(10, Math.ceil(100 / quotes.length)) : 0;
  const infiniteQuotes = quotes.length > 0 ? Array(repetitions).fill(quotes).flat() : [];
  const currentQuote = quotes.length > 0 ? quotes[currentIndex % quotes.length] : null;

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

  const handleToggleFavorite = useCallback(() => {
    if (!currentQuote) return;
    
    const isCurrentlyFavorite = favoriteQuoteIds.includes(currentQuote.id);
    if (isCurrentlyFavorite) {
      removeFavorite(currentQuote.id);
      console.log('Removed from favorites:', currentQuote.id);
    } else {
      addFavorite(currentQuote.id);
      console.log('Added to favorites:', currentQuote.id);
      // Track favorite added for review prompt
      reviewService.trackFavoriteAdded();
    }
  }, [currentQuote, favoriteQuoteIds, addFavorite, removeFavorite]);

  const handleShare = useCallback(async () => {
    if (!currentQuote) {
      console.log('Share pressed, but no current quote to share.');
      return;
    }
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
        <VStack flex={1} safeAreaTop>
          {/* Full screen quote swiper - horizontal with fixed centering */}
          <LinearGradient
            colors={[theme.colors.miracleBackground, theme.colors.miracleBackground]}
            style={StyleSheet.absoluteFill}
          />
          <Box flex={1} position="relative">
            {/* My Favorites title positioned on the page */}
            <Text 
              fontSize="lg" 
              fontWeight="light" 
              color="gray.300"
              position="absolute"
              top={4}
              left={4}
              zIndex={1}
            >
              My Favorites
            </Text>
            
            <SwiperFlatList
              data={infiniteQuotes}
              keyExtractor={(item, index) => `${item.id}-repeat-${index}`}
              renderItem={({ item, index }: { item: Quote; index: number }) => {
                console.log(`Rendering favorite item at index ${index}:`, item.id);
                return (
                  <Box
                    width={screenWidth}
                    height={screenHeight - 180}
                    justifyContent="center"
                    alignItems="center"
                    px={4}
                  >
                    <Box
                      bg="quoteBackground"
                      rounded="3xl"
                      shadow="5"
                      p={{base: 6, md: 8}}
                      minH={screenHeight * 0.35}
                      maxH={screenHeight * 0.6}
                      width="90%"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text variant="quote">
                        {item.text}
                      </Text>
                    </Box>
                  </Box>
                );
              }}
              onChangeIndex={({ index }: { index: number }) => {
                console.log('Favorites swiper index changed to:', index);
                setCurrentIndex(index);
              }}
            />
            
            {/* Swipe indicator - centered under the cards */}
            <Box alignItems="center" pb={4}>
              <Icon as={Ionicons} name="chevron-forward-outline" size="sm" color="gray.400" />
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Swipe right
              </Text>
            </Box>
          </Box>

          {/* Clean bottom action bar */}
          <HStack 
            justifyContent="center" 
            alignItems="center" 
            px={6}
            py={4}
            space={8}
            safeAreaBottom
          >
            <IconButton
              icon={<Icon as={Ionicons} name="refresh-outline" />}
              size="lg"
              variant="ghost"
              colorScheme="primary"
              onPress={fetchFavoriteQuotes}
              accessibilityLabel="Refresh favorites"
            />
            <IconButton
              icon={<Icon as={Ionicons} name="share-social-outline" />}
              size="lg"
              variant="ghost"
              colorScheme="primary"
              onPress={handleShare}
              accessibilityLabel="Share affirmation"
            />
            <IconButton
              icon={
                <Icon
                  as={Ionicons}
                  name={currentQuote && favoriteQuoteIds.includes(currentQuote.id) ? "heart" : "heart-outline"}
                  color={currentQuote && favoriteQuoteIds.includes(currentQuote.id) ? "primary.500" : "primary.500"}
                />
              }
              size="lg"
              variant="ghost"
              colorScheme="primary"
              onPress={handleToggleFavorite}
              accessibilityLabel="Favorite affirmation"
            />
          </HStack>
        </VStack>
      )}
    </Box>
  );
} 