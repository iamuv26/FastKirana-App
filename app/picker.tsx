import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Alert, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ArrowLeft, CheckCircle, Package, Play, Barcode } from 'lucide-react-native';
import { formatPrice } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { toast } from '../lib/toast';
import { useAuthStore } from '../stores/auth-store';
import { API_BASE_URL } from '../lib/constants';
import { StatusBar } from 'expo-status-bar';
import { useNewOrderAlert } from '../hooks/use-new-order-alert';
import { NewOrderAlertModal } from '../components/operations/NewOrderAlertModal';
import { useTheme } from './context/ThemeContext';

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

  return (
    <SafeAreaView className="flex-1 bg-slate-950">
      <StatusBar style="light" />
      {/* Header */}
      <View className="bg-slate-900 px-3 py-2 flex-row items-center justify-between border-b border-slate-800">
        <View className="flex-row items-center gap-2">
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
            className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center border border-slate-700 active:bg-slate-700"
          >
            <ArrowLeft size={15} color="#fff" />
          </Pressable>
          <View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-white font-black text-sm">Picker Console 📦</Text>
              <View className="px-1.5 py-0.5 rounded bg-indigo-900 border border-indigo-750">
                <Text className="text-white font-extrabold text-[7.5px] tracking-wider uppercase">
                  {user?.role || 'PICKER'}
                </Text>
              </View>
            </View>
            <Text className="text-slate-400 text-[9px] font-bold tracking-wide">
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
          className="px-2.5 py-1 rounded-md bg-red-600/15 border border-red-500/25 active:bg-red-600/30"
        >
          <Text className="text-red-500 font-bold text-[10px]">Log Out</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 p-2.5" showsVerticalScrollIndicator={false}>
        {isMultiPickingMode ? (
          // Multi Picking Console View
          <View className="bg-slate-900 rounded-xl border border-slate-800 p-3 shadow-sm mb-6">
            <View className="flex-row justify-between items-center border-b border-slate-800 pb-2 mb-3">
              <View>
                <Text className="text-white font-black text-xs uppercase">Multi-Picking Checklist</Text>
                <Text className="text-slate-400 text-[8px] font-bold">{multiActiveOrders.length} Orders Active</Text>
              </View>
              
              <View className="flex-row gap-1">
                {multiActiveOrders.map(o => (
                  <View key={o.id} className="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded">
                    <Text className="text-[7px] font-bold text-slate-300">{binColors[o.id]}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View className="flex-row gap-1 bg-slate-955 p-1 rounded-lg border border-slate-800 items-center mb-3">
              <Barcode size={12} color="#6366f1" />
              <TextInput
                placeholder="Scan product barcode..."
                placeholderTextColor="#94a3b8"
                value={barcodeQuery}
                onChangeText={setBarcodeQuery}
                onSubmitEditing={scanBarcodeProduct}
                className="flex-grow text-white text-[10px] font-semibold p-0"
              />
              <Pressable 
                onPress={() => setIsCameraActive(true)}
                className="bg-indigo-650 px-2.5 py-1.5 rounded active:bg-indigo-750"
              >
                <Text className="text-white font-extrabold text-[8px] uppercase">📷 Scan</Text>
              </Pressable>
            </View>

            <Text className="text-slate-400 font-black text-[9px] uppercase tracking-wider mb-2">Sorted by Warehouse Aisle</Text>
            
            <View className="divide-y divide-slate-800">
              {consolidatedItems.map((cItem) => {
                const aisle = getItemAisle({ id: cItem.productId, name: cItem.name, price: 0, quantity: 0, categorySlug: cItem.categorySlug });
                const isAllDone = cItem.totalPicked === cItem.totalNeeded;

                return (
                  <View key={cItem.name} className="py-3">
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 pr-3">
                        <Text className={`text-xs font-extrabold leading-tight ${isAllDone ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                          {cItem.name}
                        </Text>
                        <Text className="text-indigo-400 text-[8px] font-black mt-1 uppercase tracking-wider">{aisle}</Text>
                      </View>
                      
                      <View className="bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                        <Text className="text-slate-300 font-black text-[9px]">{cItem.totalPicked}/{cItem.totalNeeded}</Text>
                      </View>
                    </View>

                    {/* Placements for Bins */}
                    <View className="flex-row flex-wrap gap-2 mt-2">
                      {cItem.placements.map((plc) => {
                        const plcDone = plc.quantityPicked === plc.quantityNeeded;
                        let binColorClass = 'bg-blue-950/30 border-blue-900/30 text-blue-400';
                        if (plc.binName.includes('Red')) binColorClass = 'bg-red-950/30 border-red-900/30 text-red-400';
                        else if (plc.binName.includes('Green')) binColorClass = 'bg-green-950/30 border-green-900/30 text-emerald-400';

                        return (
                          <View 
                            key={plc.orderId}
                            className={`border rounded-lg p-1.5 flex-row items-center gap-1.5 ${binColorClass} ${plcDone ? 'opacity-40' : ''}`}
                          >
                            <Text className="font-extrabold text-[8px] uppercase">{plc.binName}: {plc.quantityPicked}/{plc.quantityNeeded}</Text>
                            {!plcDone && (
                              <View className="flex-row items-center gap-1">
                                <Pressable 
                                  onPress={() => handleResetMultiItem(plc.orderId, plc.itemId)}
                                  className="bg-slate-950/80 px-1 py-0.5 rounded border border-slate-800"
                                >
                                  <Text className="text-[7px] text-slate-300">↺</Text>
                                </Pressable>
                                <Pressable 
                                  onPress={() => handleMultiPickOne(plc.orderId, plc.itemId, plc.quantityNeeded)}
                                  className="bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 active:bg-slate-800"
                                >
                                  <Text className="text-[7px] font-black text-slate-300">+1</Text>
                                </Pressable>
                                <Pressable 
                                  onPress={() => handleMultiPickAll(plc.orderId, plc.itemId, plc.quantityNeeded)}
                                  className="bg-indigo-600 px-1.5 py-0.5 rounded"
                                >
                                  <Text className="text-white text-[7px] font-black">ALL</Text>
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
          <View className="bg-slate-900 rounded-xl border border-slate-800 p-3 shadow-sm mb-6">
            <View className="flex-row justify-between items-center border-b border-slate-800 pb-2 mb-3">
              <View>
                <Text className="text-white font-black text-xs uppercase">Picking Order #{activePickingOrder.id.slice(-6).toUpperCase()}</Text>
                <Text className="text-slate-400 text-[8px] font-semibold">Customer: {activePickingOrder.user.name}</Text>
              </View>
              <Pressable 
                onPress={() => setActivePickingOrder(null)}
                className="px-2.5 py-1 rounded bg-slate-950 border border-slate-800 active:bg-slate-800"
              >
                <Text className="text-slate-300 font-extrabold text-[8px] uppercase tracking-wider">Cancel</Text>
              </Pressable>
            </View>

            <View className="flex-row gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 items-center mb-3">
              <Barcode size={12} color="#6366f1" />
              <TextInput
                placeholder="Scan product barcode..."
                placeholderTextColor="#94a3b8"
                value={barcodeQuery}
                onChangeText={setBarcodeQuery}
                onSubmitEditing={scanBarcodeProduct}
                className="flex-1 text-white text-[10px] font-semibold p-0"
              />
              <Pressable 
                onPress={() => setIsCameraActive(true)}
                className="bg-indigo-655 px-2 py-1 rounded active:bg-indigo-750 mr-0.5"
              >
                <Text className="text-white font-extrabold text-[7px] uppercase">📷 Scan</Text>
              </Pressable>
            </View>

            <Text className="text-slate-400 font-black text-[9px] uppercase tracking-wider mb-1.5">Checklist by Location</Text>
            <View className="divide-y divide-slate-800">
              {activePickingOrder.items.map((item) => {
                const picked = pickedQuantities[item.id] || 0;
                const max = item.quantity;
                const aisle = getItemAisle(item);
                const isDone = picked === max;

                return (
                  <View key={item.id} className="py-2 flex-row justify-between items-center gap-2">
                    <View className="flex-1 pr-1">
                      <Text className={`text-[11px] font-bold leading-tight ${isDone ? 'text-slate-600 line-through' : 'text-slate-200'}`}>
                        {item.name}
                      </Text>
                      <Text className="text-indigo-400 text-[8px] font-black mt-0.5 uppercase tracking-wider">{aisle}</Text>
                    </View>
                    
                    <View className="flex-row items-center gap-1.5">
                      {isDone ? (
                        <View className="bg-emerald-950/20 border border-emerald-900/30 px-1.5 py-0.5 rounded flex-row items-center gap-0.5">
                          <CheckCircle size={8} color="#059669" />
                          <Text className="text-emerald-400 font-black text-[8px] uppercase">{max}/{max}</Text>
                        </View>
                      ) : (
                        <View className="flex-row items-center bg-slate-950 rounded p-0.5 border border-slate-800">
                          <Pressable onPress={() => resetItemPicker(item.id)} className="px-1.5">
                            <Text className="text-slate-400 font-black text-[10px]">↺</Text>
                          </Pressable>
                          <Text className="px-0.5 text-slate-200 font-black text-[10px]">{picked}/{max}</Text>
                          <Pressable 
                            onPress={() => manualPickOne(item.id, max)}
                            className="bg-slate-900 px-1.5 py-1 rounded border border-slate-800 active:bg-slate-800 ml-1"
                          >
                            <Text className="text-slate-200 font-black text-[9px] uppercase">+1</Text>
                          </Pressable>
                          <Pressable 
                            onPress={() => manualPickAll(item.id, max)}
                            className="bg-indigo-600 px-1.5 py-1 rounded active:bg-indigo-750 ml-0.5"
                          >
                            <Text className="text-white font-extrabold text-[9px] uppercase">All</Text>
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
              className="bg-indigo-600 py-2.5 rounded-lg items-center mt-4 active:bg-indigo-700"
            >
              <Text className="text-white font-extrabold text-[11px] uppercase tracking-wider">Pack & Complete Order</Text>
            </Pressable>
          </View>
        ) : (
          // Pending Jobs List
          <View>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-black text-sm">Picker Pending Jobs</Text>
              
              <View className="flex-row gap-2.5 items-center">
                {selectedOrderIds.length > 0 && (
                  <Pressable 
                    onPress={handleStartMultiPicking}
                    className="bg-indigo-600 px-3 py-1.5 rounded-xl active:bg-indigo-700"
                  >
                    <Text className="text-white font-black text-[9px] uppercase">Multi-Pick ({selectedOrderIds.length})</Text>
                  </Pressable>
                )}
                
                <Pressable 
                  onPress={() => fetchServerOrders(true)} 
                  className="w-7 h-7 rounded-full bg-slate-900 items-center justify-center border border-slate-800 active:bg-slate-800"
                >
                  <Text className="text-[10px]">🔄</Text>
                </Pressable>
              </View>
            </View>

            {pickerPendingOrders.length === 0 ? (
              <View className="bg-slate-900 rounded-xl border border-slate-800 p-4 items-center shadow-xs">
                <Text className="text-3xl">📭</Text>
                <Text className="text-white font-black text-xs mt-2">No orders waiting for pickers</Text>
                <Text className="text-slate-400 text-[10px] mt-1 text-center leading-normal">
                  New orders placed by customers will sync here in real time.
                </Text>
              </View>
            ) : (
              <View className="gap-2.5">
                {pickerPendingOrders.map((ord) => {
                  const isSelected = selectedOrderIds.includes(ord.id);
                  return (
                    <Pressable 
                      key={ord.id} 
                      onPress={() => toggleSelectOrder(ord.id)}
                      className={`bg-slate-900 rounded-xl border p-3 shadow-xs ${
                        isSelected ? 'border-indigo-600 bg-indigo-950/20' : 'border-slate-800'
                      }`}
                    >
                      <View className="flex-row justify-between items-center border-b border-slate-800 pb-2 mb-2">
                        <View className="flex-row items-center gap-2">
                          <View className={`w-3.5 h-3.5 rounded-full border items-center justify-center ${
                            isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-700 bg-slate-950'
                          }`}>
                            {isSelected && <Text className="text-[8px] font-black text-white">✓</Text>}
                          </View>
                          <Text className="text-white font-black text-xs uppercase">Order #{ord.id.slice(-6).toUpperCase()}</Text>
                        </View>
                        <View className="bg-amber-950/20 border border-amber-900/30 px-1.5 py-0.5 rounded-full">
                          <Text className="text-amber-400 font-extrabold text-[7px] uppercase tracking-wider">{ord.status}</Text>
                        </View>
                      </View>

                      <Text className="text-slate-300 text-[11px] font-semibold">User: {ord.user.name}</Text>
                      <Text className="text-slate-400 text-[9px] font-semibold mt-0.5 truncate" numberOfLines={1}>
                        Items: {ord.items.map(it => `${it.name} x${it.quantity}`).join(', ')}
                      </Text>

                      <Pressable
                        onPress={() => startPicking(ord)}
                        className="bg-indigo-650 mt-3 py-2 rounded-lg flex-row items-center justify-center gap-1 active:bg-indigo-750"
                      >
                        <Play size={8} color="#fff" fill="#fff" />
                        <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">Start Single Pick</Text>
                      </Pressable>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        )}
        <View className="h-6" />
      </ScrollView>

      {/* Camera Barcode View Modal */}
      {isCameraActive && (
        <Modal
          visible={isCameraActive}
          animationType="slide"
          onRequestClose={() => setIsCameraActive(false)}
        >
          <SafeAreaView className="flex-1 bg-black justify-between p-6">
            <View className="flex-row justify-between items-center mt-8">
              <Pressable 
                onPress={() => setIsCameraActive(false)}
                className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center"
              >
                <Text className="text-white font-bold text-lg">✕</Text>
              </Pressable>
              <Text className="text-white font-black text-xs uppercase tracking-widest text-center flex-1 pr-10">Scan Item Barcode</Text>
            </View>

            <View className="w-full aspect-[4/3] bg-slate-900 border-2 border-white/20 rounded-3xl items-center justify-center relative overflow-hidden self-center my-6">
              {!permission ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : !permission.granted ? (
                <View className="items-center p-6">
                  <Text className="text-white/80 text-xs font-bold text-center mb-3">Camera permissions are required to scan barcodes</Text>
                  <Pressable 
                    onPress={requestPermission}
                    className="bg-indigo-650 px-4 py-2 rounded-xl"
                  >
                    <Text className="text-white font-extrabold text-[10px] uppercase">Grant Permission</Text>
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

            <Text className="text-white/60 text-[10px] font-black uppercase tracking-wider text-center mb-8">
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
