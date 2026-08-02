import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/storage';

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  mrp: number;
  price: number;
  discount: number;
  unit: string;
  stock: number;
  isAvailable?: boolean;
  restaurantId?: string | null;
  restaurantName?: string | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    parentId: string | null;
    sortOrder: number;
  } | null;
  tags?: string[];
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
  notes?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: CartProduct) => void;
  replaceCartWithProduct: (product: CartProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemQuantity: (productId: string) => number;
  getTotalItems: () => number;
  getSubtotal: () => number;
  getMrpTotal: () => number;
  getSavings: () => number;
  getCartRestaurantId: () => string | null;
  getCartRestaurantName: () => string | null;
  updateCartProduct: (productId: string, updates: Partial<CartProduct>) => void;
  updateItemNotes: (productId: string, notes: string) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: CartProduct) => {
        const isOOS = product.isAvailable === false || (product.isAvailable !== true && product.stock !== undefined && product.stock !== null && product.stock <= 0);
        if (isOOS) return;
        const effectiveStock = (product.isAvailable === true && (product.stock === undefined || product.stock === null || product.stock <= 0)) ? 999 : (product.stock ?? 999);
        set((state) => {
          const existing = state.items.find((item) => item.product.id === product.id);
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.product.id === product.id
                  ? { ...item, quantity: Math.min(item.quantity + 1, effectiveStock) }
                  : item
              ),
            };
          }
          return { items: [...state.items, { product, quantity: 1 }] };
        });
      },

      replaceCartWithProduct: (product: CartProduct) => {
        const isOOS = product.isAvailable === false || (product.isAvailable !== true && product.stock !== undefined && product.stock !== null && product.stock <= 0);
        if (isOOS) return;
        set({ items: [{ product, quantity: 1 }] });
      },

      getCartRestaurantId: () => {
        const item = get().items.find((i) => !!i.product.restaurantId);
        return item?.product.restaurantId || null;
      },

      getCartRestaurantName: () => {
        const item = get().items.find((i) => !!i.product.restaurantName);
        return item?.product.restaurantName || null;
      },

      removeItem: (productId: string) => {
        set((state) => ({
          items: state.items.filter((item) => item.product.id !== productId),
        }));
      },

      updateQuantity: (productId: string, quantity: number) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.product.id !== productId) };
          }
          return {
            items: state.items.map((item) => {
              if (item.product.id === productId) {
                const effectiveStock = (item.product.isAvailable === true && (item.product.stock === undefined || item.product.stock === null || item.product.stock <= 0)) ? 999 : (item.product.stock ?? 999);
                return { ...item, quantity: Math.min(quantity, effectiveStock) };
              }
              return item;
            }),
          };
        });
      },

      clearCart: () => set({ items: [] }),

      getItemQuantity: (productId: string) => {
        const item = get().items.find((i) => i.product.id === productId);
        return item?.quantity || 0;
      },

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getSubtotal: () => {
        return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
      },

      getMrpTotal: () => {
        return get().items.reduce((sum, item) => sum + item.product.mrp * item.quantity, 0);
      },

      getSavings: () => {
        const state = get();
        return state.getMrpTotal() - state.getSubtotal();
      },

      updateCartProduct: (productId: string, updates: Partial<CartProduct>) => {
        set((state) => ({
          items: state.items
            .map((item) => {
              if (item.product.id !== productId) return item;
              const newProduct = { ...item.product, ...updates };
              let newQty = item.quantity;
              if (updates.stock !== undefined && newQty > updates.stock) {
                newQty = updates.stock;
              }
              return {
                product: newProduct,
                quantity: newQty,
              };
            })
            .filter((item) => {
              if (item.product.id === productId) {
                return item.quantity > 0 && updates.isAvailable !== false;
              }
              return item.quantity > 0;
            }),
        }));
      },
      updateItemNotes: (productId: string, notes: string) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.product.id === productId ? { ...item, notes } : item
          ),
        }));
      },
    }),
    {
      name: 'fastkirana-cart-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
