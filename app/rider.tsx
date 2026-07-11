import { View, Text, Pressable, ScrollView, Alert, Modal, ActivityIndicator, Image, Platform, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import { ArrowLeft, Truck, Phone, MapPin, Camera, QrCode, X } from 'lucide-react-native';
import { formatPrice } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { toast } from '../lib/toast';
import { useAuthStore } from '../stores/auth-store';
import { API_BASE_URL } from '../lib/constants';
import { StatusBar } from 'expo-status-bar';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'PACKED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  total: number;
  createdAt: string;
  paymentMethod: 'UPI' | 'COD' | 'CARD';
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  user: { name: string; phone: string };
  address: { houseNo: string; street: string; area: string; city: string; pincode: string; lat?: number | null; lng?: number | null };
  items: OrderItem[];
}

const INITIAL_SIMULATION_ORDERS: Order[] = [
  {
    id: "ord-103",
    status: "PACKED",
    total: 440,
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    paymentMethod: "COD",
    deliveryMethod: "DELIVERY",
    user: { name: "Pooja Trivedi", phone: "+919876543219" },
    address: { houseNo: "54A", street: "Galla Mandi Path", area: "Ghatampur", city: "Kanpur", pincode: "209206" },
    items: [
      { id: "oi7", name: "Aashirvaad Shudh Chakki Atta", price: 245, quantity: 1 }
    ]
  }
];

export default function RiderScreen() {
  const { user, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>(INITIAL_SIMULATION_ORDERS);
  const [isOnline, setIsOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [codCollected, setCodCollected] = useState(0);
  const [todayDeliveries, setTodayDeliveries] = useState(0);
  
  const [isPhotoCapturing, setIsPhotoCapturing] = useState(false);
  const [photoTargetOrder, setPhotoTargetOrder] = useState<Order | null>(null);
  const [isUpiQrVisible, setIsUpiQrVisible] = useState(false);
  const [upiTargetOrder, setUpiTargetOrder] = useState<Order | null>(null);
  const [offlineSyncQueue, setOfflineSyncQueue] = useState<{ orderId: string, nextStatus: string, extraPayload: any }[]>([]);

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
      const res = await fetch(`${API_BASE_URL}/delivery/orders`, { 
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
            pincode: ord.address.pincode || '',
            lat: ord.address.lat || null,
            lng: ord.address.lng || null,
          } : { houseNo: '', street: '', area: '', city: '', pincode: '', lat: null, lng: null },
          items: (ord.items || []).map((it: any) => ({
            id: it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity
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

  useEffect(() => {
    fetchServerOrders(true);
  }, []);

  // Watch position and stream GPS coordinates when there's an active out-for-delivery run
  useEffect(() => {
    let locationSubscription: any = null;
    let isTracking = false;

    const startTracking = async () => {
      // Find active shipping order
      const activeOrder = orders.find(o => o.status === 'SHIPPED');
      if (!activeOrder) return;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Foreground location permission denied');
          return;
        }

        isTracking = true;
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 8000, // Every 8 seconds
            distanceInterval: 10, // Every 10 meters
          },
          async (loc) => {
            if (!isTracking) return;
            const { latitude, longitude } = loc.coords;

            // Stream coordinates to the backend server
            try {
              await fetch(`${API_BASE_URL}/orders/${activeOrder.id}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                  status: 'SHIPPED', // Keep current status
                  deliveryLat: latitude,
                  deliveryLng: longitude,
                }),
              });
            } catch (err) {
              console.warn('Failed to stream location coords to backend:', err);
            }
          }
        );
      } catch (e) {
        console.warn('Error starting location watch:', e);
      }
    };

    startTracking();

    return () => {
      isTracking = false;
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [orders]);

  const handleNavigateToAddress = (address: any) => {
    triggerHaptic('light');
    const lat = address.lat;
    const lng = address.lng;
    
    let url = '';
    if (lat && lng) {
      // Direct exact coordinates navigation
      url = Platform.select({
        ios: `maps://app?daddr=${lat},${lng}`,
        android: `google.navigation:q=${lat},${lng}`,
        default: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
      });
    } else {
      // Address text query navigation fallback
      const query = encodeURIComponent(`${address.houseNo} ${address.street} ${address.area} ${address.city} ${address.pincode}`);
      url = Platform.select({
        ios: `maps://app?daddr=${query}`,
        android: `google.navigation:q=${query}`,
        default: `https://www.google.com/maps/search/?api=1&query=${query}`
      });
    }

    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat && lng ? `${lat},${lng}` : encodeURIComponent(address.area + ' ' + address.city)}`;
        Linking.openURL(webUrl);
      }
    }).catch(err => {
      console.warn('Failed to open maps url:', err);
    });
  };

  const queueOfflineUpdate = (orderId: string, nextStatus: string, extraPayload: any = {}) => {
    setOfflineSyncQueue(prev => {
      const exists = prev.find(item => item.orderId === orderId && item.nextStatus === nextStatus);
      if (exists) return prev;
      return [...prev, { orderId, nextStatus, extraPayload }];
    });
    toast.warning('Saved locally! Updates will sync when online.');
  };

  useEffect(() => {
    if (isOnline && offlineSyncQueue.length > 0) {
      const syncOffline = async () => {
        let successCount = 0;
        for (const item of offlineSyncQueue) {
          try {
            const res = await fetch(`${API_BASE_URL}/orders/${item.orderId}`, {
              method: 'PATCH',
              headers: getAuthHeaders(),
              body: JSON.stringify({ status: item.nextStatus, ...item.extraPayload }),
            });
            if (res.ok) successCount++;
          } catch (err) {
            console.error('Failed to sync offline status update:', err);
          }
        }
        setOfflineSyncQueue([]);
        if (successCount > 0) {
          toast.success(`Successfully synced all offline status updates!`);
          fetchServerOrders(false);
        }
      };
      syncOffline();
    }
  }, [isOnline, offlineSyncQueue]);

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

  const triggerAudioSuccess = () => {
    triggerHaptic('success');
  };

  const acceptShipment = async (order: Order) => {
    if (isOnline) {
      const ok = await updateOrderStatus(order.id, 'SHIPPED');
      if (!ok) return;
    } else {
      setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: 'SHIPPED' } : o));
      queueOfflineUpdate(order.id, 'SHIPPED');
    }
    triggerHaptic('medium');
    toast.success(`Shipment accepted! Out for delivery.`);
  };

  const initiateConfirmDelivery = (order: Order) => {
    if (order.paymentMethod === 'COD') {
      setUpiTargetOrder(order);
      setIsUpiQrVisible(true);
    } else {
      setPhotoTargetOrder(order);
      setIsPhotoCapturing(true);
    }
    triggerHaptic('light');
  };

  const handleCashCollected = (order: Order) => {
    setIsUpiQrVisible(false);
    setUpiTargetOrder(null);
    setCodCollected(prev => prev + order.total);
    setPhotoTargetOrder(order);
    setIsPhotoCapturing(true);
  };

  const handleUpiQrPaid = (order: Order) => {
    setIsUpiQrVisible(false);
    setUpiTargetOrder(null);
    toast.success("Payment Received via UPI QR!");
    setPhotoTargetOrder(order);
    setIsPhotoCapturing(true);
  };

  const finalizeDelivery = async () => {
    if (!photoTargetOrder) return;
    const orderId = photoTargetOrder.id;
    const mockPhotoBase64 = "/delivered_package_proof.png";
    
    if (isOnline) {
      const ok = await updateOrderStatus(orderId, 'DELIVERED', {
        deliveryPhoto: mockPhotoBase64,
        deliveryLat: 26.1542,
        deliveryLng: 80.1724
      });
      if (!ok) return;
    } else {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'DELIVERED' } : o));
      queueOfflineUpdate(orderId, 'DELIVERED', {
        deliveryPhoto: mockPhotoBase64,
        deliveryLat: 26.1542,
        deliveryLng: 80.1724
      });
    }
    setTodayDeliveries(prev => prev + 1);
    triggerAudioSuccess();
    toast.success(`Delivery completed for #${orderId.slice(-6).toUpperCase()}`);
    setIsPhotoCapturing(false);
    setPhotoTargetOrder(null);
  };

  const optimizeRiderRoute = (ordersList: Order[]) => {
    if (ordersList.length <= 1) return ordersList;

    const storeLat = 26.1534185;
    const storeLng = 80.1714024;

    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    const getOrderCoords = (ord: Order) => {
      const lat = ord.address?.lat ?? 26.1542;
      const lng = ord.address?.lng ?? 80.1724;
      return { lat, lng };
    };

    const unvisited = [...ordersList];
    const optimized: Order[] = [];
    let currentLat = storeLat;
    let currentLng = storeLng;

    while (unvisited.length > 0) {
      let bestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const { lat, lng } = getOrderCoords(unvisited[i]);
        const dist = getDistance(currentLat, currentLng, lat, lng);
        
        let score = dist;
        if (unvisited[i].paymentMethod === 'COD') score -= 0.5;
        const elapsedMins = (new Date().getTime() - new Date(unvisited[i].createdAt).getTime()) / (60 * 1000);
        score -= elapsedMins * 0.05;

        if (score < minDistance) {
          minDistance = score;
          bestIndex = i;
        }
      }

      const nextOrder = unvisited.splice(bestIndex, 1)[0];
      optimized.push(nextOrder);
      const { lat, lng } = getOrderCoords(nextOrder);
      currentLat = lat;
      currentLng = lng;
    }

    return optimized;
  };

  const riderQueueOrders = useMemo(() => orders.filter(o => o.status === 'PACKED'), [orders]);
  const riderActiveDeliveries = useMemo(() => {
    const active = orders.filter(o => o.status === 'SHIPPED');
    return optimizeRiderRoute(active);
  }, [orders]);

  return (
    <SafeAreaView className="flex-1 bg-slate-955">
      <StatusBar style="light" />
      {/* Header */}
      <View className="bg-slate-900 px-3 py-2 flex-row items-center justify-between border-b border-slate-800">
        <View className="flex-row items-center gap-2">
          <Pressable 
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/operations');
              }
            }}
            className="w-8 h-8 rounded-full bg-slate-800 items-center justify-center border border-slate-700 active:bg-slate-700"
          >
            <ArrowLeft size={15} color="#fff" />
          </Pressable>
          <View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-white font-black text-sm">Rider Console 🛵</Text>
              <View className="px-1.5 py-0.5 rounded bg-indigo-900 border border-indigo-750">
                <Text className="text-white font-extrabold text-[7.5px] tracking-wider uppercase">
                  {user?.role || 'DELIVERY'}
                </Text>
              </View>
            </View>
            <Text className="text-slate-400 text-[9px] font-bold tracking-wide">FastKirana Logistics Delivery Fleet</Text>
          </View>
        </View>
        
        <Pressable 
          onPress={() => {
            if (Platform.OS === 'web') {
              const confirmLogout = window.confirm('Are you sure you want to log out from the rider console?');
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
          className="px-2.5 py-1 rounded-md bg-red-600/15 border border-red-500/25 active:bg-red-600/30"
        >
          <Text className="text-red-500 font-bold text-[10px]">Log Out</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 p-2.5" showsVerticalScrollIndicator={false}>
        {/* Today Rider Stats */}
        <View className="flex-row justify-between gap-2.5 mb-4 bg-slate-900 p-2.5 rounded-xl shadow-sm border border-slate-800">
          <View className="flex-1 items-center border-r border-slate-800">
            <Text className="text-white font-black text-base">{todayDeliveries}</Text>
            <Text className="text-slate-400 text-[7px] font-black uppercase tracking-wider mt-0.5">Delivered</Text>
          </View>
          <View className="flex-1 items-center border-r border-slate-800">
            <Text className="text-white font-black text-base">{riderActiveDeliveries.length}</Text>
            <Text className="text-slate-400 text-[7px] font-black uppercase tracking-wider mt-0.5">Active Run</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-emerald-400 font-black text-base">{formatPrice(codCollected)}</Text>
            <Text className="text-slate-400 text-[7px] font-black uppercase tracking-wider mt-0.5">COD Cash</Text>
          </View>
        </View>

        {/* Active Shipments Route */}
        {riderActiveDeliveries.length > 0 && (
          <View className="mb-4">
            <Text className="text-white font-black text-sm mb-2">Rider Active Run ({riderActiveDeliveries.length})</Text>
            <View className="gap-2.5">
              {riderActiveDeliveries.map((ord) => (
                <View key={ord.id} className="bg-slate-900 rounded-xl border border-slate-800 p-3 shadow-xs">
                  <View className="flex-row justify-between items-center border-b border-slate-800 pb-1.5 mb-2">
                    <View>
                      <Text className="text-white font-black text-xs uppercase">Shipment #{ord.id.slice(-6).toUpperCase()}</Text>
                      <Text className="text-slate-400 text-[8px] font-bold">Payment: {ord.paymentMethod} • {formatPrice(ord.total)}</Text>
                    </View>
                    <View className="bg-indigo-950/20 border border-indigo-900/30 px-1.5 py-0.5 rounded-full">
                      <Text className="text-indigo-400 font-extrabold text-[7px] uppercase tracking-wider">Active</Text>
                    </View>
                  </View>

                  <View className="flex-row items-center justify-between gap-2 mb-1.5">
                    <View className="flex-row items-center gap-1.5 flex-1">
                      <MapPin size={10} color="#ef4444" />
                      <Text className="text-slate-200 text-[11px] font-semibold flex-1 leading-4">
                        {ord.address.houseNo}, {ord.address.street}, {ord.address.area}, {ord.address.city}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleNavigateToAddress(ord.address)}
                      className="bg-indigo-650 active:bg-indigo-800 px-2.5 py-1 rounded-md flex-row items-center gap-1 shrink-0"
                    >
                      <Text className="text-white text-[9.5px] font-black uppercase">Navigate 🗺️</Text>
                    </Pressable>
                  </View>

                  <View className="flex-row items-center gap-1.5 mb-3">
                    <Phone size={10} color="#94a3b8" />
                    <Text className="text-slate-300 text-[11px] font-bold">{ord.user.name} ({ord.user.phone})</Text>
                  </View>

                  <Pressable
                    onPress={() => initiateConfirmDelivery(ord)}
                    className="bg-emerald-600 py-2.5 rounded-lg flex-row items-center justify-center gap-1 active:bg-emerald-700"
                  >
                    <Camera size={12} color="#fff" />
                    <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">Confirm Delivery Proof</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pickup queue from Picker Packing */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-white font-black text-sm">Rider Pickup Queue ({riderQueueOrders.length})</Text>
          <Pressable 
            onPress={() => fetchServerOrders(true)} 
            className="w-7 h-7 rounded-full bg-slate-900 items-center justify-center border border-slate-800 active:bg-slate-800"
          >
            <Text className="text-[10px]">🔄</Text>
          </Pressable>
        </View>

        {riderQueueOrders.length === 0 ? (
          <View className="bg-slate-900 rounded-xl border border-slate-800 p-4 items-center shadow-xs">
            <Text className="text-3xl">📦</Text>
            <Text className="text-white font-black text-xs mt-2">No shipments ready for pickup</Text>
            <Text className="text-slate-400 text-[10px] mt-1 text-center leading-normal">
              Riders wait here. Packhouses auto-pack orders to dispatch them here.
            </Text>
          </View>
        ) : (
          <View className="gap-2.5">
            {riderQueueOrders.map((ord) => (
              <View key={ord.id} className="bg-slate-900 rounded-xl border border-slate-800 p-3 shadow-xs">
                <View className="flex-row justify-between items-center border-b border-slate-800 pb-1.5 mb-2">
                  <View>
                    <Text className="text-white font-black text-xs uppercase">Order #{ord.id.slice(-6).toUpperCase()}</Text>
                    <Text className="text-slate-400 text-[8px] font-bold">{ord.address.area} • {formatPrice(ord.total)}</Text>
                  </View>
                  <View className="bg-emerald-955/20 border border-emerald-900/30 px-1.5 py-0.5 rounded-full">
                    <Text className="text-emerald-400 font-extrabold text-[7px] uppercase tracking-wider">Packed</Text>
                  </View>
                </View>

                <Text className="text-slate-200 text-[11px] font-semibold">User: {ord.user.name}</Text>
                <Text className="text-slate-400 text-[9px] font-semibold mt-0.5">Delivery address: {ord.address.houseNo}, {ord.address.street}</Text>

                <Pressable
                  onPress={() => acceptShipment(ord)}
                  className="bg-indigo-650 mt-3 py-2.5 rounded-lg flex-row items-center justify-center gap-1 active:bg-indigo-750"
                >
                  <Truck size={12} color="#fff" />
                  <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">Accept Delivery shipment</Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}
        <View className="h-6" />
      </ScrollView>

      {/* UPI QR Code Selector Modal */}
      {isUpiQrVisible && upiTargetOrder && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsUpiQrVisible(false)}
        >
          <View className="flex-1 bg-black/60 justify-center items-center p-6">
            <View className="bg-slate-900 rounded-3xl p-6 w-full max-w-sm items-center border border-slate-800 shadow-2xl">
              <QrCode size={40} color="#6366f1" />
              <Text className="text-white font-black text-base mt-3">Scan UPI QR Code</Text>
              <Text className="text-slate-400 text-[10px] font-bold text-center mt-1 uppercase tracking-wider">Amount: {formatPrice(upiTargetOrder.total)}</Text>
              
              <View className="w-48 h-48 bg-white rounded-2xl border border-slate-700 mt-5 items-center justify-center p-2.5">
                <Image
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`upi://pay?pa=iamuv26@ptyes&pn=FastKirana&am=${upiTargetOrder.total}&cu=INR&tn=Order_${upiTargetOrder.id.slice(0, 8)}`)}` }}
                  style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
                />
              </View>

              <View className="flex-row w-full gap-2.5 mt-6 border-t border-slate-800 pt-5">
                <Pressable
                  onPress={() => handleCashCollected(upiTargetOrder)}
                  className="flex-1 border border-slate-800 py-3 rounded-xl items-center bg-slate-950 active:bg-slate-800"
                >
                  <Text className="text-slate-300 font-extrabold text-xs uppercase tracking-wider">Paid Cash</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleUpiQrPaid(upiTargetOrder)}
                  className="flex-1 bg-indigo-600 py-3 rounded-xl items-center active:bg-indigo-700"
                >
                  <Text className="text-white font-extrabold text-xs uppercase tracking-wider">Confirm Paid</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Photo Proof Capture Simulation Overlay */}
      {isPhotoCapturing && photoTargetOrder && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsPhotoCapturing(false)}
        >
          <View className="flex-1 bg-black justify-between p-6">
            <View className="flex-row justify-between items-center mt-8">
              <Pressable 
                onPress={() => setIsPhotoCapturing(false)}
                className="w-10 h-10 rounded-full bg-slate-800 items-center justify-center"
              >
                <X size={20} color="#fff" />
              </Pressable>
              <Text className="text-white font-black text-xs uppercase tracking-widest">Capture Delivery Proof</Text>
              <View className="w-10" />
            </View>

            <View className="w-full aspect-[4/3] bg-slate-900 border-2 border-white/20 rounded-3xl items-center justify-center relative overflow-hidden self-center my-6">
              <Text className="text-5xl">📷</Text>
              <Text className="text-white/60 text-[10px] font-black uppercase tracking-wider mt-4">Place package at door & snap</Text>
              <View className="absolute bottom-4 left-4 right-4 bg-black/60 p-2 rounded-xl border border-white/5">
                <Text className="text-white text-[9px] font-black uppercase text-center">Proof for: {photoTargetOrder.user.name}</Text>
              </View>
            </View>

            <Pressable 
              onPress={finalizeDelivery}
              className="w-20 h-20 rounded-full border-4 border-white items-center justify-center self-center mb-8 active:scale-95 transition-all"
            >
              <View className="w-14 h-14 rounded-full bg-white" />
            </Pressable>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
}
