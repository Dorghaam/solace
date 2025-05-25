import { supabase } from '@/services/supabaseClient';
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, HStack, Icon, IconButton, Spinner, Text, useTheme, VStack } from 'native-base';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Share } from 'react-native';
import { SwiperFlatList } from 'react-native-swiper-flatlist';

interface Quote {
  id: string;
  text: string;
  author?: string;
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

  const currentQuote = quotes[currentIndex] || null;

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
        .select('id, text, author, category')
        .in('id', favoriteQuoteIds)
        .order('created_at', { ascending: false });

      if (dbError) throw dbError;

      console.log('Raw favorite data from Supabase:', data);

      if (data && data.length > 0) {
        // Order the quotes based on the favoriteQuoteIds order for consistency
        const orderedQuotes = favoriteQuoteIds
          .map(id => data.find(quote => quote.id === id))
          .filter(Boolean) as Quote[];
        
        setQuotes(orderedQuotes);
        console.log('Successfully set favorite quotes:', orderedQuotes.length, 'quotes loaded');
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
        message: `"${currentQuote.text}"${currentQuote.author ? ` — ${currentQuote.author}` : ''} - via Solace App`,
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
      <Box flex={1} justifyContent="center" alignItems="center" bg="backgroundLight">
        <Spinner size="lg" color="primary.500" />
        <Text mt={2} color="textSecondary">Loading your favorites...</Text>
      </Box>
    );
  }

  console.log('FavoritesScreen - Number of quotes to render:', quotes.length, quotes.map(q => q.id));

  return (
    <Box flex={1} bg="backgroundLight">
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
          {/* Header with title and settings */}
          <HStack px={4} py={2} justifyContent="space-between" alignItems="center">
            <Text fontSize="lg" fontWeight="semibold" color="gray.800">
              My Favorites
            </Text>
            <IconButton
              icon={<Icon as={Ionicons} name="settings-outline" color="textSecondary" />}
              size="md"
              variant="ghost"
              onPress={() => router.push('/(main)/settings')}
            />
          </HStack>

          {/* Full screen quote swiper - horizontal with fixed centering */}
          <Box flex={1} position="relative">
            <SwiperFlatList
              data={quotes}
              renderItem={({ item, index }: { item: Quote; index: number }) => {
                console.log(`Rendering favorite item at index ${index}:`, item.id);
                return (
                  <Box
                    key={item.id}
                    width={screenWidth}
                    height={screenHeight - 200}
                    justifyContent="center"
                    alignItems="center"
                    px={4}
                  >
                    {/* Clean quote card */}
                    <Box
                      bg="white"
                      rounded="3xl"
                      shadow="6"
                      p={8}
                      minH={screenHeight * 0.35}
                      maxH={screenHeight * 0.55}
                      width="90%"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text 
                        fontSize="2xl" 
                        fontWeight="medium" 
                        color="gray.800" 
                        textAlign="center"
                        lineHeight="2xl"
                        letterSpacing="sm"
                      >
                        {item.text}
                      </Text>
                      {item.author && (
                        <Text 
                          mt={6} 
                          fontSize="md" 
                          color="gray.500" 
                          fontStyle="italic"
                          textAlign="center"
                        >
                          — {item.author}
                        </Text>
                      )}
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
                  color={currentQuote && favoriteQuoteIds.includes(currentQuote.id) ? "red.500" : "primary.500"}
                />
              }
              size="lg"
              variant="ghost"
              colorScheme={currentQuote && favoriteQuoteIds.includes(currentQuote.id) ? "red" : "primary"}
              onPress={handleToggleFavorite}
              accessibilityLabel="Favorite affirmation"
            />
          </HStack>
        </VStack>
      )}
    </Box>
  );
} 