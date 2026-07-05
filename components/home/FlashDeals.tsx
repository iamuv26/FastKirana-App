import { View, Text, ScrollView } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import ProductCard, { Product } from '../product/ProductCard';

interface FlashDealsProps {
  products: Product[];
}

export default function FlashDeals({ products }: FlashDealsProps) {
  const [timeLeft, setTimeLeft] = useState('00:00:00');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      // Target is the next hour boundary
      target.setHours(now.getHours() + 1, 0, 0, 0);
      const diff = target.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const hStr = hours < 10 ? '0' + hours : hours;
      const mStr = minutes < 10 ? '0' + minutes : minutes;
      const sStr = seconds < 10 ? '0' + seconds : seconds;

      setTimeLeft(`${hStr}:${mStr}:${sStr}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter products that have discounts for deals
  const dealProducts = useMemo(() => {
    return products
      .filter((p) => p.isAvailable !== false && p.discount > 0 && !(p.category?.slug === 'cafe' || p.tags?.includes('cafe') || p.id.startsWith('c')))
      .slice(0, 8);
  }, [products]);

  if (dealProducts.length === 0) return null;

  return (
    <View className="mb-6">
      {/* Header Row */}
      <View className="mx-4 flex-row justify-between items-center mb-3.5">
        <View className="flex-row items-center gap-2">
          <Text className="text-slate-800 dark:text-zinc-100 font-black text-base">⚡ Flash Deals</Text>
          <View className="bg-rose-100 dark:bg-rose-950/40 px-2 py-0.5 rounded-md border border-rose-200/50 dark:border-rose-900/30">
            <Text className="text-rose-600 dark:text-rose-400 font-black text-[10px] tabular-nums">
              Ends in {timeLeft}
            </Text>
          </View>
        </View>
      </View>

      {/* Horizontal List of Products */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12, alignItems: 'flex-start' }}
        decelerationRate="fast"
      >
        {dealProducts.map((product, idx) => (
          <View key={product.id} className="w-40">
            <ProductCard product={product} className="w-full" index={idx} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
