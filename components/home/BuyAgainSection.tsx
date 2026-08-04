import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform } from 'react-native';
import { History, Plus, Bell, ShoppingBag } from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { useCartActions } from '../../hooks/use-cart';
import { formatPrice } from '../../lib/utils';
import { toast } from '../../lib/toast';
import { useTheme } from '../../app/context/ThemeContext';
import { ScalePressable } from '../shared/ScalePressable';
import { THEME } from '../../lib/theme';
import { API_BASE_URL } from '../../lib/constants';
import { api } from '../../lib/api-client';
import { useAuthStore } from '../../stores/auth-store';

interface BuyAgainSectionProps {
  orders?: any[];
}

export default function BuyAgainSection({ orders: propOrders }: BuyAgainSectionProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const { addItem } = useCartActions();
  const { user } = useAuthStore();
  const [fetchedOrders, setFetchedOrders] = useState<any[]>([]);

  useEffect(() => {
    // If propOrders is not provided, fetch past orders from API/storage
    if (!propOrders || propOrders.length === 0) {
      let isMounted = true;
      const loadPastOrders = async () => {
        let list: any[] = [];
        try {
          const res = await api.get('/orders');
          if (Array.isArray(res)) {
            list = res;
          }
        } catch (err) {
          // Fallback to local storage if API error
        }

        try {
          const { mmkvStorage } = require('../../lib/storage');
          const localKey = `local_orders_${user?.id || 'guest'}`;
          const localData = mmkvStorage.getItem(localKey);
          if (localData && localData !== 'undefined') {
            const localList = JSON.parse(localData);
            if (Array.isArray(localList)) {
              localList.forEach((lo) => {
                if (!list.some((so) => so.id === lo.id)) {
                  list.push(lo);
                }
              });
            }
          }
        } catch (storageErr) {}

        if (isMounted && list.length > 0) {
          setFetchedOrders(list);
        }
      };

      loadPastOrders();
      return () => {
        isMounted = false;
      };
    }
  }, [propOrders, user]);

  const activeOrders = propOrders && propOrders.length > 0 ? propOrders : fetchedOrders;

  // Extract unique past ordered products dynamically from real order history
  const realBuyAgainItems = useMemo(() => {
    if (!Array.isArray(activeOrders) || activeOrders.length === 0) return [];

    const productMap = new Map<string, {
      id: string;
      name: string;
      slug: string;
      price: number;
      mrp: number;
      imageUrl: string | null;
      unit: string;
      lastOrderedDate: string;
      orderCount: number;
      stock?: number;
      isAvailable?: boolean;
    }>();

    // Iterate through orders (sorted by createdAt)
    activeOrders.forEach((order) => {
      if (!order.items || !Array.isArray(order.items)) return;

      const orderDate = new Date(order.createdAt || Date.now());
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 3600 * 24));

      let dateLabel = 'Recently';
      if (diffDays === 0) dateLabel = 'Today';
      else if (diffDays === 1) dateLabel = 'Yesterday';
      else if (diffDays > 0 && diffDays < 30) dateLabel = `${diffDays}d ago`;
      else dateLabel = orderDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

      order.items.forEach((item: any) => {
        const itemKey = item.productId || item.id || item.name;
        if (!itemKey) return;

        let imgUrl = item.imageUrl || item.product?.imageUrl || item.image || null;
        if (imgUrl && imgUrl.startsWith('/') && !imgUrl.startsWith('//')) {
          imgUrl = `${API_BASE_URL.replace('/api', '')}${imgUrl}`;
        }

        if (productMap.has(itemKey)) {
          const existing = productMap.get(itemKey)!;
          existing.orderCount += 1;
        } else {
          productMap.set(itemKey, {
            id: item.productId || item.id || `p-${Math.random()}`,
            name: item.name,
            slug: item.productSlug || item.slug || item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            price: item.price || 0,
            mrp: item.mrp || item.price || 0,
            imageUrl: imgUrl,
            unit: item.unit || '1 unit',
            lastOrderedDate: dateLabel,
            orderCount: 1,
            stock: item.stock ?? 100,
            isAvailable: item.isAvailable ?? true,
          });
        }
      });
    });

    return Array.from(productMap.values()).slice(0, 12);
  }, [activeOrders]);

  if (realBuyAgainItems.length === 0) {
    return null;
  }

  const handleAddToCart = (item: any) => {
    addItem({
      id: item.id,
      name: item.name,
      slug: item.slug,
      imageUrl: item.imageUrl,
      mrp: item.mrp,
      price: item.price,
      discount: item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0,
      unit: item.unit,
      stock: item.stock ?? 50,
      isAvailable: item.isAvailable ?? true,
    });
    toast.success(`${item.name} added to cart \u{1F6D2}️`);
  };

  return (
    <View
      style={{
        marginHorizontal: THEME.SPACING.lg,
        marginVertical: THEME.SPACING.sm,
        borderRadius: THEME.RADIUS.lg,
        padding: THEME.SPACING.md,
        backgroundColor: isDarkMode ? 'rgba(24, 24, 27, 0.7)' : '#ffffff',
        borderWidth: 1,
        borderColor: isDarkMode ? colors.border : THEME.COLORS.light.border,
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
          },
          android: { elevation: 2 }
        })
      }}
    >
      {/* Section Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: THEME.SPACING.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 38,
            height: 38,
            borderRadius: THEME.RADIUS.md,
            backgroundColor: isDarkMode ? `${THEME.COLORS.brand.primary}26` : '#fff1f2',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isDarkMode ? `${THEME.COLORS.brand.primary}4D` : '#ffe4e6'
          }}>
            <History size={18} color={THEME.COLORS.brand.primary} strokeWidth={2.5} />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 15, fontWeight: THEME.TYPOGRAPHY.weights.extrabold, color: colors.textPrimary, letterSpacing: -0.2 }}>
                Buy It Again
              </Text>
              <View style={{ backgroundColor: THEME.COLORS.brand.primary, borderRadius: THEME.RADIUS.pill, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: THEME.TYPOGRAPHY.weights.black, textTransform: 'uppercase' }}>
                  Favorites
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.semibold, color: colors.textSecondary, marginTop: 1 }}>
              Your past ordered favorites, 1-tap reorder
            </Text>
          </View>
        </View>
      </View>

      {/* Horizontal Scroll list of real ordered items */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: THEME.SPACING.sm, paddingBottom: 4 }}
        decelerationRate="fast"
      >
        {realBuyAgainItems.map((item) => (
          <View
            key={item.id}
            style={{
              width: 135,
              backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
              borderColor: isDarkMode ? colors.border : THEME.COLORS.light.border,
              borderWidth: 1,
              borderRadius: 16,
              padding: 10,
              alignItems: 'center',
              position: 'relative',
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                },
                android: { elevation: 1 }
              })
            }}
          >
            {/* Last ordered badge */}
            <View style={{
              position: 'absolute',
              top: 6,
              left: 6,
              zIndex: 5,
              backgroundColor: isDarkMode ? 'rgba(39,39,42,0.9)' : '#f8fafc',
              borderWidth: 1,
              borderColor: isDarkMode ? colors.border : THEME.COLORS.light.borderLight,
              borderRadius: 8,
              paddingHorizontal: 5,
              paddingVertical: 1.5,
            }}>
              <Text style={{ fontSize: 8, fontWeight: THEME.TYPOGRAPHY.weights.extrabold, color: colors.textSecondary }}>
                {item.lastOrderedDate}
              </Text>
            </View>

            {/* Product Image */}
            <View style={{
              width: 64,
              height: 64,
              borderRadius: 12,
              backgroundColor: isDarkMode ? colors.surfaceElevated : '#f8fafc',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 18,
              marginBottom: 8,
              overflow: 'hidden'
            }}>
              {item.imageUrl ? (
                <ExpoImage
                  source={{ uri: item.imageUrl }}
                  contentFit="contain"
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <ShoppingBag size={28} color={colors.textMuted} />
              )}
            </View>

            {/* Product Name */}
            <Text
              style={{
                fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
                fontWeight: THEME.TYPOGRAPHY.weights.bold,
                height: 30,
                textAlign: 'center',
                marginBottom: 4,
                lineHeight: 15,
                color: colors.textPrimary,
              }}
              numberOfLines={2}
            >
              {item.name}
            </Text>

            {/* Price stack */}
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: 8 }}>
              <Text style={{ fontSize: 13, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary }}>
                {formatPrice(item.price)}
              </Text>
              {item.mrp > item.price && (
                <Text style={{ fontSize: 9.5, fontWeight: THEME.TYPOGRAPHY.weights.semibold, color: colors.textMuted, textDecorationLine: 'line-through' }}>
                  {formatPrice(item.mrp)}
                </Text>
              )}
            </View>

            {/* Quick Add Button */}
            {(item.isAvailable === false || (item.stock !== undefined && item.stock <= 0)) ? (
              <ScalePressable
                onPress={() => toast.info(`We will notify you when ${item.name} is back in stock! \u{1F514}`)}
                scaleValue={0.92}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: THEME.COLORS.brand.warning,
                  backgroundColor: isDarkMode ? `${THEME.COLORS.brand.warning}1A` : '#fffbeb',
                  paddingVertical: 6,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bell size={13} color={THEME.COLORS.brand.warning} strokeWidth={2.5} />
              </ScalePressable>
            ) : (
              <ScalePressable
                onPress={() => handleAddToCart(item)}
                scaleValue={0.92}
                style={{
                  width: '100%',
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: THEME.COLORS.brand.primary,
                  backgroundColor: isDarkMode ? `${THEME.COLORS.brand.primary}1A` : '#ffffff',
                  paddingVertical: 5,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                }}
              >
                <Text style={{ color: THEME.COLORS.brand.primary, fontSize: 10.5, fontWeight: THEME.TYPOGRAPHY.weights.black, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                  ADD
                </Text>
                <Plus size={12} color={THEME.COLORS.brand.primary} strokeWidth={3} />
              </ScalePressable>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
