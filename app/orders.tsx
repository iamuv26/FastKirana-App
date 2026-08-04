import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
  useWindowDimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useFocusEffect } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Package,
  Truck,
  AlertCircle
} from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate
} from 'react-native-reanimated';
import { useAuthStore } from '../stores/auth-store';
import { useCartActions } from '../hooks/use-cart';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../lib/constants';
import { api } from '../lib/api-client';
import { formatPrice, formatDisplayOrderId } from '../lib/utils';
import { useResponsive, getCenteredContainerStyle } from '../lib/responsive';
import { toast } from '../lib/toast';
import { triggerHaptic } from '../lib/haptic';
import { useTheme } from './context/ThemeContext';
import { ScalePressable } from '../components/shared/ScalePressable';
import BuyAgainSection from '../components/home/BuyAgainSection';
import { THEME } from '../lib/theme';

interface OrderItem {
  id?: string;
  productId?: string;
  productSlug?: string;
  name: string;
  price: number;
  mrp?: number;
  quantity: number;
  imageUrl?: string;
  unit?: string;
}

interface Order {
  id: string;
  readableId?: number | null;
  status: string;
  total: number;
  createdAt: string;
  shopName?: string | null;
  items: OrderItem[];
}

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const { width } = useWindowDimensions();
  const responsive = useResponsive();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  const { addItem } = useCartActions();

  const tabTranslateX = useSharedValue(0);
  const tabContainerWidth = useMemo(() => {
    return Math.min(width - 32, 400);
  }, [width]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    const translationX = interpolate(
      tabTranslateX.value,
      [0, 1],
      [0, (tabContainerWidth - 8) / 2]
    );
    return {
      transform: [{ translateX: translationX }],
    };
  });

  const loadOrders = async () => {
    let serverOrders: Order[] = [];

    try {
      const data = await api.get('/orders');
      if (Array.isArray(data)) {
        serverOrders = data;
      }
    } catch (err) {
      console.warn('Failed to load orders from backend:', err);
    }

    const isMockUser = user?.id?.startsWith('mock-');
    if (__DEV__ || isMockUser) {
      try {
        const { mmkvStorage } = require('../lib/storage');
        const localKey = `local_orders_${user?.id || 'guest'}`;
        const localData = mmkvStorage.getItem(localKey);
        if (localData && localData !== 'undefined') {
          let localList = [];
          try {
            localList = JSON.parse(localData);
          } catch (jsonErr) { }
          if (Array.isArray(localList)) {
            const combined = [...localList];
            serverOrders.forEach((so: Order) => {
              if (!combined.some((lo) => lo.id === so.id)) {
                combined.push(so);
              }
            });
            combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setOrders(combined);
            setIsLoading(false);
            return;
          }
        }
      } catch (storageErr) { }
    }

    setOrders(serverOrders);
    setIsLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
      const interval = setInterval(loadOrders, 5000);
      return () => clearInterval(interval);
    }, [user])
  );

  const liveOrders = useMemo(() => {
    return orders.filter(o => !['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(o.status));
  }, [orders]);

  const historyOrders = useMemo(() => {
    return orders.filter(o => ['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(o.status));
  }, [orders]);

  useEffect(() => {
    if (!isLoading && liveOrders.length === 0 && historyOrders.length > 0) {
      setActiveTab('history');
      tabTranslateX.value = withSpring(1, { damping: 18, stiffness: 140 });
    }
  }, [isLoading, liveOrders.length, historyOrders.length]);

  const handleTabSwitch = (tab: 'live' | 'history') => {
    triggerHaptic('light');
    setActiveTab(tab);
    tabTranslateX.value = withSpring(tab === 'live' ? 0 : 1, { damping: 18, stiffness: 140 });
  };

  const handleReorder = (order: Order) => {
    triggerHaptic('success');
    if (!order.items || order.items.length === 0) return;

    order.items.forEach((item) => {
      addItem({
        id: item.productId || item.id || '',
        name: item.name,
        slug: item.productSlug || item.name.toLowerCase().replace(/\s+/g, '-'),
        imageUrl: item.imageUrl || null,
        mrp: item.mrp || item.price,
        price: item.price,
        discount: item.mrp ? Math.max(0, item.mrp - item.price) : 0,
        unit: item.unit || '1 unit',
        stock: 50,
        isAvailable: true,
        category: null,
      });
    });
    toast.success(`Readded items from Order #${formatDisplayOrderId(order.id, order.readableId)} 🛍️`);
    router.push('/(tabs)');
  };

  const getStatusBadge = (status: string) => {
    const label = ORDER_STATUS_LABELS[status] || status;
    const isLive = !['DELIVERED', 'CANCELLED'].includes(status);
    const statusConfig = ORDER_STATUS_COLORS[status] || ORDER_STATUS_COLORS.DEFAULT;
    const bg = isLive ? THEME.COLORS.successLight : (status === 'DELIVERED' ? '#f0fdf4' : '#fef2f2');
    const border = isLive ? '#bbf7d0' : (status === 'DELIVERED' ? '#bbf7d0' : '#fecaca');
    const text = isLive ? '#15803d' : (status === 'DELIVERED' ? '#15803d' : '#b91c1c');

    return (
      <View style={{
        paddingHorizontal: 9,
        paddingVertical: 3,
        borderRadius: 10,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
      }}>
        {isLive && (
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.COLORS.success }} />
        )}
        <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '900', color: text, letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </Text>
      </View>
    );
  };

  const isStepComplete = (stepStatuses: string[], current: string) => stepStatuses.includes(current);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderLight }]}>
        <ScalePressable
          onPress={() => router.back()}
          scaleValue={0.9}
          style={[styles.backBtn, { backgroundColor: isDarkMode ? colors.borderLight : THEME.COLORS.light.borderLight }]}
        >
          <ArrowLeft size={18} color={isDarkMode ? '#ffffff' : colors.textPrimary} />
        </ScalePressable>

        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          My Orders
        </Text>

        <View style={{ width: 34 }} />
      </View>

      {/* Segmented Control Tabs */}
      <View style={styles.tabContainerWrap}>
        <View style={[
          styles.tabContainer,
          { backgroundColor: colors.borderLight, borderColor: colors.border, width: tabContainerWidth }
        ]}>
          <Animated.View style={[
            styles.activeIndicator,
            { width: (tabContainerWidth - 8) / 2 },
            animatedIndicatorStyle
          ]} />

          <Pressable onPress={() => handleTabSwitch('live')} style={styles.tabBtn}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              {liveOrders.length > 0 && (
                <View style={[styles.liveDotPulse, { backgroundColor: THEME.COLORS.success }]} />
              )}
              <Text style={[
                styles.tabText,
                activeTab === 'live' ? styles.tabTextActive : { color: colors.textSecondary }
              ]}>
                Live Orders ({liveOrders.length})
              </Text>
            </View>
          </Pressable>

          <Pressable onPress={() => handleTabSwitch('history')} style={styles.tabBtn}>
            <Text style={[
              styles.tabText,
              activeTab === 'history' ? styles.tabTextActive : { color: colors.textSecondary }
            ]}>
              History ({historyOrders.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingHorizontal: responsive.spacing.page,
          paddingTop: responsive.spacing.card,
          paddingBottom: 100,
          ...getCenteredContainerStyle(responsive),
        }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={THEME.COLORS.brand.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Syncing live orders...
            </Text>
          </View>
        ) : activeTab === 'live' ? (
          liveOrders.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={{ fontSize: 44 }}>🛵</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Active Orders
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                You don't have any ongoing orders at the moment. Explore items and place an order!
              </Text>
              <ScalePressable
                onPress={() => router.replace('/(tabs)')}
                scaleValue={0.96}
                style={styles.shopBtn}
              >
                <ShoppingBag size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.shopBtnText}>Start Shopping</Text>
              </ScalePressable>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {liveOrders.map((order) => {
                const packedStepStatuses = ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'];
                const shippedStepStatuses = ['SHIPPED', 'OUT_FOR_DELIVERY'];
                return (
                  <ScalePressable
                    key={order.id}
                    onPress={() => router.push(`/order/${order.id}`)}
                    scaleValue={0.98}
                    style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  >
                    {/* Top Live Bar Header */}
                    <View style={[styles.cardHeaderRow, { borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={[styles.orderIdLabel, { color: THEME.COLORS.brand.primary }]}>ACTIVE ORDER</Text>
                        <Text style={[styles.orderIdValue, { color: colors.textPrimary }]}>
                          #{formatDisplayOrderId(order.id, order.readableId)}
                        </Text>
                      </View>

                      {getStatusBadge(order.status)}
                    </View>

                    {/* Items List */}
                    <View style={styles.cardItemsWrap}>
                      <Text numberOfLines={2} style={[styles.itemSummaryText, { color: colors.textSecondary }]}>
                        {order.items.map(it => `${it.name} (${it.quantity}x)`).join('  •  ')}
                      </Text>
                    </View>

                    {/* Stage Progress Visual */}
                    <View style={[
                      styles.progressRow,
                      {
                        backgroundColor: isDarkMode ? 'rgba(16,185,129,0.06)' : 'rgba(16, 185, 129, 0.04)',
                        borderColor: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16, 185, 129, 0.08)',
                        borderWidth: 1,
                      }
                    ]}>
                      <View style={styles.progressStep}>
                        <View style={[styles.stepIconCircle, { backgroundColor: '#dcfce7' }]}>
                          <CheckCircle2 size={13} color={THEME.COLORS.success} />
                        </View>
                        <Text style={[styles.stepText, { color: colors.textPrimary }]}>Confirmed</Text>
                      </View>
                      <View style={[
                        styles.progressLine,
                        { backgroundColor: isStepComplete(packedStepStatuses, order.status) ? THEME.COLORS.success : colors.border }
                      ]} />

                      <View style={styles.progressStep}>
                        <View style={[
                          styles.stepIconCircle,
                          { backgroundColor: isStepComplete(packedStepStatuses, order.status) ? '#dcfce7' : colors.borderLight }
                        ]}>
                          <Package size={13} color={isStepComplete(packedStepStatuses, order.status) ? THEME.COLORS.success : colors.textMuted} />
                        </View>
                        <Text style={[
                          styles.stepText,
                          { color: isStepComplete(packedStepStatuses, order.status) ? colors.textPrimary : colors.textMuted }
                        ]}>Packed</Text>
                      </View>
                      <View style={[
                        styles.progressLine,
                        { backgroundColor: isStepComplete(shippedStepStatuses, order.status) ? '#2563eb' : colors.border }
                      ]} />

                      <View style={styles.progressStep}>
                        <View style={[
                          styles.stepIconCircle,
                          { backgroundColor: isStepComplete(shippedStepStatuses, order.status) ? '#eff6ff' : colors.borderLight }
                        ]}>
                          <Truck size={13} color={isStepComplete(shippedStepStatuses, order.status) ? '#2563eb' : colors.textMuted} />
                        </View>
                        <Text style={[
                          styles.stepText,
                          { color: isStepComplete(shippedStepStatuses, order.status) ? colors.textPrimary : colors.textMuted }
                        ]}>On the way</Text>
                      </View>
                    </View>

                    {/* Footer Row */}
                    <View style={[styles.cardFooterRow, { borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} color={colors.textMuted} />
                        <Text style={[styles.timestampText, { color: colors.textSecondary }]}>
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>
                          {formatPrice(order.total)}
                        </Text>
                        <View style={styles.trackBtn}>
                          <Text style={styles.trackBtnText}>Track</Text>
                          <ChevronRight size={13} color="#ffffff" />
                        </View>
                      </View>
                    </View>
                  </ScalePressable>
                );
              })}
            </View>
          )
        ) : (
          historyOrders.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={{ fontSize: 44 }}>📜</Text>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No Past Orders
              </Text>
              <Text style={[styles.emptySub, { color: colors.textSecondary }]}>
                Your order history will appear here after your first completed delivery.
              </Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {historyOrders.map((order) => (
                <ScalePressable
                  key={order.id}
                  onPress={() => router.push(`/order/${order.id}`)}
                  scaleValue={0.98}
                  style={[styles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                >
                  <View style={[styles.cardHeaderRow, { borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={[styles.orderIdLabel, { color: THEME.COLORS.brand.primary }]}>
                        ORDER #{formatDisplayOrderId(order.id, order.readableId)}
                      </Text>
                      <Text style={[styles.timestampText, { color: colors.textSecondary, marginTop: 4 }]}>
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Text>
                    </View>

                    {getStatusBadge(order.status)}
                  </View>

                  <View style={styles.cardItemsWrap}>
                    <Text numberOfLines={2} style={[styles.itemSummaryText, { color: colors.textSecondary }]}>
                      {order.items.map(it => `${it.name} (${it.quantity}x)`).join('  •  ')}
                    </Text>
                  </View>

                  <View style={[styles.cardFooterRow, { borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}>
                    <Text style={[styles.totalAmount, { color: colors.textPrimary }]}>
                      {formatPrice(order.total)}
                    </Text>

                    <ScalePressable
                      onPress={() => handleReorder(order)}
                      scaleValue={0.94}
                      style={styles.reorderBtn}
                    >
                      <RotateCcw size={13} color={THEME.COLORS.brand.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.reorderBtnText}>Reorder</Text>
                    </ScalePressable>
                  </View>
                </ScalePressable>
              ))}

              <View style={{ marginTop: 8 }}>
                <BuyAgainSection orders={orders} />
              </View>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm + 4,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.titleSm,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    letterSpacing: -0.3,
  },
  tabContainerWrap: {
    alignItems: 'center',
    paddingVertical: THEME.SPACING.sm + 2,
    backgroundColor: 'transparent',
  },
  tabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 21,
    borderWidth: 1.2,
    padding: 4,
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    height: 34,
    top: 3,
    left: 4,
    borderRadius: 17,
    backgroundColor: THEME.COLORS.brand.primary,
    shadowColor: THEME.COLORS.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
  },
  liveDotPulse: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  tabText: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  scrollView: { flex: 1 },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
    marginTop: THEME.SPACING.sm,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: THEME.SPACING.xxl,
  },
  emptyTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.title,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    marginTop: THEME.SPACING.md,
  },
  emptySub: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    textAlign: 'center',
    marginTop: THEME.SPACING.xs + 2,
    lineHeight: 18,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.brand.primary,
    paddingHorizontal: THEME.SPACING.xxl,
    paddingVertical: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.lg,
    marginTop: THEME.SPACING.md + 6,
    ...THEME.SHADOWS.primaryGlow,
  },
  shopBtnText: {
    color: '#ffffff',
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },
  orderCard: {
    borderRadius: THEME.RADIUS.xl,
    borderWidth: 1.2,
    padding: THEME.SPACING.md + 4,
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    ...THEME.SHADOWS.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: THEME.SPACING.xs + 2,
    borderBottomWidth: 1,
  },
  orderIdLabel: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    letterSpacing: 0.6,
  },
  orderIdValue: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm + 1,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    marginTop: 1,
  },
  cardItemsWrap: {
    paddingVertical: THEME.SPACING.sm,
  },
  itemSummaryText: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    lineHeight: 18,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.SPACING.sm,
    paddingHorizontal: THEME.SPACING.xs + 2,
    borderRadius: THEME.RADIUS.md,
    marginBottom: THEME.SPACING.sm + 2,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
  },
  progressLine: {
    flex: 1,
    height: 1.5,
    marginHorizontal: 4,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: THEME.SPACING.sm,
    borderTopWidth: 1,
  },
  timestampText: {
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
  },
  totalAmount: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm + 2,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.brand.primary,
    paddingHorizontal: THEME.SPACING.sm + 4,
    paddingVertical: THEME.SPACING.xs + 1,
    borderRadius: THEME.RADIUS.sm,
    gap: 2,
  },
  trackBtnText: {
    color: '#ffffff',
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.brand.primaryLight,
    borderWidth: 1,
    borderColor: THEME.COLORS.brand.primaryLight,
    paddingHorizontal: THEME.SPACING.sm + 4,
    paddingVertical: THEME.SPACING.xs + 1,
    borderRadius: THEME.RADIUS.sm,
  },
  reorderBtnText: {
    color: THEME.COLORS.brand.primary,
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },
});
