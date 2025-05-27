import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Breakup-specific categories (example)
export const breakupInterestCategories = [
  { id: 'healing_heart', label: 'Healing a Broken Heart' }, // General heartbreak
  { id: 'self_love_after_loss', label: 'Reclaiming Self Love' }, // Post-breakup/loss
  { id: 'letting_go_moving_on', label: 'Letting Go & Moving On' },
  { id: 'rebuilding_my_life', label: 'Rebuilding My Life' }, // Good for after divorce or significant life change
  { id: 'finding_strength_alone', label: 'Finding Strength in Solitude' }, // Addresses loneliness
  { id: 'peace_after_pain', label: 'Discovering Peace After Pain' },
  { id: 'hope_for_new_beginnings', label: 'Hope for New Beginnings' },
  { id: 'coping_with_grief', label: 'Coping with Grief & Loss' }, // Specifically for loss of a partner
  { id: 'navigating_change', label: 'Navigating Change & Uncertainty' }, // General, but very relevant
  { id: 'forgiveness_closure', label: 'Forgiveness & Finding Closure' }
] as const;

export type BreakupCategory = typeof breakupInterestCategories[number]['id'];

export interface NotificationSettings {
  frequency: '1x' | '3x' | '5x' | 'custom';
  enabled: boolean;
  // customTimes?: string[]; // For later if 'custom' frequency is used
}

// Widget Settings
export type WidgetTheme = 'light' | 'dark_text_on_pink' | 'pink_text_on_white'; // From widgetconfig.tsx

export interface WidgetSettings {
  category: BreakupCategory | 'favorites' | 'all';
  theme: WidgetTheme;
}

interface UserState {
  hasCompletedOnboarding: boolean;
  userName: string | null;
  affirmationFamiliarity: 'new' | 'occasional' | 'regular' | null;
  interestCategories: BreakupCategory[];
  notificationSettings: NotificationSettings;
  pushToken: string | null;
  favoriteQuoteIds: string[];
  widgetSettings: WidgetSettings;

  setHasCompletedOnboarding: (status: boolean) => void;
  setUserName: (name: string) => void;
  setAffirmationFamiliarity: (familiarity: UserState['affirmationFamiliarity']) => void;
  setInterestCategories: (categories: BreakupCategory[]) => void;
  toggleInterestCategory: (category: BreakupCategory) => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setPushToken: (token: string | null) => void;
  addFavoriteQuoteId: (quoteId: string) => void;
  removeFavoriteQuoteId: (quoteId: string) => void;
  // isQuoteFavorite: (quoteId: string) => boolean; // Selector can be derived in component
  setWidgetSettings: (settings: Partial<WidgetSettings>) => void;
  resetState: () => void;
}

const initialState: Omit<UserState, 'setHasCompletedOnboarding' | 'setUserName' | 'setAffirmationFamiliarity' | 'setInterestCategories' | 'toggleInterestCategory' | 'setNotificationSettings' | 'setPushToken' | 'addFavoriteQuoteId' | 'removeFavoriteQuoteId' | 'setWidgetSettings' | 'resetState'> = {
  hasCompletedOnboarding: false,
  userName: null,
  affirmationFamiliarity: null,
  interestCategories: [],
  notificationSettings: { frequency: '3x', enabled: false },
  pushToken: null,
  favoriteQuoteIds: [],
  widgetSettings: { // Default widget settings
    category: 'all',
    theme: 'light',
  },
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
        notificationSettings: { ...state.notificationSettings, ...settings }
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
      // isQuoteFavorite can be derived in components: favoriteQuoteIds.includes(id)
      setWidgetSettings: (settings) =>
        set((state) => ({ widgetSettings: { ...state.widgetSettings, ...settings } })),
      resetState: () => set(initialState),
    }),
    {
      name: 'solace-user-store-v1', // Unique name for storage, version if schema changes
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 