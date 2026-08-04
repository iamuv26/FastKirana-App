import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, Modal, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, CheckCircle, Package, Play, Barcode, RefreshCw, Minus, Plus } from 'lucide-react-native';
import { formatPrice, formatDisplayOrderId } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { toast } from '../lib/toast';
import { useAuthStore } from '../stores/auth-store';
import { API_BASE_URL } from '../lib/constants';
import { StatusBar } from 'expo-status-bar';
import { useNewOrderAlert } from '../hooks/use-new-order-alert';
import { NewOrderAlertModal } from '../components/operations/NewOrderAlertModal';
import { useTheme } from './context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { THEME } from '../../lib/theme';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
  location?: string | null;
  categorySlug?: string;
  pickedQty?: number;
}

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  createdAt: string;
  paymentMethod: 'UPI' | 'COD' | 'CARD';
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  user: { name: string; phone: string };
  address: { houseNo: string; street: string; area: string; city: string; pincode: string };
  items: OrderItem[];
  binName?: string;
}

const CATEGORY_AISLES: Record<string, string> = {
  'fruits-vegetables': 'Aisle 1 (Produce Rack)',
  'dairy-breakfast': 'Aisle 2 (Chilled Dairy)',
  'snacks-biscuits': 'Aisle 3 (Snacks)',
  'beverages': 'Aisle 4 (Beverages)',
  'grocery-essential': 'Aisle 5 (Staples)',
  'personal-care': 'Aisle 6 (Hygiene)',
  'household': 'Aisle 7 (Cleaning)',
  'bakery': 'Aisle 8 (Bakery)',
};

function getItemAisle(item: OrderItem): string {
  if (item.location) return item.location;
  const slug = item.categorySlug || '';
  return CATEGORY_AISLES[slug] || 'Aisle 9 (General Shelves)';
}

const INITIAL_SIMULATION_ORDERS: Order[] = [
  {
    id: "ord-101",
    status: "PENDING",
    total: 395,
    createdAt: new Date(Date.now() - 4 * 60000).toISOString(),
    paymentMethod: "UPI",
    deliveryMethod: "DELIVERY",
    user: { name: "Anish Gupta", phone: "+919888877777" },
    address: { houseNo: "C-12", street: "Nehru Nagar", area: "Ghatampur", city: "Kanpur", pincode: "209206" },
    items: [
      { id: "oi1", name: "Amul Taaza Milk Tetra", price: 27, quantity: 3, categorySlug: "dairy-breakfast" },
      { id: "oi2", name: "Lays Classic Salted", price: 38, quantity: 2, categorySlug: "snacks-biscuits" },
      { id: "oi3", name: "Alphonso Mangoes (Hapus)", price: 199, quantity: 1, categorySlug: "fruits-vegetables" }
    ],
    binName: "Blue Bin"
  }
];

export default function PickerScreen() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const { user, logout } = useAuthStore();
  const { activeAlertOrder, acknowledgeAlert, acceptOrder, refreshAlerts } = useNewOrderAlert(user?.role === 'PICKER');
  const [orders, setOrders] = useState<Order[]>(INITIAL_SIMULATION_ORDERS);
  const [isOnline, setIsOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activePickingOrder, setActivePickingOrder] = useState<Order | null>(null);
  const [pickedQuantities, setPickedQuantities] = useState<Record<string, number>>({});
  const [barcodeQuery, setBarcodeQuery] = useState('');

  // Multi-order states
  const [isMultiPickingMode, setIsMultiPickingMode] = useState(false);
  const [multiActiveOrders, setMultiActiveOrders] = useState<Order[]>([]);
  const [multiPickedQuantities, setMultiPickedQuantities] = useState<Record<string, Record<string, number>>>({});
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [binColors, setBinColors] = useState<Record<string, string>>({});

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    if (isCameraActive && (!permission || !permission.granted)) {
      requestPermission();
    }
  }, [isCameraActive, permission]);

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
      const res = await fetch(`${API_BASE_URL}/picker/orders`, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        const mappedOrders = data.map((ord: any) => ({
          id: ord.id,
          status: ord.status,
          total: ord.total,
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
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            imageUrl: it.imageUrl || it.product?.imageUrl || null,
            location: it.product?.location || null,
            categorySlug: it.product?.category?.slug || ''
          })),
          binName: ord.binName || null
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

  useEffect(() => {
    fetchServerOrders(true);
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

  const startPicking = async (order: Order) => {
    if (isOnline) {
      const ok = await updateOrderStatus(order.id, 'CONFIRMED');
      if (!ok) return;
    } else {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'CONFIRMED' } : o));
    }

    const initQtys: Record<string, number> = {};
    order.items.forEach(it => {
      initQtys[it.id] = 0;
    });
    setPickedQuantities(initQtys);
    setActivePickingOrder({ ...order, status: 'CONFIRMED' });
    triggerHaptic('medium');
    toast.success(`Picking started for #${order.id.slice(-6).toUpperCase()}`);
  };

  const manualPickOne = (itemId: string, max: number) => {
    const current = pickedQuantities[itemId] || 0;
    if (current < max) {
      const next = current + 1;
      const nextQtys = { ...pickedQuantities, [itemId]: next };
      setPickedQuantities(nextQtys);
      triggerHaptic('light');
      triggerAudioBeep();
      checkIfAllPicked(nextQtys);
    }
  };

  const manualPickAll = (itemId: string, max: number) => {
    const nextQtys = { ...pickedQuantities, [itemId]: max };
    setPickedQuantities(nextQtys);
    triggerHaptic('light');
    triggerAudioBeep();
    checkIfAllPicked(nextQtys);
  };

  const resetItemPicker = (itemId: string) => {
    setPickedQuantities(prev => ({ ...prev, [itemId]: 0 }));
    triggerHaptic('medium');
  };

  const scanBarcodeProduct = () => {
    if (!activePickingOrder || !barcodeQuery.trim()) return;
    const query = barcodeQuery.trim().toLowerCase();

    if (isMultiPickingMode) {
      scanMultiBarcodeProduct(barcodeQuery);
      return;
    }

    const matched = activePickingOrder.items.find(item =>
      item.name.toLowerCase().includes(query)
    );

    if (matched) {
      const current = pickedQuantities[matched.id] || 0;
      if (current < matched.quantity) {
        const nextQtys = { ...pickedQuantities, [matched.id]: current + 1 };
        setPickedQuantities(nextQtys);
        triggerAudioBeep();
        toast.success(`Scanned: ${matched.name}`);
        checkIfAllPicked(nextQtys);
      } else {
        toast.info(`Already picked all units of ${matched.name}`);
      }
    } else {
      triggerHaptic('warning');
      toast.error(`No item matches "${barcodeQuery}"`);
    }
    setBarcodeQuery('');
  };

  const handleBarcodeScanned = (result: { data: string }) => {
    const scannedData = result.data;
    if (!scannedData) return;

    if (isMultiPickingMode) {
      scanMultiBarcodeProduct(scannedData);
      setIsCameraActive(false);
      return;
    }

    if (!activePickingOrder) return;
    const query = scannedData.trim().toLowerCase();

    const matched = activePickingOrder.items.find(item =>
      item.name.toLowerCase().includes(query) || item.id === query
    );

    if (matched) {
      const current = pickedQuantities[matched.id] || 0;
      if (current < matched.quantity) {
        const nextQtys = { ...pickedQuantities, [matched.id]: current + 1 };
        setPickedQuantities(nextQtys);
        triggerAudioBeep();
        toast.success(`Scanned: ${matched.name}`);
        checkIfAllPicked(nextQtys);
      } else {
        toast.info(`Already picked all units of ${matched.name}`);
      }
    } else {
      triggerHaptic('warning');
      toast.error(`No item matches scanned barcode: ${scannedData}`);
    }
    setIsCameraActive(false);
  };

  const checkIfAllPicked = (qtys: Record<string, number>) => {
    if (!activePickingOrder) return;
    const allPicked = activePickingOrder.items.every(it => qtys[it.id] === it.quantity);
    if (allPicked) {
      setTimeout(() => {
        packActiveOrder(activePickingOrder.id);
      }, 500);
    }
  };

  const packActiveOrder = async (orderId: string) => {
    if (isOnline) {
      const ok = await updateOrderStatus(orderId, 'PACKED');
      if (!ok) return;
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PACKED' } : o));
    }
    triggerHaptic('success');
    triggerAudioSuccess();
    toast.success(`Order #${orderId.slice(-6).toUpperCase()} Packed & Dispatched to Rider!`);
    setActivePickingOrder(null);
    setPickedQuantities({});
  };

  // Multi-Order Picking Logics
  const handleStartMultiPicking = async () => {
    if (selectedOrderIds.length === 0) return;
    setIsRefreshing(true);
    try {
      const activeOrdersToSet: Order[] = [];
      const initialMultiPicked: Record<string, Record<string, number>> = {};
      const assignedBins: Record<string, string> = {};
      const binNames = ['Blue Bin', 'Red Bin', 'Green Bin'];

      for (let i = 0; i < selectedOrderIds.length; i++) {
        const orderId = selectedOrderIds[i];
        const order = orders.find(o => o.id === orderId);
        if (order) {
          if (isOnline) {
            const ok = await updateOrderStatus(order.id, 'CONFIRMED');
            if (!ok) continue;
          }
          activeOrdersToSet.push(order);
          assignedBins[order.id] = binNames[i % binNames.length];

          const orderPicked: Record<string, number> = {};
          order.items.forEach(item => {
            orderPicked[item.id] = 0;
          });
          initialMultiPicked[order.id] = orderPicked;
        }
      }

      setMultiActiveOrders(activeOrdersToSet);
      setBinColors(assignedBins);
      setMultiPickedQuantities(initialMultiPicked);
      setIsMultiPickingMode(true);
      setSelectedOrderIds([]);
      toast.success(`Multi-Picking Console started for ${activeOrdersToSet.length} orders!`);
      fetchServerOrders(false);
    } catch (e) {
      toast.error('Failed to start multi-picking console');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleMultiPickOne = (orderId: string, itemId: string, maxQty: number) => {
    const orderPicked = multiPickedQuantities[orderId] || {};
    const current = orderPicked[itemId] || 0;
    if (current < maxQty) {
      const next = current + 1;
      const nextQtys = {
        ...multiPickedQuantities,
        [orderId]: {
          ...orderPicked,
          [itemId]: next
        }
      };
      setMultiPickedQuantities(nextQtys);
      triggerHaptic('light');
      triggerAudioBeep();
      checkIfMultiOrderAllPicked(orderId, nextQtys[orderId]);
    }
  };

  const handleMultiPickAll = (orderId: string, itemId: string, maxQty: number) => {
    const orderPicked = multiPickedQuantities[orderId] || {};
    const nextQtys = {
      ...multiPickedQuantities,
      [orderId]: {
        ...orderPicked,
        [itemId]: maxQty
      }
    };
    setMultiPickedQuantities(nextQtys);
    triggerHaptic('light');
    triggerAudioBeep();
    checkIfMultiOrderAllPicked(orderId, nextQtys[orderId]);
  };

  const handleResetMultiItem = (orderId: string, itemId: string) => {
    const orderPicked = multiPickedQuantities[orderId] || {};
    const nextQtys = {
      ...multiPickedQuantities,
      [orderId]: {
        ...orderPicked,
        [itemId]: 0
      }
    };
    setMultiPickedQuantities(nextQtys);
    triggerHaptic('medium');
  };

  const checkIfMultiOrderAllPicked = (orderId: string, qtys: Record<string, number>) => {
    const order = multiActiveOrders.find(o => o.id === orderId);
    if (!order) return;
    const allPicked = order.items.every(it => qtys[it.id] === it.quantity);
    if (allPicked) {
      setTimeout(() => {
        packMultiOrder(orderId);
      }, 500);
    }
  };

  const packMultiOrder = async (orderId: string) => {
    if (isOnline) {
      const ok = await updateOrderStatus(orderId, 'PACKED');
      if (!ok) return;
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'PACKED' } : o));
    }
    triggerHaptic('success');
    triggerAudioSuccess();
    toast.success(`Order #${orderId.slice(-6).toUpperCase()} Packed & Dispatched to Rider!`);

    // Remove from active list
    setMultiActiveOrders(prev => prev.filter(o => o.id !== orderId));
    setMultiPickedQuantities(prev => {
      const copy = { ...prev };
      delete copy[orderId];
      return copy;
    });

    // If no more active orders, exit multi-picking mode
    if (multiActiveOrders.length <= 1) {
      setIsMultiPickingMode(false);
    }
  };

  const scanMultiBarcodeProduct = (scannedCode: string) => {
    const query = scannedCode.trim().toLowerCase();

    for (const order of multiActiveOrders) {
      const matched = order.items.find(item =>
        item.name.toLowerCase().includes(query) || item.id === query
      );
      if (matched) {
        const orderPicked = multiPickedQuantities[order.id] || {};
        const current = orderPicked[matched.id] || 0;
        if (current < matched.quantity) {
          const next = current + 1;
          const nextQtys = {
            ...multiPickedQuantities,
            [order.id]: {
              ...orderPicked,
              [matched.id]: next
            }
          };
          setMultiPickedQuantities(nextQtys);
          triggerAudioBeep();
          const bin = binColors[order.id] || 'Blue Bin';

          Alert.alert(
            'Place Item',
            `Scanned: ${matched.name}\n\n👉 Place in ${bin} (${order.user.name})`,
            [{ text: 'OK' }]
          );
          checkIfMultiOrderAllPicked(order.id, nextQtys[order.id]);
          return;
        }
      }
    }
    triggerHaptic('warning');
    toast.error(`No item matches scanned barcode: ${scannedCode}`);
  };

  const consolidatedItems = useMemo(() => {
    if (!isMultiPickingMode || multiActiveOrders.length === 0) return [];
    const itemsMap: Record<string, {
      productId: string;
      name: string;
      unit: string;
      categorySlug: string;
      totalNeeded: number;
      totalPicked: number;
      placements: Array<{
        orderId: string;
        itemId: string;
        quantityNeeded: number;
        quantityPicked: number;
        binName: string;
      }>;
    }> = {};

    multiActiveOrders.forEach(order => {
      const binName = binColors[order.id] || 'Blue Bin';
      const orderPicked = multiPickedQuantities[order.id] || {};

      order.items.forEach(item => {
        const picked = orderPicked[item.id] || 0;
        const key = item.name;

        if (!itemsMap[key]) {
          itemsMap[key] = {
            productId: item.id,
            name: item.name,
            unit: 'unit',
            categorySlug: item.categorySlug || '',
            totalNeeded: 0,
            totalPicked: 0,
            placements: []
          };
        }

        const entry = itemsMap[key];
        entry.totalNeeded += item.quantity;
        entry.totalPicked += picked;
        entry.placements.push({
          orderId: order.id,
          itemId: item.id,
          quantityNeeded: item.quantity,
          quantityPicked: picked,
          binName
        });
      });
    });

    return Object.values(itemsMap).sort((a, b) => {
      const aisleA = getItemAisle({ id: a.productId, name: a.name, price: 0, quantity: 0, categorySlug: a.categorySlug });
      const aisleB = getItemAisle({ id: b.productId, name: b.name, price: 0, quantity: 0, categorySlug: b.categorySlug });
      return aisleA.localeCompare(aisleB);
    });
  }, [isMultiPickingMode, multiActiveOrders, multiPickedQuantities, binColors]);

  const pickerPendingOrders = useMemo(() => orders.filter(o => o.status === 'PENDING'), [orders]);

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  };

  // Compute bin placement styles
  const getBinPlacementStyle = (binName: string, isDone: boolean) => {
    let bg, borderColor, textColor;
    if (binName.includes('Red')) {
      bg = isDarkMode ? `${THEME.COLORS.brand.primary}1E` : `${THEME.COLORS.brand.primary}14`;
      borderColor = isDarkMode ? `${THEME.COLORS.brand.primary}40` : `${THEME.COLORS.brand.primary}28`;
      textColor = THEME.COLORS.brand.primary;
    } else if (binName.includes('Green')) {
      bg = isDarkMode ? `${THEME.COLORS.brand.success}1E` : `${THEME.COLORS.brand.success}14`;
      borderColor = isDarkMode ? `${THEME.COLORS.brand.success}40` : `${THEME.COLORS.brand.success}28`;
      textColor = isDarkMode ? THEME.COLORS.brand.success : THEME.COLORS.brand.success;
    } else {
      bg = isDarkMode ? `${THEME.COLORS.brand.accent}1E` : `${THEME.COLORS.brand.accent}14`;
      borderColor = isDarkMode ? `${THEME.COLORS.brand.accent}40` : `${THEME.COLORS.brand.accent}28`;
      textColor = THEME.COLORS.brand.accent;
    }
    return { backgroundColor: bg, borderColor, textColor, opacity: isDone ? 0.4 : 1 };
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: isDarkMode ? '#09090b' : colors.background }}
    >
      <StatusBar style={isDarkMode ? "light" : "dark"} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm + 2 }}>
          <Pressable
            onPress={() => {
              if (isMultiPickingMode) {
                Alert.alert('Consolidated Multi-Picking', 'Exit consolidated multi-picking?', [
                  { text: 'No' },
                  { text: 'Yes', onPress: () => setIsMultiPickingMode(false) }
                ]);
              } else if (activePickingOrder) {
                setActivePickingOrder(null);
              } else {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/operations');
                }
              }
            }}
            style={[styles.backBtn, { backgroundColor: `${colors.textPrimary}08`, borderColor: colors.border }]}
          >
            <ArrowLeft size={15} color={colors.textPrimary} />
          </Pressable>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.xs + 2 }}>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Picker Console</Text>
              <View style={[styles.roleBadge, { backgroundColor: `${THEME.COLORS.brand.accent}14`, borderColor: `${THEME.COLORS.brand.accent}33` }]}>
                <Text style={[styles.roleBadgeText, { color: THEME.COLORS.brand.accent }]}>
                  {user?.role || 'PICKER'}
                </Text>
              </View>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              {isMultiPickingMode ? 'Consolidated Multi-Picking' : 'FastKirana Darkstore'}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            if (Platform.OS === 'web') {
              const confirmLogout = window.confirm('Are you sure you want to log out from the picker console?');
              if (confirmLogout) {
                logout();
                router.replace('/(auth)/login');
              }
            } else {
              Alert.alert('Log Out', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', onPress: () => { logout(); router.replace('/(auth)/login'); } }
              ]);
            }
          }}
          style={[styles.logoutBtn, { backgroundColor: `${THEME.COLORS.brand.primary}14`, borderColor: `${THEME.COLORS.brand.primary}33` }]}
        >
          <Text style={[styles.logoutBtnText, { color: THEME.COLORS.brand.primary }]}>Log Out</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: THEME.SPACING.lg }} showsVerticalScrollIndicator={false}>
        {isMultiPickingMode ? (
          // Multi Picking Console View
          <View style={[styles.multiPickCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={[styles.multiPickHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.multiPickTitle, { color: colors.textPrimary }]}>Multi-Picking Checklist</Text>
                <Text style={[styles.multiPickSubtitle, { color: colors.textSecondary }]}>{multiActiveOrders.length} Orders Active</Text>
              </View>

              <View style={{ flexDirection: 'row', gap: THEME.SPACING.xs }}>
                {multiActiveOrders.map(o => (
                  <View key={o.id} style={[styles.binChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.binChipText, { color: colors.textSecondary }]}>{binColors[o.id]}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={[styles.barcodeBar, { backgroundColor: `${THEME.COLORS.brand.accent}14`, borderColor: `${THEME.COLORS.brand.accent}33` }]}>
              <Barcode size={12} color={THEME.COLORS.brand.accent} />
              <TextInput
                placeholder="Scan product barcode..."
                placeholderTextColor={isDarkMode ? `${colors.textPrimary}88` : colors.textMuted}
                value={barcodeQuery}
                onChangeText={setBarcodeQuery}
                onSubmitEditing={scanBarcodeProduct}
                style={[styles.barcodeInput, { color: colors.textPrimary }]}
              />
              <Pressable
                onPress={() => setIsCameraActive(true)}
                style={[styles.scanBtn, { backgroundColor: `${THEME.COLORS.brand.accent}26` }]}
              >
                <Text style={[styles.scanBtnText, { color: '#ffffff' }]}>📷 Scan</Text>
              </Pressable>
            </View>

            <Text style={[styles.aisleLabel, { color: colors.textSecondary }]}>Sorted by Warehouse Aisle</Text>

            <View style={{ gap: THEME.SPACING.xs }}>
              {consolidatedItems.map((cItem) => {
                const aisle = getItemAisle({ id: cItem.productId, name: cItem.name, price: 0, quantity: 0, categorySlug: cItem.categorySlug });
                const isAllDone = cItem.totalPicked === cItem.totalNeeded;

                return (
                  <View key={cItem.name} style={[styles.consolidatedItem, { borderBottomColor: colors.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flex: 1, paddingRight: THEME.SPACING.sm }}>
                        <Text style={[styles.consolidatedName, isAllDone ? { color: colors.textMuted, textDecorationLine: 'line-through' } : { color: colors.textPrimary }]}>
                          {cItem.name}
                        </Text>
                        <Text style={[styles.aisleTag, { color: THEME.COLORS.brand.accent }]}>{aisle}</Text>
                      </View>

                      <View style={[styles.qtyCounter, { backgroundColor: colors.background, borderColor: colors.border }]}>
                        <Text style={[styles.qtyCounterText, { color: colors.textSecondary }]}>{cItem.totalPicked}/{cItem.totalNeeded}</Text>
                      </View>
                    </View>

                    {/* Placements for Bins */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: THEME.SPACING.sm + 2, marginTop: THEME.SPACING.sm + 2 }}>
                      {cItem.placements.map((plc) => {
                        const plcDone = plc.quantityPicked === plc.quantityNeeded;
                        const binStyle = getBinPlacementStyle(plc.binName, plcDone);

                        return (
                          <View
                            key={plc.orderId}
                            style={[styles.binPlacement, { backgroundColor: binStyle.backgroundColor, borderColor: binStyle.borderColor }, { opacity: binStyle.opacity }]}
                          >
                            <Text style={[styles.binPlacementText, { color: binStyle.textColor }]}>{plc.binName}: {plc.quantityPicked}/{plc.quantityNeeded}</Text>
                            {!plcDone && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.xs }}>
                                <Pressable
                                  onPress={() => handleResetMultiItem(plc.orderId, plc.itemId)}
                                  style={[styles.binActionBtn, { backgroundColor: `${colors.textPrimary}18` }]}
                                >
                                  <Text style={[styles.binActionText, { color: colors.textSecondary }]}>↺</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() => handleMultiPickOne(plc.orderId, plc.itemId, plc.quantityNeeded)}
                                  style={[styles.binActionBtn, { backgroundColor: `${colors.textPrimary}14` }]}
                                >
                                  <Text style={[styles.binActionText, { color: colors.textSecondary }]}>+1</Text>
                                </Pressable>
                                <Pressable
                                  onPress={() => handleMultiPickAll(plc.orderId, plc.itemId, plc.quantityNeeded)}
                                  style={[styles.binAllBtn, { backgroundColor: THEME.COLORS.brand.accent }]}
                                >
                                  <Text style={[styles.binAllBtnText, { color: '#ffffff' }]}>ALL</Text>
                                </Pressable>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ) : activePickingOrder ? (
          // Single Picking Console View
          <View style={[styles.singlePickCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <View style={[styles.singlePickHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.singlePickTitle, { color: colors.textPrimary }]}>
                  Picking Order #{formatDisplayOrderId(activePickingOrder.id, (activePickingOrder as any).readableId)}
                </Text>
                <Text style={[styles.singlePickCustomer, { color: `${colors.textPrimary}99` }]}>Customer: {activePickingOrder.user.name}</Text>
              </View>
              <Pressable
                onPress={() => setActivePickingOrder(null)}
                style={[styles.cancelBtn, { backgroundColor: `${colors.textPrimary}08`, borderColor: colors.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </Pressable>
            </View>

            <View style={[styles.barcodeBar, { backgroundColor: `${colors.textPrimary}08`, borderColor: colors.border }]}>
              <Barcode size={12} color={THEME.COLORS.brand.accent} />
              <TextInput
                placeholder="Scan product barcode..."
                placeholderTextColor={isDarkMode ? `${colors.textPrimary}88` : colors.textMuted}
                value={barcodeQuery}
                onChangeText={setBarcodeQuery}
                onSubmitEditing={scanBarcodeProduct}
                style={[styles.barcodeInput, { color: colors.textPrimary }]}
              />
              <Pressable
                onPress={() => setIsCameraActive(true)}
                style={[styles.scanBtn, { backgroundColor: `${THEME.COLORS.brand.accent}26` }]}
              >
                <Text style={[styles.scanBtnText, { color: '#ffffff' }]}>📷 Scan</Text>
              </Pressable>
            </View>

            <Text style={[styles.checklistLabel, { color: colors.textSecondary }]}>Checklist by Location</Text>
            <View style={{ gap: THEME.SPACING.xs + 2 }}>
              {activePickingOrder.items.map((item) => {
                const picked = pickedQuantities[item.id] || 0;
                const max = item.quantity;
                const aisle = getItemAisle(item);
                const isDone = picked === max;

                return (
                  <View key={item.id} style={[styles.checklistRow, { paddingVertical: THEME.SPACING.sm + 4 }]}>
                    <View style={{ flex: 1, paddingRight: THEME.SPACING.xs + 2 }}>
                      <Text style={[styles.itemName, isDone ? { color: colors.textMuted, textDecorationLine: 'line-through' } : { color: colors.textPrimary }]}>
                        {item.name}
                      </Text>
                      <Text style={[styles.aisleTag, { color: THEME.COLORS.brand.accent }]}>{aisle}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.xs + 2 }}>
                      {isDone ? (
                        <View style={[styles.doneBadge, { backgroundColor: `${THEME.COLORS.brand.success}14`, borderColor: `${THEME.COLORS.brand.success}33` }]}>
                          <CheckCircle size={8} color={THEME.COLORS.brand.successDark || '#059669'} />
                          <Text style={[styles.doneBadgeText, { color: THEME.COLORS.brand.success }]}>{max}/{max}</Text>
                        </View>
                      ) : (
                        <View style={[styles.pickControls, { backgroundColor: colors.background, borderColor: colors.border }]}>
                          <Pressable onPress={() => resetItemPicker(item.id)} style={{ paddingHorizontal: THEME.SPACING.sm + 2, paddingVertical: THEME.SPACING.sm }}>
                            <Text style={[styles.pickReset, { color: colors.textMuted }]}>↺</Text>
                          </Pressable>
                          <Text style={[styles.pickCount, { color: colors.textPrimary }]}>{picked}/{max}</Text>
                          <Pressable
                            onPress={() => manualPickOne(item.id, max)}
                            style={[styles.pickOneBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                          >
                            <Text style={[styles.pickOneBtnText, { color: colors.textSecondary }]}>+1</Text>
                          </Pressable>
                          <Pressable
                            onPress={() => manualPickAll(item.id, max)}
                            style={[styles.pickAllBtn, { backgroundColor: THEME.COLORS.brand.accent }]}
                          >
                            <Text style={[styles.pickAllBtnText, { color: '#ffffff' }]}>All</Text>
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            <Pressable
              onPress={() => packActiveOrder(activePickingOrder.id)}
              style={[styles.packBtn, { backgroundColor: THEME.COLORS.brand.accent }]}
            >
              <Text style={[styles.packBtnText, { color: '#ffffff' }]}>Pack & Complete Order</Text>
            </Pressable>
          </View>
        ) : (
          // Pending Jobs List
          <View>
            <View style={[styles.pendingHeaderRow, { marginBottom: THEME.SPACING.sm + 4 }]}>
              <Text style={[styles.pendingTitle, { color: colors.textPrimary }]}>Picker Pending Jobs</Text>

              <View style={{ flexDirection: 'row', gap: THEME.SPACING.sm + 2, alignItems: 'center' }}>
                {selectedOrderIds.length > 0 && (
                  <Pressable
                    onPress={handleStartMultiPicking}
                    style={[styles.multiPickStartBtn, { backgroundColor: THEME.COLORS.brand.accent }]}
                  >
                    <Text style={[styles.multiPickStartBtnText, { color: '#ffffff' }]}>Multi-Pick ({selectedOrderIds.length})</Text>
                  </Pressable>
                )}

                <Pressable
                  onPress={() => fetchServerOrders(true)}
                  style={[styles.refreshSmallBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
                >
                  <Text style={{ fontSize: 10 }}>🔄</Text>
                </Pressable>
              </View>
            </View>

            {pickerPendingOrders.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                <Text style={styles.emptyEmoji}>📭</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No orders waiting for pickers</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  New orders placed by customers will sync here in real time.
                </Text>
              </View>
            ) : (
              <View style={{ gap: THEME.SPACING.sm + 2 }}>
                {pickerPendingOrders.map((ord) => {
                  const isSelected = selectedOrderIds.includes(ord.id);
                  return (
                    <Pressable
                      key={ord.id}
                      onPress={() => toggleSelectOrder(ord.id)}
                      style={[styles.pendingOrderCard, { backgroundColor: colors.surfaceElevated, borderColor: isSelected ? THEME.COLORS.brand.accent : colors.border }]}
                    >
                      <View style={[styles.pendingOrderHeader, { borderBottomColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.xs + 2 }}>
                          <View style={[styles.checkbox, isSelected ? { backgroundColor: THEME.COLORS.brand.accent, borderColor: THEME.COLORS.brand.accent } : { backgroundColor: colors.background, borderColor: colors.border }]}>
                            {isSelected && <Text style={[styles.checkboxCheck, { color: '#ffffff' }]}>✓</Text>}
                          </View>
                          <Text style={[styles.pendingOrderId, { color: colors.textPrimary }]}>Order #{formatDisplayOrderId(ord.id, (ord as any).readableId)}</Text>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: `${THEME.COLORS.brand.primary}14`, borderColor: `${THEME.COLORS.brand.primary}33` }]}>
                          <Text style={[styles.statusBadgeText, { color: THEME.COLORS.brand.primary }]}>{ord.status}</Text>
                        </View>
                      </View>

                      <Text style={[styles.pendingOrderUser, { color: colors.textSecondary }]}>User: {ord.user.name}</Text>
                      <Text style={[styles.pendingOrderItems, { color: colors.textMuted }]} numberOfLines={1}>
                        Items: {ord.items.map(it => `${it.name} x${it.quantity}`).join(', ')}
                      </Text>

                      <Pressable
                        onPress={() => startPicking(ord)}
                        style={[styles.startPickBtn, { backgroundColor: THEME.COLORS.brand.accent }]}
                      >
                        <Play size={8} color="#ffffff" fill="#ffffff" />
                        <Text style={[styles.startPickBtnText, { color: '#ffffff' }]}>Start Single Pick</Text>
                      </Pressable>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
        <View style={{ height: THEME.SPACING.xxl }} />
      </ScrollView>

      {/* Camera Barcode View Modal */}
      {isCameraActive && (
        <Modal
          visible={isCameraActive}
          animationType="slide"
          onRequestClose={() => setIsCameraActive(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: THEME.SPACING.xxl * 1.5, paddingHorizontal: THEME.SPACING.lg }}>
              <Pressable
                onPress={() => setIsCameraActive(false)}
                style={styles.cameraCloseBtn}
              >
                <Text style={styles.cameraCloseText}>✕</Text>
              </Pressable>
              <Text style={[styles.cameraTitle, { color: '#ffffff' }]}>Scan Item Barcode</Text>
            </View>

            <View style={[styles.cameraFrame, { borderColor: `${colors.textPrimary}33` }]}>
              {!permission ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : !permission.granted ? (
                <View style={{ alignItems: 'center', padding: THEME.SPACING.lg }}>
                  <Text style={[styles.cameraPermissionText, { color: `${colors.textPrimary}cc` }]}>Camera permissions are required to scan barcodes</Text>
                  <Pressable
                    onPress={requestPermission}
                    style={[styles.cameraPermitBtn, { backgroundColor: `${THEME.COLORS.brand.accent}26` }]}
                  >
                    <Text style={[styles.cameraPermitBtnText, { color: '#ffffff' }]}>Grant Permission</Text>
                  </Pressable>
                </View>
              ) : (
                <CameraView
                  style={{ width: '100%', height: '100%' }}
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr', 'code128', 'code39', 'ean13', 'ean8', 'upc_a', 'upc_e'],
                  }}
                  onBarcodeScanned={handleBarcodeScanned}
                />
              )}
            </View>

            <Text style={[styles.cameraHint, { color: `${colors.textPrimary}99` }]}>
              Center the product barcode in the screen box to scan
            </Text>
          </SafeAreaView>
        </Modal>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.md + 2,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  roleBadge: {
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: THEME.SPACING.xs / 2,
    borderRadius: THEME.RADIUS.pill,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 7.5,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  logoutBtn: {
    paddingHorizontal: THEME.SPACING.sm + 4,
    paddingVertical: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
  },
  logoutBtnText: {
    fontSize: 9.5,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  multiPickCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: THEME.SPACING.md,
    marginBottom: THEME.SPACING.lg,
    ...THEME.SHADOWS.sm,
  },
  multiPickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: THEME.SPACING.sm + 2,
    marginBottom: THEME.SPACING.sm + 2,
  },
  multiPickTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  multiPickSubtitle: {
    fontSize: 8,
    fontWeight: '700',
  },
  binChip: {
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: THEME.SPACING.xs / 2,
    borderRadius: THEME.RADIUS.sm,
    borderWidth: 1,
  },
  binChipText: {
    fontSize: 7,
    fontWeight: '700',
  },
  barcodeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.xs + 2,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: THEME.SPACING.sm + 2,
    paddingVertical: THEME.SPACING.sm,
    marginBottom: THEME.SPACING.sm + 2,
  },
  barcodeInput: {
    flex: 1,
    fontSize: 10,
    fontWeight: '600',
    padding: 0,
  },
  scanBtn: {
    paddingHorizontal: THEME.SPACING.sm + 2,
    paddingVertical: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.sm,
  },
  scanBtnText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  aisleLabel: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: THEME.SPACING.sm + 2,
  },
  consolidatedItem: {
    paddingVertical: THEME.SPACING.sm + 4,
    borderBottomWidth: 1,
  },
  consolidatedName: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  aisleTag: {
    fontSize: 8,
    fontWeight: '900',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  qtyCounter: {
    paddingHorizontal: THEME.SPACING.sm + 2,
    paddingVertical: THEME.SPACING.xs / 2,
    borderRadius: THEME.RADIUS.sm,
    borderWidth: 1,
  },
  qtyCounterText: {
    fontSize: 9,
    fontWeight: '900',
  },
  binPlacement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.xs + 2,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
    padding: THEME.SPACING.xs + 2,
  },
  binPlacementText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  binActionBtn: {
    paddingHorizontal: THEME.SPACING.xs,
    paddingVertical: THEME.SPACING.xs / 2,
    borderRadius: THEME.RADIUS.xs,
    borderWidth: 1,
  },
  binActionText: {
    fontSize: 7,
    fontWeight: '700',
  },
  binAllBtn: {
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: THEME.SPACING.xs / 2,
    borderRadius: THEME.RADIUS.xs,
  },
  binAllBtnText: {
    fontSize: 7,
    fontWeight: '900',
  },
  singlePickCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: THEME.SPACING.md + 4,
    marginBottom: THEME.SPACING.md,
    ...THEME.SHADOWS.sm,
  },
  singlePickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: THEME.SPACING.sm + 2,
    marginBottom: THEME.SPACING.sm + 2,
  },
  singlePickTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  singlePickCustomer: {
    fontSize: 8,
    fontWeight: '600',
    marginTop: 2,
  },
  cancelBtn: {
    paddingHorizontal: THEME.SPACING.sm + 2,
    paddingVertical: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 8,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  checklistLabel: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: THEME.SPACING.sm + 2,
  },
  checklistRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
  },
  itemName: {
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.xs / 2,
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: THEME.SPACING.xs / 2,
    borderRadius: THEME.RADIUS.pill,
    borderWidth: 1,
  },
  doneBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pickControls: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  pickReset: {
    fontSize: 10,
    fontWeight: '900',
  },
  pickCount: {
    paddingHorizontal: THEME.SPACING.sm,
    fontSize: 10,
    fontWeight: '900',
    minWidth: 24,
    textAlign: 'center',
  },
  pickOneBtn: {
    paddingHorizontal: THEME.SPACING.sm + 2,
    paddingVertical: THEME.SPACING.sm,
    borderLeftWidth: 1,
  },
  pickOneBtnText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pickAllBtn: {
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm,
    borderTopRightRadius: THEME.RADIUS.md,
    borderBottomRightRadius: THEME.RADIUS.md,
  },
  pickAllBtnText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  packBtn: {
    paddingVertical: THEME.SPACING.md + 2,
    borderRadius: THEME.RADIUS.xl,
    alignItems: 'center',
    marginTop: THEME.SPACING.md + 4,
  },
  packBtnText: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  pendingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pendingTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  multiPickStartBtn: {
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.lg,
  },
  multiPickStartBtnText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  refreshSmallBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingOrderCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: THEME.SPACING.md,
    ...THEME.SHADOWS.xs,
  },
  pendingOrderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingBottom: THEME.SPACING.sm + 2,
    marginBottom: THEME.SPACING.sm + 2,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCheck: {
    fontSize: 8,
    fontWeight: '900',
  },
  pendingOrderId: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusBadge: {
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: THEME.SPACING.xs / 2,
    borderRadius: THEME.RADIUS.pill,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 7,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  pendingOrderUser: {
    fontSize: 11,
    fontWeight: '600',
  },
  pendingOrderItems: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  startPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.SPACING.xs,
    paddingVertical: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.md,
    marginTop: THEME.SPACING.sm + 4,
  },
  startPickBtnText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  emptyCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: THEME.SPACING.lg,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: THEME.SPACING.sm,
  },
  emptyTitle: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: THEME.SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 10,
    marginTop: THEME.SPACING.sm,
    textAlign: 'center',
    maxWidth: 280,
  },
  cameraCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.textPrimary}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraCloseText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  cameraTitle: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    textAlign: 'center',
    flex: 1,
    paddingRight: 40,
  },
  cameraFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#09090b',
    borderWidth: 2,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    alignSelf: 'center',
    marginVertical: THEME.SPACING.lg,
  },
  cameraPermissionText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: THEME.SPACING.md,
  },
  cameraPermitBtn: {
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.lg,
  },
  cameraPermitBtnText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cameraHint: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: THEME.SPACING.xxl,
  },
});
