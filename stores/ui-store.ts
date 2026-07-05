import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/storage';

interface UserCoords {
  lat: number;
  lng: number;
}

interface UIState {
  selectedLocation: string;
  userCoords: UserCoords | null;
  shopName: string;
  shopPhone: string;
  groceryMartOpen: boolean;
  cafeOpen: boolean;
  deliveryRadius: number;
  storeLat: number;
  storeLng: number;
  activeVariantProduct: any | null;
  assignedStoreId: string | null;
  surgeCharge: number;
  // Dynamic Settings Toggles
  minOrderValue: number;
  storeOpenHour: number;
  storeCloseHour: number;
  holidays: string[];
  surgeMultiplier: number;
  setSelectedLocation: (location: string) => void;
  setUserCoords: (coords: UserCoords | null) => void;
  setShopDetails: (name: string, phone: string) => void;
  setStoreStatus: (
    groceryOpen: boolean, 
    cafeOpen: boolean, 
    radius: number, 
    storeLat?: number, 
    storeLng?: number,
    minOrderValue?: number,
    storeOpenHour?: number,
    storeCloseHour?: number,
    holidays?: string[],
    surgeMultiplier?: number
  ) => void;
  setActiveVariantProduct: (product: any | null) => void;
  setAssignedStore: (store: { id: string; name: string; surgeCharge: number; groceryOpen: boolean; cafeOpen: boolean } | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedLocation: 'Select Location',
      userCoords: null,
      shopName: '',
      shopPhone: '',
      groceryMartOpen: true,
      cafeOpen: true,
      deliveryRadius: 5,
      storeLat: 26.1534185,
      storeLng: 80.1714024,
      activeVariantProduct: null,
      assignedStoreId: null,
      surgeCharge: 0.0,
      minOrderValue: 99,
      storeOpenHour: 7,
      storeCloseHour: 23,
      holidays: [],
      surgeMultiplier: 1.0,

      setSelectedLocation: (location) => set({ selectedLocation: location }),
      setUserCoords: (coords) => set({ userCoords: coords }),
      setShopDetails: (name, phone) => set({ shopName: name, shopPhone: phone }),
      setStoreStatus: (
        groceryOpen, 
        cafeOpen, 
        radius, 
        storeLat, 
        storeLng,
        minOrderValue,
        storeOpenHour,
        storeCloseHour,
        holidays,
        surgeMultiplier
      ) => 
        set((state) => {
          // Always keep store open in development mode for testing
          const finalGroceryOpen = __DEV__ ? true : groceryOpen;
          const finalCafeOpen = __DEV__ ? true : cafeOpen;
          const updates: Partial<UIState> = { 
            groceryMartOpen: finalGroceryOpen, 
            cafeOpen: finalCafeOpen, 
            deliveryRadius: radius 
          };
          if (storeLat !== undefined) updates.storeLat = storeLat;
          if (storeLng !== undefined) updates.storeLng = storeLng;
          if (minOrderValue !== undefined) updates.minOrderValue = minOrderValue;
          if (storeOpenHour !== undefined) updates.storeOpenHour = storeOpenHour;
          if (storeCloseHour !== undefined) updates.storeCloseHour = storeCloseHour;
          if (holidays !== undefined) updates.holidays = holidays;
          if (surgeMultiplier !== undefined) updates.surgeMultiplier = surgeMultiplier;
          return updates;
        }),
      setActiveVariantProduct: (product) => set({ activeVariantProduct: product }),
      setAssignedStore: (store) => set({
        assignedStoreId: store ? store.id : null,
        shopName: store ? store.name : 'FastKirana',
        surgeCharge: store ? store.surgeCharge : 0.0,
        groceryMartOpen: store ? store.groceryOpen : true,
        cafeOpen: store ? store.cafeOpen : true
      }),
    }),
    {
      name: 'fastkirana-ui-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
