import { View, Text, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useCallback } from 'react';
import { router, useFocusEffect } from 'expo-router';
import { ArrowLeft, Clock, ChevronRight } from 'lucide-react-native';
import { useAuthStore } from '../stores/auth-store';
import { API_BASE_URL, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../lib/constants';
import { formatPrice } from '../lib/utils';
import { toast } from '../lib/toast';
import { useTheme } from './context/ThemeContext';
import BuyAgainSection from '../components/home/BuyAgainSection';

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  shopName: string | null;
  items: OrderItem[];
}

export default function OrdersScreen() {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

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

  const loadOrders = async () => {
    setIsLoading(true);
    let serverOrders: Order[] = [];
    
    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        serverOrders = data;
      }
    } catch (err) {
      console.warn('Failed to load orders from backend:', err);
    }

    // Merge with local fallback/mock orders from MMKV
    try {
      const { mmkvStorage } = require('../lib/storage');
      const localKey = `local_orders_${user?.id || 'guest'}`;
      const localData = mmkvStorage.getItem(localKey);
      if (localData) {
        const localList = JSON.parse(localData);
        // Combine list, avoiding duplicates by id
        const combined = [...localList];
        serverOrders.forEach((so: Order) => {
          if (!combined.some((lo) => lo.id === so.id)) {
            combined.push(so);
          }
        });
        
        // Sort by date descending
        combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setOrders(combined);
      } else {
        setOrders(serverOrders);
      }
    } catch (storageErr) {
      console.warn('Failed to load local fallback orders:', storageErr);
      setOrders(serverOrders);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [user])
  );

  const getStatusStyle = (status: string) => {
    const defaultColor = 'bg-slate-100 text-slate-800';
    return ORDER_STATUS_COLORS[status] || defaultColor;
  };

  const getStatusLabel = (status: string) => {
    return ORDER_STATUS_LABELS[status] || status;
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-zinc-950">
      {/* Header */}
      <View className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex-row justify-between items-center shadow-xs">
        <View className="flex-row items-center gap-3">
          <View style={{ width: 36 }} />
          <Text className="text-slate-800 dark:text-zinc-100 font-black text-base">My Orders</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView className="flex-1 px-4 py-4" showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#e20a22" />
          </View>
        ) : orders.length === 0 ? (
          <View className="items-center justify-center py-20 px-6">
            <Text className="text-5xl">🛍️</Text>
            <Text className="text-slate-800 dark:text-zinc-200 font-black text-base mt-4">No Orders Placed Yet</Text>
            <Text className="text-slate-400 dark:text-zinc-400 text-xs mt-1 text-center leading-4">
              Your grocery basket is empty! Check out our categories and order fresh produce & hot brews.
            </Text>
            <Pressable 
              onPress={() => router.replace('/(tabs)')}
              className="bg-rose-600 px-6 py-3 rounded-xl mt-6 shadow-xs"
            >
              <Text className="text-white font-extrabold text-xs">Start Shopping</Text>
            </Pressable>
          </View>
        ) : (
          <View className="gap-3.5 mb-2">
            {orders.map((order) => (
              <Pressable
                key={order.id}
                onPress={() => router.push(`/order/${order.id}`)}
                className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 shadow-xs active:scale-[0.99] transition-all"
              >
                {/* Header Row */}
                <View className="flex-row justify-between items-center pb-2 border-b border-slate-50 dark:border-zinc-800/50">
                  <View>
                    <Text className="text-slate-400 dark:text-zinc-400 text-[9px] font-bold uppercase tracking-wider">Order ID</Text>
                    <Text className="text-slate-800 dark:text-zinc-100 font-bold text-xs mt-0.5">{order.id.slice(-8).toUpperCase()}</Text>
                  </View>

                  <View className={`px-2 py-0.5 rounded-full ${getStatusStyle(order.status)}`}>
                    <Text className="text-[8px] font-black uppercase tracking-wider">
                      {getStatusLabel(order.status)}
                    </Text>
                  </View>
                </View>

                {/* Items preview list */}
                <View className="py-2.5">
                  <Text className="text-slate-500 dark:text-zinc-400 text-xs font-semibold leading-relaxed" numberOfLines={2}>
                    {order.items.map(it => `${it.name} (${it.quantity}x)`).join(', ')}
                  </Text>
                </View>

                {/* Bottom Row */}
                <View className="flex-row justify-between items-center pt-2 border-t border-slate-50 dark:border-zinc-800/50">
                  <View className="flex-row items-center gap-1">
                    <Clock size={12} color={isDarkMode ? '#71717a' : '#94a3b8'} />
                    <Text className="text-slate-400 dark:text-zinc-500 text-[10px] font-semibold">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-1">
                     <Text className="text-slate-800 dark:text-zinc-200 font-black text-sm">{formatPrice(order.total)}</Text>
                    <ChevronRight size={14} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}

        {/* One-tap Reorder Buy Again Section */}
        <BuyAgainSection />

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}
