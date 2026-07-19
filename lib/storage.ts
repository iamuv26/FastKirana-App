import { StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const memoryCache: Record<string, string> = {};
let isHydrated = false;

// Hydrate memory cache on mobile startup
const hydrate = async () => {
  if (Platform.OS === 'web') {
    isHydrated = true;
    return;
  }
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([key, val]) => {
      if (val !== null) {
        memoryCache[key] = val;
      }
    });
  } catch (e) {
    console.warn('Failed to hydrate memory storage cache:', e);
  } finally {
    isHydrated = true;
  }
};

hydrate().catch(() => {});

const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(name, value);
        return;
      } catch (e) {}
    }
    memoryCache[name] = value;
    AsyncStorage.setItem(name, value).catch(() => {});
  },
  getItem: (name) => {
    if (Platform.OS === 'web') {
      try {
        return window.localStorage.getItem(name) ?? null;
      } catch (e) {
        return null;
      }
    }
    return memoryCache[name] ?? null;
  },
  removeItem: (name) => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem(name);
        return;
      } catch (e) {}
    }
    delete memoryCache[name];
    AsyncStorage.removeItem(name).catch(() => {});
  },
};

export { mmkvStorage };
