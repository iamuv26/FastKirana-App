import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useMemo, useEffect } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, Check, ChefHat } from 'lucide-react-native';
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
  imageUrl?: string | null;
  categorySlug?: string;
  cooked?: boolean;
  notes?: string | null;
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
      { id: "oi4", name: "Veg Fried Momos", price: 49, quantity: 2, categorySlug: "cafe" },
      { id: "oi5", name: "Classic Cold Coffee", price: 79, quantity: 1, categorySlug: "cafe" }
    ]
  }
];

export default function ChefScreen() {
  const { user, logout } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>(INITIAL_SIMULATION_ORDERS);
  const [isOnline, setIsOnline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
            categorySlug: it.product?.category?.slug || 'cafe',
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
          .filter(it => it.categorySlug === 'cafe')
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
        toast.success(`☕ Kitchen order for ${targetOrderUser} prepared! Sent to Rider.`);
      }, 300);
    } else {
      setOrders(updatedOrders);
      triggerAudioBeep();
    }
  };

  const pendingCafeOrders = useMemo(() => {
    return orders.filter(o => 
      (o.status === 'PENDING' || o.status === 'CONFIRMED') && 
      o.items.some(it => it.categorySlug === 'cafe')
    );
  }, [orders]);

  const aggregatedPrepItems = useMemo(() => {
    const counts: Record<string, { name: string; quantity: number }> = {};
    orders.forEach(order => {
      if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') return;
      order.items.forEach(item => {
        if (item.categorySlug !== 'cafe') return;
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
    <SafeAreaView className="flex-1 bg-slate-950">
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
              <Text className="text-white font-black text-sm">Cafe Kitchen Console 🍳</Text>
              <View className="px-1.5 py-0.5 rounded bg-rose-900 border border-rose-750">
                <Text className="text-white font-extrabold text-[7.5px] tracking-wider uppercase">
                  {user?.role || 'CHEF'}
                </Text>
              </View>
            </View>
            <Text className="text-slate-400 text-[9px] font-bold tracking-wide">FastKirana Cafe Food Prep Station</Text>
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
          className="px-2.5 py-1 rounded-md bg-red-600/15 border border-red-500/25 active:bg-red-600/30"
        >
          <Text className="text-red-500 font-bold text-[10px]">Log Out</Text>
        </Pressable>
      </View>

      {/* Main Content */}
      <ScrollView className="flex-1 p-2.5" showsVerticalScrollIndicator={false}>
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-white font-black text-sm">Cafe Kitchen Cooking Queue</Text>
          <Pressable 
            onPress={() => fetchServerOrders(true)} 
            className="w-7 h-7 rounded-full bg-slate-900 items-center justify-center border border-slate-800 active:bg-slate-800"
          >
            <Text className="text-[10px]">🔄</Text>
          </Pressable>
        </View>

        {aggregatedPrepItems.length > 0 && (
          <View className="mb-4 bg-orange-950/20 border border-orange-900/30 rounded-2xl p-3 shadow-xs">
            <Text className="text-orange-400 font-black text-[9px] uppercase tracking-wider mb-2">🧑‍🍳 Kitchen Prep Summary (Bulk Prepare)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 py-0.5">
              {aggregatedPrepItems.map((item, idx) => (
                <View key={idx} className="bg-slate-950 border border-orange-900/15 rounded-xl px-3 py-2 flex-row items-center gap-1.5 shadow-2xs">
                  <Text className="text-slate-200 font-extrabold text-[10px]">{item.name}</Text>
                  <View className="bg-orange-950/40 px-2 py-0.5 rounded-lg">
                    <Text className="text-orange-400 font-black text-[9px]">x{item.quantity}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {pendingCafeOrders.length === 0 ? (
          <View className="bg-slate-900 rounded-xl border border-slate-800 p-4 items-center shadow-xs">
            <Text className="text-3xl">🍳</Text>
            <Text className="text-white font-black text-xs mt-2">No cafe items pending cooking</Text>
            <Text className="text-slate-400 text-[10px] mt-1 text-center leading-normal">
              Cafe orders placed on the customer app sync instantly to the chef console.
            </Text>
          </View>
        ) : (
          <View className="gap-2.5 mb-6">
            {pendingCafeOrders.map((ord) => {
              const cafeItems = ord.items.filter(it => it.categorySlug === 'cafe');
              const isPending = ord.status === 'PENDING';
              return (
                <View key={ord.id} className="bg-slate-900 rounded-xl border border-slate-800 p-3 shadow-xs">
                  <View className="flex-row justify-between items-center border-b border-slate-800 pb-1.5 mb-2">
                    <View>
                      <Text className="text-white font-black text-xs uppercase">Kitchen Job #{ord.id.slice(-6).toUpperCase()}</Text>
                      <Text className="text-slate-400 text-[8px] font-bold">Order Time: {new Date(ord.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</Text>
                    </View>
                    <View className={isPending ? "bg-amber-950/20 border border-amber-900/30 px-1.5 py-0.5 rounded-full" : "bg-rose-950/20 border border-rose-900/30 px-1.5 py-0.5 rounded-full"}>
                      <Text className={isPending ? "text-amber-400 font-extrabold text-[7px] uppercase tracking-wider" : "text-rose-400 font-extrabold text-[7px] uppercase tracking-wider"}>
                        {isPending ? 'Pending' : 'Preparing'}
                      </Text>
                    </View>
                  </View>

                  {isPending ? (
                    <View>
                      <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1.5">Items Preview</Text>
                      <View className="gap-2 opacity-60 mb-3">
                        {cafeItems.map((item) => (
                          <View key={item.id} className="flex-row justify-between items-center p-2 rounded-lg border border-slate-800 bg-slate-950/40">
                            <View className="flex-1 pr-1.5">
                              <Text className="text-[11px] font-bold text-slate-200">{item.name}</Text>
                              <Text className="text-slate-400 text-[8px] font-semibold">Quantity: x{item.quantity}</Text>
                              {item.notes && (
                                <Text className="text-orange-400 text-[9px] font-black mt-1">🗒️ Note: {item.notes}</Text>
                              )}
                            </View>
                          </View>
                        ))}
                      </View>
                      <Pressable
                        onPress={() => startPreparingChef(ord)}
                        className="bg-rose-600 py-2.5 rounded-lg flex-row items-center justify-center gap-1 active:bg-rose-700"
                      >
                        <ChefHat size={12} color="#fff" />
                        <Text className="text-white font-extrabold text-[10px] uppercase tracking-wider">Accept & Start Cooking</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View>
                      <Text className="text-slate-400 font-bold text-[9px] uppercase tracking-wider mb-1.5">Items to Cook</Text>
                      <View className="gap-2">
                        {cafeItems.map((item) => (
                          <Pressable
                            key={item.id}
                            onPress={() => markChefItemReady(ord.id, item.id)}
                            className={`flex-row justify-between items-center p-2.5 rounded-lg border ${
                              item.cooked 
                                ? 'bg-emerald-950/20 border-emerald-900/30' 
                                : 'bg-slate-950 border border-slate-800'
                            }`}
                          >
                            <View className="flex-1 pr-1.5">
                              <Text className={`text-[11px] font-bold ${item.cooked ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                                {item.name}
                              </Text>
                              <Text className="text-slate-400 text-[8px] font-semibold">Quantity: x{item.quantity}</Text>
                              {item.notes && (
                                <Text className="text-orange-400 text-[9px] font-black mt-1">🗒️ Note: {item.notes}</Text>
                              )}
                            </View>

                            <View className={`w-5 h-5 rounded-full items-center justify-center ${
                              item.cooked ? 'bg-emerald-600' : 'bg-slate-800'
                            }`}>
                              {item.cooked ? (
                                <Check size={10} color="#fff" strokeWidth={3} />
                              ) : (
                                <Text className="text-[8px] font-black text-slate-400">+</Text>
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
        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
