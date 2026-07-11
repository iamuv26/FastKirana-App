import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ActivityIndicator, ScrollView, Platform } from 'react-native';
import { ShoppingBag, MapPin, X, Check, Phone } from 'lucide-react-native';
import { formatPrice } from '../../lib/utils';

interface NewOrderAlertModalProps {
  order: {
    id: string;
    total: number;
    paymentMethod: string;
    deliveryMethod: string;
    items: any[];
    address?: any;
  } | null;
  onAccept: (id: string) => Promise<boolean>;
  onDismiss: (id: string) => void;
  isDarkMode: boolean;
}

export function NewOrderAlertModal({ order, onAccept, onDismiss, isDarkMode }: NewOrderAlertModalProps) {
  const [isAccepting, setIsAccepting] = useState(false);

  if (!order) return null;

  const handleAccept = async () => {
    setIsAccepting(true);
    const success = await onAccept(order.id);
    setIsAccepting(false);
  };

  const isUpi = order.paymentMethod === 'UPI';
  const isPickup = order.deliveryMethod === 'PICKUP';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={!!order}
      onRequestClose={() => onDismiss(order.id)}
    >
      <View className="flex-1 justify-center items-center bg-black/60 px-4">
        <View 
          style={{ width: Platform.OS === 'web' ? 420 : '100%', maxHeight: '80%' }}
          className={`rounded-3xl border overflow-hidden ${
            isDarkMode 
              ? 'bg-zinc-950 border-rose-900/50 shadow-rose-900/10' 
              : 'bg-white border-rose-100 shadow-rose-100/10'
          } shadow-2xl`}
        >
          {/* Header Banners: Urgent Blinking Alert */}
          <View className="bg-rose-600 px-5 py-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
              <Text className="text-white font-black text-sm uppercase tracking-wider">🔔 Urgent: New Order</Text>
            </View>
            <Text className="text-rose-100 font-extrabold text-xs">
              ID: #{order.id.slice(-6).toUpperCase()}
            </Text>
          </View>

          {/* Scrollable Order Details */}
          <ScrollView className="p-5 flex-grow-0" showsVerticalScrollIndicator={false}>
            {/* Amount and Payments */}
            <View className={`p-4 rounded-2xl mb-4 items-center justify-between flex-row ${
              isDarkMode ? 'bg-zinc-900' : 'bg-slate-50'
            }`}>
              <View>
                <Text className="text-slate-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-wider">Total Amount</Text>
                <Text className="text-2xl font-black text-rose-600 dark:text-rose-400">{formatPrice(order.total)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-slate-400 dark:text-zinc-500 text-[10px] font-black uppercase tracking-wider">Fulfillment</Text>
                <Text className={`text-xs font-black px-2 py-0.5 rounded-md mt-0.5 uppercase tracking-wide ${
                  isPickup 
                    ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400' 
                    : 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
                }`}>
                  {isPickup ? 'Self-Pickup' : 'Home Delivery'}
                </Text>
              </View>
            </View>

            {/* Address / Contact details */}
            <View className="mb-4 gap-2.5">
              <View className="flex-row gap-2">
                <View className={`w-8 h-8 rounded-full items-center justify-center ${
                  isDarkMode ? 'bg-zinc-900' : 'bg-slate-100'
                }`}>
                  <Phone size={14} color={isDarkMode ? '#e4e4e7' : '#4b5563'} />
                </View>
                <View className="flex-1 justify-center">
                  <Text className="text-slate-500 dark:text-zinc-400 text-[9px] font-black uppercase tracking-wider">Payment Method</Text>
                  <Text className="text-slate-800 dark:text-zinc-200 text-xs font-bold mt-0.5">
                    {order.paymentMethod === 'COD' ? '💵 Cash on Delivery' : isUpi ? '⚡ UPI Transaction' : '💳 Credit/Debit Card'}
                  </Text>
                </View>
              </View>

              {!isPickup && order.address && (
                <View className="flex-row gap-2">
                  <View className={`w-8 h-8 rounded-full items-center justify-center ${
                    isDarkMode ? 'bg-zinc-900' : 'bg-slate-100'
                  }`}>
                    <MapPin size={14} color="#e20a22" />
                  </View>
                  <View className="flex-1 justify-center">
                    <Text className="text-slate-500 dark:text-zinc-400 text-[9px] font-black uppercase tracking-wider">Delivery Address</Text>
                    <Text className="text-slate-700 dark:text-zinc-300 text-xs font-semibold mt-0.5 leading-relaxed" numberOfLines={2}>
                      {[
                        order.address.houseNo && order.address.houseNo !== '-' ? `House ${order.address.houseNo}` : '',
                        order.address.street !== '-' ? order.address.street : '',
                        order.address.area !== '-' ? order.address.area : '',
                        order.address.city
                      ].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <View className="h-px bg-slate-100 dark:bg-zinc-800/80 my-2" />

            {/* Item List Header */}
            <Text className="text-slate-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider mb-2">
              Items ({order.items.length})
            </Text>

            {/* Item list rows */}
            <View className="gap-2 max-h-40">
              {order.items.map((item, idx) => (
                <View 
                  key={idx} 
                  className={`flex-row justify-between items-center p-2.5 rounded-xl ${
                    isDarkMode ? 'bg-zinc-900/60' : 'bg-slate-50/50'
                  }`}
                >
                  <View className="flex-1 pr-3">
                    <Text className="text-slate-800 dark:text-zinc-200 font-bold text-xs" numberOfLines={1}>
                      {item.name || item.product?.name}
                    </Text>
                    {item.notes && (
                      <Text className="text-[10px] text-rose-500 dark:text-rose-400 font-semibold italic mt-0.5">
                        Note: {item.notes}
                      </Text>
                    )}
                  </View>
                  <Text className="text-slate-500 dark:text-zinc-400 font-black text-xs">
                    x{item.quantity}
                  </Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer CTA Buttons */}
          <View className={`p-5 flex-row gap-3 border-t ${
            isDarkMode ? 'bg-zinc-950/60 border-zinc-900' : 'bg-slate-50/60 border-slate-100'
          }`}>
            <Pressable
              onPress={() => onDismiss(order.id)}
              disabled={isAccepting}
              className={`flex-1 py-3 rounded-xl border items-center justify-center flex-row gap-1.5 active:scale-95 ${
                isDarkMode 
                  ? 'border-zinc-800 bg-zinc-900 active:bg-zinc-800/80' 
                  : 'border-slate-200 bg-white active:bg-slate-50'
              }`}
            >
              <X size={15} color={isDarkMode ? '#fafafa' : '#4b5563'} strokeWidth={3} />
              <Text className={`font-black text-xs ${isDarkMode ? 'text-zinc-100' : 'text-slate-600'}`}>
                SNOOZE
              </Text>
            </Pressable>

            <Pressable
              onPress={handleAccept}
              disabled={isAccepting}
              className="flex-[2] bg-rose-600 active:bg-rose-700 py-3 rounded-xl items-center justify-center flex-row gap-1.5 active:scale-95 shadow-md shadow-rose-600/20"
            >
              {isAccepting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Check size={16} color="#fff" strokeWidth={3.5} />
                  <Text className="text-white font-black text-xs tracking-wide">
                    ACCEPT ORDER
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
