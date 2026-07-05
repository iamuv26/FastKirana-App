import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Coffee, Flame, ChevronRight, Clock } from 'lucide-react-native';
import { formatPrice } from '../../lib/utils';

export default function CafeFlashDeals() {
  // Flash Deals Countdown (starts at 15m 00s for demo)
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const flashProducts = [
    { id: 'p1', name: 'Fresh Strawberries', price: 99, mrp: 199, discount: '50% OFF', unit: '250g', emoji: '🍓' },
    { id: 'p2', name: 'Amul Salted Butter', price: 48, mrp: 60, discount: '20% OFF', unit: '100g', emoji: '🧈' },
    { id: 'p3', name: 'Coca-Cola Zero Sugar', price: 30, mrp: 40, discount: '25% OFF', unit: '300ml', emoji: '🥤' }
  ];

  return (
    <View className="mb-8">
      {/* Cafe Banner Section */}
      <Pressable 
        onPress={() => router.push('/cafe')}
        className="mx-4 mb-6 bg-amber-950 p-5 rounded-2xl border border-amber-900 shadow-sm relative overflow-hidden flex-row justify-between items-center"
      >
        <View className="z-10 flex-1 pr-4">
          <View className="flex-row items-center gap-1.5 bg-amber-900/60 px-2.5 py-1 rounded-full self-start">
            <Coffee size={12} color="#fcd34d" />
            <Text className="text-amber-300 text-[9px] font-black uppercase tracking-wider">FastKirana Café</Text>
          </View>
          <Text className="text-white text-lg font-black mt-2 leading-5">Chai, Coffee & Hot Bites!</Text>
          <Text className="text-amber-200 text-xs mt-1">Freshly brewed and delivered steaming hot in 8 mins.</Text>
        </View>

        <View className="bg-amber-800/80 px-4 py-2.5 rounded-xl border border-amber-700 z-10">
          <Text className="text-amber-300 font-extrabold text-[10px] uppercase text-center">Order Food</Text>
          <Text className="text-white font-black text-xs mt-0.5 text-center">View Menu</Text>
        </View>

        {/* Decorative background emoji */}
        <Text className="absolute right-[-10px] top-[-10px] text-7xl opacity-10">☕</Text>
      </Pressable>

      {/* Flash Deals Section */}
      <View className="mx-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        {/* Flash Header */}
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center gap-1.5">
            <Flame size={18} color="#f97316" fill="#f97316" />
            <Text className="text-slate-800 font-black text-base">Flash Deals</Text>
          </View>
          
          <View className="flex-row items-center gap-1 bg-orange-50 border border-orange-100 px-2 py-1 rounded-lg">
            <Clock size={12} color="#ea580c" />
            <Text className="text-orange-700 font-extrabold text-[10px] tracking-wider uppercase">
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        {/* Horizontal Deals list */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-3">
          {flashProducts.map((product) => (
            <Pressable
              key={product.id}
              onPress={() => router.push(`/product/${product.id}`)}
              className="w-32 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 items-center"
            >
              {/* Product Label badge */}
              <View className="absolute top-1 left-1 bg-orange-600 px-1.5 py-0.5 rounded-md z-10">
                <Text className="text-white font-extrabold text-[8px] uppercase">{product.discount}</Text>
              </View>

              {/* Product Emoji */}
              <View className="w-16 h-16 rounded-full bg-white items-center justify-center mb-2 mt-2 border border-slate-100">
                <Text className="text-3xl">{product.emoji}</Text>
              </View>

              {/* Product Info */}
              <Text className="text-slate-800 font-extrabold text-[10px] text-center leading-3 h-6" numberOfLines={2}>
                {product.name}
              </Text>
              <Text className="text-slate-400 text-[8px] font-semibold mt-0.5">{product.unit}</Text>

              {/* Pricing & Add */}
              <View className="flex-row items-center justify-between w-full mt-2 border-t border-slate-100 pt-1.5">
                <View>
                  <Text className="text-slate-800 font-black text-xs">{formatPrice(product.price)}</Text>
                  <Text className="text-slate-400 line-through text-[8px]">{formatPrice(product.mrp)}</Text>
                </View>
                <Pressable className="bg-primary px-2.5 py-1 rounded-md">
                  <Text className="text-white font-extrabold text-[9px]">ADD</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
