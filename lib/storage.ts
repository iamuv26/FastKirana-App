import { StateStorage } from 'zustand/middleware';

import AsyncStorage from '@react-native-async-storage/async-storage';

const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    return AsyncStorage.setItem(name, value);
  },
  getItem: async (name) => {
    const value = await AsyncStorage.getItem(name);
    return value ?? null;
  },
  removeItem: (name) => {
    return AsyncStorage.removeItem(name);
  },
};

export { mmkvStorage };
