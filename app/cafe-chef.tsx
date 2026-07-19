import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Platform, TextInput, Modal, TouchableOpacity, useWindowDimensions, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Check, ChefHat, RefreshCw, Search, Plus, Minus, AlertTriangle, X, TrendingUp, ShoppingBag, Calendar, DollarSign, Percent, ClipboardList, Package, Flame, LogOut } from 'lucide-react-native';
import { triggerHaptic } from '../lib/haptic';
import { toast } from '../lib/toast';
import { useAuthStore } from '../stores/auth-store';
import { API_BASE_URL } from '../lib/constants';
import { StatusBar } from 'expo-status-bar';
import { useNewOrderAlert } from '../hooks/use-new-order-alert';
import { NewOrderAlertModal } from '../components/operations/NewOrderAlertModal';
import { useTheme } from './context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, FadeIn, FadeOut } from 'react-native-reanimated';

interface OrderItem {
  id: string;
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  categorySlug?: string;
  selectedVariant?: string | null;
  cooked?: boolean;
  notes?: string | null;
}

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  deliveryFee?: number;
  miscFee?: number;
  discount?: number;
  createdAt: string;
  paymentMethod: 'UPI' | 'COD' | 'CARD';
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  user: { name: string; phone: string };
  address: { houseNo: string; street: string; area: string; city: string; pincode: string };
  items: OrderItem[];
}

const INITIAL_SIMULATION_ORDERS: Order[] = [
  {
    id: "ord-102",
    status: "CONFIRMED",
    total: 194,
    createdAt: new Date(Date.now() - 8 * 60000).toISOString(),
    paymentMethod: "COD",
    deliveryMethod: "DELIVERY",
    user: { name: "Rahul Singh", phone: "+919999900000" },
    address: { houseNo: "Flat 204", street: "Kalyanpur Road", area: "Ghatampur", city: "Kanpur", pincode: "209206" },
    items: [
      { id: "oi4", name: "Veg Fried Momos", price: 49, quantity: 2, categorySlug: "restaurant" },
      { id: "oi5", name: "Classic Cold Coffee", price: 79, quantity: 1, categorySlug: "restaurant" }
    ]
  }
];

function LivePulseDot() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1.6, { duration: 1200 }), -1, false);
    opacity.value = withRepeat(withTiming(0, { duration: 1200 }), -1, false);
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={{ width: 14, height: 14, justifyContent: 'center', alignItems: 'center', marginRight: 4 }}>
      <Animated.View style={[{ position: 'absolute', width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981' }, glowStyle]} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
    </View>
  );
}

export default function CafeChefScreen() {
  const { theme } = useTheme();
  const isDarkMode = false;
  const isItemNonVeg = (name: string) => {
    const n = name.toLowerCase();
    return n.includes('chicken') || n.includes('egg') || n.includes('fish') || n.includes('meat') || n.includes('pork') || n.includes('mutton') || n.includes('non-veg') || n.includes('nonveg') || n.includes('wings') || (n.includes('burger') && !n.includes('veg'));
  };
  const { user, logout } = useAuthStore();
  const { activeAlertOrder, acknowledgeAlert, acceptOrder, refreshAlerts } = useNewOrderAlert(user?.role === 'CHEF');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { width: windowWidth } = useWindowDimensions();

  // --- Chef Console Order Edit States ---
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [outOfStockProductIds, setOutOfStockProductIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [editTaxRate, setEditTaxRate] = useState<number>(0.05); // Default 5%
  const [deliveryFeeSetting, setDeliveryFeeSetting] = useState<number>(25);
  const [miscFeeSetting, setMiscFeeSetting] = useState<number>(5);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState<number>(200);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(query));
    setSearchResults(filtered);
  }, [searchQuery, allProducts]);

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'ANALYTICS' | 'INVENTORY'>('ORDERS');
  const [inventoryProducts, setInventoryProducts] = useState<any[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(false);
  const [inventorySearchQuery, setInventorySearchQuery] = useState('');

  // Analytics states
  const [summary, setSummary] = useState<any>({
    totalSales: 0,
    netProfit: 0,
    ordersCount: 0,
    avgOrderValue: 0
  });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [rangePreset, setRangePreset] = useState<'today' | 'yesterday' | '7days' | '30days'>('7days');
  const [isLoadingReports, setIsLoadingReports] = useState(false);

  const fetchReports = async (preset: string = rangePreset) => {
    setIsLoadingReports(true);
    try {
      const now = new Date();
      let start = new Date();
      let end = new Date();

      if (preset === 'today') {
        start = now;
      } else if (preset === 'yesterday') {
        start.setDate(now.getDate() - 1);
        end.setDate(now.getDate() - 1);
      } else if (preset === '7days') {
        start.setDate(now.getDate() - 7);
      } else if (preset === '30days') {
        start.setDate(now.getDate() - 30);
      }

      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      const res = await fetch(`${API_BASE_URL}/restaurant/reports?startDate=${startStr}&endDate=${endStr}`, {
        headers: getAuthHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary || {});
        setTopProducts(data.topProducts || []);
      }
    } catch (err) {
      console.warn('Failed to load restaurant analytics reports', err);
    } finally {
      setIsLoadingReports(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ANALYTICS') {
      fetchReports();
    }
  }, [activeTab, rangePreset]);

  const isTargetCategory = (slug?: string | null) => {
    const s = (slug || 'cafe').toLowerCase();
    return s === 'cafe' || s === 'burgers' || s === 'garlic-bread' || s === 'desserts' || s === 'beverages' || s === 'ice-cream' || s === 'bakery';
  };

  const fetchInventoryProducts = async () => {
    setIsLoadingInventory(true);
    try {
      const response = await fetch(`${API_BASE_URL}/products?category=cafe,burgers,garlic-bread,desserts,beverages,ice-cream,bakery&limit=300`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setInventoryProducts(data);
        }
      }
    } catch (err) {
      console.log('Error fetching inventory', err);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'INVENTORY') {
      fetchInventoryProducts();
    }
  }, [activeTab]);

  const toggleProductAvailability = async (productId: string, currentAvailable: boolean) => {
    triggerHaptic('light');
    setInventoryProducts(prev => prev.map(p => p.id === productId ? { ...p, isAvailable: !currentAvailable } : p));
    try {
      const res = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isAvailable: !currentAvailable })
      });
      if (!res.ok) {
        setInventoryProducts(prev => prev.map(p => p.id === productId ? { ...p, isAvailable: currentAvailable } : p));
        toast.error('Failed to update product availability');
      } else {
        toast.success('Availability updated!');
      }
    } catch (err) {
      setInventoryProducts(prev => prev.map(p => p.id === productId ? { ...p, isAvailable: currentAvailable } : p));
      toast.error('Network error updating availability');
    }
  };

  const filteredProducts = useMemo(() => {
    if (!inventorySearchQuery.trim()) return inventoryProducts;
    const q = inventorySearchQuery.toLowerCase();
    return inventoryProducts.filter(p => p.name?.toLowerCase().includes(q));
  }, [inventoryProducts, inventorySearchQuery]);

  const getAuthHeaders = (): Record<string, string> => {
    const { token } = useAuthStore.getState();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (user) {
      headers['x-user-id'] = user.id;
      headers['x-user-role'] = user.role;
      headers['x-user-email'] = user.email || '';
      headers['x-user-name'] = user.name || '';
      headers['x-user-phone'] = user.phone || '';
    }
    return headers;
  };

  const fetchServerOrders = async (showLoader = false) => {
    if (!user) return;
    if (showLoader) setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/picker/orders?type=cafe`, { 
        method: 'GET', 
        headers: getAuthHeaders() 
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const mappedOrders = data.map((ord: any) => ({
          id: ord.id,
          status: ord.status,
          total: ord.total,
          deliveryFee: ord.deliveryFee || 0,
          miscFee: ord.miscFee || 0,
          discount: ord.discount || 0,
          createdAt: ord.createdAt,
          paymentMethod: ord.paymentMethod || 'COD',
          deliveryMethod: ord.deliveryMethod || 'DELIVERY',
          user: ord.user ? {
            name: ord.user.name || 'Customer',
            phone: ord.user.phone || ''
          } : { name: 'Customer', phone: '' },
          address: ord.address ? {
            houseNo: ord.address.houseNo || '',
            street: ord.address.street || '',
            area: ord.address.area || '',
            city: ord.address.city || '',
            pincode: ord.address.pincode || ''
          } : { houseNo: '', street: '', area: '', city: '', pincode: '' },
          items: (ord.items || []).map((it: any) => ({
            id: it.id,
            productId: it.productId || it.product?.id || it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            imageUrl: it.imageUrl || it.product?.imageUrl || null,
            categorySlug: it.product?.category?.slug || 'restaurant',
            selectedVariant: it.selectedVariant || null,
            cooked: it.cooked || false,
            notes: it.notes || null
          }))
        }));
        setOrders(mappedOrders);
        setIsOnline(true);
      } else {
        setIsOnline(false);
      }
    } catch (err) {
      setIsOnline(false);
    } finally {
      if (showLoader) setIsRefreshing(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`${API_BASE_URL}/settings`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (data.tax_rate !== undefined) {
            setEditTaxRate(parseFloat(data.tax_rate) / 100);
          }
          if (data.delivery_fee !== undefined) {
            setDeliveryFeeSetting(parseFloat(data.delivery_fee));
          }
          if (data.misc_fee !== undefined) {
            setMiscFeeSetting(parseFloat(data.misc_fee));
          }
          if (data.cafe_free_delivery_threshold !== undefined) {
            setFreeDeliveryThreshold(parseFloat(data.cafe_free_delivery_threshold));
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch settings, using defaults:', err);
    }
  };

  const handleEditOrder = async (order: Order) => {
    setEditingOrder(order);
    setEditItems(order.items.map(it => ({ ...it })));
    setOutOfStockProductIds([]);
    setSearchQuery('');
    setSearchResults([]);

    // Pre-fetch all products for catalog suggestions / variant swap referencing
    try {
      const response = await fetch(`${API_BASE_URL}/products?category=cafe,burgers,garlic-bread,desserts,beverages,ice-cream,bakery&limit=300`);
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data)) {
          setAllProducts(data);
        }
      }
    } catch (err) {
      console.warn('Error loading products for edit suggestions', err);
    }
  };

  const updateItemQty = (productId: string, variant: string | null, delta: number) => {
    setEditItems(prev => {
      return prev.map(item => {
        if (item.productId === productId && item.selectedVariant === variant) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const updateItemVariant = (productId: string, oldVariant: string | null, newVariant: string, newPrice: number) => {
    setEditItems(prev => prev.map(item => {
      if (item.productId === productId && item.selectedVariant === oldVariant) {
        return {
          ...item,
          selectedVariant: newVariant,
          price: newPrice
        };
      }
      return item;
    }));
  };

  const markItemOutOfStock = (productId: string) => {
    if (!outOfStockProductIds.includes(productId)) {
      setOutOfStockProductIds(prev => [...prev, productId]);
    }
    setEditItems(prev => prev.filter(item => item.productId !== productId));
  };

  const addCatalogItem = (product: any) => {
    triggerHaptic('light');
    const existing = editItems.find(it => it.productId === product.id && it.selectedVariant === null);
    if (existing) {
      updateItemQty(product.id, null, 1);
    } else {
      const newItem = {
        id: `new-${Date.now()}`,
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1,
        imageUrl: product.imageUrl,
        categorySlug: product.category?.slug || 'cafe',
        selectedVariant: null,
        notes: null,
        cooked: false
      };
      setEditItems(prev => [...prev, newItem]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const saveEditedOrder = async () => {
    if (!editingOrder) return;
    setIsSavingEdit(true);
    triggerHaptic('medium');
    try {
      const subtotalVal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const deliveryFeeVal = editingOrder.deliveryMethod === 'PICKUP' 
        ? 0 
        : (subtotalVal < freeDeliveryThreshold ? deliveryFeeSetting : 0);
      const miscFeeVal = editingOrder.deliveryMethod === 'PICKUP' 
        ? 0 
        : (editingOrder.miscFee === 0 ? 0 : miscFeeSetting);
      const taxesVal = parseFloat((subtotalVal * editTaxRate).toFixed(2));
      const totalVal = subtotalVal + deliveryFeeVal + taxesVal + miscFeeVal - (editingOrder.discount || 0);

      const itemsPayload = editItems.map(it => ({
        productId: it.productId,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
        selectedVariant: it.selectedVariant,
        notes: it.notes
      }));

      const res = await fetch(`${API_BASE_URL}/orders/${editingOrder.id}/edit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          items: itemsPayload,
          subtotal: subtotalVal,
          deliveryFee: deliveryFeeVal,
          miscFee: miscFeeVal,
          taxes: taxesVal,
          total: totalVal,
          outOfStockProductIds
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Order updated successfully!');
        setEditingOrder(null);
        fetchServerOrders(false);
      } else {
        toast.error(data.error || 'Failed to edit order');
      }
    } catch (err) {
      console.warn('Error saving order edits', err);
      toast.error('Network error updating order');
    } finally {
      setIsSavingEdit(false);
    }
  };

  useEffect(() => {
    fetchServerOrders(true);
    fetchSettings();
  }, []);

  const updateOrderStatus = async (orderId: string, nextStatus: string, extraPayload: any = {}) => {
    if (!isOnline) return false;
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status: nextStatus, ...extraPayload })
      });
      const data = await res.json();
      if (res.ok) {
        fetchServerOrders(false);
        return true;
      } else {
        toast.error(data.error || 'Failed to update order status');
        return false;
      }
    } catch (err) {
      toast.error('Network error updating order status');
      return false;
    }
  };

  const triggerAudioBeep = () => {
    triggerHaptic('light');
  };

  const triggerAudioSuccess = () => {
    triggerHaptic('success');
  };

  const startPreparingChef = async (order: Order) => {
    if (isOnline) {
      const ok = await updateOrderStatus(order.id, 'CONFIRMED');
      if (!ok) return;
    } else {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'CONFIRMED' } : o));
    }
    triggerHaptic('medium');
    toast.success(`Started preparing Kitchen order #${order.id.slice(-6).toUpperCase()}`);
  };

  const markChefItemReady = async (orderId: string, itemId: string) => {
    let allChefItemsReady = false;
    let targetOrderUser = 'Customer';
    
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        targetOrderUser = o.user.name;
        const updatedItems = o.items.map(it => 
          it.id === itemId ? { ...it, cooked: !it.cooked } : it
        );
        
        allChefItemsReady = updatedItems
          .filter(it => isTargetCategory(it.categorySlug))
          .every(it => it.cooked === true);

        return { ...o, items: updatedItems };
      }
      return o;
    });

    if (allChefItemsReady) {
      if (isOnline) {
        const ok = await updateOrderStatus(orderId, 'PACKED');
        if (!ok) return;
      } else {
        setOrders(updatedOrders.map(o => o.id === orderId ? { ...o, status: 'PACKED' } : o));
      }
      triggerAudioSuccess();
      setTimeout(() => {
        toast.success(`☕ Cafe order for ${targetOrderUser} prepared! Sent to Rider.`);
      }, 300);
    } else {
      setOrders(updatedOrders);
      triggerAudioBeep();
    }
  };

  const pendingCafeOrders = useMemo(() => {
    return orders.filter(o => 
      (o.status === 'PENDING' || o.status === 'CONFIRMED') && 
      o.items.some(it => isTargetCategory(it.categorySlug))
    );
  }, [orders]);

  const aggregatedPrepItems = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number }> = {};
    orders.forEach(order => {
      if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') return;
      order.items.forEach(item => {
        if (!isTargetCategory(item.categorySlug)) return;
        if (item.cooked) return; // Only count uncooked/unprepared items

        if (!counts[item.name]) {
          counts[item.name] = {
            name: item.name,
            quantity: 0
          };
        }
        counts[item.name].quantity += item.quantity;
      });
    });
    return Object.values(counts).sort((a, b) => b.quantity - a.quantity);
  }, [orders]);
  return (
    <LinearGradient
      colors={isDarkMode ? ['#09090b', '#121214', '#09090b'] : ['#f8fafc', '#f1f5f9', '#f8fafc']}
      style={{ flex: 1 }}
    >
      <SafeAreaView 
        className="flex-1"
        style={{ backgroundColor: 'transparent' }}
      >
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* Premium Header */}
      <View className="px-4 py-3.5 flex-row items-center justify-between border-b bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800/80 shadow-xs">
        <View className="flex-row items-center gap-3">
          <Pressable 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/operations');
              }
            }}
            className="w-9 h-9 rounded-full bg-slate-50 dark:bg-zinc-800 items-center justify-center border border-slate-100 dark:border-zinc-700/80 active:scale-95 transition-transform"
          >
            <ArrowLeft size={16} color={isDarkMode ? "#fff" : "#1e293b"} />
          </Pressable>
          <View>
            <View className="flex-row items-center gap-2">
              <Text className="text-slate-800 dark:text-white font-extrabold text-sm tracking-tight">FastKirana Cafe Console</Text>
              <View className="flex-row items-center bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 px-2 py-0.5 rounded-full gap-1">
                <LivePulseDot />
                <Text className="text-orange-650 dark:text-orange-450 font-black text-[7.5px] tracking-wider uppercase">
                  {user?.role || 'CHEF'}
                </Text>
              </View>
            </View>
            <Text className="text-slate-400 dark:text-zinc-500 text-[9.5px] font-bold mt-0.5">FastKirana Cafe Food Prep Station</Text>
          </View>
        </View>
        
        <Pressable 
          onPress={() => {
            if (Platform.OS === 'web') {
              const confirmLogout = window.confirm('Are you sure you want to log out from the chef kitchen console?');
              if (confirmLogout) {
                logout();
                router.replace('/(auth)/login');
              }
            } else {
              Alert.alert(
                'Log Out',
                'Are you sure you want to log out?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { 
                    text: 'Log Out', 
                    style: 'destructive',
                    onPress: () => {
                      logout();
                      router.replace('/(auth)/login');
                    }
                  }
                ]
              );
            }
          }}
          className="px-3.5 py-1.5 rounded-full border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/10 active:scale-95"
        >
          <Text className="text-red-655 dark:text-red-400 font-extrabold text-[9.5px] uppercase tracking-wider">Log Out</Text>
        </Pressable>
      </View>

      {/* Tab Switcher - Glass Capsule design */}
      <View className="flex-row mx-4 mt-3 mb-4 bg-slate-100 dark:bg-zinc-900 rounded-xl p-1 border border-slate-200/50 dark:border-zinc-800/80">
        <Pressable 
          onPress={() => { triggerHaptic('light'); setActiveTab('ORDERS'); }}
          style={{ flex: 1, height: 34, justifyContent: 'center', alignItems: 'center', position: 'relative' }}
        >
          {activeTab === 'ORDERS' && (
            <LinearGradient
              colors={['#ea580c', '#f97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', left: 2, right: 2, top: 2, bottom: 2, borderRadius: 8 }}
            />
          )}
          <Text className={`font-black text-[11px] z-10 ${activeTab === 'ORDERS' ? 'text-white' : 'text-slate-500'}`}>
            Orders ({pendingCafeOrders.length})
          </Text>
        </Pressable>

        <Pressable 
          onPress={() => { triggerHaptic('light'); setActiveTab('ANALYTICS'); }}
          style={{ flex: 1, height: 34, justifyContent: 'center', alignItems: 'center', position: 'relative' }}
        >
          {activeTab === 'ANALYTICS' && (
            <LinearGradient
              colors={['#ea580c', '#f97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', left: 2, right: 2, top: 2, bottom: 2, borderRadius: 8 }}
            />
          )}
          <Text className={`font-black text-[11px] z-10 ${activeTab === 'ANALYTICS' ? 'text-white' : 'text-slate-500'}`}>
            Analytics
          </Text>
        </Pressable>

        <Pressable 
          onPress={() => { triggerHaptic('light'); setActiveTab('INVENTORY'); }}
          style={{ flex: 1, height: 34, justifyContent: 'center', alignItems: 'center', position: 'relative' }}
        >
          {activeTab === 'INVENTORY' && (
            <LinearGradient
              colors={['#ea580c', '#f97316']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', left: 2, right: 2, top: 2, bottom: 2, borderRadius: 8 }}
            />
          )}
          <Text className={`font-black text-[11px] z-10 ${activeTab === 'INVENTORY' ? 'text-white' : 'text-slate-500'}`}>
            Menu Stock
          </Text>
        </Pressable>
      </View>

      {/* Main Content */}
      {activeTab === 'ORDERS' ? (
        <ScrollView className="flex-1 p-4" showsVerticalScrollIndicator={false}>
          <View className="flex-row justify-between items-center mb-3.5">
            <View className="flex-row items-center gap-2">
              <View className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30 items-center justify-center">
                <Flame size={14} color="#ea580c" />
              </View>
              <View>
                <Text className="text-slate-800 dark:text-white font-extrabold text-[11px] uppercase tracking-wide">Cafe Cooking Queue</Text>
                <Text className="text-slate-400 dark:text-zinc-500 text-[8.5px] font-bold mt-0.5">Track & manage all kitchen preparations in real-time</Text>
              </View>
            </View>
            <Pressable 
              onPress={() => fetchServerOrders(true)} 
              className="w-8 h-8 rounded-full bg-white dark:bg-zinc-900 items-center justify-center border border-slate-100 dark:border-zinc-800 shadow-sm active:scale-90 transition-transform"
            >
              <RefreshCw size={12} color={isDarkMode ? '#ffffff' : '#64748b'} />
            </Pressable>
          </View>

          {/* Bulk Prep Box - Redesigned into glass card with shadow */}
          {aggregatedPrepItems.length > 0 && (
            <View className="mb-4 bg-orange-50/70 dark:bg-orange-950/10 border border-orange-100/60 dark:border-orange-900/20 rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center gap-1.5 mb-3">
                <ChefHat size={14} color="#ea580c" />
                <Text className="text-orange-650 dark:text-orange-400 font-black text-[9.5px] uppercase tracking-wider">Kitchen Prep Summary (Bulk Prepare)</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2.5 py-0.5">
                {aggregatedPrepItems.map((item, idx) => (
                  <View key={idx} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 flex-row items-center gap-2 shadow-2xs">
                    <Text className="text-slate-800 dark:text-slate-200 font-extrabold text-[11px]">{item.name}</Text>
                    <View className="bg-orange-500 px-2 py-0.5 rounded-full">
                      <Text className="text-white font-black text-[9px]">x{item.quantity}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {pendingCafeOrders.length === 0 ? (
            <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-8 items-center shadow-sm py-16">
              <Text className="text-4xl mb-1">☕</Text>
              <Text className="text-slate-800 dark:text-white font-black text-sm mt-3">No cafe items pending cooking</Text>
              <Text className="text-slate-400 dark:text-zinc-500 text-[10px] mt-1.5 text-center leading-normal max-w-xs">
                Restaurant orders placed on the customer app sync instantly to the chef console.
              </Text>
            </View>
          ) : (
            <View className="gap-4.5 mb-8">
              {pendingCafeOrders.map((ord) => {
                const cafeItems = ord.items.filter(it => isTargetCategory(it.categorySlug));
                const isPending = ord.status === 'PENDING';
                return (
                  <View key={ord.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-4.5 shadow-sm">
                    <View className="flex-row justify-between items-center border-b border-slate-50 dark:border-zinc-850 pb-3 mb-3">
                      <View>
                        <Text className="text-slate-800 dark:text-white font-black text-xs uppercase tracking-wide">Kitchen Job #{ord.id.slice(-6).toUpperCase()}</Text>
                        <Text className="text-slate-400 dark:text-zinc-500 text-[8.5px] font-bold mt-0.5">Order Time: {new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                      </View>
                      
                      {/* Gradient Status badge */}
                      <LinearGradient
                        colors={isPending ? ['#f59e0b', '#d97706'] : ['#ea580c', '#f97316']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="px-3 py-1 rounded-full shadow-2xs"
                      >
                        <Text className="text-white font-extrabold text-[8px] uppercase tracking-wider">
                          {isPending ? 'Pending' : 'Preparing'}
                        </Text>
                      </LinearGradient>
                    </View>

                    {isPending ? (
                      <View>
                        <Text className="text-slate-400 dark:text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider mb-2">Items Preview</Text>
                        <View className="gap-2 opacity-75 mb-4">
                          {cafeItems.map((item) => (
                            <View key={item.id} className="flex-row justify-between items-center p-3 rounded-2xl border border-slate-100 dark:border-zinc-800/85 bg-slate-50/50 dark:bg-zinc-950/40">
                              <View className="flex-1 pr-2">
                                <Text className="text-[11.5px] font-bold text-slate-800 dark:text-zinc-200">{item.name}</Text>
                                <Text className="text-slate-500 dark:text-zinc-450 text-[8.5px] font-bold mt-0.5">Quantity: x{item.quantity}</Text>
                                {item.notes && (
                                  <Text className="text-orange-600 dark:text-orange-400 text-[9px] font-black mt-1">🗒️ Note: {item.notes}</Text>
                                )}
                              </View>
                            </View>
                          ))}
                        </View>
                        <View style={{ flexDirection: 'row', gap: 10 }}>
                          <TouchableOpacity
                            onPress={() => handleEditOrder(ord)}
                            style={{ flex: 1, height: 42, borderWidth: 1, borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0', borderRadius: 14, justifyContent: 'center', alignItems: 'center' }}
                            activeOpacity={0.7}
                          >
                            <Text style={{ fontSize: 11, fontWeight: '800', color: isDarkMode ? '#e2e8f0' : '#475569' }}>Edit Order</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => startPreparingChef(ord)}
                            style={{ flex: 2, height: 42, borderRadius: 14, overflow: 'hidden' }}
                            activeOpacity={0.8}
                          >
                            <LinearGradient
                              colors={['#ea580c', '#f97316']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                            >
                              <ChefHat size={13} color="#fff" />
                              <Text style={{ color: '#ffffff', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' }}>Start Cooking</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <View>
                        <Text className="text-slate-400 dark:text-zinc-500 font-extrabold text-[9px] uppercase tracking-wider mb-2.5">Items to Cook (Tap to ready)</Text>
                        <View className="gap-2.5">
                          {cafeItems.map((item) => (
                            <Pressable
                              key={item.id}
                              onPress={() => markChefItemReady(ord.id, item.id)}
                              className={`flex-row justify-between items-center p-3.5 rounded-2xl border transition-all ${
                                item.cooked 
                                  ? 'bg-emerald-50/70 dark:bg-emerald-950/10 border-emerald-100/60 dark:border-emerald-900/20' 
                                  : 'bg-slate-50/50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850'
                              }`}
                            >
                              <View className="flex-1 pr-2">
                                <Text className={`text-[12px] font-bold ${item.cooked ? 'text-slate-400 dark:text-zinc-600 line-through' : 'text-slate-800 dark:text-zinc-100'}`}>
                                  {item.name}
                                </Text>
                                <Text className="text-slate-550 dark:text-zinc-450 text-[9px] font-extrabold mt-0.5">Quantity: x{item.quantity}</Text>
                                {item.notes && (
                                  <Text className="text-orange-655 dark:text-orange-400 text-[9px] font-black mt-1">🗒️ Note: {item.notes}</Text>
                                )}
                              </View>

                              {/* Interactive check badge */}
                              <View className={`w-6 h-6 rounded-full items-center justify-center border ${
                                item.cooked 
                                  ? 'bg-emerald-600 border-emerald-600' 
                                  : 'bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700'
                              }`}>
                                {item.cooked ? (
                                  <Check size={12} color="#fff" strokeWidth={3.5} />
                                ) : (
                                  <Text className="text-[10px] font-black text-slate-400 dark:text-slate-500">+</Text>
                                )}
                              </View>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          <View className="h-8" />
        </ScrollView>
      ) : activeTab === 'ANALYTICS' ? (
        <View className="flex-1 px-4">
          {/* Preset Buttons - Premium Pill layout */}
          <View className="flex-row gap-2 mb-4 bg-slate-100 dark:bg-zinc-900 p-1 rounded-xl border border-slate-200/40 dark:border-zinc-850">
            {(['today', 'yesterday', '7days', '30days'] as const).map((preset) => (
              <Pressable
                key={preset}
                onPress={() => { triggerHaptic('light'); setRangePreset(preset); }}
                className={`flex-1 py-1.5 rounded-lg items-center justify-center ${
                  rangePreset === preset ? 'bg-white dark:bg-zinc-800 shadow-xs' : ''
                }`}
              >
                <Text className={`font-black text-[10px] uppercase tracking-wider ${
                  rangePreset === preset ? 'text-red-600 dark:text-red-400 font-extrabold' : 'text-slate-500'
                }`}>
                  {preset === 'today' ? 'Today' : preset === 'yesterday' ? 'Yday' : preset === '7days' ? '7 Days' : '30 Days'}
                </Text>
              </Pressable>
            ))}
          </View>

          {isLoadingReports ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="small" color="#ea580c" />
              <Text className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold mt-2">Loading analytics...</Text>
            </View>
          ) : (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              {/* Financial Metrics Grid - Glass tiles with top accent indicator */}
              <View className="flex-row flex-wrap justify-between gap-y-3.5 mb-4">
                {/* Gross Revenue */}
                <View className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-4 w-[48%] shadow-2xs overflow-hidden relative">
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#10b981' }} />
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[9px] font-black uppercase text-slate-400">Gross Sales</Text>
                    <TrendingUp size={12} color="#10b981" />
                  </View>
                  <Text className="text-slate-800 dark:text-white font-extrabold text-sm">₹{summary.totalSales || 0}</Text>
                </View>

                {/* Net Profit */}
                <View className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-4 w-[48%] shadow-2xs overflow-hidden relative">
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#ea580c' }} />
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[9px] font-black uppercase text-slate-400">Net Profit</Text>
                    <Percent size={11} color="#ea580c" />
                  </View>
                  <Text className="text-slate-800 dark:text-white font-extrabold text-sm">₹{summary.netProfit || 0}</Text>
                </View>

                {/* Orders Count */}
                <View className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-4 w-[48%] shadow-2xs overflow-hidden relative">
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#3b82f6' }} />
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[9px] font-black uppercase text-slate-400">Orders</Text>
                    <ShoppingBag size={11} color="#3b82f6" />
                  </View>
                  <Text className="text-slate-800 dark:text-white font-extrabold text-sm">{summary.ordersCount || 0}</Text>
                </View>

                {/* Avg Value */}
                <View className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl p-4 w-[48%] shadow-2xs overflow-hidden relative">
                  <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#8b5cf6' }} />
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-[9px] font-black uppercase text-slate-400">Avg Value</Text>
                    <DollarSign size={11} color="#8b5cf6" />
                  </View>
                  <Text className="text-slate-800 dark:text-white font-extrabold text-sm">₹{Math.round(summary.avgOrderValue || 0)}</Text>
                </View>
              </View>

              {/* Top Products - Redesigned with visual quantity sales bars */}
              <View className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-3xl p-4.5 mb-6 shadow-xs">
                <Text className="text-slate-800 dark:text-white font-black text-xs mb-3.5">🔥 Top Selling Cafe Items</Text>
                {topProducts.length === 0 ? (
                  <Text className="text-slate-400 text-[10px] font-bold text-center py-4">No top products data for this period</Text>
                ) : (
                  <View className="gap-3.5">
                    {(() => {
                      const maxQty = Math.max(...topProducts.map(p => p.quantity), 1);
                      return topProducts.map((prod, idx) => {
                        const pct = (prod.quantity / maxQty) * 100;
                        return (
                          <View key={idx} className="pb-3.5 border-b border-slate-50 dark:border-zinc-850 last:border-b-0 last:pb-0">
                            <View className="flex-row justify-between items-center mb-1">
                              <View className="flex-1 pr-2">
                                <Text className="text-slate-800 dark:text-zinc-200 font-extrabold text-[12px]" numberOfLines={1}>{prod.name}</Text>
                                <Text className="text-slate-400 dark:text-zinc-500 text-[9px] font-bold mt-0.5">Qty sold: x{prod.quantity}</Text>
                              </View>
                              <View className="items-end">
                                <Text className="text-slate-800 dark:text-zinc-200 font-black text-[11px]">₹{prod.sales}</Text>
                                <Text className="text-emerald-600 dark:text-emerald-500 font-bold text-[8.5px] mt-0.5">Profit: ₹{prod.profit}</Text>
                              </View>
                            </View>
                            {/* Horizontal visual progress bar */}
                            <View style={{ height: 4, backgroundColor: isDarkMode ? '#1c1c1e' : '#f1f5f9', borderRadius: 2, overflow: 'hidden' }}>
                              <View style={{ height: '100%', width: `${pct}%`, backgroundColor: '#ea580c', borderRadius: 2 }} />
                            </View>
                          </View>
                        );
                      });
                    })()}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      ) : (
        <View className="flex-1 px-4">
          {/* Search Bar - Modern Glassmorphic style */}
          <View className="flex-row items-center bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 rounded-2xl px-3.5 py-2.5 mb-4 shadow-2xs">
            <Search size={14} color={isDarkMode ? '#a1a1aa' : '#64748b'} style={{ marginRight: 8 }} />
            <TextInput
              value={inventorySearchQuery}
              onChangeText={setInventorySearchQuery}
              placeholder="Search restaurant menu..."
              placeholderTextColor={isDarkMode ? '#71717a' : '#94a3b8'}
              className="flex-1 text-xs text-slate-800 dark:text-white font-bold p-0"
            />
          </View>

          {isLoadingInventory ? (
            <View className="flex-1 items-center justify-center py-20">
              <ActivityIndicator size="small" color="#ea580c" />
              <Text className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold mt-2">Loading items...</Text>
            </View>
          ) : filteredProducts.length === 0 ? (
            <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-100 dark:border-zinc-800/80 p-8 items-center shadow-sm py-16">
              <Text className="text-3xl mb-1">📦</Text>
              <Text className="text-slate-800 dark:text-white font-black text-xs mt-2">No items found</Text>
            </View>
          ) : (
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="gap-3 mb-6">
                {filteredProducts.map((product) => {
                  const available = product.isAvailable !== false;
                  const isNonVeg = product.tags?.some((t: string) => t.toLowerCase() === 'non-veg') || false;
                  return (
                    <View key={product.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800/85 p-3.5 flex-row justify-between items-center shadow-2xs">
                      <View className="flex-1 pr-3">
                        <View className="flex-row items-center gap-1.5 mb-1.5">
                          <View className={`px-2 py-0.5 rounded-full ${isNonVeg ? 'bg-red-50 dark:bg-red-950/20 border border-red-100/60 dark:border-red-900/30' : 'bg-green-50 dark:bg-green-950/20 border border-green-100/60 dark:border-green-900/30'}`}>
                            <Text className={`font-black text-[7.5px] tracking-wider uppercase ${isNonVeg ? 'text-red-600' : 'text-green-600'}`}>
                              {isNonVeg ? 'NON-VEG' : 'VEG'}
                            </Text>
                          </View>
                          <Text className="text-[8.5px] text-slate-400 dark:text-zinc-500 font-extrabold uppercase">{product.category?.name || 'Food'}</Text>
                        </View>
                        <Text className="text-slate-800 dark:text-white font-extrabold text-[12px] leading-normal">{product.name}</Text>
                        <Text className="text-slate-500 dark:text-zinc-400 text-[10px] font-black mt-1">₹{product.price}</Text>
                      </View>

                      {/* Sleek toggle capsule button */}
                      <View className="items-center">
                        <Pressable
                          onPress={() => toggleProductAvailability(product.id, available)}
                          className={`px-3 py-1.5 rounded-xl border flex-row items-center gap-1.5 ${
                            available 
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30' 
                              : 'bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-850'
                          }`}
                          style={{ minWidth: 95, justifyContent: 'center' }}
                        >
                          <View className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          <Text className={`font-black text-[9px] uppercase tracking-wider ${
                            available ? 'text-emerald-700 dark:text-emerald-500' : 'text-slate-500 dark:text-zinc-400'
                          }`}>
                            {available ? 'Available' : 'Out of Stock'}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
              <View className="h-6" />
            </ScrollView>
          )}
        </View>
      )}
      
      <NewOrderAlertModal
        order={activeAlertOrder}
        onAccept={async (id) => {
          const success = await acceptOrder(id);
          if (success) refreshAlerts();
          return success;
        }}
        onDismiss={acknowledgeAlert}
        isDarkMode={isDarkMode}
      />

      {/* Order Edit Modal Overlay (Native/Web responsive hybrid) */}
      <Modal
        visible={editingOrder !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditingOrder(null)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ width: '100%', maxWidth: 440, backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff', borderRadius: 24, padding: 20, maxHeight: '85%' }}>
            {/* Modal Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#27272a' : '#e2e8f0', paddingBottom: 12, marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#0f172a', textTransform: 'uppercase' }}>Edit Order Items</Text>
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: isDarkMode ? '#a1a1aa' : '#64748b', marginTop: 2 }}>Job #{editingOrder?.id.slice(-6).toUpperCase()}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditingOrder(null)} style={{ padding: 4 }}>
                <X size={16} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
              </TouchableOpacity>
            </View>

            {/* Catalog Search Input */}
            <View style={{ position: 'relative', marginBottom: 12, zIndex: 50 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9', borderRadius: 14, paddingHorizontal: 12, height: 40 }}>
                <Search size={14} color={isDarkMode ? '#94a3b8' : '#64748b'} style={{ marginRight: 8 }} />
                <TextInput
                  placeholder="Search catalog to add items..."
                  placeholderTextColor={isDarkMode ? '#71717a' : '#94a3b8'}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{ flex: 1, fontSize: 12, fontWeight: '700', color: isDarkMode ? '#ffffff' : '#0f172a' }}
                />
              </View>

              {/* Search Suggestions Dropdown */}
              {searchResults.length > 0 && (
                <View style={{ position: 'absolute', top: 44, left: 0, right: 0, maxHeight: 180, backgroundColor: isDarkMode ? '#27272a' : '#ffffff', borderWidth: 1, borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0', borderRadius: 14, zIndex: 100, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                  <ScrollView nestedScrollEnabled={true}>
                    {searchResults.map((prod) => (
                      <TouchableOpacity
                        key={prod.id}
                        onPress={() => addCatalogItem(prod)}
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: isDarkMode ? '#3f3f46' : '#f1f5f9' }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: isDarkMode ? '#fafafa' : '#1e293b', flex: 1, marginRight: 8 }}>{prod.name}</Text>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: '#ea580c' }}>₹{prod.price}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>

            {/* Scrollable list of current items */}
            <ScrollView style={{ flexGrow: 0, flexShrink: 1, marginBottom: 12 }} showsVerticalScrollIndicator={false} nestedScrollEnabled={true}>
              {editItems.length === 0 ? (
                <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>No items in order. Add items from catalog search.</Text>
                </View>
              ) : (
                editItems.map((item, idx) => {
                  const prodDetails = allProducts.find(p => p.id === item.productId);
                  const variants = prodDetails?.variants as any[] | undefined;
                  const hasItemVariants = variants && Array.isArray(variants) && variants.length > 0;

                  return (
                    <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: isDarkMode ? '#27272a' : '#f8fafc', borderRadius: 16, borderWidth: 1, borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0', marginBottom: 8 }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: isDarkMode ? '#fafafa' : '#1e293b' }} numberOfLines={1}>{item.name}</Text>
                        <Text style={{ fontSize: 9.5, fontWeight: '900', color: isDarkMode ? '#a1a1aa' : '#64748b', marginTop: 2 }}>₹{item.price}</Text>
                        
                        {/* Variant Swap Selector */}
                        {hasItemVariants && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                            <Text style={{ fontSize: 8.5, fontWeight: '900', color: isDarkMode ? '#a1a1aa' : '#64748b', textTransform: 'uppercase' }}>Variant:</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 4 }}>
                              {variants.map((v) => {
                                const isSelected = item.selectedVariant === v.name;
                                return (
                                  <TouchableOpacity
                                    key={v.name}
                                    onPress={() => updateItemVariant(item.productId, item.selectedVariant, v.name, v.price)}
                                    style={{
                                      paddingHorizontal: 8,
                                      paddingVertical: 3,
                                      borderRadius: 8,
                                      borderWidth: 1,
                                      borderColor: isSelected ? '#ea580c' : (isDarkMode ? '#3f3f46' : '#e2e8f0'),
                                      backgroundColor: isSelected ? 'rgba(226,10,34,0.1)' : 'transparent',
                                      marginRight: 4
                                    }}
                                  >
                                    <Text style={{ fontSize: 8.5, fontWeight: '800', color: isSelected ? '#ea580c' : (isDarkMode ? '#e2e8f0' : '#475569') }}>
                                      {v.name} (₹{v.price})
                                    </Text>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          </View>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff', borderWidth: 1, borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                          <TouchableOpacity
                            onPress={() => updateItemQty(item.productId, item.selectedVariant, -1)}
                            style={{ padding: 6 }}
                          >
                            <Minus size={10} color={isDarkMode ? '#e2e8f0' : '#475569'} strokeWidth={3} />
                          </TouchableOpacity>
                          <Text style={{ paddingHorizontal: 8, fontSize: 11, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#0f172a', minWidth: 18, textAlign: 'center' }}>
                            {item.quantity}
                          </Text>
                          <TouchableOpacity
                            onPress={() => updateItemQty(item.productId, item.selectedVariant, 1)}
                            style={{ padding: 6 }}
                          >
                            <Plus size={10} color={isDarkMode ? '#e2e8f0' : '#475569'} strokeWidth={3} />
                          </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                          onPress={() => markItemOutOfStock(item.productId)}
                          style={{ padding: 6, backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 10 }}
                        >
                          <AlertTriangle size={12} color="#ef4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </ScrollView>

            {/* Recalculated Live Bill Preview */}
            {(() => {
              const computedSubtotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              const computedDeliveryFee = editingOrder?.deliveryMethod === 'PICKUP'
                ? 0
                : (computedSubtotal < freeDeliveryThreshold ? deliveryFeeSetting : 0);
              const computedMiscFee = editingOrder?.deliveryMethod === 'PICKUP'
                ? 0
                : (editingOrder?.miscFee === 0 ? 0 : miscFeeSetting);
              const computedTaxes = parseFloat((computedSubtotal * editTaxRate).toFixed(2));
              const computedTotal = computedSubtotal + computedDeliveryFee + computedTaxes + computedMiscFee - (editingOrder?.discount || 0);

              return (
                <View style={{ backgroundColor: isDarkMode ? '#27272a' : '#f8fafc', padding: 12, borderRadius: 16, borderWidth: 1, borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0', marginBottom: 12, gap: 4 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Subtotal</Text>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#1e293b' }}>₹{computedSubtotal}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Taxes ({Math.round(editTaxRate * 100)}%)</Text>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#1e293b' }}>₹{computedTaxes}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Delivery Fee</Text>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#1e293b' }}>₹{computedDeliveryFee}</Text>
                  </View>
                  {computedMiscFee > 0 && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                      <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Handling / Packaging Fee</Text>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#1e293b' }}>₹{computedMiscFee}</Text>
                    </View>
                  )}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Discount</Text>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#1e293b' }}>-₹{editingOrder?.discount || 0}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 0.5, borderTopColor: isDarkMode ? '#3f3f46' : '#e2e8f0', paddingTop: 6, marginTop: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#0f172a' }}>Estimated Total</Text>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: '#ea580c' }}>₹{computedTotal}</Text>
                  </View>
                </View>
              );
            })()}

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setEditingOrder(null)}
                style={{ flex: 1, height: 40, borderWidth: 1, borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0', borderRadius: 12, justifyContent: 'center', alignItems: 'center' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: isDarkMode ? '#a1a1aa' : '#475569' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={isSavingEdit}
                onPress={saveEditedOrder}
                style={{ flex: 1, height: 40, backgroundColor: '#ea580c', borderRadius: 12, justifyContent: 'center', alignItems: 'center', opacity: isSavingEdit ? 0.6 : 1 }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff' }}>
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}
