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
import { API_BASE_URL, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../lib/constants';
import { api } from '../lib/api-client';
import { formatPrice } from '../lib/utils';
import { toast } from '../lib/toast';
import { triggerHaptic } from '../lib/haptic';
import { useTheme } from './context/ThemeContext';
import { ScalePressable } from '../components/shared/ScalePressable';
import BuyAgainSection from '../components/home/BuyAgainSection';

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
  const { width } = useWindowDimensions();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  const { addItem } = useCartActions();

  // Tab Indicator Animation
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
          } catch (jsonErr) {}
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
      } catch (storageErr) {}
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

  // Split Orders into Live Active vs Past History
  const liveOrders = useMemo(() => {
    return orders.filter(o => !['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(o.status));
  }, [orders]);

  const historyOrders = useMemo(() => {
    return orders.filter(o => ['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(o.status));
  }, [orders]);

  // Auto-switch to history if no live orders exist on load
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
    toast.success(`Readded items from Order #${order.id.slice(-6).toUpperCase()} 🛍️`);
    router.push('/(tabs)');
  };

  const getStatusBadge = (status: string) => {
    const label = ORDER_STATUS_LABELS[status] || status;
    const isLive = !['DELIVERED', 'CANCELLED'].includes(status);
    const bg = isLive ? '#eff6ff' : (status === 'DELIVERED' ? '#f0fdf4' : '#fef2f2');
    const border = isLive ? '#bfdbfe' : (status === 'DELIVERED' ? '#bbf7d0' : '#fecaca');
    const text = isLive ? '#1d4ed8' : (status === 'DELIVERED' ? '#15803d' : '#b91c1c');

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
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#2563eb' }} />
        )}
        <Text style={{ fontSize: 10, fontWeight: '900', color: text, letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDarkMode ? styles.bgDark : styles.bgLight]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />

      {/* Header */}
      <View style={[styles.header, isDarkMode ? styles.headerDark : styles.headerLight]}>
        <ScalePressable
          onPress={() => router.back()}
          scaleValue={0.9}
          style={[styles.backBtn, isDarkMode ? styles.backBtnDark : styles.backBtnLight]}
        >
          <ArrowLeft size={18} color={isDarkMode ? '#ffffff' : '#0f172a'} />
        </ScalePressable>
        
        <Text style={[styles.headerTitle, isDarkMode ? styles.textLight : styles.textDark]}>
          My Orders
        </Text>

        <View style={{ width: 34 }} />
      </View>

      {/* Segmented Control Tabs (LIVE ORDERS vs ORDER HISTORY) */}
      <View style={styles.tabContainerWrap}>
        <View style={[
          styles.tabContainer, 
          isDarkMode ? styles.tabContainerDark : styles.tabContainerLight,
          { width: tabContainerWidth }
        ]}>
          {/* Gliding Active Indicator */}
          <Animated.View style={[
            styles.activeIndicator,
            { width: (tabContainerWidth - 8) / 2 },
            animatedIndicatorStyle
          ]} />

          {/* Live Orders Tab */}
          <Pressable
            onPress={() => handleTabSwitch('live')}
            style={styles.tabBtn}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              {liveOrders.length > 0 && (
                <View style={styles.liveDotPulse} />
              )}
              <Text style={[
                styles.tabText,
                activeTab === 'live' ? styles.tabTextActive : (isDarkMode ? styles.tabTextInactiveDark : styles.tabTextInactiveLight)
              ]}>
                Live Orders ({liveOrders.length})
              </Text>
            </View>
          </Pressable>

          {/* Order History Tab */}
          <Pressable
            onPress={() => handleTabSwitch('history')}
            style={styles.tabBtn}
          >
            <Text style={[
              styles.tabText,
              activeTab === 'history' ? styles.tabTextActive : (isDarkMode ? styles.tabTextInactiveDark : styles.tabTextInactiveLight)
            ]}>
              History ({historyOrders.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#e20a22" />
            <Text style={[styles.loadingText, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
              Syncing live orders...
            </Text>
          </View>
        ) : activeTab === 'live' ? (
          /* LIVE ORDERS TAB CONTENT */
          liveOrders.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={{ fontSize: 44 }}>🛵</Text>
              <Text style={[styles.emptyTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                No Active Orders
              </Text>
              <Text style={[styles.emptySub, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
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
              {liveOrders.map((order) => (
                <ScalePressable
                  key={order.id}
                  onPress={() => router.push(`/order/${order.id}`)}
                  scaleValue={0.98}
                  style={[styles.orderCard, isDarkMode ? styles.orderCardDark : styles.orderCardLight]}
                >
                  {/* Top Live Bar Header */}
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.orderIdLabel}>ACTIVE ORDER</Text>
                      <Text style={[styles.orderIdValue, isDarkMode ? styles.textLight : styles.textDark]}>
                        #{order.id.slice(-8).toUpperCase()}
                      </Text>
                    </View>

                    {getStatusBadge(order.status)}
                  </View>

                  {/* Items List */}
                  <View style={styles.cardItemsWrap}>
                    <Text numberOfLines={2} style={[styles.itemSummaryText, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
                      {order.items.map(it => `${it.name} (${it.quantity}x)`).join(', ')}
                    </Text>
                  </View>

                  {/* Stage Progress Visual */}
                  <View style={styles.progressRow}>
                    <View style={styles.progressStep}>
                      <View style={[styles.stepIconCircle, { backgroundColor: '#dcfce7' }]}>
                        <CheckCircle2 size={13} color="#16a34a" />
                      </View>
                      <Text style={styles.stepText}>Confirmed</Text>
                    </View>
                    <View style={styles.progressLine} />
                    
                    <View style={styles.progressStep}>
                      <View style={[
                        styles.stepIconCircle, 
                        { backgroundColor: ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status) ? '#dcfce7' : '#f1f5f9' }
                      ]}>
                        <Package size={13} color={['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status) ? '#16a34a' : '#94a3b8'} />
                      </View>
                      <Text style={styles.stepText}>Packed</Text>
                    </View>
                    <View style={styles.progressLine} />

                    <View style={styles.progressStep}>
                      <View style={[
                        styles.stepIconCircle, 
                        { backgroundColor: ['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status) ? '#eff6ff' : '#f1f5f9' }
                      ]}>
                        <Truck size={13} color={['SHIPPED', 'OUT_FOR_DELIVERY'].includes(order.status) ? '#2563eb' : '#94a3b8'} />
                      </View>
                      <Text style={styles.stepText}>On the way</Text>
                    </View>
                  </View>

                  {/* Footer Row */}
                  <View style={styles.cardFooterRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Clock size={12} color={isDarkMode ? '#71717a' : '#94a3b8'} />
                      <Text style={[styles.timestampText, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={[styles.totalAmount, isDarkMode ? styles.textLight : styles.textDark]}>
                        {formatPrice(order.total)}
                      </Text>
                      <View style={styles.trackBtn}>
                        <Text style={styles.trackBtnText}>Track Order</Text>
                        <ChevronRight size={13} color="#ffffff" />
                      </View>
                    </View>
                  </View>
                </ScalePressable>
              ))}
            </View>
          )
        ) : (
          /* ORDER HISTORY TAB CONTENT */
          historyOrders.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={{ fontSize: 44 }}>📜</Text>
              <Text style={[styles.emptyTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                No Past Orders
              </Text>
              <Text style={[styles.emptySub, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
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
                  style={[styles.orderCard, isDarkMode ? styles.orderCardDark : styles.orderCardLight]}
                >
                  {/* Top Bar Header */}
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={styles.orderIdLabel}>ORDER #{order.id.slice(-8).toUpperCase()}</Text>
                      <Text style={[styles.timestampText, isDarkMode ? styles.subtextDark : styles.subtextLight, { marginTop: 2 }]}>
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

                  {/* Items List */}
                  <View style={styles.cardItemsWrap}>
                    <Text numberOfLines={2} style={[styles.itemSummaryText, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
                      {order.items.map(it => `${it.name} (${it.quantity}x)`).join(', ')}
                    </Text>
                  </View>

                  {/* Footer Row */}
                  <View style={styles.cardFooterRow}>
                    <Text style={[styles.totalAmount, isDarkMode ? styles.textLight : styles.textDark]}>
                      {formatPrice(order.total)}
                    </Text>

                    <ScalePressable
                      onPress={() => handleReorder(order)}
                      scaleValue={0.94}
                      style={styles.reorderBtn}
                    >
                      <RotateCcw size={13} color="#e20a22" style={{ marginRight: 4 }} />
                      <Text style={styles.reorderBtnText}>Reorder</Text>
                    </ScalePressable>
                  </View>
                </ScalePressable>
              ))}

              {/* Buy Again Section */}
              <View style={{ marginTop: 8 }}>
                <BuyAgainSection />
              </View>
            </View>
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgLight: {
    backgroundColor: '#f8fafc',
  },
  bgDark: {
    backgroundColor: '#09090b',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderColor: '#f1f5f9',
  },
  headerDark: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnLight: {
    backgroundColor: '#f1f5f9',
  },
  backBtnDark: {
    backgroundColor: '#27272a',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  textLight: {
    color: '#0f172a',
  },
  textDark: {
    color: '#f4f4f5',
  },
  subtextLight: {
    color: '#64748b',
  },
  subtextDark: {
    color: '#a1a1aa',
  },
  tabContainerWrap: {
    alignItems: 'center',
    paddingVertical: 10,
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
  tabContainerLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  tabContainerDark: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  activeIndicator: {
    position: 'absolute',
    height: 34,
    top: 3,
    left: 4,
    borderRadius: 17,
    backgroundColor: '#e20a22',
    shadowColor: '#e20a22',
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
    backgroundColor: '#22c55e',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  tabTextActive: {
    color: '#ffffff',
  },
  tabTextInactiveLight: {
    color: '#64748b',
  },
  tabTextInactiveDark: {
    color: '#a1a1aa',
  },
  scrollView: {
    flex: 1,
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 10,
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  shopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e20a22',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 18,
  },
  shopBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  orderCard: {
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      }
    })
  },
  orderCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  orderCardDark: {
    backgroundColor: '#18181b',
    borderColor: '#27272a',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  orderIdLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#e20a22',
    letterSpacing: 0.6,
  },
  orderIdValue: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 1,
  },
  cardItemsWrap: {
    paddingVertical: 10,
  },
  itemSummaryText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 6,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    marginBottom: 10,
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
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  progressLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  timestampText: {
    fontSize: 11,
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: '900',
  },
  trackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e20a22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  trackBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontWeight: '900',
  },
  reorderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  reorderBtnText: {
    color: '#e20a22',
    fontSize: 11.5,
    fontWeight: '900',
  },
});
