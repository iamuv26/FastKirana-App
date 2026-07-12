import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { History, Plus } from 'lucide-react-native';
import { useCartActions } from '../../hooks/use-cart';
import { formatPrice } from '../../lib/utils';
import { toast } from '../../lib/toast';
import { useTheme } from '../../app/context/ThemeContext';
import * as Haptics from 'expo-haptics';

interface BuyAgainItem {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  price: number;
  mrp: number;
  unit: string;
  lastOrderedDays: number;
  categorySlug: string;
}

const MOCK_BUY_AGAIN_ITEMS: BuyAgainItem[] = [
  {
    id: 'db1',
    name: 'Amul Taaza Milk',
    slug: 'amul-taaza-milk',
    emoji: '🥛',
    price: 27,
    mrp: 27,
    unit: '500 ml',
    lastOrderedDays: 3,
    categorySlug: 'dairy-breakfast',
  },
  {
    id: 'sm2',
    name: 'Maggi Noodles',
    slug: 'maggi-noodles',
    emoji: '🍜',
    price: 52,
    mrp: 56,
    unit: '280 g (4-pack)',
    lastOrderedDays: 5,
    categorySlug: 'snacks-biscuits',
  },
  {
    id: 'def2',
    name: 'Aashirvaad Atta',
    slug: 'aashirvaad-atta',
    emoji: '🌾',
    price: 265,
    mrp: 295,
    unit: '5 kg',
    lastOrderedDays: 12,
    categorySlug: 'grocery-essential',
  },
  {
    id: 'bb1',
    name: 'Bread - White',
    slug: 'bread-white',
    emoji: '🍞',
    price: 35,
    mrp: 40,
    unit: '400 g',
    lastOrderedDays: 2,
    categorySlug: 'bakery',
  },
  {
    id: 'bv1',
    name: 'Coca-Cola Can',
    slug: 'coca-cola-can',
    emoji: '🥤',
    price: 35,
    mrp: 40,
    unit: '300 ml',
    lastOrderedDays: 15,
    categorySlug: 'beverages',
  },
  {
    id: 'bb2',
    name: 'Parle-G Biscuits',
    slug: 'parle-g-biscuits',
    emoji: '🍪',
    price: 72,
    mrp: 80,
    unit: '800 g',
    lastOrderedDays: 7,
    categorySlug: 'bakery',
  },
];

export default function BuyAgainSection() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { addItem } = useCartActions();

  const handleAddToCart = (item: BuyAgainItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addItem({
      id: item.id,
      name: item.name,
      slug: item.slug,
      imageUrl: null,
      mrp: item.mrp,
      price: item.price,
      discount: item.mrp > item.price ? Math.round(((item.mrp - item.price) / item.mrp) * 100) : 0,
      unit: item.unit,
      stock: 50,
      isAvailable: true,
    });
    toast.success(`${item.name} added to cart`);
  };

  return (
    <View className="my-4 rounded-2xl border p-4 bg-rose-50/10 dark:bg-zinc-900/40 border-rose-100/10 dark:border-zinc-800">
      {/* Section Header */}
      <View className="flex-row items-center gap-3 mb-4">
        <View className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/20 items-center justify-center border border-rose-100/10">
          <History size={16} color="#e11d48" />
        </View>
        <View>
          <Text className="text-slate-800 dark:text-zinc-100 font-black text-sm tracking-tight">Buy It Again</Text>
          <Text className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold">Your favorites, one tap away</Text>
        </View>
      </View>

      {/* Horizontal Scroll list of items */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
        decelerationRate="fast"
      >
        {MOCK_BUY_AGAIN_ITEMS.map((item) => (
          <View
            key={item.id}
            className="w-[120px] bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-3 items-center rounded-xl"
          >
            {/* Emoji Circle */}
            <View className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-800 items-center justify-center mb-2">
              <Text className="text-2xl">{item.emoji}</Text>
            </View>

            {/* Product name */}
            <Text
              className="text-slate-800 dark:text-zinc-200 font-extrabold text-[11px] text-center mb-1 h-8"
              numberOfLines={2}
            >
              {item.name}
            </Text>

            {/* Last ordered days */}
            <Text className="text-slate-400 dark:text-zinc-500 text-[9px] font-bold mb-2">
              {item.lastOrderedDays === 1 ? 'Yesterday' : `${item.lastOrderedDays} days ago`}
            </Text>

            {/* Price stack */}
            <View className="flex-row items-baseline gap-1 mb-2">
              <Text className="text-xs font-black text-slate-800 dark:text-zinc-100">
                {formatPrice(item.price)}
              </Text>
              {item.mrp > item.price && (
                <Text className="text-[9px] text-slate-455 line-through">
                  {formatPrice(item.mrp)}
                </Text>
              )}
            </View>

            {/* Quick Add Button */}
            <Pressable
              onPress={() => handleAddToCart(item)}
              className="w-full bg-rose-50/10 dark:bg-rose-950/20 border border-rose-600 dark:border-rose-500/50 py-1.5 px-2 rounded-lg flex-row items-center justify-center gap-0.5 active:scale-95"
            >
              <Text className="text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase">Add</Text>
              <Plus size={10} color={isDarkMode ? '#ff4d62' : '#e11d48'} strokeWidth={3} />
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
