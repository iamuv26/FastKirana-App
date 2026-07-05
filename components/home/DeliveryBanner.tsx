import React from 'react';
import { View, Text } from 'react-native';
import { Truck, Sparkles, ShieldCheck, Store } from 'lucide-react-native';
import { useTheme } from '../../app/context/ThemeContext';

export default function DeliveryBanner() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <View className="mx-4 my-4 bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden">
      {/* Tagline */}
      <View className="bg-rose-50/40 dark:bg-zinc-800/40 px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex-row items-center justify-center gap-1.5">
        <Store size={14} color="#e20a22" />
        <Text className="text-[10px] min-[375px]:text-xs font-bold text-slate-800 dark:text-zinc-200 text-center">
          From Your Town's Dark Store — Packed & Delivered by <Text className="text-[#e20a22] font-black">FastKirana</Text>
        </Text>
      </View>

      <View className="p-4 gap-4">
        {/* Instant Delivery */}
        <View className="flex-row items-start gap-3.5">
          <View className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/20 items-center justify-center border border-rose-100/10">
            <Truck size={20} color="#e20a22" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-black text-slate-800 dark:text-zinc-100">Fast Instant Delivery</Text>
            <Text className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed font-semibold">
              Our network of local dark stores delivers your groceries fresh to your doorstep with our fast delivery service.
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View className="h-[1px] bg-slate-150 dark:bg-zinc-800" />

        {/* Free Shipping */}
        <View className="flex-row items-start gap-3.5">
          <View className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/20 items-center justify-center border border-amber-100/10">
            <Sparkles size={20} color="#d97706" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-black text-slate-800 dark:text-zinc-100">Free Shipping</Text>
            <Text className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed font-semibold">
              Order your daily essentials and get free contactless delivery for cart values above ₹199.
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View className="h-[1px] bg-slate-150 dark:bg-zinc-800" />

        {/* Freshness */}
        <View className="flex-row items-start gap-3.5">
          <View className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 items-center justify-center border border-emerald-100/10">
            <ShieldCheck size={20} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-black text-slate-800 dark:text-zinc-100">Super Fresh Guarantee</Text>
            <Text className="text-[10px] text-slate-500 dark:text-zinc-400 mt-0.5 leading-relaxed font-semibold">
              Handpicked vegetables and fruits sourced daily. If you are not satisfied, return at the door.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
