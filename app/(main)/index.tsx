import { reviewService } from '@/services/reviewService'; // Import reviewService
import { supabase } from '@/services/supabaseClient'; // Ensure this path is correct
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import { Box, Button, Icon, IconButton, Spinner, Text, useTheme, VStack } from 'native-base';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Share, StyleSheet } from 'react-native'; // Import Share, Dimensions, StyleSheet
import { SwiperFlatList } from 'react-native-swiper-flatlist'; // Changed to more reliable swiper

interface Quote {
  id: string;
  text: string;
  category?: string; // For potential filtering later
}

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

export default function FeedScreen() {
  const theme = useTheme(); // NativeBase theme hook
  const userName = useUserStore((state) => state.userName);
  const interestCategories = useUserStore((state) => state.interestCategories);
  const favoriteQuoteIds = useUserStore((state) => state.favoriteQuoteIds);
  const addFavorite = useUserStore((state) => state.addFavoriteQuoteId);
  const removeFavorite = useUserStore((state) => state.removeFavoriteQuoteId);
  const targetQuote = useUserStore((state) => state.targetQuote);
  const clearTargetQuote = useUserStore((state) => state.clearTargetQuote);
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Create infinite scroll data by repeating quotes multiple times
  // Use more repetitions if we have fewer quotes to ensure smooth infinite scrolling
  const repetitions = quotes.length > 0 ? Math.max(10, Math.ceil(100 / quotes.length)) : 0;
  const infiniteQuotes = quotes.length > 0 ? Array(repetitions).fill(quotes).flat() : [];
  const currentQuote = quotes.length > 0 ? quotes[currentIndex % quotes.length] : null;

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log('Fetching quotes with categories:', interestCategories);

    try {
      let query = supabase.from('quotes').select('id, text, category');

      // Filter by selected interest categories if any are present
      if (interestCategories && interestCategories.length > 0) {
        query = query.in('category', interestCategories);
      }
      
      // Fetch quotes without specific ordering - we'll randomize client-side
      query = query.limit(50); // Fetch more quotes for better variety in infinite scroll

      const { data, error: dbError } = await query;

      if (dbError) throw dbError;

      console.log('Raw data from Supabase:', data); // Added debug log

      if (data && data.length > 0) {
        // ALWAYS shuffle the quotes for true randomization on each app load
        const shuffledData = [...data].sort(() => Math.random() - 0.5);
        setQuotes(shuffledData);
        console.log('Successfully set quotes:', shuffledData.length, 'quotes loaded and shuffled'); // Added debug log
      } else {
        setQuotes([]);
        console.log('No quotes returned from database'); // Added debug log
        // Optionally set a specific message if no quotes match filters
        if (interestCategories && interestCategories.length > 0) {
          setError("No affirmations match your selected topics yet. Try adjusting categories in Settings or check back later!");
        } else {
          setError("No affirmations available right now. Please check back later.");
        }
      }
    } catch (e: any) {
      console.error("Failed to fetch quotes:", e);
      setError('Could not load affirmations. Please try again.');
      setQuotes([]);
    } finally {
      setIsLoading(false);
    }
  }, [interestCategories]); // Re-fetch if interestCategories change

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  // Handle target quote from notification
  useEffect(() => {
    if (targetQuote && quotes.length > 0) {
      // Find the target quote in the quotes array
      const targetIndex = quotes.findIndex(quote => quote.id === targetQuote.id);
      if (targetIndex !== -1) {
        // Set the current index to show the target quote
        setCurrentIndex(targetIndex);
        console.log('Navigated to target quote from notification:', targetQuote.id, 'at index:', targetIndex);
      } else {
        // If the target quote is not in the current quotes array, add it temporarily
        const tempQuote: Quote = {
          id: targetQuote.id,
          text: targetQuote.text,
          category: targetQuote.category
        };
        setQuotes(prevQuotes => [tempQuote, ...prevQuotes]);
        setCurrentIndex(0);
        console.log('Added target quote to beginning of quotes array:', targetQuote.id);
      }
      // Clear the target quote after handling it
      clearTargetQuote();
    }
  }, [targetQuote, quotes, clearTargetQuote]);

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
  }, [currentQuote, favoriteQuoteIds, addFavorite, removeFavorite]); // Dependencies for useCallback

  const handleShare = useCallback(async () => {
    if (!currentQuote) {
      console.log('Share pressed, but no current quote to share.');
      return;
    }
    console.log('Attempting to share quote:', currentQuote.text);

    try {
      const result = await Share.share({
        message: `"${currentQuote.text}" - via Solace App`,
        // title: 'Share Affirmation', // Optional: For some platforms like email
        // url: 'https://yourappstorelink.com' // Optional: Link to your app
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
  }, [currentQuote]); // Dependency for useCallback: re-create handleShare if currentQuote changes

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="miracleBackground">
        <Spinner size="lg" color="primary.500" />
        <Text mt={2} color="textSecondary">Loading affirmations...</Text>
      </Box>
    );
  }

  // Add console log for debugging before return
  console.log('FeedScreen - Number of quotes to render:', quotes.length, 'Infinite quotes:', infiniteQuotes.length);

  return (
    <Box flex={1} bg="miracleBackground">
      {/* Clean minimal layout without overlapping elements */}
      
      {/* Error States */}
      {error && !isLoading && quotes.length === 0 && (
        <VStack flex={1} justifyContent="center" alignItems="center" p={6} space={3}>
          <Icon as={Ionicons} name="sad-outline" size="6xl" color="textTertiary" />
          <Text textAlign="center" color="textSecondary">{error}</Text>
          <Button variant="outline" onPress={fetchQuotes} mt={4}>Try Again</Button>
        </VStack>
      )}

      {!error && quotes.length === 0 && !isLoading && (
         <VStack flex={1} justifyContent="center" alignItems="center" p={6} space={3}>
          <Icon as={Ionicons} name="leaf-outline" size="6xl" color="textTertiary" />
          <Text textAlign="center" color="textSecondary">No affirmations loaded. Pull to refresh or check settings.</Text>
           <Button variant="outline" onPress={fetchQuotes} mt={4}>Refresh</Button>
        </VStack>
      )}
      
      {/* Main Quote Display - Full screen, clean layout */}
      {quotes.length > 0 && (
        <VStack flex={1}>
          {/* Full screen quote swiper - vertical with proper page snapping */}
          <LinearGradient
            colors={[theme.colors.miracleBackground, theme.colors.miracleBackground]} // Updated to miracleBackground
            style={StyleSheet.absoluteFill} // Make gradient fill the container
          />
          <Box flex={1} position="relative"> {/* Swiper now sits on top of the gradient */}
            <SwiperFlatList
              data={infiniteQuotes}
              keyExtractor={(item, index) => `${item.id}-repeat-${index}`}
              index={currentIndex}
              vertical={true} // Enable vertical scrolling like TikTok
              pagingEnabled={true} // Enable proper page snapping
              showsVerticalScrollIndicator={false} // Hide scroll indicator for clean look
              snapToInterval={screenHeight} // Snap exactly one screen height
              snapToAlignment="start" // Align to start of each page
              decelerationRate="fast" // Fast snapping for better page feel
              bounces={false} // Disable bouncing for cleaner page transitions
              renderItem={({ item, index }: { item: Quote; index: number }) => {
                console.log(`Rendering item at index ${index}:`, item.id);
                return (
                  <Box
                    width={screenWidth}
                    height={screenHeight} // Full screen height for each quote
                    justifyContent="center"
                    alignItems="center"
                    px={6}
                  >
                    {/* Clean quote card */}
                    <Box
                      bg="transparent" // Keep transparent background as it was before
                      rounded="3xl" // More rounded
                      // shadow="3" // Remove shadow for transparent card
                      p={6} // Reduced padding
                      maxWidth="92%" // Made container wider
                      minH="200px" // Minimum height constraint
                      maxH="400px" // Maximum height constraint
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text 
                        variant="quote" // Use the quote variant from theme
                        allowFontScaling={false} // Prevent font scaling
                        adjustsFontSizeToFit={false} // Don't auto-adjust font size
                        numberOfLines={0} // Allow unlimited lines
                        textBreakStrategy="simple" // Ensure proper word breaking
                      >
                        {item.text}
                      </Text>
                    </Box>
                  </Box>
                );
              }}
              onChangeIndex={({ index }: { index: number }) => {
                console.log('Swiper index changed to:', index);
                setCurrentIndex(index);
                // Track quote viewed for review prompt
                reviewService.trackQuoteViewed();
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
                bg="rgba(255,255,255,0.9)"
                _icon={{ color: "primary.500" }}
                onPress={fetchQuotes}
                accessibilityLabel="Refresh affirmations"
              />
              <IconButton
                icon={<Icon as={Ionicons} name="share-social-outline" />}
                size="lg"
                variant="solid"
                colorScheme="primary"
                rounded="full"
                bg="rgba(255,255,255,0.9)"
                _icon={{ color: "primary.500" }}
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
                variant="solid"
                colorScheme="primary"
                rounded="full"
                bg="rgba(255,255,255,0.9)"
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