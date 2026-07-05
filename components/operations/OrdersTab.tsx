import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { RefreshCw, Search, ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth-store';
import { API_BASE_URL } from '../../lib/constants';
import { formatPrice } from '../../lib/utils';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';
import { useTheme } from '../../app/context/ThemeContext';

export default function OrdersTab() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

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

  // 1. Fetch Orders Query with pagination, search, and status filter
  const { 
    data: ordersData = { orders: [], total: 0, counts: {} }, 
    isLoading: isAdminOrdersLoading, 
    refetch: fetchAdminOrders,
    isRefetching
  } = useQuery<any>({
    queryKey: ['adminOrders', page, filter, searchQuery],
    queryFn: async () => {
      const statusParam = filter === 'ALL' ? '' : filter;
      const res = await fetch(
        `${API_BASE_URL}/admin/orders?page=${page}&limit=10&status=${statusParam}&search=${encodeURIComponent(searchQuery)}`, 
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      return {
        orders: Array.isArray(data.orders) ? data.orders : [],
        total: data.total || 0,
        counts: data.counts || {}
      };
    },
    staleTime: 10000,
  });

  const adminOrders = ordersData.orders;
  const orderTotal = ordersData.total;
  const orderCounts = ordersData.counts;
  const totalPages = Math.ceil(orderTotal / 10) || 1;

  // 2. Update Order Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: (_, variables) => {
      triggerHaptic('success');
      toast.success(`Order status updated to ${variables.status}!`);
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    },
    onError: () => {
      toast.error('Failed to update order status.');
    }
  });

  const handleUpdateStatus = (orderId: string, status: string) => {
    triggerHaptic('medium');
    updateStatusMutation.mutate({ orderId, status });
  };

  const getFilterLabel = (key: string) => {
    const labels: Record<string, string> = {
      ALL: 'All',
      PENDING: 'Placed (New)',
      CONFIRMED: 'Confirmed',
      PACKED: 'Packed',
      SHIPPED: 'On the Way',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
    };
    return labels[key] || key;
  };

  return (
    <View className="gap-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-1 flex-wrap gap-2">
        <View>
          <Text className="text-slate-850 dark:text-zinc-105 font-black text-base">Store Orders</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-[8px] font-bold mt-0.5">
            Showing {adminOrders.length} of {orderTotal} orders
          </Text>
        </View>
        <Pressable 
          onPress={() => {
            triggerHaptic('light');
            fetchAdminOrders();
          }}
          disabled={isAdminOrdersLoading || isRefetching}
          className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 active:bg-indigo-100 flex-row items-center gap-1.5"
        >
          {isAdminOrdersLoading || isRefetching ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : (
            <RefreshCw size={12} color="#4f46e5" />
          )}
          <Text className="text-indigo-600 dark:text-indigo-400 font-extrabold text-[9px] uppercase tracking-wider">Refresh</Text>
        </Pressable>
      </View>

      {/* Search Input Bar */}
      <View className="bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-zinc-800 rounded-full px-4 h-11 flex-row items-center gap-2.5 shadow-sm">
        <Search size={15} color="#94a3b8" strokeWidth={2.5} />
        <TextInput
          placeholder="Search orders by ID, customer name, email or phone..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setPage(1); // reset to page 1 on new search
          }}
          className="flex-1 text-slate-800 dark:text-white font-bold text-xs h-full p-0"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} className="bg-slate-200/60 dark:bg-zinc-800 p-1 rounded-full">
            <X size={12} color="#94a3b8" />
          </Pressable>
        )}
      </View>

      {/* Filter buttons with counts */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2 py-1">
        {['ALL', 'PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((f) => {
          const isActive = filter === f;
          const count = orderCounts[f] ?? 0;
          return (
            <Pressable
              key={f}
              onPress={() => {
                triggerHaptic('light');
                setFilter(f);
                setPage(1); // reset page on filter change
              }}
              className={`px-4 py-2 rounded-full border mr-2 ${
                isActive 
                  ? 'bg-indigo-600 border-indigo-500 shadow-xs' 
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
              }`}
            >
              <Text className={`text-[9px] font-black uppercase tracking-wider ${isActive ? 'text-white' : 'text-slate-550 dark:text-zinc-400'}`}>
                {getFilterLabel(f)} ({count})
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Peak Load Alert Banner */}
      {((orderCounts['PENDING'] || 0) + (orderCounts['CONFIRMED'] || 0)) >= 10 && (
        <View className="p-4 rounded-2xl border border-rose-500/25 bg-rose-50/50 dark:bg-rose-955/10">
          <Text className="text-rose-600 dark:text-rose-455 font-extrabold text-xs">Peak Load Alert: {((orderCounts['PENDING'] || 0) + (orderCounts['CONFIRMED'] || 0))} Active Orders</Text>
          <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-semibold mt-1">Staff allocation is recommended to maintain the 10-minute delivery SLA.</Text>
        </View>
      )}

      {/* Orders list */}
      {isAdminOrdersLoading && adminOrders.length === 0 ? (
        <View className="py-20 items-center">
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : adminOrders.length === 0 ? (
        <View className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/60 dark:border-zinc-800 p-8 items-center">
          <Text className="text-slate-500 dark:text-zinc-400 text-xs text-center font-bold">No orders found.</Text>
        </View>
      ) : (
        <View className="gap-3.5 mb-4">
          {adminOrders.map((ord: any) => (
            <View key={ord.id} className="bg-white dark:bg-zinc-900 rounded-3xl border border-slate-150 dark:border-zinc-800/80 p-4 shadow-sm">
              <View className="flex-row justify-between items-center border-b border-dashed border-slate-100 dark:border-zinc-800/80 pb-3 mb-3">
                <View>
                  <Text className="text-slate-850 dark:text-zinc-200 font-extrabold text-xs uppercase">Order #{ord.id.slice(0, 8).toUpperCase()}</Text>
                  <Text className="text-slate-400 dark:text-zinc-500 text-[8.5px] font-black mt-0.5 uppercase tracking-wider">
                    {new Date(ord.createdAt).toLocaleString('en-IN')}  •  {ord.paymentMethod}
                  </Text>
                  <Text className="text-slate-650 dark:text-zinc-350 font-bold text-[9.5px] mt-1.5">
                    👤 {ord.userName || ord.userEmail || 'Customer'}
                  </Text>
                </View>
                <View className={`px-3 py-1 rounded-full border ${
                  ord.status === 'DELIVERED' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                  ord.status === 'CANCELLED' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400' :
                  'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30 text-amber-700 dark:text-amber-400'
                }`}>
                  <Text style={{ fontSize: 8.5, fontWeight: '900' }} className="uppercase tracking-wider text-center">{ord.status}</Text>
                </View>
              </View>

              {/* Items */}
              <View className="py-1">
                {ord.items?.map((item: any, idx: number) => (
                  <Text key={idx} className="text-slate-600 dark:text-zinc-400 text-xs font-semibold leading-5">
                    • {item.productName || item.name} (×{item.quantity}) - {formatPrice(item.price)}
                  </Text>
                ))}
              </View>

              {/* Actions */}
              <View className="flex-row justify-between items-center border-t border-slate-100 dark:border-zinc-800/80 pt-3 mt-3">
                <View>
                  <Text className="text-slate-400 dark:text-zinc-500 text-[8px] font-black uppercase tracking-wider">Total Bill</Text>
                  <Text className="text-slate-800 dark:text-zinc-250 font-black text-sm">{formatPrice(ord.total)}</Text>
                </View>

                <View className="flex-row gap-2">
                  {ord.status === 'PENDING' && (
                    <Pressable
                      onPress={() => handleUpdateStatus(ord.id, 'CONFIRMED')}
                      disabled={updateStatusMutation.isPending}
                      className="bg-indigo-600 active:bg-indigo-700 px-4 py-2 rounded-full shadow-xs"
                    >
                      <Text className="text-white font-extrabold text-[9.5px] uppercase tracking-wider">Confirm</Text>
                    </Pressable>
                  )}
                  {ord.status === 'CONFIRMED' && (
                    <Pressable
                      onPress={() => handleUpdateStatus(ord.id, 'PACKED')}
                      disabled={updateStatusMutation.isPending}
                      className="bg-amber-650 active:bg-amber-700 px-4 py-2 rounded-full shadow-xs"
                    >
                      <Text className="text-white font-extrabold text-[9.5px] uppercase tracking-wider">Pack</Text>
                    </Pressable>
                  )}
                  {ord.status === 'PACKED' && (
                    <Pressable
                      onPress={() => handleUpdateStatus(ord.id, 'SHIPPED')}
                      disabled={updateStatusMutation.isPending}
                      className="bg-blue-600 active:bg-blue-700 px-4 py-2 rounded-full shadow-xs"
                    >
                      <Text className="text-white font-extrabold text-[9.5px] uppercase tracking-wider">Ship</Text>
                    </Pressable>
                  )}
                  {ord.status === 'SHIPPED' && (
                    <Pressable
                      onPress={() => handleUpdateStatus(ord.id, 'DELIVERED')}
                      disabled={updateStatusMutation.isPending}
                      className="bg-emerald-600 active:bg-emerald-700 px-4 py-2 rounded-full shadow-xs"
                    >
                      <Text className="text-white font-extrabold text-[9.5px] uppercase tracking-wider">Deliver</Text>
                    </Pressable>
                  )}
                  {['PENDING', 'CONFIRMED'].includes(ord.status) && (
                    <Pressable
                      onPress={() => handleUpdateStatus(ord.id, 'CANCELLED')}
                      disabled={updateStatusMutation.isPending}
                      className="bg-rose-50 dark:bg-rose-955/10 border border-rose-100 dark:border-rose-900/30 active:bg-rose-100/60 px-4 py-2 rounded-full"
                    >
                      <Text className="text-rose-600 dark:text-rose-400 font-extrabold text-[9.5px] uppercase tracking-wider">Cancel</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Pagination Controls */}
      {orderTotal > 10 && (
        <View className="flex-row justify-between items-center py-2 mb-10">
          <Pressable
            onPress={() => {
              if (page > 1) {
                triggerHaptic('light');
                setPage(page - 1);
              }
            }}
            disabled={page === 1}
            className={`px-3 py-2 rounded-xl border flex-row items-center gap-1 ${
              page === 1 ? 'border-slate-100 dark:border-zinc-800 opacity-50' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 active:bg-slate-200'
            }`}
          >
            <ChevronLeft size={14} color={isDark ? '#fff' : '#000'} />
            <Text className="text-slate-800 dark:text-white font-black text-[10px]">PREVIOUS</Text>
          </Pressable>

          <Text className="text-slate-500 dark:text-slate-400 text-xs font-bold">
            Page {page} of {totalPages}
          </Text>

          <Pressable
            onPress={() => {
              if (page < totalPages) {
                triggerHaptic('light');
                setPage(page + 1);
              }
            }}
            disabled={page === totalPages}
            className={`px-3 py-2 rounded-xl border flex-row items-center gap-1 ${
              page === totalPages ? 'border-slate-100 dark:border-zinc-800 opacity-50' : 'bg-slate-100 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700 active:bg-slate-200'
            }`}
          >
            <Text className="text-slate-800 dark:text-white font-black text-[10px]">NEXT</Text>
            <ChevronRight size={14} color={isDark ? '#fff' : '#000'} />
          </Pressable>
        </View>
      )}
    </View>
  );
}
