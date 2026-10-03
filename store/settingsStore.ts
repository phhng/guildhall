import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Mode } from '@/theme/tokens';

// Non-secret preferences only. Tokens live in services/secureStorage.
interface SettingsState { theme: Mode; gamification: boolean; notifications: boolean; set: (p: Partial<Omit<SettingsState, 'set'>>) => void }
export const useSettings = create<SettingsState>()(
  persist((set) => ({ theme: 'dark', gamification: true, notifications: true, set: (p) => set(p) }), {
    name: 'guildhall-settings',
    storage: createJSONStorage(() => AsyncStorage),
  }),
);
