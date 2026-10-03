import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface TokenStorage {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
}

// Native: Keychain/Keystore via expo-secure-store (never AsyncStorage for secrets).
const native: TokenStorage = {
  get: (k) => SecureStore.getItemAsync(k),
  set: (k, v) => SecureStore.setItemAsync(k, v),
  remove: (k) => SecureStore.deleteItemAsync(k),
};
// Web has no secure store. sessionStorage is dev-preview only.
// TODO(supabase): on web use httpOnly, Secure, SameSite cookies set by the server.
const ss = () => (globalThis as any).sessionStorage as Storage | undefined;
const web: TokenStorage = {
  get: async (k) => ss()?.getItem(k) ?? null,
  set: async (k, v) => { ss()?.setItem(k, v); },
  remove: async (k) => { ss()?.removeItem(k); },
};
export const tokenStorage: TokenStorage = Platform.OS === 'web' ? web : native;
