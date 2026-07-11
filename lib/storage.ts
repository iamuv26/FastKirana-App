import { StateStorage } from 'zustand/middleware';

// Pure JavaScript in-memory storage for diagnostics.
// This removes all native module dependencies (MMKV, FileSystem, etc.) to isolate the startup crash.
const store: Record<string, string> = {};

const mmkvStorage: StateStorage = {
  setItem: (name, value) => {
    store[name] = value;
  },
  getItem: (name) => {
    return store[name] || null;
  },
  removeItem: (name) => {
    delete store[name];
  },
};

export { mmkvStorage };
