import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { History, Plus } from 'lucide-react-native';
import { useCartActions } from '../../hooks/use-cart';
import { formatPrice } from '../../lib/utils';
import { toast } from '../../lib/toast';
import { useTheme } from '../../app/context/ThemeContext';
import { ScalePressable } from '../shared/ScalePressable';
import { THEME } from '../../lib/theme';


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
    <View style={{ marginHorizontal: THEME.SPACING.lg, marginVertical: THEME.SPACING.md, borderRadius: THEME.RADIUS.lg, padding: THEME.SPACING.lg }} className="border bg-rose-50/10 dark:bg-zinc-900/40 border-rose-100/10 dark:border-zinc-800">
      {/* Section Header */}
      <View className="flex-row items-center gap-3 mb-4">
        <View style={{ width: 36, height: 36, borderRadius: THEME.RADIUS.sm }} className="bg-rose-50 dark:bg-rose-950/20 items-center justify-center border border-rose-100/10">
          <History size={16} color={THEME.COLORS.brand.primary} />
        </View>
        <View>
          <Text style={{ fontSize: 15, fontWeight: '700', color: isDarkMode ? '#fafafa' : '#1e293b' }} className="tracking-tight">Buy It Again</Text>
          <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '500', color: isDarkMode ? '#cbd5e1' : '#475569', marginTop: 1 }}>Your favorites, one tap away</Text>
        </View>
      </View>

      {/* Horizontal Scroll list of items */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: THEME.SPACING.md, paddingBottom: 4 }}
        decelerationRate="fast"
      >
        {MOCK_BUY_AGAIN_ITEMS.map((item) => (
          <View
            key={item.id}
            style={{
              width: 124,
              backgroundColor: isDarkMode ? THEME.COLORS.dark.surface : '#ffffff',
              borderColor: isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9',
              borderRadius: THEME.RADIUS.sm,
              padding: 12,
              alignItems: 'center',
            }}
            className="border"
          >
            {/* Emoji Circle */}
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: isDarkMode ? THEME.COLORS.dark.surfaceElevated : '#f8fafc' }} className="items-center justify-center mb-2.5">
              <Text className="text-2xl">{item.emoji}</Text>
            </View>

            {/* Product name */}
            <Text
              style={{
                color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary,
                fontSize: 12,
                fontWeight: '600',
                height: 32,
                textAlign: 'center',
                marginBottom: 2,
              }}
              numberOfLines={2}
            >
              {item.name}
            </Text>

            {/* Last ordered days */}
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '500', color: isDarkMode ? '#71717a' : '#94a3b8', marginBottom: 8 }}>
              {item.lastOrderedDays === 1 ? 'Yesterday' : `${item.lastOrderedDays} days ago`}
            </Text>

            {/* Price stack */}
            <View className="flex-row items-baseline gap-1 mb-2">
              <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }}>
                {formatPrice(item.price)}
              </Text>
              {item.mrp > item.price && (
                <Text style={{ fontSize: 10, fontWeight: '400', color: isDarkMode ? '#71717a' : '#94a3b8' }} className="line-through">
                  {formatPrice(item.mrp)}
                </Text>
              )}
            </View>

            {/* Quick Add Button */}
            <ScalePressable
              onPress={() => handleAddToCart(item)}
              scaleValue={0.9}
              style={{
                borderRadius: THEME.RADIUS.xs,
                borderColor: THEME.COLORS.brand.primary,
                backgroundColor: isDarkMode ? 'rgba(226,10,34,0.1)' : 'rgba(226,10,34,0.02)',
              }}
              className="w-full border py-1.5 px-2 flex-row items-center justify-center gap-0.5"
            >
              <Text style={{ color: THEME.COLORS.brand.primary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700' }} className="uppercase">Add</Text>
              <Plus size={10} color={THEME.COLORS.brand.primary} strokeWidth={3} />
            </ScalePressable>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
