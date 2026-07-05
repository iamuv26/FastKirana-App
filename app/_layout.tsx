import React, { useEffect } from 'react';
import { Stack, router, usePathname } from 'expo-router';
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

import { registerForPushNotificationsAsync } from '../lib/push-notifications';
import VariantSelectorDrawer from '../components/product/VariantSelectorDrawer';
import { useUIStore } from '../stores/ui-store';
import { API_BASE_URL } from '../lib/constants';
import { isWithinOperatingHours, isHoliday } from '../lib/store-hours';
console.log('🚀 API_BASE_URL being used by Web App:', API_BASE_URL);


function RouteProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(true);
    setProgress(0.1);
    
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 0.9) {
          clearInterval(interval);
          return 0.9;
        }
        return prev + 0.15;
      });
    }, 80);

    const timeout = setTimeout(() => {
      setProgress(1);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 150);
    }, 400);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 99999, backgroundColor: 'transparent' }}>
      <View 
        style={{ 
          height: '100%', 
          backgroundColor: '#e20a22', 
          width: `${progress * 100}%`,
          shadowColor: '#e20a22',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.5,
          shadowRadius: 4,
          elevation: 3
        }} 
      />
    </View>
  );
}



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

  useEffect(() => {
    if (!isLoggedIn || !user) return;

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
  }, [items, isLoggedIn, user]);

  return null;
}

export default function RootLayout() {
  const { isLoggedIn, user } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWide = width > 768;

  // Load Plus Jakarta Sans font family
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

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
          const minOrderValue = settings.min_order_value ? parseInt(settings.min_order_value) : 99;
          const storeOpenHour = settings.store_open_hour ? parseInt(settings.store_open_hour) : 7;
          const storeCloseHour = settings.store_close_hour ? parseInt(settings.store_close_hour) : 23;
          const holidays = settings.holidays ? settings.holidays.split(',').map((h: string) => h.trim()) : [];
          const surgeMultiplier = settings.surge_multiplier ? parseFloat(settings.surge_multiplier) : 1.0;

          // Check store hours auto-close and holiday calendar
          const inHours = isWithinOperatingHours(storeOpenHour, storeCloseHour);
          const onHoliday = isHoliday(holidays);
          
          let finalGroceryOpen = groceryOpen;
          let finalCafeOpen = cafeOpen;
          
          if (!inHours || onHoliday) {
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
            surgeMultiplier
          );
        }
      } catch (err) {
        console.warn('Failed to sync store settings from server:', err);
      }
    };
    
    syncStoreSettings();
    const settingsPoll = setInterval(syncStoreSettings, 10000);

    // Redirect staff members to their console
    let redirectTimer: any = null;
    if (isLoggedIn && user && user.role !== 'USER') {
      redirectTimer = setTimeout(() => {
        if (user.role === 'PICKER') router.replace('/picker');
        else if (user.role === 'CHEF') router.replace('/chef');
        else if (user.role === 'DELIVERY') router.replace('/rider');
        else router.replace('/operations');
      }, 200);
    }

    return () => {
      clearInterval(settingsPoll);
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [isLoggedIn, user]);

  const pathname = usePathname();
  const isStaffRoute = ['/operations', '/picker', '/chef', '/rider'].some(path => pathname?.startsWith(path));
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
          <RouteProgressBar />
          <RootThemeWrapper>
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
              <Stack screenOptions={{ headerShown: false, gestureEnabled: true, animation: 'slide_from_right', headerBackVisible: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="product/[slug]" options={{ headerShown: false }} />
                <Stack.Screen name="category/[slug]" options={{ headerShown: false }} />
                <Stack.Screen name="cart" options={{ presentation: 'modal', headerShown: true, title: 'Your Cart' }} />
                <Stack.Screen name="checkout" options={{ headerShown: true, title: 'Checkout' }} />
                <Stack.Screen name="order/[id]" options={{ headerShown: false }} />
              </Stack>
              <VariantSelectorDrawer />
              <CartSynchronizer />
            </View>
          </RootThemeWrapper>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
