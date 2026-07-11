import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, StyleSheet, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { Image } from 'expo-image';
import { ArrowLeft, ShoppingCart, Tag, Trash2, ArrowRight, Clock, ShieldCheck, RefreshCw, Sparkles, CheckCircle2, KeyRound } from 'lucide-react-native';
import { useCart } from '../hooks/use-cart';
import { formatPrice } from '../lib/utils';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, GROCERY_FREE_DELIVERY_THRESHOLD, CAFE_FREE_DELIVERY_THRESHOLD, COMBINED_FREE_DELIVERY_THRESHOLD, TAX_RATE, API_BASE_URL } from '../lib/constants';
import { useUIStore } from '../stores/ui-store';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from './context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../lib/haptic';
import { toast } from '../lib/toast';
import Animated, { FadeInRight, FadeOutLeft, LinearTransition } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const MOCK_CHEAP_PRODUCTS: any[] = [];

export default function CartScreen() {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    addItem,
    getSubtotal, 
    getMrpTotal, 
    getSavings,
    updateItemNotes
  } = useCart();

  const { user, isLoggedIn } = useAuthStore();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const groceryMartOpen = useUIStore((s) => s.groceryMartOpen);
  const cafeOpen = useUIStore((s) => s.cafeOpen);

  const [couponCode, setCouponCode] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);

  // Suggestions state
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);

  const subtotal = getSubtotal();
  const mrpTotal = getMrpTotal();
  const itemDiscount = getSavings();

  const getAuthHeaders = (): Record<string, string> => {
    if (!user) return {};
    return {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-role': user.role,
      'x-user-email': user.email || '',
      'x-user-name': user.name || '',
      'x-user-phone': user.phone || '',
    };
  };

  useEffect(() => {
    let active = true;
    const fetchSuggestions = async () => {
      setIsSuggestionsLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/products?limit=500`);
        const data = await res.json();
        if (active && data && data.products) {
          // Filter cheap products under ₹30, isAvailable is true, and stock > 0
          const cheapProducts = data.products.filter((p: any) => 
            p.price <= 30 && 
            p.stock > 0 && 
            p.isAvailable !== false
          );
          setSuggestions(cheapProducts);
        }
      } catch (err) {
        console.error('Failed to fetch add-on suggestions:', err);
      } finally {
        if (active) setIsSuggestionsLoading(false);
      }
    };

    fetchSuggestions();
    return () => {
      active = false;
    };
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsCouponLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/coupons/validate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ code: couponCode, subtotal }),
      });
      const data = await res.json();
      if (!res.ok) {
        toastError(data.error || 'Failed to apply coupon');
      } else {
        setAppliedCoupon({
          code: data.coupon.code,
          discountAmount: data.coupon.discountAmount,
        });
        toastSuccess(`Coupon "${data.coupon.code}" applied! Saved ${formatPrice(data.coupon.discountAmount)}`);
      }
    } catch (err) {
      toastError('Failed to validate coupon code');
    } finally {
      setIsCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toastSuccess('Coupon removed');
  };

  const promoDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;

  // Split items
  const isCafeProduct = (product: any) => 
    product.category?.slug === 'cafe' || product.tags?.includes('cafe');

  const groceryItems = useMemo(() => items.filter(item => !isCafeProduct(item.product)), [items]);
  const cafeItems = useMemo(() => items.filter(item => isCafeProduct(item.product)), [items]);

  const grocerySubtotal = useMemo(() => 
    groceryItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [groceryItems]);
  
  const cafeSubtotal = useMemo(() => 
    cafeItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cafeItems]);

  let deliveryFee = 0;
  if (groceryItems.length > 0 && cafeItems.length === 0) {
    deliveryFee = grocerySubtotal >= GROCERY_FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  } else if (cafeItems.length > 0 && groceryItems.length === 0) {
    deliveryFee = cafeSubtotal >= CAFE_FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  } else if (groceryItems.length > 0 && cafeItems.length > 0) {
    deliveryFee = subtotal >= COMBINED_FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  }

  const taxes = Math.round((subtotal - promoDiscount) * TAX_RATE);
  const totalPayable = (subtotal - promoDiscount) + deliveryFee + taxes;

  const hasInventoryIssues = useMemo(() => items.some(
    (item) => item.quantity > item.product.stock || item.product.stock <= 0 || item.product.isAvailable === false
  ), [items]);

  const hasClosedGroceryItems = groceryItems.length > 0 && !groceryMartOpen && !__DEV__;
  const hasClosedCafeItems = cafeItems.length > 0 && !cafeOpen && !__DEV__;
  const isCheckoutBlocked = hasClosedGroceryItems || hasClosedCafeItems || hasInventoryIssues;

  const handleAutoAdjust = () => {
    let adjustedCount = 0;
    items.forEach((item) => {
      if (item.product.isAvailable === false || item.product.stock <= 0) {
        removeItem(item.product.id, item.product.name);
        adjustedCount++;
      } else if (item.quantity > item.product.stock) {
        updateQuantity(item.product.id, item.product.name, item.product.stock);
        adjustedCount++;
      }
    });
    if (adjustedCount > 0) {
      toastSuccess(`Adjusted ${adjustedCount} item(s) to match stock!`);
    }
  };

  const toastSuccess = (msg: string) => {
    toast.success(msg);
  };

  const toastError = (msg: string) => {
    toast.error(msg);
  };

  const handleCheckoutRedirect = () => {
    if (!isLoggedIn) {
      triggerHaptic('warning');
      setShowLoginModal(true);
      return;
    }
    
    if (isCheckoutBlocked) {
      if (hasInventoryIssues) {
        Alert.alert('Inventory Issue', 'Please adjust quantities to match available stock.');
      } else {
        Alert.alert('Store Closed', 'Some items belong to a store that is currently closed.');
      }
      return;
    }
    router.push('/checkout');
  };

  // Compute cheap suggestions
  const cheapSuggestions = useMemo(() => {
    const pool = suggestions.length > 0 ? suggestions : MOCK_CHEAP_PRODUCTS;
    return pool.filter(p => !items.some(item => item.product.id === p.id));
  }, [suggestions, items]);

  const showSuggestions = deliveryFee > 0;

  const renderItemRow = (item: typeof items[0]) => {
    const isCafe = isCafeProduct(item.product);
    const isStoreClosed = isCafe ? !cafeOpen : !groceryMartOpen;
    const isOOS = item.product.stock <= 0 || item.product.isAvailable === false;
    const isExceeded = item.quantity > item.product.stock && !isOOS;

    return (
      <Animated.View 
        key={item.product.id} 
        entering={FadeInRight.duration(200)} 
        exiting={FadeOutLeft.duration(200)}
        layout={LinearTransition.springify()}
        className="py-3 border-b border-slate-100 dark:border-zinc-800 last:border-b-0"
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1 pr-4">
            <Text className={`text-slate-800 dark:text-zinc-100 font-extrabold text-sm leading-5 ${isOOS ? 'text-slate-400 line-through' : ''}`}>
              {item.product.name}
            </Text>
            <Text className="text-slate-400 dark:text-zinc-400 text-xs font-semibold mt-0.5">{item.product.unit}</Text>
            <View className="flex-row items-baseline gap-1.5 mt-1">
              <Text className="text-slate-800 dark:text-zinc-200 font-black text-sm">{formatPrice(item.product.price)}</Text>
              {item.product.mrp > item.product.price && (
                <Text className="text-slate-400 dark:text-zinc-500 line-through text-[10px]">{formatPrice(item.product.mrp)}</Text>
              )}
            </View>
          </View>

          <View className="flex-row items-center gap-2">
            <Pressable 
              onPress={() => { triggerHaptic('medium'); removeItem(item.product.id, item.product.name); }}
              className="p-1.5 rounded-lg bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 active:bg-slate-200"
            >
              <Trash2 size={14} color="#ef4444" />
            </Pressable>

            <View className="flex-row items-center border border-slate-200 dark:border-zinc-700 rounded-lg p-0.5 bg-slate-50 dark:bg-zinc-800">
              <Pressable 
                onPress={() => { triggerHaptic('light'); updateQuantity(item.product.id, item.product.name, item.quantity - 1); }}
                className="px-2.5 py-1"
              >
                <Text className="text-slate-700 dark:text-zinc-300 font-bold text-base">-</Text>
              </Pressable>
              <Text className="px-2 text-slate-800 dark:text-zinc-100 font-black text-sm">{item.quantity}</Text>
              <Pressable 
                onPress={() => { triggerHaptic('light'); updateQuantity(item.product.id, item.product.name, item.quantity + 1); }}
                disabled={isStoreClosed || item.quantity >= item.product.stock}
                className="px-2.5 py-1"
              >
                <Text className={`text-slate-700 dark:text-zinc-300 font-bold text-base ${isStoreClosed || item.quantity >= item.product.stock ? 'text-slate-300 dark:text-zinc-650' : ''}`}>+</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {isOOS && (
          <View className="mt-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-2 rounded-lg">
            <Text className="text-[10px] font-bold text-rose-600 dark:text-rose-400">❌ Out of stock — please remove to checkout.</Text>
          </View>
        )}
        {isExceeded && (
          <View className="mt-2 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/50 p-2 rounded-lg">
            <Text className="text-[10px] font-bold text-amber-650 dark:text-amber-400">⚠️ Only {item.product.stock} units available in stock.</Text>
          </View>
        )}
        {isCafe && (
          <View className="mt-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-2 rounded-xl">
            <TextInput
              value={item.notes || ''}
              onChangeText={(text) => updateItemNotes(item.product.id, text)}
              placeholder="Cooking instructions (e.g., less sugar, extra spicy)..."
              placeholderTextColor={theme === 'dark' ? '#71717a' : '#94a3b8'}
              className="text-[10px] text-slate-800 dark:text-zinc-100 font-bold p-0"
            />
          </View>
        )}
      </Animated.View>
    );
  };

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Stack.Screen options={{ headerShown: false }} />
        {/* Header */}
        <View className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex-row items-center gap-3">
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }}
            className="w-8 h-8 rounded-full items-center justify-center bg-slate-50 dark:bg-zinc-800"
          >
            <ArrowLeft size={18} color={isDarkMode ? '#ffffff' : '#0f172a'} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-slate-850 dark:text-zinc-100 font-black text-base">Review Cart Items</Text>
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-8">
          {/* Animated/Glowing Cart Icon */}
          <View className="w-24 h-24 rounded-full bg-slate-50 dark:bg-zinc-900 border border-slate-105 dark:border-zinc-800 items-center justify-center mb-6 shadow-xs relative">
            <View className="absolute inset-0 rounded-full bg-rose-500/5" style={{ opacity: 0.1 }} />
            <ShoppingCart size={40} color="#e20a22" strokeWidth={2} />
          </View>

          <Text className="text-slate-800 dark:text-zinc-100 font-black text-lg text-center">
            Your Cart is Empty
          </Text>
          <Text className="text-slate-400 dark:text-zinc-450 text-[11px] font-medium text-center mt-2 leading-5 max-w-xs">
            Add items to get started! Choose from fresh farm produce, groceries, snacks, and freshly cooked meals.
          </Text>

          <Pressable
            onPress={() => {
              triggerHaptic('medium');
              router.replace('/(tabs)');
            }}
            style={({ pressed }) => [
              {
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
            className="mt-8 bg-rose-600 active:bg-rose-700 px-8 py-3.5 rounded-2xl shadow-sm"
          >
            <Text className="text-white font-black text-xs uppercase tracking-wider">
              Start Shopping
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View 
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          backgroundColor: 'transparent',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          overflow: 'hidden'
        }}
      >
        <BlurView 
          intensity={95}
          tint={isDarkMode ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
        <Pressable 
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
            zIndex: 10
          }}
        >
          <ArrowLeft size={18} color={isDarkMode ? '#ffffff' : '#0f172a'} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-slate-850 dark:text-zinc-100 font-black text-base">Review Cart Items</Text>
          <Text className="text-slate-400 dark:text-zinc-400 text-[10px] font-bold mt-0.5">{items.length} item(s) selected</Text>
        </View>
        
        {hasInventoryIssues && (
          <Pressable 
            onPress={handleAutoAdjust}
            className="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1.5 rounded-xl active:bg-indigo-100"
          >
            <Text className="text-indigo-650 dark:text-indigo-300 font-extrabold text-[9px] uppercase">🪄 Auto-Adjust</Text>
          </Pressable>
        )}
      </View>

      <ScrollView className="flex-1 px-4 py-3" contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        {/* Closed store alerts */}
        {hasClosedGroceryItems && (
          <View className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl mb-3 flex-row gap-3 items-start">
            <Text className="text-lg">💤</Text>
            <View className="flex-1">
              <Text className="text-amber-800 dark:text-amber-300 font-black text-xs">Grocery Mart Closed</Text>
              <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-bold mt-0.5 leading-4">
                Our Grocery Mart is currently closed (6 AM - 12 AM). Please remove groceries to proceed with Cafe items.
              </Text>
            </View>
          </View>
        )}
        {hasClosedCafeItems && (
          <View className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl mb-3 flex-row gap-3 items-start">
            <Text className="text-lg">☕</Text>
            <View className="flex-1">
              <Text className="text-amber-800 dark:text-amber-300 font-black text-xs">Cafe Kitchen Closed</Text>
              <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-bold mt-0.5 leading-4">
                Our Cafe Kitchen is currently closed (6 AM - 12 AM). Please remove Cafe items to proceed with groceries.
              </Text>
            </View>
          </View>
        )}

        {/* Free Delivery Progress Header */}
        {groceryItems.length > 0 && cafeItems.length > 0 ? (
          subtotal < COMBINED_FREE_DELIVERY_THRESHOLD ? (
            <View className="bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/30 p-3.5 rounded-2xl mb-4">
              <Text className="text-indigo-700 dark:text-indigo-350 text-[11px] font-black">
                🛍️ Add {formatPrice(COMBINED_FREE_DELIVERY_THRESHOLD - subtotal)} more for FREE delivery (Combined order over ₹300)
              </Text>
              <View style={{ height: 6, width: '100%', backgroundColor: theme === 'dark' ? '#27272a' : '#e2e8f0', borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#e20a22', '#f97316', '#10b981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: '100%', width: `${Math.min(subtotal / COMBINED_FREE_DELIVERY_THRESHOLD, 1) * 100}%`, borderRadius: 99 }}
                />
              </View>
            </View>
          ) : (
            <View className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/30 p-3.5 rounded-2xl mb-4">
              <Text className="text-emerald-700 dark:text-emerald-355 text-[11px] font-black text-center">
                🎉 FREE Combined Delivery unlocked!
              </Text>
            </View>
          )
        ) : groceryItems.length > 0 ? (
          grocerySubtotal < GROCERY_FREE_DELIVERY_THRESHOLD ? (
            <View className="bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/30 p-3.5 rounded-2xl mb-4">
              <Text className="text-rose-700 dark:text-rose-350 text-[11px] font-black">
                📦 Add {formatPrice(GROCERY_FREE_DELIVERY_THRESHOLD - grocerySubtotal)} more of groceries for FREE delivery (Over ₹199)
              </Text>
              <View style={{ height: 6, width: '100%', backgroundColor: theme === 'dark' ? '#27272a' : '#e2e8f0', borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#e20a22', '#f97316', '#10b981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: '100%', width: `${Math.min(grocerySubtotal / GROCERY_FREE_DELIVERY_THRESHOLD, 1) * 100}%`, borderRadius: 99 }}
                />
              </View>
            </View>
          ) : (
            <View className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/30 p-3.5 rounded-2xl mb-4">
              <Text className="text-emerald-700 dark:text-emerald-355 text-[11px] font-black text-center">
                🎉 FREE Grocery delivery unlocked!
              </Text>
            </View>
          )
        ) : cafeItems.length > 0 ? (
          cafeSubtotal < CAFE_FREE_DELIVERY_THRESHOLD ? (
            <View className="bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/30 p-3.5 rounded-2xl mb-4">
              <Text className="text-rose-700 dark:text-rose-350 text-[11px] font-black">
                ☕ Add {formatPrice(CAFE_FREE_DELIVERY_THRESHOLD - cafeSubtotal)} more from Cafe for FREE delivery (Over ₹199)
              </Text>
              <View style={{ height: 6, width: '100%', backgroundColor: theme === 'dark' ? '#27272a' : '#e2e8f0', borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#e20a22', '#f97316', '#10b981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: '100%', width: `${Math.min(cafeSubtotal / CAFE_FREE_DELIVERY_THRESHOLD, 1) * 100}%`, borderRadius: 99 }}
                />
              </View>
            </View>
          ) : (
            <View className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/30 p-3.5 rounded-2xl mb-4">
              <Text className="text-emerald-700 dark:text-emerald-355 text-[11px] font-black text-center">
                🎉 FREE Cafe delivery unlocked!
              </Text>
            </View>
          )
        ) : null}

        {/* Smart Cart Add-on Suggestions Carousel */}
        {showSuggestions && cheapSuggestions.length > 0 && (
          <View className="mb-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 shadow-sm">
            <View className="flex-row items-center gap-1.5 mb-1">
              <Sparkles size={13} color="#f43f5e" />
              <Text className="text-slate-855 dark:text-zinc-105 font-black text-xs uppercase tracking-wider">
                Add-on suggestions under ₹30
              </Text>
            </View>
            <Text className="text-slate-400 dark:text-zinc-400 text-[9.5px] font-bold mb-3">
              {groceryItems.length > 0 && cafeItems.length > 0
                ? `Add items worth ${formatPrice(COMBINED_FREE_DELIVERY_THRESHOLD - subtotal)} more for FREE Combined Delivery`
                : groceryItems.length > 0
                ? `Add items worth ${formatPrice(GROCERY_FREE_DELIVERY_THRESHOLD - grocerySubtotal)} more for FREE Grocery Delivery`
                : `Add items worth ${formatPrice(CAFE_FREE_DELIVERY_THRESHOLD - cafeSubtotal)} more for FREE Cafe Delivery`}
            </Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row py-1">
              {cheapSuggestions.map((product) => {
                const isCafe = isCafeProduct(product);
                const isStoreClosed = isCafe ? !cafeOpen : !groceryMartOpen;

                return (
                  <View 
                    key={product.id} 
                    className="mr-3 bg-slate-50/50 dark:bg-zinc-900/40 border border-slate-100/60 dark:border-zinc-800/40 p-3 rounded-2xl w-[135px] flex-col justify-between"
                  >
                    <View>
                      {/* Product image */}
                      <View className="h-16 w-16 bg-white dark:bg-zinc-800 rounded-xl items-center justify-center self-center mb-2 overflow-hidden border border-slate-100 dark:border-zinc-700">
                        {product.imageUrl ? (
                          <Image 
                            source={
                              product.imageUrl.startsWith('/')
                                ? { uri: `${API_BASE_URL.replace('/api', '')}${product.imageUrl}` }
                                : { uri: product.imageUrl }
                            }
                            className="h-full w-full"
                            contentFit="contain"
                          />
                        ) : (
                          <Text className="text-xl">📦</Text>
                        )}
                      </View>
                      <Text 
                        className="text-zinc-800 dark:text-zinc-200 font-extrabold text-[10.5px] leading-4"
                        numberOfLines={2}
                      >
                        {product.name}
                      </Text>
                      <Text className="text-zinc-400 dark:text-zinc-450 text-[8.5px] font-semibold mt-0.5">
                        {product.unit}
                      </Text>
                    </View>

                    <View className="flex-row items-center justify-between mt-2.5 pt-1.5 border-t border-slate-100 dark:border-zinc-800">
                      <View className="flex-col">
                        <Text className="text-zinc-800 dark:text-zinc-100 font-black text-xs">
                          {formatPrice(product.price)}
                        </Text>
                        {product.mrp > product.price && (
                          <Text className="text-zinc-400 dark:text-zinc-500 line-through text-[9px]">
                            {formatPrice(product.mrp)}
                          </Text>
                        )}
                      </View>

                      <Pressable
                        onPress={() => {
                          triggerHaptic('light');
                          addItem({
                            id: product.id,
                            name: product.name,
                            slug: product.slug,
                            mrp: product.mrp,
                            price: product.price,
                            discount: product.discount || 0,
                            unit: product.unit,
                            stock: product.stock,
                            imageUrl: product.imageUrl,
                            category: product.category,
                            tags: product.tags,
                          });
                        }}
                        disabled={isStoreClosed}
                        style={({ pressed }) => [{ transform: [{ scale: pressed ? 0.95 : 1 }] }]}
                        className={`px-2.5 py-1.5 rounded-lg border ${
                          isStoreClosed 
                            ? 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700' 
                            : 'bg-white dark:bg-zinc-800 border-emerald-600 dark:border-emerald-500'
                        }`}
                      >
                        <Text className={`font-black text-[9px] uppercase ${isStoreClosed ? 'text-zinc-400' : 'text-emerald-650 dark:text-emerald-400'}`}>
                          {isStoreClosed ? 'Closed' : '+ Add'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Grocery items splitting */}
        {groceryItems.length > 0 && (
          <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 mb-4">
            <View className="border-b border-slate-100 dark:border-zinc-800 pb-2 mb-2">
              <Text className="text-slate-800 dark:text-zinc-100 font-black text-sm">📦 Grocery & Essentials</Text>
              <Text className="text-slate-400 dark:text-zinc-400 text-[9px] font-bold mt-0.5">Delivered from Dark Store</Text>
            </View>

            <View>{groceryItems.map(renderItemRow)}</View>
          </View>
        )}

        {/* Cafe items splitting */}
        {cafeItems.length > 0 && (
          <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 mb-4">
            <View className="border-b border-slate-100 dark:border-zinc-800 pb-2 mb-2">
              <Text className="text-rose-600 dark:text-rose-400 font-black text-sm">☕ FastKirana Cafe</Text>
              <Text className="text-slate-400 dark:text-zinc-400 text-[9px] font-bold mt-0.5">Piping hot food & drinks from Cafe Kitchen</Text>
            </View>

            <View>{cafeItems.map(renderItemRow)}</View>
          </View>
        )}



        {/* Coupon code block */}
        <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 mb-4">
          <Text className="text-slate-800 dark:text-zinc-100 font-black text-sm mb-3">Apply Promo Coupon</Text>
          {appliedCoupon ? (
            <View className="flex-row items-center justify-between border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl">
              <View>
                <Text className="text-emerald-700 dark:text-emerald-300 font-black text-xs bg-emerald-100 dark:bg-emerald-900/50 px-2 py-0.5 rounded self-start">
                  {appliedCoupon.code}
                </Text>
                <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold mt-1">Saved {formatPrice(appliedCoupon.discountAmount)}</Text>
              </View>
              <Pressable 
                onPress={handleRemoveCoupon}
                className="bg-rose-600/10 border border-rose-500/20 px-3 py-1.5 rounded-lg active:bg-rose-600/20"
              >
                <Text className="text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase">Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View className="flex-row gap-2">
              <TextInput
                placeholder="e.g. WELCOME50"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                value={couponCode}
                onChangeText={setCouponCode}
                className="flex-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-slate-800 dark:text-zinc-100 font-bold text-xs"
              />
              <Pressable 
                onPress={handleApplyCoupon}
                disabled={isCouponLoading || !couponCode.trim()}
                className={`px-4 py-2.5 rounded-xl items-center justify-center ${
                  isCouponLoading || !couponCode.trim() ? 'bg-slate-200 dark:bg-zinc-800' : 'bg-rose-600 active:bg-rose-700'
                }`}
              >
                {isCouponLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-extrabold text-xs uppercase">Apply</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Pricing break-down list */}
        <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100/50 dark:border-zinc-800/40 p-4 mb-10 shadow-xs">
          <Text className="text-slate-800 dark:text-zinc-100 font-black text-base mb-3 pb-2">Bill Summary</Text>
          
          {/* Savings Banner */}
          {(itemDiscount + promoDiscount) > 0 && (
            <LinearGradient
              colors={theme === 'dark' ? ['rgba(16,185,129,0.15)', 'rgba(5,150,105,0.03)'] : ['#f0fdf4', '#ecfdf5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: theme === 'dark' ? 'rgba(16,185,129,0.3)' : '#bbf7d0',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 16 }}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: theme === 'dark' ? '#34d399' : '#15803d' }}>
                  YAY! Saving {formatPrice(itemDiscount + promoDiscount)} on this order!
                </Text>
                <Text style={{ fontSize: 9, fontWeight: '600', color: theme === 'dark' ? '#10b981' : '#16a34a', marginTop: 1 }}>
                  Includes products discount & promo savings
                </Text>
              </View>
            </LinearGradient>
          )}

          <View className="flex-row justify-between py-1.5">
            <Text className="text-slate-500 dark:text-zinc-400 text-sm font-semibold">Item Total (MRP)</Text>
            <Text className="text-slate-800 dark:text-zinc-200 text-sm font-bold">{formatPrice(mrpTotal)}</Text>
          </View>

          {itemDiscount > 0 && (
            <View className="flex-row justify-between py-1.5">
              <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">Product Discount</Text>
              <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">-{formatPrice(itemDiscount)}</Text>
            </View>
          )}

          {appliedCoupon && (
            <View className="flex-row justify-between py-1.5">
              <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">Coupon Discount</Text>
              <Text className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">-{formatPrice(promoDiscount)}</Text>
            </View>
          )}
          
          <View className="flex-row justify-between py-1.5">
            <Text className="text-slate-500 dark:text-zinc-400 text-sm font-semibold">Delivery Fee</Text>
            <Text className={`text-sm font-bold ${deliveryFee === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-zinc-200'}`}>
              {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
            </Text>
          </View>

          <View className="flex-row justify-between py-1.5">
            <Text className="text-slate-500 dark:text-zinc-400 text-sm font-semibold">GST Tax (5%)</Text>
            <Text className="text-slate-800 dark:text-zinc-200 text-sm font-bold">{formatPrice(taxes)}</Text>
          </View>

          {/* Monospace receipt dashed separator */}
          <View 
            style={{ 
              borderStyle: 'dashed', 
              borderWidth: 0.6, 
              borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0', 
              marginVertical: 10, 
              height: 1, 
              width: '100%',
              borderRadius: 1,
            }} 
          />

          <View className="flex-row justify-between py-2">
            <Text className="text-slate-800 dark:text-zinc-100 font-black text-base">To Pay</Text>
            <Text className="text-rose-600 dark:text-rose-400 font-black text-base">{formatPrice(totalPayable)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom bar */}
      <View className="bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 px-4 py-3.5 flex-row justify-between items-center shadow-lg">
        <View>
          <Text className="text-slate-400 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Total Bill</Text>
          <Text className="text-slate-800 dark:text-zinc-100 font-black text-lg">{formatPrice(totalPayable)}</Text>
        </View>
        
        <Pressable 
          onPress={() => { triggerHaptic('medium'); handleCheckoutRedirect(); }}
          disabled={isCheckoutBlocked}
          className={`px-6 py-3.5 rounded-xl flex-row items-center gap-1.5 shadow-xs ${
            isCheckoutBlocked ? 'bg-slate-300 dark:bg-zinc-700' : 'bg-rose-600 active:bg-rose-700'
          }`}
        >
          <Text className="text-white font-extrabold text-sm">
            {isCheckoutBlocked 
              ? hasInventoryIssues 
                ? 'Fix Inventory Issues' 
                : 'Store Closed' 
              : 'Proceed to Checkout'}
          </Text>
          <ArrowRight size={16} color="#fff" />
        </Pressable>
      </View>
      {/* Premium Login Required Modal */}
      <Modal
        visible={showLoginModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoginModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          {Platform.OS !== 'web' ? (
            <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
          ) : null}
          
          <Animated.View 
            entering={FadeInRight.duration(300)}
            className="w-full max-w-[340px] bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-6 items-center shadow-2xl"
          >
            {/* Golden Key Badge wrapper */}
            <View className="w-16 h-16 rounded-full bg-amber-55/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 items-center justify-center mb-4">
              <KeyRound size={28} color="#d97706" strokeWidth={2.5} />
            </View>

            <Text className="text-slate-800 dark:text-zinc-100 font-black text-lg text-center mb-2">
              Login Required
            </Text>
            
            <Text className="text-slate-500 dark:text-zinc-400 text-xs font-semibold text-center leading-relaxed mb-6 px-2">
              Please log in or sign up to proceed to checkout and place your order.
            </Text>

            {/* Action buttons */}
            <View className="w-full gap-3">
              <Pressable
                onPress={() => {
                  setShowLoginModal(false);
                  triggerHaptic('light');
                  router.push('/(auth)/login');
                }}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.97 : 1 }]
                })}
                className="w-full py-3.5 bg-rose-600 rounded-2xl items-center justify-center shadow-xs"
              >
                <Text className="text-white font-extrabold text-xs uppercase tracking-wider">Log In / Sign Up</Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setShowLoginModal(false);
                  triggerHaptic('light');
                }}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.97 : 1 }]
                })}
                className="w-full py-3.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200/50 dark:border-zinc-700/50 rounded-2xl items-center justify-center"
              >
                <Text className="text-slate-600 dark:text-zinc-350 font-bold text-xs uppercase tracking-wider">Cancel</Text>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
