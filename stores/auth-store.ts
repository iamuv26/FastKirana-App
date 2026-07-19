import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/storage';

export interface User {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: 'USER' | 'PICKER' | 'CHEF' | 'DELIVERY' | 'ADMIN';
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      setAuth: (token, user) => set({ token, user, isLoggedIn: true }),
      logout: () => {
        try {
          const { useCartStore } = require('./cart-store');
          useCartStore.getState().clearCart();
        } catch (e) {
          console.warn('Failed to clear cart on logout:', e);
        }
        set({ token: null, user: null, isLoggedIn: false });
      },
    }),
    {
      name: 'fastkirana-auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
