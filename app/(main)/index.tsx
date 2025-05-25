import { supabase } from '@/services/supabaseClient'; // Ensure this path is correct
import { useUserStore } from '@/store/userStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Box, Button, HStack, Icon, IconButton, Spinner, Text, useTheme, VStack } from 'native-base';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Dimensions } from 'react-native'; // Import Dimensions for card height
import { Swiper } from 'rn-swiper-list'; // Import the swiper correctly

interface Quote {
  id: string;
  text: string;
  author?: string;
  category?: string; // For potential filtering later
}

const { height: screenHeight } = Dimensions.get('window');

export default function FeedScreen() {
  const theme = useTheme(); // NativeBase theme hook
  const userName = useUserStore((state) => state.userName);
  const interestCategories = useUserStore((state) => state.interestCategories);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // currentQuote will be managed by the Swiper's current index

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

      if (data && data.length > 0) {
        // Simple shuffle for variety if needed, or just use the fetched order
        // const shuffledData = [...data].sort(() => 0.5 - Math.random());
        // setQuotes(shuffledData);
        setQuotes(data);
      } else {
        setQuotes([]);
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

  const handleFavorite = (quoteId: string) => {
    console.log('Favorite pressed for quote ID:', quoteId);
    // TODO: Implement favorite logic (add to Zustand store, sync with Supabase)
    Alert.alert("Favorite", "This quote has been favorited (feature coming soon)!");
  };

  const handleShare = (quoteText: string) => {
    console.log('Share pressed for quote:', quoteText);
    // TODO: Implement share logic (e.g., React Native Share API)
    Alert.alert("Share", "Sharing this quote (feature coming soon)!");
  };

  if (isLoading) {
    return (
      <Box flex={1} justifyContent="center" alignItems="center" bg="backgroundLight">
        <Spinner size="lg" color="primary.500" />
        <Text mt={2} color="textSecondary">Loading affirmations...</Text>
      </Box>
    );
  }

  return (
    <Box flex={1} bg="backgroundLight" safeAreaTop>
      {/* Top Bar: User Greeting and Settings Icon */}
      <HStack px={4} py={3} justifyContent="space-between" alignItems="center" borderBottomWidth={1} borderColor="gray.200">
        <Text fontSize="lg" fontWeight="semibold" color="primary.600" numberOfLines={1} ellipsizeMode="tail" flexShrink={1}>
          {userName ? `For You, ${userName}` : "Solace"}
        </Text>
        <IconButton
          icon={<Icon as={Ionicons} name="settings-outline" color="textSecondary" />}
          size="lg"
          variant="ghost"
          onPress={() => router.push('/(main)/settings')}
        />
      </HStack>

      {/* Main Content: Swiper for Quotes */}
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
      
      {quotes.length > 0 && (
        <Swiper
          data={quotes}
          renderCard={(item: Quote) => (
            <VStack
              height={screenHeight * 0.6} // Adjust height as needed for card appearance
              justifyContent="center"
              alignItems="center"
              p={8} // Generous padding for text
              bg="quoteBackground" // White card like "I am" app
              mx={4} // Horizontal margin for card effect
              my={screenHeight * 0.05} // Vertical margin for card effect
              rounded="2xl" // More rounded corners
              shadow="5"
              key={item.id}
            >
              <Text variant="quote" color="quoteText">
                {item.text}
              </Text>
              {item.author && (
                <Text mt={4} fontSize="sm" color="textSecondary" fontStyle="italic">
                  — {item.author}
                </Text>
              )}
            </VStack>
          )}
          // Swiper specific props (refer to rn-swiper-list docs)
          onIndexChange={(index) => console.log('Current quote index:', index)}
          cardStyle={{ flex: 1, width: '100%' }} // Ensure card takes full space
          disableLeftSwipe={false} // Allow left swipe (reject)
          disableRightSwipe={false} // Allow right swipe (like)
          disableTopSwipe={false} // Allow top swipe (super like)
        />
      )}

      {/* Bottom Action Bar - Only show if there are quotes and no error */}
      {quotes.length > 0 && !error && (
        <HStack 
          justifyContent="space-around" 
          alignItems="center" 
          py={2} px={4} 
          borderTopWidth={1} 
          borderColor="gray.200" 
          bg="backgroundFocused" // Match tab bar background
          safeAreaBottom // Ensure it's above home indicator etc.
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
            // onPress={() => handleShare(quotes[currentIndex].text)} // Need currentIndex from swiper
            onPress={() => Alert.alert("Share coming soon!")}
            accessibilityLabel="Share affirmation"
          />
          <IconButton
            icon={<Icon as={Ionicons} name="heart-outline" />} // Toggle to "heart" when favorited
            size="lg"
            variant="ghost"
            colorScheme="primary"
            // onPress={() => handleFavorite(quotes[currentIndex].id)} // Need currentIndex
            onPress={() => Alert.alert("Favorite coming soon!")}
            accessibilityLabel="Favorite affirmation"
          />
        </HStack>
      )}
    </Box>
  );
} 