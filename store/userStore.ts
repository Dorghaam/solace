import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Breakup-specific categories (example)
export const breakupInterestCategories = [
  { id: 'healing_heartbreak', label: 'Healing a Broken Heart' }, // General heartbreak
  { id: 'self_love', label: 'Reclaiming Self Love' }, // Post-breakup/loss
  { id: 'letting_go', label: 'Letting Go & Moving On' },
  { id: 'rebuilding_confidence', label: 'Rebuilding My Life' }, // Good for after divorce or significant life change
  { id: 'overcoming_loneliness', label: 'Finding Strength in Solitude' }, // Addresses loneliness
  { id: 'finding_peace', label: 'Discovering Peace After Pain' },
  { id: 'hope_future', label: 'Hope for New Beginnings' },
  { id: 'moving_forward', label: 'Coping with Grief & Loss' }, // Specifically for loss of a partner
] as const;

export type BreakupCategory = typeof breakupInterestCategories[number]['id'];

export interface NotificationSettings {
  frequency: '1x' | '3x' | '5x' | '10x' | 'custom';
  enabled: boolean;
  // customTimes?: string[]; // For later if 'custom' frequency is used
}

export interface TargetQuote {
  id: string;
  text: string;
  category?: string;
}

// Widget Settings
export type WidgetTheme = 'light' | 'dark_text_on_pink' | 'pink_text_on_white'; // From widgetconfig.tsx

export interface WidgetSettings {
  category: BreakupCategory | 'favorites' | 'all';
  theme: WidgetTheme;
}

// ADDED: Interface for DailyMood
export interface DailyMood {
  mood: string;
  emoji: string;
  date: string; // Store date as YYYY-MM-DD string
}

interface UserState {
  hasCompletedOnboarding: boolean;
  userName: string | null;
  affirmationFamiliarity: 'new' | 'occasional' | 'regular' | null;
  interestCategories: BreakupCategory[];
  notificationSettings: NotificationSettings | null;
  pushToken: string | null;
  favoriteQuoteIds: string[];
  widgetSettings: WidgetSettings | {};
  targetQuote: TargetQuote | null; // For navigation from notifications
  dailyMood: DailyMood | null; // ADDED
  supabaseUser: any | null; // Added for supabaseUser field

  setHasCompletedOnboarding: (status: boolean) => void;
  setUserName: (name: string) => void;
  setAffirmationFamiliarity: (familiarity: UserState['affirmationFamiliarity']) => void;
  setInterestCategories: (categories: BreakupCategory[]) => void;
  toggleInterestCategory: (category: BreakupCategory) => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setPushToken: (token: string | null) => void;
  addFavoriteQuoteId: (quoteId: string) => void;
  removeFavoriteQuoteId: (quoteId: string) => void;
  setWidgetSettings: (settings: Partial<WidgetSettings>) => void;
  setTargetQuote: (quote: TargetQuote | null) => void;
  clearTargetQuote: () => void;
  setDailyMood: (moodData: DailyMood | null) => void; // ADDED
  setSupabaseUser: (user: any | null) => void; // ADDED
  resetState: () => void;
}

const initialState = {
  userName: null,
  interestCategories: [],
  affirmationFamiliarity: null,
  notificationSettings: null, // We will refine this default in a later step if needed, but null is fine for the initial reset definition
  favoriteQuoteIds: [],
  widgetSettings: {}, // Or a more defined default like { category: 'all', theme: 'light' } if preferred for initial state, though an empty object is fine for reset purposes if the main store definition handles defaults
  dailyMood: null,
  supabaseUser: null,
  hasCompletedOnboarding: false,
  pushToken: null, // Keep existing field
  targetQuote: null, // Keep existing field
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setHasCompletedOnboarding: (status) => set({ hasCompletedOnboarding: status }),
      setUserName: (name) => set({ userName: name }),
      setAffirmationFamiliarity: (familiarity) => set({ affirmationFamiliarity: familiarity }),
      setInterestCategories: (categories) => set({ interestCategories: categories }),
      toggleInterestCategory: (category) => set((state) => {
        const newCategories = state.interestCategories.includes(category)
          ? state.interestCategories.filter(c => c !== category)
          : [...state.interestCategories, category];
        return { interestCategories: newCategories };
      }),
      setNotificationSettings: (settings) => set((state) => ({
        notificationSettings: state.notificationSettings 
          ? { ...state.notificationSettings, ...settings }
          : { frequency: '3x', enabled: false, ...settings } as NotificationSettings
      })),
      setPushToken: (token) => set({ pushToken: token }),
      addFavoriteQuoteId: (quoteId) =>
        set((state) => ({
          favoriteQuoteIds: state.favoriteQuoteIds.includes(quoteId)
            ? state.favoriteQuoteIds
            : [...state.favoriteQuoteIds, quoteId],
        })),
      removeFavoriteQuoteId: (quoteId) =>
        set((state) => ({ favoriteQuoteIds: state.favoriteQuoteIds.filter((id) => id !== quoteId) })),
      setWidgetSettings: (settings) =>
        set((state) => ({ widgetSettings: { ...state.widgetSettings, ...settings } })),
      setTargetQuote: (quote) => set({ targetQuote: quote }),
      clearTargetQuote: () => set({ targetQuote: null }),
      setDailyMood: (moodData) => set({ dailyMood: moodData }), // ADDED
      setSupabaseUser: (user) => set({ supabaseUser: user }),
      resetState: () => {
        console.log('Store: Resetting state to initial values (Checklist Pattern).');
        set(initialState); // Reset all data fields to initial values
      },
    }),
    {
      name: 'solace-user-store-v1', // Unique name for storage, version if schema changes
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        console.log('Store rehydrated:', state);
        // Validate the rehydrated state and fix any inconsistencies
        if (state) {
          // If hasCompletedOnboarding is true but userName is missing, reset onboarding
          if (state.hasCompletedOnboarding && !state.userName) {
            console.log('Inconsistent state detected: onboarding completed but no userName. Resetting onboarding state.');
            state.hasCompletedOnboarding = false;
          }
          
          // Ensure all required fields have default values
          if (!state.notificationSettings) {
            state.notificationSettings = { frequency: '3x', enabled: false };
          }
          if (!state.widgetSettings) {
            state.widgetSettings = { category: 'all', theme: 'light' };
          }
          if (!Array.isArray(state.favoriteQuoteIds)) {
            state.favoriteQuoteIds = [];
          }
          if (!Array.isArray(state.interestCategories)) {
            state.interestCategories = [];
          }
        }
      },
    }
  )
); 