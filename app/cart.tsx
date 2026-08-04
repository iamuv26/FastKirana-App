import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, StyleSheet, Modal, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, Stack } from 'expo-router';
import { useState, useMemo, useEffect, memo } from 'react';
import { Image } from 'expo-image';
import { ArrowLeft, ShoppingCart, Trash2, ArrowRight, Clock, KeyRound } from 'lucide-react-native';
import { useCart } from '../hooks/use-cart';
import { formatPrice, getAppImageSource, getCategoryEmoji } from '../lib/utils';
import { API_BASE_URL } from '../lib/constants';
import { useUIStore } from '../stores/ui-store';
import { useAuthStore } from '../stores/auth-store';
import { useTheme } from './context/ThemeContext';
import { ScalePressable } from '../components/shared/ScalePressable';
import { useQuery } from '@tanstack/react-query';
import { THEME } from '../lib/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../lib/haptic';
import { toast } from '../lib/toast';
import { BlurView } from 'expo-blur';
import Animated, { FadeInRight } from 'react-native-reanimated';
import { useResponsive, getCenteredContainerStyle } from '../lib/responsive';

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
  const responsive = useResponsive();
  const { width: windowWidth } = useWindowDimensions();
  const isWideLayout = responsive.isLargeScreen;
  const {
    items,
    updateQuantity,
    removeItem,
    addItem,
    getItemQuantity,
    getSubtotal,
    getMrpTotal,
    getSavings,
    updateItemNotes,
    updateCartProduct
  } = useCart();

  const insets = useSafeAreaInsets();
  const { user, isLoggedIn } = useAuthStore();
  const { theme } = useTheme();
  const assignedStoreId = useUIStore((s) => s.assignedStoreId);
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
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

  const validStoreId = (assignedStoreId && !assignedStoreId.startsWith('default-')) ? assignedStoreId : null;

  const { data: allProducts = [], isLoading: isSuggestionsLoading } = useQuery<any[]>({
    queryKey: ['cart-suggestions-products', validStoreId],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/products?limit=500${validStoreId ? `&storeId=${validStoreId}` : ''}`);
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
      if (p.isAvailable === false) return false;
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
              toast.info('Cart adjusted to match live stock & pricing!');
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
    (item) => item.product.isAvailable === false
  ), [items]);

  const hasClosedGroceryItems = groceryItems.length > 0 && !groceryMartOpen && !__DEV__;
  const hasClosedCafeItems = cafeItems.length > 0 && !cafeOpen && !__DEV__;
  const isCheckoutBlocked = hasClosedGroceryItems || hasClosedCafeItems || hasInventoryIssues;

  const handleAutoAdjust = () => {
    let adjustedCount = 0;
    items.forEach((item) => {
      if (item.product.isAvailable === false) {
        removeItem(item.product.id, item.product.name);
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

  const CartItemRow = memo(function CartItemRow({ item, colors }: { item: any; colors: typeof THEME.COLORS.light }) {
    const isCafe = isCafeProduct(item.product);
    const isStoreClosed = isCafe ? !cafeOpen : !groceryMartOpen;
    const isOOS = item.product.isAvailable === false || (item.product.stock !== undefined && item.product.stock !== null && item.product.stock <= 0);
    const effectiveStock = item.product.isAvailable === false
      ? 0
      : (item.product.stock !== undefined && item.product.stock !== null
          ? Math.max(0, item.product.stock)
          : 999);
    const isExceeded = item.quantity > effectiveStock && !isOOS;
    const activeColor = isCafe ? '#ea580c' : '#e20a22';

    return (
      <View
        key={item.product.id}
        style={{
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderColor: colors.border,
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
                  borderColor: item.product.tags?.includes('non-veg') ? THEME.COLORS.brand.error : THEME.COLORS.brand.success,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 6,
                  borderRadius: 2,
                }}>
                  <View style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: item.product.tags?.includes('non-veg') ? THEME.COLORS.brand.error : THEME.COLORS.brand.success,
                  }} />
                </View>
              )}
              <Text
                style={{
                  color: colors.textPrimary,
                  fontWeight: '900',
                  fontSize: 14,
                  lineHeight: 20,
                  textDecorationLine: isOOS ? 'line-through' : 'none',
                }}
              >
                {item.product.name}
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600', marginTop: 2 }}>
              {item.product.unit}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: 14 }}>
                {formatPrice(item.product.price)}
              </Text>
              {item.product.mrp > item.product.price && (
                <Text style={{ color: colors.textMuted, fontSize: 11, textDecorationLine: 'line-through' }}>
                  {formatPrice(item.product.mrp)}
                </Text>
              )}
            </View>
          </View>

          {/* Clean counter control */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: THEME.RADIUS.sm,
            backgroundColor: colors.surface,
            height: 34,
            padding: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: isDarkMode ? 0.2 : 0.04,
            shadowRadius: 3,
            elevation: 1,
          }}>
            <ScalePressable
              onPress={() => {
                triggerHaptic('light');
                if (item.quantity === 1) {
                  removeItem(item.product.id, item.product.name);
                } else {
                  updateQuantity(item.product.id, item.product.name, item.quantity - 1);
                }
              }}
              scaleValue={0.9}
              style={{
                width: 30,
                height: 30,
                borderRadius: THEME.RADIUS.sm,
                backgroundColor: isDarkMode ? `${THEME.COLORS.brand.error}1A` : '#fef2f2',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {item.quantity === 1 ? (
                <Trash2 size={13} color={THEME.COLORS.brand.error} strokeWidth={2.5} />
              ) : (
                <Text style={{ color: activeColor, fontWeight: '900', fontSize: 16, lineHeight: 18, marginTop: -2 }}>-</Text>
              )}
            </ScalePressable>
            <Text style={{ width: 26, textAlign: 'center', color: colors.textPrimary, fontWeight: '900', fontSize: 13 }}>
              {item.quantity}
            </Text>
            <ScalePressable
              onPress={() => {
                triggerHaptic('light');
                updateQuantity(item.product.id, item.product.name, item.quantity + 1);
              }}
              disabled={isStoreClosed || item.quantity >= item.product.stock}
              scaleValue={0.9}
              style={{
                width: 30,
                height: 30,
                borderRadius: THEME.RADIUS.sm,
                backgroundColor: isStoreClosed || item.quantity >= item.product.stock
                  ? colors.surfaceElevated
                  : activeColor,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{
                color: '#ffffff',
                fontWeight: '900',
                fontSize: 15,
                lineHeight: 18,
                marginTop: -1
              }}>+</Text>
            </ScalePressable>
          </View>
        </View>

        {isOOS && (
          <View style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: `${THEME.COLORS.brand.error}14`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.error}33`, borderRadius: THEME.RADIUS.md }}>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '700', color: THEME.COLORS.brand.error }}>Out of stock — please remove to checkout.</Text>
          </View>
        )}
        {isExceeded && (
          <View style={{ marginTop: 8, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: `${THEME.COLORS.brand.warning}14`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.warning}33`, borderRadius: THEME.RADIUS.md }}>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '700', color: THEME.COLORS.brand.warning }}>Only {item.product.stock} units available in stock.</Text>
          </View>
        )}
        {isCafe && (
          <View style={{ marginTop: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: colors.surfaceElevated, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.border, borderRadius: THEME.RADIUS.md, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Clock size={11} color={colors.textMuted} />
            <TextInput
              value={item.notes || ''}
              onChangeText={(text) => updateItemNotes(item.product.id, text)}
              placeholder="Cooking instructions (e.g., less sugar, extra spicy)..."
              placeholderTextColor={colors.textMuted}
              style={{
                flex: 1,
                fontSize: 11,
                fontWeight: '700',
                color: colors.textPrimary,
                padding: 0,
              }}
            />
          </View>
        )}
      </View>
    );
  });

  if (items.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDarkMode ? "light" : "dark"} />
        <Stack.Screen options={{ headerShown: false }} />
        {/* Header */}
        <View style={{ paddingHorizontal: THEME.SPACING.md, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }}
            style={{ width: 32, height: 32, borderRadius: THEME.RADIUS.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated }}
          >
            <ArrowLeft size={18} color={isDarkMode ? '#ffffff' : '#0f172a'} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.bodySm }}>Review Cart Items</Text>
          </View>
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: THEME.SPACING.xxl }}>
          {/* Animated/Glowing Cart Icon */}
          <View style={{ width: 96, height: 96, borderRadius: THEME.RADIUS.pill, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 }}>
            <View style={{ position: 'absolute', inset: 0, borderRadius: THEME.RADIUS.pill, backgroundColor: `${THEME.COLORS.brand.primary}14`, opacity: 0.14 }} />
            <ShoppingCart size={40} color={THEME.COLORS.brand.primary} strokeWidth={2} />
          </View>

          <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: 18, textAlign: 'center' }}>
            Your Cart is Empty
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '500', textAlign: 'center', marginTop: 8, lineHeight: 18, maxWidth: 280 }}>
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
                marginTop: 32,
                backgroundColor: THEME.COLORS.brand.primary,
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: THEME.RADIUS.lg,
                shadowColor: THEME.COLORS.brand.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              },
            ]}
          >
            <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Start Shopping
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View
        style={{
          paddingHorizontal: THEME.SPACING.md,
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: colors.borderLight,
          backgroundColor: isDarkMode ? 'rgba(9, 9, 11, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          overflow: 'hidden',
        }}
      >
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: THEME.RADIUS.pill,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? `${THEME.COLORS.dark.textPrimary}14` : 'rgba(0,0,0,0.05)',
            zIndex: 10,
          }}
        >
          <ArrowLeft size={18} color={isDarkMode ? '#ffffff' : '#0f172a'} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.bodySm }}>Review Cart Items</Text>
          <Text style={{ color: colors.textMuted, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '600', marginTop: 2 }}>{items.length} item(s) selected</Text>
        </View>

        {hasInventoryIssues && (
          <Pressable
            onPress={handleAutoAdjust}
            style={{ backgroundColor: `${THEME.COLORS.brand.accent}1A`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.accent}44`, paddingHorizontal: 10, paddingVertical: 6, borderRadius: THEME.RADIUS.md }}
          >
            <Text style={{ color: isDarkMode ? '#c7d2fe' : '#4338ca', fontWeight: '800', fontSize: THEME.TYPOGRAPHY.sizes.micro, textTransform: 'uppercase' }}>Auto-Adjust</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: responsive.spacing.page,
          paddingVertical: responsive.spacing.card,
          paddingBottom: 110,
          ...getCenteredContainerStyle(responsive),
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Closed store alerts */}
        {hasClosedGroceryItems && (
          <View style={{ backgroundColor: `${THEME.COLORS.brand.warning}1A`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.warning}33`, padding: 14, borderRadius: THEME.RADIUS.lg, marginBottom: 12, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 18 }}>💤</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: isDarkMode ? '#fcd34d' : '#92400e', fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.caption }}>Grocery Mart Closed</Text>
              <Text style={{ color: isDarkMode ? '#fbbf24' : '#b45309', fontSize: 10, fontWeight: '700', marginTop: 2, lineHeight: 14 }}>
                Our Grocery Mart is currently closed (6 AM - 12 AM). Please remove groceries to proceed with Food items.
              </Text>
            </View>
          </View>
        )}
        {hasClosedCafeItems && (
          <View style={{ backgroundColor: `${THEME.COLORS.brand.warning}1A`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.warning}33`, padding: 14, borderRadius: THEME.RADIUS.lg, marginBottom: 12, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
            <Text style={{ fontSize: 18 }}>🍔</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ color: isDarkMode ? '#fcd34d' : '#92400e', fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.caption }}>Food Kitchen Closed</Text>
              <Text style={{ color: isDarkMode ? '#fbbf24' : '#b45309', fontSize: 10, fontWeight: '700', marginTop: 2, lineHeight: 14 }}>
                Our Food Kitchen is currently closed (6 AM - 12 AM). Please remove Food items to proceed with groceries.
              </Text>
            </View>
          </View>
        )}

        {/* Free Delivery Progress Header */}
        {groceryItems.length > 0 ? (
          grocerySubtotal < groceryFreeDeliveryThreshold ? (
            <View style={{ backgroundColor: `${THEME.COLORS.brand.primary}0D`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.primary}28`, padding: 14, borderRadius: THEME.RADIUS.lg, marginBottom: 16 }}>
              <Text style={{ color: isDarkMode ? '#fda4af' : '#be123c', fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '900' }}>
                Add {formatPrice(groceryFreeDeliveryThreshold - grocerySubtotal)} more of groceries for FREE delivery (Over {formatPrice(groceryFreeDeliveryThreshold)})
              </Text>
              <View style={{ height: 6, width: '100%', backgroundColor: colors.surfaceElevated, borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#e20a22', '#f97316', '#10b981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: '100%', width: `${Math.min(grocerySubtotal / groceryFreeDeliveryThreshold, 1) * 100}%`, borderRadius: 99 }}
                />
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: `${THEME.COLORS.brand.success}14`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.success}33`, padding: 14, borderRadius: THEME.RADIUS.lg, marginBottom: 16 }}>
              <Text style={{ color: isDarkMode ? '#34d399' : '#047857', fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '900', textAlign: 'center' }}>
                FREE Grocery delivery unlocked!
              </Text>
            </View>
          )
        ) : cafeItems.length > 0 ? (
          cafeSubtotal < cafeFreeDeliveryThreshold ? (
            <View style={{ backgroundColor: `${THEME.COLORS.brand.accent}0D`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.accent}28`, padding: 14, borderRadius: THEME.RADIUS.lg, marginBottom: 16 }}>
              <Text style={{ color: isDarkMode ? '#fdba74' : '#c2410c', fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '900' }}>
                Add {formatPrice(cafeFreeDeliveryThreshold - cafeSubtotal)} more from Food for FREE delivery (Over {formatPrice(cafeFreeDeliveryThreshold)})
              </Text>
              <View style={{ height: 6, width: '100%', backgroundColor: colors.surfaceElevated, borderRadius: 99, marginTop: 8, overflow: 'hidden' }}>
                <LinearGradient
                  colors={['#e20a22', '#f97316', '#10b981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ height: '100%', width: `${Math.min(cafeSubtotal / cafeFreeDeliveryThreshold, 1) * 100}%`, borderRadius: 99 }}
                />
              </View>
            </View>
          ) : (
            <View style={{ backgroundColor: `${THEME.COLORS.brand.success}14`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.success}33`, padding: 14, borderRadius: THEME.RADIUS.lg, marginBottom: 16 }}>
              <Text style={{ color: isDarkMode ? '#34d399' : '#047857', fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '900', textAlign: 'center' }}>
                FREE Food delivery unlocked!
              </Text>
            </View>
          )
        ) : null}


        {/* Grocery items splitting */}
        {groceryItems.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: THEME.RADIUS.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }}>
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8, marginBottom: 8 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.titleSm }}>Grocery & Essentials</Text>
              <Text style={{ color: colors.textMuted, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700', marginTop: 2 }}>Delivered from Dark Store</Text>
            </View>

            <View>{groceryItems.map((item) => <CartItemRow key={item.product.id} item={item} colors={colors} />)}</View>
          </View>
        )}

        {/* Cafe items splitting */}
        {cafeItems.length > 0 && (
          <View style={{ backgroundColor: colors.surface, borderRadius: THEME.RADIUS.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }}>
            <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 8, marginBottom: 8 }}>
              <Text style={{ color: THEME.COLORS.brand.accent, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.titleSm }}>FastKirana Food</Text>
              <Text style={{ color: colors.textMuted, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700', marginTop: 2 }}>Piping hot food & drinks from Food Kitchen</Text>
            </View>

            <View>{cafeItems.map((item) => <CartItemRow key={item.product.id} item={item} colors={colors} />)}</View>
          </View>
        )}



        {/* Smart Upsell Suggestions Carousel */}
        {cheapSuggestions.length > 0 && (
          <View style={{ marginBottom: 16, backgroundColor: colors.surface, borderRadius: THEME.RADIUS.lg, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.titleSm }}>Frequently Added Together</Text>
              <Text style={{ color: colors.textMuted, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700', marginTop: 2 }}>Quick recommendations based on your cart</Text>
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
                      backgroundColor: colors.surfaceElevated,
                      borderRadius: THEME.RADIUS.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 10,
                      justifyContent: 'space-between',
                    }}
                  >
                    <View>
                      {/* Image Container with Discount Badge */}
                      <View style={{ width: '100%', height: 80, borderRadius: 10, overflow: 'hidden', backgroundColor: colors.surface, position: 'relative', justifyContent: 'center', alignItems: 'center' }}>
                        {(() => {
                          const imgSrc = getAppImageSource(product.imageUrl || (product as any).image, 250);
                          if (imgSrc) {
                            return (
                              <Image
                                source={imgSrc}
                                style={{ width: '85%', height: '85%' }}
                                contentFit="contain"
                                cachePolicy="memory-disk"
                              />
                            );
                          }
                          return (
                            <Text style={{ fontSize: 28 }}>
                              {getCategoryEmoji(product.category?.slug || product.name)}
                            </Text>
                          );
                        })()}
                        {discount > 0 && (
                          <View style={{ position: 'absolute', top: 4, left: 4, backgroundColor: THEME.COLORS.brand.primary, paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 }}>
                            <Text style={{ color: '#ffffff', fontSize: 7, fontWeight: '900' }}>{discount}% OFF</Text>
                          </View>
                        )}
                      </View>

                      {/* Product Name */}
                      <Text
                        numberOfLines={2}
                        style={{
                          fontSize: THEME.TYPOGRAPHY.sizes.micro,
                          fontWeight: '800',
                          color: colors.textPrimary,
                          marginTop: 8,
                          minHeight: 28,
                          lineHeight: 13,
                        }}
                      >
                        {product.name}
                      </Text>
                    </View>

                    {/* Price and Add button */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
                      <View>
                        <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '900', color: THEME.COLORS.brand.success }}>{formatPrice(product.price)}</Text>
                        {product.mrp && product.mrp > product.price && (
                          <Text style={{ fontSize: 8, fontWeight: 'bold', color: colors.textMuted, textDecorationLine: 'line-through' }}>{formatPrice(product.mrp)}</Text>
                        )}
                      </View>

                      {(() => {
                        const qty = getItemQuantity(product.id);
                        if (qty > 0) {
                          return (
                            <View style={{
                              flexDirection: 'row',
                              alignItems: 'center',
                              backgroundColor: isDarkMode ? `${THEME.COLORS.brand.success}1A` : '#f0fdf4',
                              borderWidth: 1.5,
                              borderColor: THEME.COLORS.brand.success,
                              borderRadius: THEME.RADIUS.sm,
                              height: 30,
                              paddingHorizontal: 2,
                            }}>
                              <Pressable
                                onPress={() => {
                                  updateQuantity(product.id, product.name, qty - 1);
                                }}
                                style={{
                                  paddingHorizontal: 7,
                                  height: '100%',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Text style={{ color: isDarkMode ? '#34d399' : THEME.COLORS.brand.success, fontSize: 14, fontWeight: '900' }}>-</Text>
                              </Pressable>
                              <Text style={{ color: isDarkMode ? '#34d399' : THEME.COLORS.brand.successDark, fontSize: 11, fontWeight: '900', paddingHorizontal: 3 }}>
                                {qty}
                              </Text>
                              <Pressable
                                onPress={() => {
                                  updateQuantity(product.id, product.name, qty + 1);
                                }}
                                style={{
                                  paddingHorizontal: 7,
                                  height: '100%',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Text style={{ color: isDarkMode ? '#34d399' : THEME.COLORS.brand.success, fontSize: 14, fontWeight: '900' }}>+</Text>
                              </Pressable>
                            </View>
                          );
                        }

                        return (
                          <Pressable
                            onPress={() => {
                              triggerHaptic('medium');
                              addItem(product);
                            }}
                            style={{
                              backgroundColor: THEME.COLORS.brand.primary,
                              borderRadius: 8,
                              paddingHorizontal: 12,
                              paddingVertical: 5,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Text style={{ color: '#ffffff', fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '900' }}>ADD</Text>
                          </Pressable>
                        );
                      })()}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Coupon code block */}
        <View style={{ backgroundColor: colors.surface, borderRadius: THEME.RADIUS.lg, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 16 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.titleSm, marginBottom: 12 }}>Apply Promo Coupon</Text>
          {appliedCoupon ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: `${THEME.COLORS.brand.success}33`, backgroundColor: `${THEME.COLORS.brand.success}14`, padding: 12, borderRadius: THEME.RADIUS.md }}>
              <View>
                <Text style={{ backgroundColor: `${THEME.COLORS.brand.success}1A`, color: isDarkMode ? '#34d399' : THEME.COLORS.brand.successDark, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.caption, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start' }}>
                  {appliedCoupon.code}
                </Text>
                <Text style={{ color: isDarkMode ? '#34d399' : THEME.COLORS.brand.successDark, fontSize: 10, fontWeight: '700', marginTop: 4 }}>Saved {formatPrice(appliedCoupon.discountAmount)}</Text>
              </View>
              <Pressable
                onPress={handleRemoveCoupon}
                style={{ backgroundColor: `${THEME.COLORS.brand.primary}1A`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.primary}33`, paddingHorizontal: 12, paddingVertical: 6, borderRadius: THEME.RADIUS.md }}
              >
                <Text style={{ color: THEME.COLORS.brand.primary, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.micro, textTransform: 'uppercase' }}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TextInput
                placeholder="e.g. WELCOME50"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="characters"
                value={couponCode}
                onChangeText={setCouponCode}
                style={{ flex: 1, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: THEME.RADIUS.md, paddingHorizontal: 12, paddingVertical: 8, color: colors.textPrimary, fontWeight: '700', fontSize: THEME.TYPOGRAPHY.sizes.caption }}
              />
              <Pressable
                onPress={handleApplyCoupon}
                disabled={isCouponLoading || !couponCode.trim()}
                style={{ backgroundColor: isCouponLoading || !couponCode.trim() ? colors.surfaceElevated : THEME.COLORS.brand.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: THEME.RADIUS.md, alignItems: 'center', justifyContent: 'center' }}
              >
                {isCouponLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: THEME.TYPOGRAPHY.sizes.caption, textTransform: 'uppercase' }}>Apply</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>

        {/* Pricing break-down list */}
        <View style={{ backgroundColor: colors.surface, borderRadius: THEME.RADIUS.lg, borderWidth: 1, borderColor: colors.borderLight, padding: 16, marginBottom: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 }}>
          <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.body, marginBottom: 12, paddingBottom: 8 }}>Bill Summary</Text>

          {/* Savings Banner */}
          {(itemDiscount + promoDiscount) > 0 && (
            <LinearGradient
              colors={isDarkMode ? ['rgba(16,185,129,0.15)', 'rgba(5,150,105,0.03)'] : ['#f0fdf4', '#ecfdf5']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: THEME.RADIUS.md,
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(16,185,129,0.3)' : '#bbf7d0',
                marginBottom: 12,
              }}
            >
              <Text style={{ fontSize: 16 }}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontWeight: '900', color: isDarkMode ? '#34d399' : '#15803d' }}>
                  YAY! Saving {formatPrice(itemDiscount + promoDiscount)} on this order!
                </Text>
                <Text style={{ fontSize: 9, fontWeight: '600', color: isDarkMode ? '#10b981' : THEME.COLORS.brand.successDark, marginTop: 1 }}>
                  Includes products discount & promo savings
                </Text>
              </View>
            </LinearGradient>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '600' }}>Item Total (MRP)</Text>
            <Text style={{ color: colors.textPrimary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '700' }}>{formatPrice(mrpTotal)}</Text>
          </View>

          {itemDiscount > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: isDarkMode ? '#34d399' : THEME.COLORS.brand.successDark, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '600' }}>Product Discount</Text>
              <Text style={{ color: isDarkMode ? '#34d399' : THEME.COLORS.brand.successDark, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '700' }}>-{formatPrice(itemDiscount)}</Text>
            </View>
          )}

          {appliedCoupon && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: isDarkMode ? '#34d399' : THEME.COLORS.brand.successDark, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '600' }}>Coupon Discount</Text>
              <Text style={{ color: isDarkMode ? '#34d399' : THEME.COLORS.brand.successDark, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '700' }}>-{formatPrice(promoDiscount)}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '600' }}>Delivery Fee</Text>
            <Text style={{ color: deliveryFee === 0 ? (isDarkMode ? '#34d399' : THEME.COLORS.brand.successDark) : colors.textPrimary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '700' }}>
              {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
            </Text>
          </View>

          {miscFee > 0 && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
              <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '600' }}>{miscFeeLabel || 'Handling Charge'}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '700' }}>{formatPrice(miscFee)}</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '600' }}>GST Tax ({taxRate}%)</Text>
            <Text style={{ color: colors.textPrimary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '700' }}>{formatPrice(taxes)}</Text>
          </View>

          {/* Monospace receipt dashed separator */}
          <View
            style={{
              borderStyle: 'dashed',
              borderWidth: 0.6,
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : colors.border,
              marginVertical: 10,
              height: 1,
              width: '100%',
              borderRadius: 1,
            }}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 }}>
            <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.body }}>To Pay</Text>
            <Text style={{ color: THEME.COLORS.brand.primary, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.body }}>{formatPrice(totalPayable)}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom bar */}
      <View
        style={{
          backgroundColor: colors.background,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: THEME.SPACING.md,
          paddingTop: 12,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {isCheckoutBlocked ? (
          <Pressable
            disabled
            style={{
              width: '100%',
              height: 52,
              borderRadius: THEME.RADIUS.md,
              backgroundColor: colors.surfaceElevated,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '700' }}>
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
              borderRadius: THEME.RADIUS.md,
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
            style={{ width: '100%', maxWidth: 340, backgroundColor: colors.surface, borderRadius: THEME.RADIUS.xl, borderWidth: 1, borderColor: colors.border, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 8 }}
          >
            {/* Golden Key Badge wrapper */}
            <View style={{ width: 64, height: 64, borderRadius: THEME.RADIUS.pill, backgroundColor: `${THEME.COLORS.brand.warning}14`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.warning}33`, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <KeyRound size={28} color={THEME.COLORS.brand.warning} strokeWidth={2.5} />
            </View>

            <Text style={{ color: colors.textPrimary, fontWeight: '900', fontSize: THEME.TYPOGRAPHY.sizes.titleSm, textAlign: 'center', marginBottom: 8 }}>
              Login Required
            </Text>

            <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '600', textAlign: 'center', lineHeight: 20, marginBottom: 24, paddingHorizontal: 8 }}>
              Please log in or sign up to proceed to checkout and place your order.
            </Text>

            {/* Action buttons */}
            <View style={{ width: '100', gap: 12 }}>
              <ScalePressable
                onPress={() => {
                  setShowLoginModal(false);
                  router.push('/(auth)/login');
                }}
                scaleValue={0.97}
                style={{ width: '100%', paddingVertical: 14, backgroundColor: THEME.COLORS.brand.primary, borderRadius: THEME.RADIUS.md, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: THEME.TYPOGRAPHY.sizes.caption, textTransform: 'uppercase', letterSpacing: 1 }}>Log In / Sign Up</Text>
              </ScalePressable>

              <ScalePressable
                onPress={() => {
                  setShowLoginModal(false);
                }}
                scaleValue={0.97}
                style={{ width: '100%', paddingVertical: 14, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, borderRadius: THEME.RADIUS.md, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: THEME.TYPOGRAPHY.sizes.caption, textTransform: 'uppercase', letterSpacing: 1 }}>Cancel</Text>
              </ScalePressable>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
