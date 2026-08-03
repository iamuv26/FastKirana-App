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
  isLocationConfirmed: boolean;
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
  pendingConflictProduct: any | null;
  // Dynamic Settings Toggles
  minOrderValue: number;
  storeOpenHour: number;
  storeCloseHour: number;
  holidays: string[];
  surgeMultiplier: number;
  taxRate: number;
  onlyCod: boolean;
  miscFee: number;
  miscFeeLabel: string;
  deliveryFeeBase: number;
  groceryFreeDeliveryThreshold: number;
  cafeFreeDeliveryThreshold: number;
  isTabBarVisible: boolean;
  setTabBarVisible: (visible: boolean) => void;
  setSelectedLocation: (location: string) => void;
  setUserCoords: (coords: UserCoords | null) => void;
  setLocationConfirmed: (confirmed: boolean) => void;
  setShopDetails: (name: string, phone: string) => void;
  setStoreStatus: (
    groceryOpen: boolean, 
    radius: number, 
    storeLat?: number, 
    storeLng?: number,
    minOrderValue?: number,
    storeOpenHour?: number,
    storeCloseHour?: number,
    holidays?: string[],
    surgeMultiplier?: number,
    taxRate?: number,
    onlyCod?: boolean,
    miscFee?: number,
    miscFeeLabel?: string,
    deliveryFeeBase?: number,
    groceryFreeDeliveryThreshold?: number,
    cafeOpen?: boolean,
    cafeFreeDeliveryThreshold?: number
  ) => void;
  setActiveVariantProduct: (product: any | null) => void;
  setPendingConflictProduct: (product: any | null) => void;
  setAssignedStore: (store: { id: string; name: string; surgeCharge: number; groceryOpen: boolean } | null) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      selectedLocation: 'Ghatampur Market, Kanpur',
      userCoords: { lat: 26.1534185, lng: 80.1714024 },
      isLocationConfirmed: false,
      shopName: 'Ghatampur',
      shopPhone: '',
      groceryMartOpen: true,
      cafeOpen: true,
      deliveryRadius: 5,
      storeLat: 26.1534185,
      storeLng: 80.1714024,
      activeVariantProduct: null,
      pendingConflictProduct: null,
      assignedStoreId: 'default-Ghatampur Market',
      surgeCharge: 0.0,
      minOrderValue: 0,
      storeOpenHour: 7,
      storeCloseHour: 23,
      holidays: [],
      surgeMultiplier: 1.0,
      taxRate: 5,
      onlyCod: false,
      miscFee: 0,
      miscFeeLabel: '',
      deliveryFeeBase: 25,
      groceryFreeDeliveryThreshold: 199,
      cafeFreeDeliveryThreshold: 199,
      isTabBarVisible: true,

      setTabBarVisible: (visible) => set({ isTabBarVisible: visible }),
      setSelectedLocation: (location) => set({ selectedLocation: location }),
      setUserCoords: (coords) => set({ userCoords: coords }),
      setLocationConfirmed: (confirmed) => set({ isLocationConfirmed: confirmed }),
      setShopDetails: (name, phone) => set({ shopName: name, shopPhone: phone }),
      setStoreStatus: (
        groceryOpen, 
        radius, 
        storeLat, 
        storeLng,
        minOrderValue,
        storeOpenHour,
        storeCloseHour,
        holidays,
        surgeMultiplier,
        taxRate,
        onlyCod,
        miscFee,
        miscFeeLabel,
        deliveryFeeBase,
        groceryFreeDeliveryThreshold
      ) => 
        set((state) => {
          const finalGroceryOpen = groceryOpen;
          const updates: Partial<UIState> = { 
            groceryMartOpen: finalGroceryOpen, 
            deliveryRadius: radius 
          };
          if (storeLat !== undefined) updates.storeLat = storeLat;
          if (storeLng !== undefined) updates.storeLng = storeLng;
          if (minOrderValue !== undefined) updates.minOrderValue = minOrderValue;
          if (storeOpenHour !== undefined) updates.storeOpenHour = storeOpenHour;
          if (storeCloseHour !== undefined) updates.storeCloseHour = storeCloseHour;
          if (holidays !== undefined) updates.holidays = holidays;
          if (surgeMultiplier !== undefined) updates.surgeMultiplier = surgeMultiplier;
          if (taxRate !== undefined) updates.taxRate = taxRate;
          if (onlyCod !== undefined) updates.onlyCod = onlyCod;
          if (miscFee !== undefined) updates.miscFee = miscFee;
          if (miscFeeLabel !== undefined) updates.miscFeeLabel = miscFeeLabel;
          if (deliveryFeeBase !== undefined) updates.deliveryFeeBase = deliveryFeeBase;
          if (groceryFreeDeliveryThreshold !== undefined) updates.groceryFreeDeliveryThreshold = groceryFreeDeliveryThreshold;

          return updates;
        }),
      setActiveVariantProduct: (product) => set({ activeVariantProduct: product }),
      setPendingConflictProduct: (product) => set({ pendingConflictProduct: product }),
      setAssignedStore: (store) => set({
        assignedStoreId: store ? store.id : null,
        shopName: store ? store.name : 'FastKirana',
        surgeCharge: store ? store.surgeCharge : 0.0,
        groceryMartOpen: store ? (store.groceryOpen ?? true) : true
      }),
    }),
    {
      name: 'fastkirana-ui-storage',
      storage: createJSONStorage(() => mmkvStorage),
      merge: (persistedState: any, currentState) => {
        if (!persistedState) return currentState;
        
        let mergedStoreId = persistedState.assignedStoreId;
        let mergedShopName = persistedState.shopName;
        let mergedLocation = persistedState.selectedLocation;
        let mergedCoords = persistedState.userCoords;

        // Force migrate old/empty store details to Ghatampur
        if (!mergedStoreId || mergedStoreId === 'default-swaroop-nagar' || mergedStoreId === 'ghatampur') {
          mergedStoreId = 'default-Ghatampur Market';
          mergedShopName = 'Ghatampur';
          if (!mergedLocation || mergedLocation === 'Select Location' || mergedLocation.includes('Swaroop Nagar')) {
            mergedLocation = 'Ghatampur Market, Kanpur';
            mergedCoords = { lat: 26.1534185, lng: 80.1714024 };
          }
        }

        return {
          ...currentState,
          ...persistedState,
          assignedStoreId: mergedStoreId,
          shopName: mergedShopName,
          selectedLocation: mergedLocation,
          userCoords: mergedCoords,
          isLocationConfirmed: typeof persistedState.isLocationConfirmed === 'boolean' ? persistedState.isLocationConfirmed : currentState.isLocationConfirmed,
          storeLat: typeof persistedState.storeLat === 'number' ? persistedState.storeLat : currentState.storeLat,
          storeLng: typeof persistedState.storeLng === 'number' ? persistedState.storeLng : currentState.storeLng,
          deliveryRadius: typeof persistedState.deliveryRadius === 'number' ? persistedState.deliveryRadius : currentState.deliveryRadius,
          minOrderValue: typeof persistedState.minOrderValue === 'number' ? persistedState.minOrderValue : currentState.minOrderValue,
          surgeMultiplier: typeof persistedState.surgeMultiplier === 'number' ? persistedState.surgeMultiplier : currentState.surgeMultiplier,
          storeOpenHour: typeof persistedState.storeOpenHour === 'number' ? persistedState.storeOpenHour : currentState.storeOpenHour,
          storeCloseHour: typeof persistedState.storeCloseHour === 'number' ? persistedState.storeCloseHour : currentState.storeCloseHour,
          miscFee: typeof persistedState.miscFee === 'number' ? persistedState.miscFee : currentState.miscFee,
          miscFeeLabel: typeof persistedState.miscFeeLabel === 'string' ? persistedState.miscFeeLabel : currentState.miscFeeLabel,
          deliveryFeeBase: typeof persistedState.deliveryFeeBase === 'number' ? persistedState.deliveryFeeBase : currentState.deliveryFeeBase,
          groceryFreeDeliveryThreshold: typeof persistedState.groceryFreeDeliveryThreshold === 'number' ? persistedState.groceryFreeDeliveryThreshold : currentState.groceryFreeDeliveryThreshold,

        };
      }
    }
  )
);
