import { StateStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const mmkvStorage: StateStorage = {
  setItem: async (name, value) => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.setItem(name, value);
        return;
      } catch (e) {}
    }
    try {
      await AsyncStorage.setItem(name, value);
    } catch (e) {
      console.warn(`Failed to save ${name} to AsyncStorage:`, e);
    }
  },
  getItem: async (name) => {
    if (Platform.OS === 'web') {
      try {
        return window.localStorage.getItem(name) ?? null;
      } catch (e) {
        return null;
      }
    }
    try {
      return await AsyncStorage.getItem(name);
    } catch (e) {
      console.warn(`Failed to read ${name} from AsyncStorage:`, e);
      return null;
    }
  },
  removeItem: async (name) => {
    if (Platform.OS === 'web') {
      try {
        window.localStorage.removeItem(name);
        return;
      } catch (e) {}
    }
    try {
      await AsyncStorage.removeItem(name);
    } catch (e) {
      console.warn(`Failed to remove ${name} from AsyncStorage:`, e);
    }
  },
};

export { mmkvStorage };
