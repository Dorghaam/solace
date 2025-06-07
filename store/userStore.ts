import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Define BreakupCategory and other existing types...
export type BreakupCategory = 'healing_heartbreak' | 'self_love' | 'letting_go' | 'rebuilding_confidence' | 'overcoming_loneliness' | 'finding_peace' | 'hope_future' | 'moving_forward';
export type FamiliarityOption = 'new' | 'occasional' | 'regular';
export type NotificationFrequency = '1x' | '3x' | '5x' | '10x' | 'custom';
export type WidgetTheme = 'light' | 'dark_text_on_pink' | 'pink_text_on_white';

// NEW TYPE FOR SUBSCRIPTION
export type SubscriptionTier = 'free' | 'premium';

// NEW TYPE FOR USER AFFIRMATIONS
export interface UserAffirmation {
  id: string;
  user_id: string;
  text: string;
  is_favorite: boolean;
  created_at: string;
}

export interface BreakupInterestCategory {
  id: BreakupCategory;
  label: string;
}

export interface NotificationSettings {
  enabled: boolean;
  frequency?: NotificationFrequency;
  customTimes?: { hour: number; minute: number }[];
}

export interface TargetQuote {
  id: string;
  text: string;
  category?: string;
}

export interface DailyMood {
  emoji: string;
  mood: string;
  date: string; // YYYY-MM-DD
}

export interface WidgetSettings {
  category: BreakupCategory | 'favorites' | 'all';
  theme: WidgetTheme;
}

interface UserState {
  supabaseUser: User | null;
  hasCompletedOnboarding: boolean;
  userName: string | null;
  interestCategories: BreakupCategory[];
  affirmationFamiliarity: FamiliarityOption | null;
  favoriteQuoteIds: string[];
  notificationSettings: NotificationSettings | null;
  pushToken: string | null;
  targetQuote: TargetQuote | null;
  dailyMood: DailyMood | null;
  widgetSettings: WidgetSettings | null;
  
  // NEW STATE
  subscriptionTier: SubscriptionTier;

  setSupabaseUser: (user: User | null) => void;
  setHasCompletedOnboarding: (status: boolean) => void;
  setUserName: (name: string) => void;
  toggleInterestCategory: (category: BreakupCategory) => void;
  setAffirmationFamiliarity: (familiarity: FamiliarityOption) => void;
  addFavoriteQuoteId: (quoteId: string) => void;
  removeFavoriteQuoteId: (quoteId: string) => void;
  setNotificationSettings: (settings: NotificationSettings) => void;
  setPushToken: (token: string | null) => void;
  setTargetQuote: (quote: TargetQuote) => void;
  clearTargetQuote: () => void;
  setDailyMood: (mood: DailyMood) => void;
  setWidgetSettings: (settings: Partial<WidgetSettings>) => void;
  
  // NEW ACTION
  setSubscriptionTier: (tier: SubscriptionTier) => void;

  resetState: () => void;
}

export const breakupInterestCategories: BreakupInterestCategory[] = [
    { id: 'healing_heartbreak', label: 'Healing a Broken Heart' },
    { id: 'self_love', label: 'Reclaiming Self Love' },
    { id: 'letting_go', label: 'Letting Go & Moving On' },
    { id: 'rebuilding_confidence', label: 'Rebuilding My Life' },
    { id: 'overcoming_loneliness', label: 'Finding Strength in Solitude' },
    { id: 'finding_peace', label: 'Discovering Peace After Pain' },
    { id: 'hope_future', label: 'Hope for New Beginnings' },
    { id: 'moving_forward', label: 'Coping with Grief & Loss' },
];

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      supabaseUser: null,
      hasCompletedOnboarding: false,
      userName: null,
      interestCategories: [],
      affirmationFamiliarity: null,
      favoriteQuoteIds: [],
      notificationSettings: null,
      pushToken: null,
      targetQuote: null,
      dailyMood: null,
      widgetSettings: { category: 'all', theme: 'light' },
      
      // NEW STATE DEFAULT
      subscriptionTier: 'free',

      setSupabaseUser: (user) => set({ supabaseUser: user }),
      setHasCompletedOnboarding: (status) => set({ hasCompletedOnboarding: status }),
      setUserName: (name) => set({ userName: name }),
      toggleInterestCategory: (category) =>
        set((state) => ({
          interestCategories: state.interestCategories.includes(category)
            ? state.interestCategories.filter((c) => c !== category)
            : [...state.interestCategories, category],
        })),
      setAffirmationFamiliarity: (familiarity) => set({ affirmationFamiliarity: familiarity }),
      addFavoriteQuoteId: (quoteId) =>
        set((state) => {
          if (!state.favoriteQuoteIds.includes(quoteId)) {
            return { favoriteQuoteIds: [...state.favoriteQuoteIds, quoteId] };
          }
          return state;
        }),
      removeFavoriteQuoteId: (quoteId) =>
        set((state) => ({
          favoriteQuoteIds: state.favoriteQuoteIds.filter((id) => id !== quoteId),
        })),
      setNotificationSettings: (settings) => set({ notificationSettings: settings }),
      setPushToken: (token) => set({ pushToken: token }),
      setTargetQuote: (quote) => set({ targetQuote: quote }),
      clearTargetQuote: () => set({ targetQuote: null }),
      setDailyMood: (mood) => set({ dailyMood: mood }),
      setWidgetSettings: (settings) => set((state) => ({
        widgetSettings: { ...state.widgetSettings, ...settings } as WidgetSettings,
      })),

      // NEW ACTION IMPLEMENTATION
      setSubscriptionTier: (tier) => set({ subscriptionTier: tier }),

      resetState: () => {
        set({
          supabaseUser: null,
          hasCompletedOnboarding: false,
          userName: null,
          interestCategories: [],
          affirmationFamiliarity: null,
          favoriteQuoteIds: [],
          notificationSettings: null,
          pushToken: null,
          targetQuote: null,
          dailyMood: null,
          widgetSettings: { category: 'all', theme: 'light' },
          subscriptionTier: 'free', // RESET TIER
        });
        console.log('Zustand state reset');
      },
    }),
    {
      name: 'solace-user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // IMPORTANT: DO NOT PERSIST subscriptionTier.
      // It should be fetched fresh on each app start.
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        userName: state.userName,
        interestCategories: state.interestCategories,
        affirmationFamiliarity: state.affirmationFamiliarity,
        favoriteQuoteIds: state.favoriteQuoteIds,
        notificationSettings: state.notificationSettings,
        pushToken: state.pushToken,
        dailyMood: state.dailyMood,
        widgetSettings: state.widgetSettings
      }),
    }
  )
);