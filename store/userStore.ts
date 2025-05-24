import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage, persist } from 'zustand/middleware';

// Breakup-specific categories (example)
export const breakupInterestCategories = [
  { id: 'self_love', label: 'Self-Love Post-Breakup' },
  { id: 'healing_heartbreak', label: 'Healing Heartbreak' },
  { id: 'letting_go', label: 'Letting Go' },
  { id: 'rebuilding_confidence', label: 'Rebuilding Confidence' },
  { id: 'overcoming_loneliness', label: 'Overcoming Loneliness' },
  { id: 'finding_peace', label: 'Finding Peace' },
  { id: 'moving_forward', label: 'Moving Forward'},
  { id: 'hope_future', label: 'Hope for the Future' },
] as const;

export type BreakupCategory = typeof breakupInterestCategories[number]['id'];

export interface NotificationSettings {
  frequency: '1x' | '3x' | '5x' | 'custom';
  enabled: boolean;
  // customTimes?: string[]; // For later if 'custom' frequency is used
}

interface UserState {
  hasCompletedOnboarding: boolean;
  userName: string | null;
  affirmationFamiliarity: 'new' | 'occasional' | 'regular' | null;
  interestCategories: BreakupCategory[];
  notificationSettings: NotificationSettings;
  pushToken: string | null;

  setHasCompletedOnboarding: (status: boolean) => void;
  setUserName: (name: string) => void;
  setAffirmationFamiliarity: (familiarity: UserState['affirmationFamiliarity']) => void;
  setInterestCategories: (categories: BreakupCategory[]) => void;
  toggleInterestCategory: (category: BreakupCategory) => void;
  setNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  setPushToken: (token: string | null) => void;
  resetState: () => void;
}

const initialState: Omit<UserState, 'setHasCompletedOnboarding' | 'setUserName' | 'setAffirmationFamiliarity' | 'setInterestCategories' | 'toggleInterestCategory' | 'setNotificationSettings' | 'setPushToken' | 'resetState'> = {
  hasCompletedOnboarding: false,
  userName: null,
  affirmationFamiliarity: null,
  interestCategories: [],
  notificationSettings: { frequency: '3x', enabled: false },
  pushToken: null,
};

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
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
      resetState: () => set(initialState),
    }),
    {
      name: 'solace-user-store-v1', // Unique name for storage, version if schema changes
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 