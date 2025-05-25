import { supabase } from '@/services/supabaseClient'; // Ensure this path is correct
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import { Box, Button, HStack, Icon, IconButton, Spinner, Text, useTheme, VStack } from 'native-base';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions, Share, StyleSheet } from 'react-native'; // Import Share, Dimensions, StyleSheet
import { SwiperFlatList } from 'react-native-swiper-flatlist'; // Changed to more reliable swiper

interface Quote {
  id: string;
  text: string;
  author?: string;
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
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  // currentQuote will be managed by the Swiper's current index

  const currentQuote = quotes[currentIndex] || null;

  const fetchQuotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.log('Fetching quotes with categories:', interestCategories);

    try {
      let query = supabase.from('quotes').select('id, text, author, category');

      // Filter by selected interest categories if any are present
      if (interestCategories && interestCategories.length > 0) {
        query = query.in('category', interestCategories);
      }
      
      // Add ordering - for now, simple random order by created_at.
      // For true randomness on each fetch, Supabase might need a function or view.
      // As a simple client-side pseudo-random, we fetch more and then shuffle locally or rely on DB order.
      query = query.order('created_at', { ascending: Math.random() > 0.5 }); // Simple variation
      query = query.limit(20); // Fetch a batch of quotes

      const { data, error: dbError } = await query;

      if (dbError) throw dbError;

      console.log('Raw data from Supabase:', data); // Added debug log

      if (data && data.length > 0) {
        // Simple shuffle for variety if needed, or just use the fetched order
        // const shuffledData = [...data].sort(() => 0.5 - Math.random());
        // setQuotes(shuffledData);
        setQuotes(data);
        console.log('Successfully set quotes:', data.length, 'quotes loaded'); // Added debug log
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
  }, [currentQuote, favoriteQuoteIds, addFavorite, removeFavorite]); // Dependencies for useCallback

  const handleShare = useCallback(async () => {
    if (!currentQuote) {
      console.log('Share pressed, but no current quote to share.');
      return;
    }
    console.log('Attempting to share quote:', currentQuote.text);

    try {
      const result = await Share.share({
        message: `"${currentQuote.text}"${currentQuote.author ? ` — ${currentQuote.author}` : ''} - via Solace App`,
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
      <Box flex={1} justifyContent="center" alignItems="center" bg="backgroundLight">
        <Spinner size="lg" color="primary.500" />
        <Text mt={2} color="textSecondary">Loading affirmations...</Text>
      </Box>
    );
  }

  // Add console log for debugging before return
  console.log('FeedScreen - Number of quotes to render:', quotes.length, quotes.map(q => q.id));

  return (
    <Box flex={1} bg="backgroundLight">
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
        <VStack flex={1} safeAreaTop>
          {/* Full screen quote swiper - horizontal with fixed centering */}
          <LinearGradient
            colors={[theme.colors.primary[50], theme.colors.backgroundLight, theme.colors.backgroundLight]} // Subtle pink to backgroundLight
            style={StyleSheet.absoluteFill} // Make gradient fill the container
          />
          <Box flex={1} position="relative"> {/* Swiper now sits on top of the gradient */}
            {/* Solace title positioned on the page */}
            <Text 
              fontSize="lg" 
              fontWeight="light" 
              color="gray.300"
              position="absolute"
              top={4}
              left={4}
              zIndex={1}
            >
              Solace
            </Text>
            
            <SwiperFlatList
              data={quotes}
              renderItem={({ item, index }: { item: Quote; index: number }) => {
                console.log(`Rendering item at index ${index}:`, item.id);
                return (
                  <Box
                    key={item.id}
                    width={screenWidth}
                    height={screenHeight - 180} // Adjust to match positioning
                    justifyContent="center"
                    alignItems="center"
                    px={4}
                  >
                    {/* Clean quote card */}
                    <Box
                      bg="quoteBackground" // Use theme color for card background (e.g., white)
                      rounded="3xl" // More rounded
                      shadow="5" // Softer shadow
                      p={{base: 6, md: 8}}
                      minH={screenHeight * 0.35}
                      maxH={screenHeight * 0.6} // Allow slightly taller cards
                      width="90%"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Text 
                        variant="quote" // Use the quote variant from theme
                      >
                        {item.text}
                      </Text>
                      {item.author && (
                        <Text 
                          mt={4} 
                          fontSize="sm" 
                          color="textSecondary" 
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
                console.log('Swiper index changed to:', index);
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
              onPress={fetchQuotes}
              accessibilityLabel="Refresh affirmations"
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