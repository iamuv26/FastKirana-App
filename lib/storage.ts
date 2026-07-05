import { StateStorage } from 'zustand/middleware';

let mmkvStorage: StateStorage;

try {
  // Use dynamic require so it does not fail parsing in environments where package isn't linked
  const { createMMKV } = require('react-native-mmkv');
  const storage = createMMKV();
  
  mmkvStorage = {
    setItem: (name, value) => storage.set(name, value),
    getItem: (name) => {
      try {
        return storage.getString(name) ?? null;
      } catch (e) {
        return null;
      }
    },
    removeItem: (name) => storage.remove(name),
  };
  console.log('[Storage] MMKV Storage initialized successfully');
} catch (e) {
  console.warn('[Storage] MMKV is not available in this environment (e.g. Expo Go). Falling back to in-memory storage.');
  
  // High-fidelity local memory storage fallback for Expo Go compatibility
  const memoryMap = new Map<string, string>();
  mmkvStorage = {
    setItem: (name, value) => {
      memoryMap.set(name, value);
    },
    getItem: (name) => {
      return memoryMap.get(name) ?? null;
    },
    removeItem: (name) => {
      memoryMap.delete(name);
    },
  };
}

export { mmkvStorage };
