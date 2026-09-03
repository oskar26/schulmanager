/**
 * Speicher-Abstraktion.
 * Zugangsdaten und Tokens landen in `expo-secure-store` (Keychain / Keystore),
 * alles andere in AsyncStorage. Im Web fällt SecureStore auf localStorage zurück —
 * dort steht auch ein Hinweis in der App.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SECURE_PREFIX = 'schulflow.secure.';

const webSecureFallback = {
  async getItem(key: string) {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(SECURE_PREFIX + key);
  },
  async setItem(key: string, value: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(SECURE_PREFIX + key, value);
  },
  async removeItem(key: string) {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(SECURE_PREFIX + key);
  },
};

export const secureStorage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return webSecureFallback.getItem(key);
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') return webSecureFallback.setItem(key, value);
    try {
      await SecureStore.setItemAsync(key, value, {
        keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch {
      /* ignoriert – dann bleibt der Nutzer eben angemeldet-los */
    }
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === 'web') return webSecureFallback.removeItem(key);
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      /* ignore */
    }
  },
};

export const storage = {
  async getJSON<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  },
  async setJSON(key: string, value: unknown): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore */
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

export const KEYS = {
  credentials: 'credentials', // { email, password } – nur SecureStore
  session: 'session', // { jwt, device } – nur SecureStore
  settings: 'schulflow.settings',
  snapshot: 'schulflow.snapshot',
  homeworkDone: 'schulflow.homework.done',
  notificationState: 'schulflow.notifications.state',
  widgetLayout: 'schulflow.widgets',
  widgetSnapshot: 'schulflow.widgets.snapshot', // JSON für Home-Screen-Widgets (s. widgets/spec.md)
} as const;
