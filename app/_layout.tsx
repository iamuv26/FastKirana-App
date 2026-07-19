import React, { useEffect, useState } from 'react';
import { Stack, router, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import AnimatedSplashScreen from '../components/shared/AnimatedSplashScreen';
// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});
import { useAuthStore } from '../stores/auth-store';
import { useCartStore } from '../stores/cart-store';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LogBox, View, useWindowDimensions, Pressable } from 'react-native';
import '../global.css';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import {
  useFonts,
  PlusJakartaSans_300Light,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Sun, Moon } from 'lucide-react-native';

// Suppress noisy warnings during development
LogBox.ignoreLogs([
  '[Reanimated] Reading from',
  'SafeAreaView has been deprecated',
  'Linking requires a build-time setting',
  '[Storage] MMKV is not available in this environment',
]);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

import { registerForPushNotificationsAsync, addNotificationResponseListener } from '../lib/push-notifications';
import VariantSelectorDrawer from '../components/product/VariantSelectorDrawer';
import CartConflictDrawer from '../components/product/CartConflictDrawer';
import { useUIStore } from '../stores/ui-store';
import { API_BASE_URL } from '../lib/constants';
import { isWithinOperatingHours, isHoliday } from '../lib/store-hours';
import { usePushSync } from '../hooks/use-push-sync';
import ErrorBoundary from '../components/shared/ErrorBoundary';
console.log('🚀 API_BASE_URL being used by Web App:', API_BASE_URL);



function RootThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View className={`flex-1 bg-surface-100 dark:bg-zinc-950 ${theme === 'dark' ? 'dark' : ''}`}>
      {children}
    </View>
  );
}

function CartSynchronizer() {
  const { isLoggedIn, user } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const isInitialMount = React.useRef(true);
  const [hasInitialSyncCompleted, setHasInitialSyncCompleted] = useState(false);
  const isFetchingServerCart = React.useRef(false);

  // Reset sync complete state if user logs out
  useEffect(() => {
    if (!isLoggedIn) {
      setHasInitialSyncCompleted(false);
    }
  }, [isLoggedIn]);

  // 1. Fetch server cart on login and merge with local cart
  useEffect(() => {
    if (!isLoggedIn || !user || hasInitialSyncCompleted || isFetchingServerCart.current) {
      return;
    }

    isFetchingServerCart.current = true;

    const loadServerCart = async () => {
      try {
        const headers = {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
          'x-user-email': user.email || '',
          'x-user-name': user.name || '',
          'x-user-phone': user.phone || '',
        };

        const response = await fetch(`${API_BASE_URL}/cart`, {
          method: 'GET',
          headers,
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && Array.isArray(data.items)) {
            const serverItems = data.items;
            const localItems = useCartStore.getState().items;

            const mergedMap = new Map();

            // First add server items
            for (const item of serverItems) {
              mergedMap.set(item.product.id, item);
            }

            // Then merge local items
            for (const item of localItems) {
              const existing = mergedMap.get(item.product.id);
              if (existing) {
                const limit = item.product.stock || 99;
                const newQty = Math.min(Math.max(existing.quantity, item.quantity), limit);
                
                mergedMap.set(item.product.id, {
                  ...existing,
                  quantity: newQty,
                  notes: item.notes || existing.notes
                });
              } else {
                mergedMap.set(item.product.id, item);
              }
            }

            const finalItems = Array.from(mergedMap.values());
            useCartStore.setState({ items: finalItems });
            console.log('Mobile: Successfully synced/merged cart from DB:', finalItems.length, 'items');
          }
        }
      } catch (err) {
        console.warn('Failed to load server cart on mobile mount:', err);
      } finally {
        setHasInitialSyncCompleted(true);
        isFetchingServerCart.current = false;
      }
    };

    loadServerCart();
  }, [isLoggedIn, user, hasInitialSyncCompleted]);

  // 2. Sync local cart changes back to DB (debounced)
  useEffect(() => {
    if (!isLoggedIn || !user || !hasInitialSyncCompleted) return;

    const delay = isInitialMount.current ? 800 : 2000;
    isInitialMount.current = false;

    const timer = setTimeout(async () => {
      try {
        const mappedItems = items.map((item) => {
          const isVariant = item.product.id.includes('_');
          const [productId, variantName] = isVariant 
            ? item.product.id.split('_') 
            : [item.product.id, null];

          return {
            productId,
            quantity: item.quantity,
            selectedVariant: variantName,
            notes: item.notes || null
          };
        });

        const headers = {
          'Content-Type': 'application/json',
          'x-user-id': user.id,
          'x-user-role': user.role,
          'x-user-email': user.email || '',
          'x-user-name': user.name || '',
          'x-user-phone': user.phone || '',
        };

        await fetch(`${API_BASE_URL}/cart`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ items: mappedItems }),
        });
      } catch (err) {
        console.warn('Failed to sync cart to database:', err);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [items, isLoggedIn, user, hasInitialSyncCompleted]);

  return null;
}

export default function RootLayout() {
  const { isLoggedIn, user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  // Sync push notifications reactively on login
  usePushSync();

  // Load Plus Jakarta Sans font family
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const [showSplash, setShowSplash] = useState(true);

  // Hide the native static splash screen immediately on mount so only the dynamic animated one is seen!
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    // Request push notification token on startup
    registerForPushNotificationsAsync();

    // Fetch store settings from server to dynamically sync open/closed status
    const syncStoreSettings = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/settings`);
        if (response.ok) {
          const settings = await response.json();
          const groceryOpen = settings.grocery_mart_open === 'true';
          const cafeOpen = settings.cafe_open === 'true';
          const radius = parseFloat(settings.delivery_radius) || 5;
          const storeLat = settings.store_lat ? parseFloat(settings.store_lat) : undefined;
          const storeLng = settings.store_lng ? parseFloat(settings.store_lng) : undefined;
          
          // Operational Controls
          const minOrderValue = settings.min_order_value ? parseInt(settings.min_order_value) : 0;
          const storeOpenHour = settings.store_open_hour ? parseInt(settings.store_open_hour) : 7;
          const storeCloseHour = settings.store_close_hour ? parseInt(settings.store_close_hour) : 23;
          const holidays = settings.holidays ? settings.holidays.split(',').map((h: string) => h.trim()) : [];
          const surgeMultiplier = settings.surge_multiplier ? parseFloat(settings.surge_multiplier) : 1.0;
          const taxRateSetting = settings.tax_rate !== undefined ? parseFloat(settings.tax_rate) : 5;
          const onlyCodSetting = settings.only_cod === 'true';
          const miscFeeSetting = settings.misc_fee !== undefined ? parseFloat(settings.misc_fee) : 0;
          const miscFeeLabelSetting = settings.misc_fee_label || '';
          const deliveryFeeBaseSetting = settings.delivery_fee !== undefined ? parseFloat(settings.delivery_fee) : 25;
          const groceryThresholdSetting = settings.grocery_free_delivery_threshold !== undefined ? parseFloat(settings.grocery_free_delivery_threshold) : 199;
          const cafeThresholdSetting = settings.cafe_free_delivery_threshold !== undefined ? parseFloat(settings.cafe_free_delivery_threshold) : 199;

          // Check store hours auto-close and holiday calendar
          const inHours = isWithinOperatingHours(storeOpenHour, storeCloseHour);
          const onHoliday = isHoliday(holidays);
          
          let finalGroceryOpen = groceryOpen;
          let finalCafeOpen = cafeOpen;
          
          // Bypassed midnight auto-close to allow testing 24/7. Stores close only when manually toggled off.
          if (onHoliday) {
            finalGroceryOpen = false;
            finalCafeOpen = false;
          }

          useUIStore.getState().setStoreStatus(
            finalGroceryOpen, 
            finalCafeOpen, 
            radius, 
            storeLat, 
            storeLng,
            minOrderValue,
            storeOpenHour,
            storeCloseHour,
            holidays,
            surgeMultiplier,
            taxRateSetting,
            onlyCodSetting,
            miscFeeSetting,
            miscFeeLabelSetting,
            deliveryFeeBaseSetting,
            groceryThresholdSetting,
            cafeThresholdSetting
          );
        }
      } catch (err) {
        console.warn('Failed to sync store settings from server:', err);
      }
    };
    
    syncStoreSettings();
    const settingsPoll = setInterval(syncStoreSettings, 60000);

    // Listen for notification responses (user tapping on a notification)
    const responseSubscription = addNotificationResponseListener(response => {
      console.log('[NotificationResponse] User tapped on notification:', response);
      const data = response.notification.request.content.data;
      if (data && typeof data.url === 'string') {
        try {
          router.push(data.url as any);
        } catch (err) {
          console.warn('Failed to route notification URL:', err);
        }
      }
    });

    // Redirect staff members to their console
    let redirectTimer: any = null;
    if (isLoggedIn && user && user.role !== 'USER') {
      redirectTimer = setTimeout(() => {
        if (user.role === 'PICKER') router.replace('/picker');
        else if (user.role === 'CHEF') router.replace(user.email?.toLowerCase().startsWith('restaurant') ? '/restaurant-chef' : '/cafe-chef');
        else if (user.role === 'DELIVERY') router.replace('/rider');
        else router.replace('/operations');
      }, 200);
    }

    return () => {
      clearInterval(settingsPoll);
      if (redirectTimer) clearTimeout(redirectTimer);
      responseSubscription.remove();
    };
  }, [isLoggedIn, user]);

  const pathname = usePathname();
  const isStaffRoute = ['/operations', '/picker', '/chef', '/cafe-chef', '/restaurant-chef', '/rider'].some(path => pathname?.startsWith(path));
  const shouldRestrictWidth = isWide && !isStaffRoute;

  if (!fontsLoaded) {
    // Avoid flashing unstyled text
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="auto" />
          <RootThemeWrapper>
            <ErrorBoundary>
              <View
                style={shouldRestrictWidth ? {
                  maxWidth: 540,
                  width: '100%',
                  height: '100%',
                  alignSelf: 'center',
                  backgroundColor: 'transparent',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 5,
                } : { width: '100%', height: '100%' }}
              >
                <Stack screenOptions={{ 
                  headerShown: false, 
                  gestureEnabled: true, 
                  gestureDirection: 'horizontal', 
                  animation: 'slide_from_right', 
                  animationDuration: 220,
                  headerBackVisible: false 
                }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="cafe" options={{ headerShown: false, animation: 'fade', animationDuration: 200 }} />
                  <Stack.Screen name="cafe-chef" options={{ headerShown: false, animation: 'slide_from_right', animationDuration: 220 }} />
                  <Stack.Screen name="restaurant-chef" options={{ headerShown: false, animation: 'slide_from_right', animationDuration: 220 }} />
                  <Stack.Screen name="product/[slug]" options={{ headerShown: false }} />
                  <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
                  <Stack.Screen name="cart" options={{ headerShown: false, animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="checkout" options={{ headerShown: false }} />
                  <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
                </Stack>
                  <VariantSelectorDrawer />
                  <CartConflictDrawer />
                  <CartSynchronizer />
                  {showSplash && <AnimatedSplashScreen onFinish={() => setShowSplash(false)} />}
               </View>
            </ErrorBoundary>
          </RootThemeWrapper>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
