import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, StyleSheet, Modal, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';
import { useState, useMemo, useEffect } from 'react';
import { Image } from 'expo-image';
import { ArrowLeft, ShoppingCart, Tag, Trash2, ArrowRight, Clock, ShieldCheck, RefreshCw, Sparkles, CheckCircle2, KeyRound } from 'lucide-react-native';
import { useCart } from '../hooks/use-cart';
import { formatPrice, getAppImageSource } from '../lib/utils';
import { DELIVERY_FEE, FREE_DELIVERY_THRESHOLD, GROCERY_FREE_DELIVERY_THRESHOLD, CAFE_FREE_DELIVERY_THRESHOLD, TAX_RATE, API_BASE_URL } from '../lib/constants';
import { useUIStore } from '../stores/ui-store';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from './context/ThemeContext';
import { ScalePressable } from '../components/shared/ScalePressable';
import { useQuery } from '@tanstack/react-query';
import { THEME } from '../lib/theme';

import { queryKeys } from '../lib/query-keys';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../lib/haptic';
import { toast } from '../lib/toast';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const MOCK_CHEAP_PRODUCTS: any[] = [];

const RECOMMENDATION_MAP: Record<string, string[]> = {
  'bread': ['milk', 'butter', 'jam', 'egg', 'cheese'],
  'pav': ['butter', 'paneer', 'tea', 'chai'],
  'bun': ['butter', 'tea', 'chai'],
  'milk': ['bread', 'rusk', 'cornflakes', 'egg', 'sugar'],
  'dahi': ['boondi', 'masala', 'salt'],
  'curd': ['boondi', 'masala', 'salt'],
  'paneer': ['butter', 'masala', 'onion', 'tomato'],
  'butter': ['bread', 'pav', 'egg', 'paneer'],
  'tea': ['biscuit', 'sugar', 'milk', 'rusk', 'samosa'],
  'chai': ['biscuit', 'sugar', 'milk', 'rusk', 'samosa'],
  'coffee': ['milk', 'sugar', 'cookies'],
  'pepsi': ['chips', 'namkeen', 'burger', 'french fries'],
  'coke': ['chips', 'namkeen', 'burger', 'french fries'],
  'sprite': ['chips', 'namkeen', 'burger'],
  'cold drink': ['chips', 'namkeen', 'popcorn'],
  'lays': ['cola', 'pepsi', 'sprite', 'cold drink'],
  'chips': ['cola', 'pepsi', 'sprite', 'cold drink'],
  'kurkure': ['cola', 'pepsi', 'sprite'],
  'namkeen': ['tea', 'chai', 'cold drink'],
  'biscuit': ['tea', 'chai', 'milk', 'coffee'],
  'cookie': ['milk', 'coffee'],
  'burger': ['french fries', 'coke', 'pepsi', 'cold drink'],
  'pizza': ['coke', 'pepsi', 'garlic bread'],
  'fries': ['burger', 'coke', 'pepsi', 'ketchup'],
  'french fries': ['burger', 'coke', 'pepsi', 'ketchup'],
  'samosa': ['tea', 'chai', 'ketchup'],
  'roll': ['coke', 'pepsi'],
  'noodle': ['ketchup', 'sauce'],
  'maggi': ['ketchup', 'cheese', 'butter'],
  'maggie': ['ketchup', 'cheese', 'butter'],
};

export default function CartScreen() {
  const { 
    items, 
    updateQuantity, 
    removeItem, 
    addItem,
    getSubtotal, 
    getMrpTotal, 
    getSavings,
    updateItemNotes,
    updateCartProduct
  } = useCart();

  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuthStore();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const groceryMartOpen = useUIStore((s) => s.groceryMartOpen);
  const cafeOpen = useUIStore((s) => s.cafeOpen);
  const taxRate = useUIStore((s) => s.taxRate);
  const miscFee = useUIStore((s) => s.miscFee || 0);
  const miscFeeLabel = useUIStore((s) => s.miscFeeLabel || 'Handling Charge');
  const deliveryFeeBase = useUIStore((s) => s.deliveryFeeBase || 25);
  const groceryFreeDeliveryThreshold = useUIStore((s) => s.groceryFreeDeliveryThreshold || 199);
  const cafeFreeDeliveryThreshold = useUIStore((s) => s.cafeFreeDeliveryThreshold || 199);

  const [couponCode, setCouponCode] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountAmount: number;
  } | null>(null);
  const [isCouponLoading, setIsCouponLoading] = useState(false);

  // Suggestions state variables removed (migrated to useQuery)

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

  const { data: allProducts = [], isLoading: isSuggestionsLoading } = useQuery<any[]>({
    queryKey: queryKeys.products.list(),
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/products?limit=500`);
      const data = await res.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
  });

  const suggestions = useMemo(() => {
    const getProductType = (p: any): 'RESTAURANT' | 'CAFE' | 'BYPASS' | 'GROCERY' => {
      const slug = p.category?.slug || p.categorySlug || '';
      const tags = p.tags || [];
      if (slug === 'restaurant' || tags.includes('restaurant')) return 'RESTAURANT';
      if (slug === 'ice-cream' || slug === 'beverages' || tags.includes('ice-cream') || tags.includes('beverages')) return 'BYPASS';
      if (slug === 'cafe' || tags.includes('cafe')) return 'CAFE';
      return 'GROCERY';
    };

    const areTypesCompatible = (t1: string, t2: string): boolean => {
      if (t1 === t2) return true;
      if (t1 === 'BYPASS' && (t2 === 'CAFE' || t2 === 'GROCERY')) return true;
      if (t2 === 'BYPASS' && (t1 === 'CAFE' || t1 === 'GROCERY')) return true;
      return false;
    };

    const cartSegment = items.length > 0 ? getProductType(items[0].product) : null;

    // Filter compatible products first
    const compatible = allProducts.filter((p: any) => {
      if (p.stock <= 0 || p.isAvailable === false) return false;
      if (cartSegment) {
        return areTypesCompatible(getProductType(p), cartSegment);
      }
      return true;
    });

    // 1. Gather all keywords from cart items
    const cartKeywords = new Set<string>();
    items.forEach(item => {
      const nameLower = item.product.name.toLowerCase();
      // Add product tags to keywords
      if (item.product.tags) {
        item.product.tags.forEach((tag: string) => cartKeywords.add(tag.toLowerCase()));
      }
      // Tokenize the name
      nameLower.split(/\s+/).forEach(word => {
        const cleaned = word.replace(/[^a-z0-9]/g, '');
        if (cleaned.length > 2) cartKeywords.add(cleaned);
      });
    });

    // 2. Map keywords to recommended item tags
    const targetRecommendations = new Set<string>();
    cartKeywords.forEach(kw => {
      Object.entries(RECOMMENDATION_MAP).forEach(([key, values]) => {
        if (kw.includes(key) || key.includes(kw)) {
          values.forEach(v => targetRecommendations.add(v));
        }
      });
    });

    // If we have recommended tags, score each product based on matches
    if (targetRecommendations.size > 0) {
      const scored = compatible.map(p => {
        let score = 0;
        const nameLower = p.name.toLowerCase();
        const pTags = (p.tags || []).map((t: string) => t.toLowerCase());

        targetRecommendations.forEach(rec => {
          // If name matches the recommendation (e.g. contains 'butter')
          if (nameLower.includes(rec)) {
            score += 10;
          }
          // If tags match the recommendation
          if (pTags.includes(rec)) {
            score += 5;
          }
        });
        return { product: p, score };
      });

      // Sort by score desc, filter out score === 0 (or keep some cheap fallbacks)
      const sorted = scored
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(x => x.product);

      if (sorted.length > 0) {
        return sorted;
      }
    }

    // Default cheap fallback if no correlations match
    return compatible.filter((p: any) => p.price <= 60);
  }, [allProducts, items]);

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
  const isCafeProduct = (product: any) => {
    const categorySlug = product.category?.slug || product.categorySlug;
    return (
      categorySlug === 'cafe' || 
      categorySlug === 'restaurant' ||
      product.tags?.includes('cafe') || 
      product.tags?.includes('restaurant')
    );
  };

  const groceryItems = useMemo(() => items.filter(item => !isCafeProduct(item.product)), [items]);
  const cafeItems = useMemo(() => items.filter(item => isCafeProduct(item.product)), [items]);

  const grocerySubtotal = useMemo(() => 
    groceryItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [groceryItems]);

  const cafeSubtotal = useMemo(() => 
    cafeItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cafeItems]);

  let deliveryFee = 0;
  if (cafeItems.length > 0) {
    deliveryFee = cafeSubtotal >= cafeFreeDeliveryThreshold ? 0 : deliveryFeeBase;
  } else {
    deliveryFee = grocerySubtotal >= groceryFreeDeliveryThreshold ? 0 : deliveryFeeBase;
  }

  const taxes = Math.round((subtotal - promoDiscount) * (taxRate / 100));
  const totalPayable = (subtotal - promoDiscount) + deliveryFee + taxes + miscFee;

  // Real-time Background Cart Stock & Price Sync
  useEffect(() => {
    const syncCartWithDatabase = async () => {
      if (items.length === 0) return;
      try {
        const response = await fetch(`${API_BASE_URL}/products/validate-cart`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items })
        });
        if (response.ok) {
          const validateData = await response.json();
          if (validateData.hasChanges && validateData.updates?.length > 0) {
            let adjustedCount = 0;
            validateData.updates.forEach((update: any) => {
              if (update.type === 'OUT_OF_STOCK') {
                removeItem(update.productId, update.name || 'Item');
                adjustedCount++;
              } else if (update.type === 'QUANTITY_CAP') {
                updateQuantity(update.productId, update.name || 'Item', update.newVal);
                adjustedCount++;
              } else if (update.type === 'PRICE_UPDATE') {
                updateCartProduct(update.productId, { price: update.newVal });
                adjustedCount++;
              } else if (update.type === 'MRP_UPDATE') {
                updateCartProduct(update.productId, { mrp: update.newVal });
                adjustedCount++;
              }
            });
            if (adjustedCount > 0) {
              toast.info('🛒 Cart adjusted to match live stock & pricing!');
            }
          }
        }
      } catch (err) {
        console.warn('Background database sync check failed:', err);
      }
    };
    syncCartWithDatabase();
  }, []);

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
    const activeColor = isCafe ? '#ea580c' : '#e20a22';

    return (
      <View 
        key={item.product.id} 
        style={{
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            {/* Veg/Non-Veg Dot for Cafe items */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {isCafe && (
                <View style={{
                  width: 12,
                  height: 12,
                  borderWidth: 1,
                  borderColor: item.product.tags?.includes('non-veg') ? '#b91c1c' : '#16a34a',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 6,
                  borderRadius: 2,
                }}>
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: item.product.tags?.includes('non-veg') ? '#b91c1c' : '#16a34a',
                  }} />
                </View>
              )}
              <Text 
                style={{
                  color: isDarkMode ? '#f4f4f5' : '#0f172a',
                  fontWeight: '800',
                  fontSize: 14,
                  lineHeight: 20,
                  textDecorationLine: isOOS ? 'line-through' : 'none',
                }}
              >
                {item.product.name}
              </Text>
            </View>
            <Text style={{ color: isDarkMode ? '#71717a' : '#64748b', fontSize: 11, fontWeight: '600', marginTop: 2 }}>
              {item.product.unit}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <Text style={{ color: isDarkMode ? '#fafafa' : '#0f172a', fontWeight: '900', fontSize: 14 }}>
                {formatPrice(item.product.price)}
              </Text>
              {item.product.mrp > item.product.price && (
                <Text style={{ color: isDarkMode ? '#52525b' : '#94a3b8', fontSize: 11, textDecorationLine: 'line-through' }}>
                  {formatPrice(item.product.mrp)}
                </Text>
              )}
            </View>
          </View>

          {/* Clean counter control */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1.2,
            borderColor: isDarkMode ? '#3f3f46' : '#cbd5e1',
            borderRadius: 10,
            backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
            height: 32,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          }}>
            <Pressable 
              onPress={() => { 
                triggerHaptic('light'); 
                if (item.quantity === 1) {
                  removeItem(item.product.id, item.product.name);
                } else {
                  updateQuantity(item.product.id, item.product.name, item.quantity - 1);
                }
              }}
              style={{ paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'center', alignItems: 'center' }}
            >
              {item.quantity === 1 ? (
                <Trash2 size={13} color="#ef4444" strokeWidth={2.2} />
              ) : (
                <Text style={{ color: activeColor, fontWeight: '900', fontSize: 15 }}>-</Text>
              )}
            </Pressable>
            <Text style={{ width: 22, textAlign: 'center', color: isDarkMode ? '#fafafa' : '#0f172a', fontWeight: '900', fontSize: 13 }}>
              {item.quantity}
            </Text>
            <Pressable 
              onPress={() => { 
                triggerHaptic('light'); 
                updateQuantity(item.product.id, item.product.name, item.quantity + 1); 
              }}
              disabled={isStoreClosed || item.quantity >= item.product.stock}
              style={{ paddingHorizontal: 10, paddingVertical: 6, justifyContent: 'center', alignItems: 'center' }}
            >
              <Text style={{ 
                color: isStoreClosed || item.quantity >= item.product.stock 
                  ? (isDarkMode ? '#3f3f46' : '#e2e8f0') 
                  : activeColor, 
                fontWeight: '900', 
                fontSize: 15 
              }}>+</Text>
            </Pressable>
          </View>
        </View>

        {isOOS && (
          <View style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(239, 68, 68, 0.08)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)', borderRadius: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#ef4444' }}>❌ Out of stock — please remove to checkout.</Text>
          </View>
        )}
        {isExceeded && (
          <View style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: 'rgba(245, 158, 11, 0.08)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.2)', borderRadius: 8 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#d97706' }}>⚠️ Only {item.product.stock} units available in stock.</Text>
          </View>
        )}
        {isCafe && (
          <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: isDarkMode ? '#1e1e24' : '#f8fafc', borderStyle: 'dashed', borderWidth: 1, borderColor: isDarkMode ? '#3f3f46' : '#cbd5e1', borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={11} color={isDarkMode ? '#71717a' : '#94a3b8'} />
            <TextInput
              value={item.notes || ''}
              onChangeText={(text) => updateItemNotes(item.product.id, text)}
              placeholder="Cooking instructions (e.g., less sugar, extra spicy)..."
              placeholderTextColor={isDarkMode ? '#71717a' : '#94a3b8'}
              style={{
                flex: 1,
                fontSize: 11,
                fontWeight: '700',
                color: isDarkMode ? '#fafafa' : '#475569',
                padding: 0,
              }}
            />
          </View>
        )}
      </View>
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
                Our Grocery Mart is currently closed (6 AM - 12 AM). Please remove groceries to proceed with Food items.
              </Text>
            </View>
          </View>
        )}
        {hasClosedCafeItems && (
          <View className="bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-2xl mb-3 flex-row gap-3 items-start">
            <Text className="text-lg">🍔</Text>
            <View className="flex-1">
              <Text className="text-amber-800 dark:text-amber-300 font-black text-xs">Food Kitchen Closed</Text>
              <Text className="text-amber-700 dark:text-amber-400 text-[10px] font-bold mt-0.5 leading-4">
                Our Food Kitchen is currently closed (6 AM - 12 AM). Please remove Food items to proceed with groceries.
              </Text>
            </View>
          </View>
        )}

        {/* Free Delivery Progress Header */}
        {groceryItems.length > 0 ? (
          grocerySubtotal < groceryFreeDeliveryThreshold ? (
            <View className="bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/30 p-3.5 rounded-2xl mb-4">
              <Text className="text-rose-700 dark:text-rose-350 text-[11px] font-black">
                📦 Add {formatPrice(groceryFreeDeliveryThreshold - grocerySubtotal)} more of groceries for FREE delivery (Over {formatPrice(groceryFreeDeliveryThreshold)})
              </Text>
              <View style={{ height: 6, width: '100%', backgroundColor: theme === 'dark' ? '#27272a' : '#e2e8f0', borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#e20a22', '#f97316', '#10b981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: '100%', width: `${Math.min(grocerySubtotal / groceryFreeDeliveryThreshold, 1) * 100}%`, borderRadius: 99 }}
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
          cafeSubtotal < cafeFreeDeliveryThreshold ? (
            <View className="bg-rose-50 dark:bg-rose-950/20 border border-rose-150 dark:border-rose-900/30 p-3.5 rounded-2xl mb-4">
              <Text className="text-rose-700 dark:text-rose-350 text-[11px] font-black">
                🍔 Add {formatPrice(cafeFreeDeliveryThreshold - cafeSubtotal)} more from Food for FREE delivery (Over {formatPrice(cafeFreeDeliveryThreshold)})
              </Text>
              <View style={{ height: 6, width: '100%', backgroundColor: theme === 'dark' ? '#27272a' : '#e2e8f0', borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#e20a22', '#f97316', '#10b981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: '100%', width: `${Math.min(cafeSubtotal / cafeFreeDeliveryThreshold, 1) * 100}%`, borderRadius: 99 }}
                />
              </View>
            </View>
          ) : (
            <View className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-150 dark:border-emerald-900/30 p-3.5 rounded-2xl mb-4">
              <Text className="text-emerald-700 dark:text-emerald-355 text-[11px] font-black text-center">
                🎉 FREE Food delivery unlocked!
              </Text>
            </View>
          )
        ) : null}


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
              <Text className="text-rose-600 dark:text-rose-400 font-black text-sm">🍔 FastKirana Food</Text>
              <Text className="text-slate-400 dark:text-zinc-400 text-[9px] font-bold mt-0.5">Piping hot food & drinks from Food Kitchen</Text>
            </View>

            <View>{cafeItems.map(renderItemRow)}</View>
          </View>
        )}



        {/* Smart Upsell Suggestions Carousel */}
        {cheapSuggestions.length > 0 && (
          <View className="mb-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4">
            <View className="mb-3">
              <Text className="text-slate-800 dark:text-zinc-100 font-black text-sm">💡 Frequently Added Together</Text>
              <Text className="text-slate-400 dark:text-zinc-400 text-[9px] font-bold mt-0.5">Quick recommendations based on your cart</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingRight: 10 }}
            >
              {cheapSuggestions.slice(0, 10).map((product) => {
                const discount = product.mrp && product.mrp > product.price 
                  ? Math.round(((product.mrp - product.price) / product.mrp) * 100) 
                  : 0;

                return (
                  <View 
                    key={product.id}
                    style={{ 
                      width: 140, 
                      backgroundColor: isDarkMode ? '#1c1c1e' : '#f8fafc',
                      borderRadius: 16,
                      borderWidth: 1,
                      borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
                      padding: 10,
                      justifyContent: 'space-between'
                    }}
                  >
                    <View>
                      {/* Image Container with Discount Badge */}
                      <View style={{ width: '100%', height: 80, borderRadius: 10, overflow: 'hidden', backgroundColor: isDarkMode ? '#2c2c2e' : '#ffffff', position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                        <Image
                          source={getAppImageSource(product.image, product.name)}
                          style={{ width: '85%', height: '85%' }}
                          contentFit="contain"
                          cachePolicy="memory-disk"
                        />
                        {discount > 0 && (
                          <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: '#e20a22', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 }}>
                            <Text style={{ color: '#ffffff', fontSize: 7, fontWeight: '900' }}>{discount}% OFF</Text>
                          </View>
                        )}
                      </View>

                      {/* Product Name */}
                      <Text 
                        numberOfLines={2} 
                        style={{ 
                          fontSize: 10, 
                          fontWeight: '800', 
                          color: isDarkMode ? '#fafafa' : '#1e293b', 
                          marginTop: 8,
                          minHeight: 28,
                          lineHeight: 13
                        }}
                      >
                        {product.name}
                      </Text>
                    </View>

                    {/* Price and Add button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <View>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: '#16a34a' }}>{formatPrice(product.price)}</Text>
                        {product.mrp && product.mrp > product.price && (
                          <Text style={{ fontSize: 8, fontWeight: 'bold', color: '#94a3b8', textDecorationLine: 'line-through' }}>{formatPrice(product.mrp)}</Text>
                        )}
                      </View>

                      <Pressable
                        onPress={() => {
                          triggerHaptic('medium');
                          addItem(product);
                          toast.success(`Added ${product.name} to cart!`);
                        }}
                        style={{
                          backgroundColor: '#e20a22',
                          borderRadius: 8,
                          paddingHorizontal: 8,
                          paddingVertical: 4.5,
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '900' }}>ADD</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
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

          {miscFee > 0 && (
            <View className="flex-row justify-between py-1.5">
              <Text className="text-slate-500 dark:text-zinc-400 text-sm font-semibold">{miscFeeLabel || 'Handling Charge'}</Text>
              <Text className="text-slate-800 dark:text-zinc-200 text-sm font-bold">{formatPrice(miscFee)}</Text>
            </View>
          )}

          <View className="flex-row justify-between py-1.5">
            <Text className="text-slate-500 dark:text-zinc-400 text-sm font-semibold">GST Tax ({taxRate}%)</Text>
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
      <View 
        style={{ 
          backgroundColor: isDarkMode ? THEME.COLORS.dark.background : '#ffffff', 
          borderTopWidth: 1, 
          borderTopColor: isDarkMode ? THEME.COLORS.dark.border : '#e2e8f0', 
          paddingHorizontal: 16, 
          paddingTop: 12, 
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12 
        }}
        className="shadow-lg"
      >
        {isCheckoutBlocked ? (
          <Pressable 
            disabled
            style={{
              width: '100%',
              height: 52,
              borderRadius: 16,
              backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: isDarkMode ? '#71717a' : '#94a3b8', fontSize: 13, fontWeight: '700' }}>
              {hasInventoryIssues ? 'Fix Inventory Issues to Proceed' : 'Store Closed'}
            </Text>
          </Pressable>
        ) : (
          <ScalePressable 
            onPress={handleCheckoutRedirect}
            scaleValue={0.98}
            haptic="medium"
            style={{
              width: '100%',
              borderRadius: 16,
              overflow: 'hidden',
              ...Platform.select({
                ios: {
                  shadowColor: cafeItems.length > 0 ? '#ea580c' : '#e20a22',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: isDarkMode ? 0.35 : 0.2,
                  shadowRadius: 10,
                },
                android: {
                  elevation: 4,
                }
              })
            }}
          >
            <LinearGradient
              colors={
                isDarkMode
                  ? ['#27272a', '#18181b']
                  : cafeItems.length > 0
                    ? ['#ea580c', '#f97316']
                    : ['#e20a22', '#ff4d64']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                width: '100%',
                height: 52,
                paddingHorizontal: 20,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View>
                <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '900' }}>
                  {formatPrice(totalPayable)}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '800', marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Total Bill
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ color: '#ffffff', fontSize: 14, fontWeight: '900' }}>
                  Proceed to Checkout
                </Text>
                <ArrowRight size={15} color="#fff" strokeWidth={3} />
              </View>
            </LinearGradient>
          </ScalePressable>
        )}
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
              <ScalePressable
                onPress={() => {
                  setShowLoginModal(false);
                  router.push('/(auth)/login');
                }}
                scaleValue={0.97}
                style={{
                  width: '100%',
                  paddingVertical: 14,
                  backgroundColor: '#e20a22',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="text-white font-extrabold text-xs uppercase tracking-wider">Log In / Sign Up</Text>
              </ScalePressable>

              <ScalePressable
                onPress={() => {
                  setShowLoginModal(false);
                }}
                scaleValue={0.97}
                style={{
                  width: '100%',
                  paddingVertical: 14,
                  backgroundColor: isDarkMode ? '#27272a' : '#f8fafc',
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#3f3f46' : '#cbd5e1',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text className="text-slate-600 dark:text-zinc-350 font-bold text-xs uppercase tracking-wider">Cancel</Text>
              </ScalePressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
