import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, FlatList, ActivityIndicator, Platform, StyleSheet, Image as RNImage, useWindowDimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { ArrowLeft, SlidersHorizontal, ArrowUpDown, Sun, Moon, MapPin, ChevronDown, ChevronRight, Search, Mic } from 'lucide-react-native';
import ProductCard, { Product } from '../../components/product/ProductCard';
import ProductCardSkeleton from '../../components/product/ProductCardSkeleton';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import { FlashList } from '@shopify/flash-list';
import { useCart } from '../../hooks/use-cart';
import { triggerHaptic } from '../../lib/haptic';
import { API_BASE_URL, CATEGORIES, DEFAULT_CAFE_MENU_SECTIONS } from '../../lib/constants';
import { useTheme } from '../context/ThemeContext';
import { useUIStore } from '../../stores/ui-store';
import Logo from '../../components/shared/Logo';
import { ScalePressable } from '../../components/shared/ScalePressable';
import { BrandedTopHeader } from '../../components/shared/BrandedTopHeader';
import { BlurView } from 'expo-blur';
import { formatHeaderAddress, getAppImageSource, getCategoryEmoji, normalizeCategorySlug, isRestaurantProduct } from '../../lib/utils';
import { THEME } from '../../lib/theme';


const GROCERY_CATEGORIES = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', emoji: '🥬' },
  { name: 'Dairy & Breakfast', slug: 'dairy-breakfast', emoji: '🥛' },
  { name: 'Snacks & Munchies', slug: 'snacks-biscuits', emoji: '🍿' },
  { name: 'Beverages', slug: 'beverages', emoji: '🥤' },
  { name: 'Ice Cream', slug: 'ice-cream', emoji: '🍦' },
  { name: 'Personal Care', slug: 'personal-care', emoji: '🧴' },
  { name: 'Home Cleaners', slug: 'home-cleaners', emoji: '🧹' },
  { name: 'Household', slug: 'household', emoji: '🏠' },
  { name: 'Bakery & Biscuits', slug: 'bakery', emoji: '🍞' },
  { name: 'Atta, Rice & Dal', slug: 'grocery-essential', emoji: '🌾' },
];

const CATEGORIES_MAPPING: Record<string, { name: string; image: any; color: string }> = {
  'fruits-vegetables': { name: 'Fruits & Veg', image: require('../../assets/fruits_vegetables_category.webp'), color: '#ecf7ed' },
  'beverages': { name: 'Beverages', image: require('../../assets/beverages_category.webp'), color: '#eef2f6' },
  'ice-cream': { name: 'Ice Cream', image: require('../../assets/ice_cream_category.webp'), color: '#e0f2f1' },
  'cafe': { name: 'Cafe', image: require('../../assets/cafe_category.webp'), color: '#fff8e1' },
  'fastkirana-cafe': { name: 'Cafe', image: require('../../assets/cafe_category.webp'), color: '#fff8e1' },
  'personal-care': { name: 'Personal Care', image: require('../../assets/personal_care_category.webp'), color: '#fce4ec' },
  'home-cleaners': { name: 'Home Cleaners', image: require('../../assets/household_category.webp'), color: '#e0f7fa' },
  'household': { name: 'Household', image: require('../../assets/household_category.webp'), color: '#e0f7fa' },
  'bakery': { name: 'Bakery', image: require('../../assets/bakery_biscuits_category.webp'), color: '#efebe9' },
  'grocery-essential': { name: 'Staples', image: require('../../assets/atta_rice_dal_category.webp'), color: '#fffde7' },
  'snacks-biscuits': { name: 'Snacks', image: require('../../assets/snacks_munchies_category.webp'), color: '#fff8e1' },
  'dairy-breakfast': { name: 'Dairy', image: require('../../assets/dairy_breakfast_category.webp'), color: '#e8f4fd' },
};

const SUBCATEGORIES_DATA: Record<string, Array<{ name: string; emoji: string; tags: string[] }>> = {
  'fruits-vegetables': [
    { name: 'All', emoji: '🥗', tags: [] },
    { name: 'Fresh Vegetables', emoji: '🥦', tags: ['onion', 'potato', 'chilli', 'banana-raw', 'arbi', 'gobhi', 'parwal', 'brinjal', 'beans', 'lemon', 'cucumber', 'capsicum', 'ginger', 'garlic', 'chilli', 'veg', 'vegetable'] },
    { name: 'New Launches', emoji: '🛍️', tags: ['new', 'fresh'] },
    { name: 'Fresh Fruits', emoji: '🍎', tags: ['banana', 'guava', 'mango', 'coconut', 'apple', 'pomegranate', 'orange', 'papaya', 'grapes', 'pear', 'fruit'] },
    { name: 'Exotics & Premium', emoji: '🥑', tags: ['avocado', 'broccoli', 'mushroom', 'kiwi', 'dragon-fruit', 'blueberry', 'lettuce'] },
    { name: 'Mangoes & Melons', emoji: '🥭', tags: ['mango', 'melon', 'watermelon', 'muskmelon', 'hapus'] },
    { name: 'Organics & Hydro', emoji: '🥬', tags: ['organic', 'hydroponic'] },
    { name: 'Leafy & Herbs', emoji: '🌿', tags: ['coriander', 'mint', 'curry', 'spinach', 'palak', 'methi', 'leaves'] }
  ],
  'dairy-breakfast': [
    { name: 'All', emoji: '🥛', tags: [] },
    { name: 'Milk & Cream', emoji: '🍼', tags: ['milk', 'cream', 'malai'] },
    { name: 'Butter & Cheese', emoji: '🧀', tags: ['butter', 'cheese', 'paneer'] },
    { name: 'Bread & Eggs', emoji: '🍞', tags: ['bread', 'eggs', 'egg', 'bun'] },
    { name: 'Yogurt & Lassi', emoji: '🍧', tags: ['yogurt', 'curd', 'lassi', 'dahi'] }
  ],
  'grocery-essential': [
    { name: 'All', emoji: '🌾', tags: [] },
    { name: 'Dry Fruits & Seeds', emoji: '🥜', tags: ['seed', 'almond', 'cashew', 'kaju', 'pista', 'pistachio', 'nuts', 'seeds'] },
    { name: 'Sauces & Spreads', emoji: '🥫', tags: ['veeba', 'mayonnaise', 'ketchup', 'sauce'] },
    { name: 'Staples & Pulses', emoji: '🌾', tags: ['atta', 'rice', 'dal', 'oil', 'ghee', 'masala'] }
  ],
  'snacks-biscuits': [
    { name: 'All', emoji: '🍿', tags: [] },
    { name: 'Chips & Namkeen', emoji: '🍟', tags: ['chips', 'crisps', 'kurkure', 'lays', 'puff', 'mixture', 'namkeen', 'bhujia', 'bhelpuri', 'peanuts', 'bingo', 'tedhe', 'medhe', 'tasty'] },
    { name: 'Cookies', emoji: '🍪', tags: ['cookies', 'biscuits', 'biscuit', 'oreo', 'fantasy', 'digestive', 'pie', 'unibic', 'parle', 'hide'] },
    { name: 'Chocolates', emoji: '🍫', tags: ['chocolate', 'cadbury', 'kitkat', 'snickers', 'munch', 'silk', 'lotte', 'dark'] },
    { name: 'Sweets & Desserts', emoji: '🍬', tags: ['sweets', 'candy', 'gummy', 'soan'] }
  ],
  'beverages': [
    { name: 'All', emoji: '🥤', tags: [] },
    { name: 'Cold Drinks', emoji: '🥤', tags: ['coke', 'pepsi', 'sprite', 'soda', 'limca', 'thums'] },
    { name: 'Juices & Shakes', emoji: '🧃', tags: ['juice', 'shake', 'smoothie', 'real'] },
    { name: 'Tea & Coffee', emoji: '☕', tags: ['tea', 'coffee', 'nescafe', 'bru', 'taj'] },
    { name: 'Water & Soda', emoji: '💧', tags: ['water', 'bisleri', 'club-soda', 'kinley'] }
  ],
  'restaurant': [
    { name: 'All', emoji: '🍱', tags: [] },
    { name: 'Roti, Naan & Breads', emoji: '🫓', tags: ['roti', 'naan', 'kulcha', 'paratha', 'bread'] },
    { name: 'Burgers & Wraps', emoji: '🍔', tags: ['burger', 'wrap', 'sandwich', 'frankie', 'roll'] },
    { name: 'Pizzas & Pastas', emoji: '🍕', tags: ['pizza', 'pasta', 'garlic', 'italian'] },
    { name: 'Chinese & Starters', emoji: '🥢', tags: ['chinese', 'noodle', 'manchurian', 'momo', 'spring-roll', 'starter'] },
    { name: 'Biryani & Curries', emoji: '🍛', tags: ['biryani', 'thali', 'rice', 'pulav', 'curry', 'paneer', 'dal'] },
    { name: 'South Indian', emoji: '🥞', tags: ['dosa', 'idli', 'vada', 'sambar', 'south-indian'] },
    { name: 'Shakes & Beverages', emoji: '🧋', tags: ['shake', 'drink', 'beverage', 'coffee', 'tea', 'cooler', 'soda'] },
    { name: 'Desserts & Sweets', emoji: '🍰', tags: ['dessert', 'sweet', 'ice-cream', 'gulab', 'jamun', 'kheer'] }
  ],
  'wedson-restaurant': [
    { name: 'All', emoji: '🍱', tags: [] },
    { name: 'Roti, Naan & Breads', emoji: '🫓', tags: ['roti', 'naan', 'kulcha', 'paratha', 'bread'] },
    { name: 'Burgers & Wraps', emoji: '🍔', tags: ['burger', 'wrap', 'sandwich', 'frankie', 'roll'] },
    { name: 'Pizzas & Pastas', emoji: '🍕', tags: ['pizza', 'pasta', 'garlic', 'italian'] },
    { name: 'Chinese & Starters', emoji: '🥢', tags: ['chinese', 'noodle', 'manchurian', 'momo', 'spring-roll', 'starter'] },
    { name: 'Biryani & Curries', emoji: '🍛', tags: ['biryani', 'thali', 'rice', 'pulav', 'curry', 'paneer', 'dal'] },
    { name: 'South Indian', emoji: '🥞', tags: ['dosa', 'idli', 'vada', 'sambar', 'south-indian'] },
    { name: 'Shakes & Beverages', emoji: '🧋', tags: ['shake', 'drink', 'beverage', 'coffee', 'tea', 'cooler', 'soda'] },
    { name: 'Desserts & Sweets', emoji: '🍰', tags: ['dessert', 'sweet', 'ice-cream', 'gulab', 'jamun', 'kheer'] }
  ],
  'cafe': [
    { name: 'All', emoji: '☕', tags: [] },
    { name: 'Steaming Hot Brews', emoji: '☕', tags: ['tea', 'coffee', 'chai', 'espresso', 'hot-beverage'] },
    { name: 'Quick Bites & Snacks', emoji: '🥟', tags: ['samosa', 'momo', 'patty', 'fries', 'nugget', 'snack', 'hot-bite'] },
    { name: 'Gourmet Sandwiches', emoji: '🥪', tags: ['sandwich', 'toast', 'grilled', 'bombay-bites'] },
    { name: 'Frankie & Rolls', emoji: '🌯', tags: ['roll', 'frankie', 'wrap'] },
    { name: 'Pizzas & Pastas', emoji: '🍕', tags: ['pizza', 'pasta', 'garlic-bread'] },
    { name: 'Chinese Kitchen Wok', emoji: '🥡', tags: ['chinese', 'noodle', 'manchurian'] },
    { name: 'Rice & Biryani', emoji: '🍚', tags: ['rice', 'biryani', 'pulav'] },
    { name: 'Thick Shakes & Coffee', emoji: '🧋', tags: ['shake', 'cold-coffee', 'mocktail', 'cooler', 'smoothie'] },
    { name: 'Bakery & Sweets', emoji: '🥐', tags: ['ice-cream', 'dessert', 'cake', 'muffin', 'bakery'] }
  ],
  'fastkirana-cafe': [
    { name: 'All', emoji: '☕', tags: [] },
    { name: 'Steaming Hot Brews', emoji: '☕', tags: ['tea', 'coffee', 'chai', 'espresso', 'hot-beverage'] },
    { name: 'Quick Bites & Snacks', emoji: '🥟', tags: ['samosa', 'momo', 'patty', 'fries', 'nugget', 'snack', 'hot-bite'] },
    { name: 'Gourmet Sandwiches', emoji: '🥪', tags: ['sandwich', 'toast', 'grilled', 'bombay-bites'] },
    { name: 'Frankie & Rolls', emoji: '🌯', tags: ['roll', 'frankie', 'wrap'] },
    { name: 'Pizzas & Pastas', emoji: '🍕', tags: ['pizza', 'pasta', 'garlic-bread'] },
    { name: 'Chinese Kitchen Wok', emoji: '🥡', tags: ['chinese', 'noodle', 'manchurian'] },
    { name: 'Rice & Biryani', emoji: '🍚', tags: ['rice', 'biryani', 'pulav'] },
    { name: 'Thick Shakes & Coffee', emoji: '🧋', tags: ['shake', 'cold-coffee', 'mocktail', 'cooler', 'smoothie'] },
    { name: 'Bakery & Sweets', emoji: '🥐', tags: ['ice-cream', 'dessert', 'cake', 'muffin', 'bakery'] }
  ],
  'bakery': [
    { name: 'All', emoji: '🍞', tags: [] },
    { name: 'Fresh Breads & Buns', emoji: '🥖', tags: ['bread', 'bun', 'pav', 'toast'] },
    { name: 'Biscuits & Cookies', emoji: '🍪', tags: ['biscuit', 'cookie', 'rusk'] },
    { name: 'Cakes & Pastries', emoji: '🧁', tags: ['cake', 'pastry', 'muffin', 'brownie'] }
  ],
  'personal-care': [
    { name: 'All', emoji: '🧴', tags: [] },
    { name: 'Soaps & Body Wash', emoji: '🧼', tags: ['soap', 'body-wash', 'shower-gel'] },
    { name: 'Hair Care', emoji: '💇', tags: ['shampoo', 'conditioner', 'hair-oil', 'hair'] },
    { name: 'Oral Hygiene', emoji: '🪥', tags: ['toothpaste', 'toothbrush', 'mouthwash'] },
    { name: 'Skin Care & Lotions', emoji: '✨', tags: ['lotion', 'cream', 'face-wash', 'skin'] }
  ],
  'household': [
    { name: 'All', emoji: '🧹', tags: [] },
    { name: 'Detergents & Dishwash', emoji: '🧼', tags: ['detergent', 'surf', 'rin', 'wheel', 'bar', 'liquid', 'dishwash', 'vim', 'pril'] },
    { name: 'Surface Cleaners', emoji: '🧽', tags: ['cleaner', 'lizol', 'colin', 'harpic', 'disinfectant', 'floor'] },
    { name: 'Tissues & Bags', emoji: '🧻', tags: ['tissue', 'mop', 'wiper', 'garbage-bag', 'trash'] }
  ],
  'ice-cream': [
    { name: 'All', emoji: '🍦', tags: [] },
    { name: 'Cones & Sticks', emoji: '🍦', tags: ['cone', 'stick', 'bar', 'kulfi'] },
    { name: 'Tubs & Family Packs', emoji: '🍨', tags: ['tub', 'family', 'scoop', 'pack'] }
  ]
};

const DEFAULT_SUBCATEGORIES = [
  { name: 'All', emoji: '🛒', tags: [] },
  { name: 'Trending', emoji: '🔥', tags: ['trending'] },
  { name: 'Popular', emoji: '⭐', tags: ['popular'] },
  { name: 'Deals', emoji: '🏷️', tags: ['deal', 'discount'] }
];

interface CategoryProductPageProps {
  categorySlug: string;
  sortBy: 'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH';
  isDarkMode: boolean;
  screenWidth: number;
}

// Sleek spring-animated Subcategory Item component for tactile feedback
const SubcategoryItem = React.memo(function SubcategoryItem({
  sub,
  isActive,
  isDarkMode,
  onPress,
}: {
  sub: { name: string; emoji: string; tags: string[] };
  isActive: boolean;
  isDarkMode: boolean;
  onPress: () => void;
}) {
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const scale = useSharedValue(isActive ? 1.08 : 1.0);
  const dotScale = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.08 : 1.0, { damping: 12, stiffness: 180 });
    dotScale.value = withSpring(isActive ? 1 : 0, { damping: 10, stiffness: 200 });
  }, [isActive]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  return (
    <ScalePressable
      onPress={onPress}
      scaleValue={0.95}
      haptic="light"
      style={{
        width: 90,
        paddingVertical: 12,
        backgroundColor: isActive
          ? (isDarkMode ? colors.surfaceElevated : '#ffffff')
          : 'transparent',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {/* Vertical Brand-Red Accent Bar */}
      {isActive && (
        <View
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 4,
            backgroundColor: THEME.COLORS.brand.primary
          }}
        />
      )}
      {/* Animated Emoji / Icon container */}
      <Animated.View
        style={[
          {
            width: 34,
            height: 34,
            borderRadius: 17,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isActive
              ? `${THEME.COLORS.brand.primary}20`
              : (isDarkMode ? colors.surface : THEME.COLORS.light.borderLight)
          },
          animatedIconStyle
        ]}
      >
        <Text style={{ fontSize: 18 }}>
          {(sub.emoji && sub.emoji !== '📦') ? sub.emoji : getCategoryEmoji(sub.name)}
        </Text>
      </Animated.View>
      {/* Text Label */}
      <Text
        style={{
          fontSize: 9,
          lineHeight: 12,
          fontWeight: isActive ? '900' : '700',
          color: isActive ? THEME.COLORS.brand.primary : colors.textMuted,
          textAlign: 'center',
          marginTop: 5,
          width: '94%',
          letterSpacing: -0.1
        }}
        numberOfLines={2}
        allowFontScaling={false}
      >
        {sub.name.replace(/–/g, ' ').replace(/-/g, ' ')}
      </Text>
    </ScalePressable>
  );
});

const TypedFlashList = FlashList as any;

const CategoryProductPage = React.memo(function CategoryProductPage({
  categorySlug,
  sortBy,
  isDarkMode,
  screenWidth
}: CategoryProductPageProps) {
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const normalizedSlug = useMemo(() => normalizeCategorySlug(categorySlug), [categorySlug]);
  const assignedStoreId = useUIStore((s) => s.assignedStoreId);
  const validStoreId = (assignedStoreId && !assignedStoreId.startsWith('default-')) ? assignedStoreId : null;

  const isCafeSection = useMemo(() => {
    return DEFAULT_CAFE_MENU_SECTIONS.some(c => c.tag === categorySlug || c.tag === normalizedSlug) ||
           categorySlug.startsWith('cafe-') ||
           categorySlug === 'cafe';
  }, [categorySlug, normalizedSlug]);

  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['category-products', categorySlug, normalizedSlug, isCafeSection, validStoreId],
    queryFn: async () => {
      const categoryParam = isCafeSection
        ? 'cafe,ice-cream,beverages,burgers-bites'
        : (categorySlug === normalizedSlug ? categorySlug : `${categorySlug},${normalizedSlug}`);
      const response = await fetch(`${API_BASE_URL}/products?category=${categoryParam}&limit=500${validStoreId ? `&storeId=${validStoreId}` : ''}`);
      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    staleTime: 5000,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (products && products.length > 0) {
      const urls = products
        .map((p) => (p.imageUrl ? getAppImageSource(p.imageUrl)?.uri : null))
        .filter((url): url is string => !!url)
        .slice(0, 30);
      if (urls.length > 0) {
        ExpoImage.prefetch(urls);
      }
    }
  }, [products]);

  const subcategoryList = useMemo(() => {
    return SUBCATEGORIES_DATA[normalizedSlug] || SUBCATEGORIES_DATA[categorySlug] || DEFAULT_SUBCATEGORIES;
  }, [categorySlug, normalizedSlug]);

  const [activeSub, setActiveSub] = useState('All');
  const sidebarScrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setActiveSub('All');
  }, [categorySlug]);

  useEffect(() => {
    if (sidebarScrollViewRef.current) {
      const activeIdx = subcategoryList.findIndex(s => s.name === activeSub);
      if (activeIdx !== -1) {
        const itemHeight = 72;
        const targetY = Math.max(0, (activeIdx * itemHeight) - 150);
        sidebarScrollViewRef.current.scrollTo({ y: targetY, animated: true });
      }
    }
  }, [activeSub, subcategoryList]);

  const filteredProducts = useMemo(() => {
    const getProductPrice = (p: Product) => {
      const hasVariants = p.variants && Array.isArray(p.variants) && p.variants.length > 0;
      if (!hasVariants) return p.price || 0;
      const prices = (p.variants as any[]).map(v => v.price);
      return prices.length > 0 ? Math.min(...prices) : (p.price || 0);
    };

    const isProductOutOfStock = (p: Product) => {
      if (p.isAvailable === false) return true;
      const hasVariants = p.variants && Array.isArray(p.variants) && p.variants.length > 0;
      if (!hasVariants) {
        return p.stock !== undefined && p.stock !== null && p.stock <= 0;
      }
      const hasAvailableVariant = (p.variants as any[]).some((v: any) =>
        v.isAvailable !== false && (v.stock === undefined || v.stock === null || v.stock > 0)
      );
      return !hasAvailableVariant;
    };

    let list = products.filter(p => p.isAvailable !== false);

    if (isCafeSection) {
      list = list.filter(p => !isRestaurantProduct(p));
      const cafeSec = DEFAULT_CAFE_MENU_SECTIONS.find(c => c.tag === categorySlug || c.tag === normalizedSlug);
      if (cafeSec) {
        list = list.filter(p => {
          const catSlug = p.category?.slug?.toLowerCase() || '';
          const pTags = p.tags?.map((t: string) => t.toLowerCase()) || [];
          return pTags.some((t: string) => cafeSec.matchTags.includes(t)) ||
                 cafeSec.matchTags.some((mt: string) => catSlug === mt.toLowerCase());
        });
      }
    }

    const listWithIndex = list.map((p, index) => ({ product: p, index }));

    listWithIndex.sort((itemA, itemB) => {
      const a = itemA.product;
      const b = itemB.product;
      const aOut = isProductOutOfStock(a);
      const bOut = isProductOutOfStock(b);
      if (aOut && !bOut) return 1;
      if (!aOut && bOut) return -1;
      if (sortBy === 'PRICE_LOW') return getProductPrice(a) - getProductPrice(b);
      else if (sortBy === 'PRICE_HIGH') return getProductPrice(b) - getProductPrice(a);
      return itemA.index - itemB.index;
    });

    list = listWithIndex.map(item => item.product);

    const activeSubItem = subcategoryList.find(s => s.name === activeSub);
    if (!activeSubItem || activeSubItem.name === 'All') {
      return list;
    }

    if (activeSubItem.name === 'Deals') {
      return list.filter(p => p.discount > 0);
    } else if (activeSubItem.name === 'Trending') {
      return list.filter(p => (p.tags && p.tags.includes('trending')) || p.price > 30);
    } else if (activeSubItem.name === 'Popular') {
      return list.filter(p => (p.tags && p.tags.includes('popular')) || p.discount > 10);
    }

    return list.filter(p => {
      const nameLower = (p.name || '').toLowerCase();
      const slugLower = (p.slug || '').toLowerCase();
      const pTags = p.tags?.map((t: string) => t.toLowerCase()) || [];
      return activeSubItem.tags.some(tag => {
        const tagLower = tag.toLowerCase();
        return nameLower.includes(tagLower) ||
               slugLower.includes(tagLower) ||
               pTags.includes(tagLower);
      });
    });
  }, [products, activeSub, subcategoryList, sortBy, isCafeSection, categorySlug, normalizedSlug]);

  return (
    <View style={{ width: screenWidth, flex: 1, flexDirection: 'row' }}>
      {/* Left Sidebar (Subcategories) */}
      <View
        style={{
          width: 94,
          borderRightWidth: 1,
          borderColor: colors.borderLight,
          backgroundColor: colors.surface
        }}
      >
        <ScrollView
          ref={sidebarScrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 12, gap: 10, alignItems: 'center' }}
        >
          {subcategoryList.map((sub, index) => {
            const isActive = activeSub === sub.name;
            return (
              <Animated.View
                key={sub.name}
                entering={undefined}
              >
                <SubcategoryItem
                  sub={sub}
                  isActive={isActive}
                  isDarkMode={isDarkMode}
                  onPress={() => {
                    setActiveSub(sub.name);
                    triggerHaptic('light');
                  }}
                />
              </Animated.View>
            );
          })}
        </ScrollView>
      </View>

      {/* Right Product Grid */}
      <View style={{ flex: 1, paddingHorizontal: 8 }}>
        {isLoading ? (
          <View style={styles.skeletonWrap}>
            {[1, 2, 3, 4].map((i) => (
              <View key={i} style={{ width: '48%' }}>
                <ProductCardSkeleton />
              </View>
            ))}
          </View>
        ) : (() => {
          const numColumns = screenWidth >= 900 ? 4 : (screenWidth >= 600 ? 3 : 2);
          return (
            <TypedFlashList
              key={`grid-${numColumns}`}
              data={filteredProducts}
              keyExtractor={(item: Product) => item.id}
              numColumns={numColumns}
              estimatedItemSize={270}
              contentContainerStyle={{ paddingBottom: 180, paddingTop: 10 }}
              style={{ flex: 1, width: '100%' }}
              showsVerticalScrollIndicator={false}
              renderItem={({ item, index }: { item: Product; index: number }) => (
                <View style={{
                  width: '100%',
                  paddingHorizontal: 4,
                  marginBottom: 12
                }}>
                  <ProductCard product={item} index={index} isCategoryGrid={true} />
                </View>
              )}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No products in this subcategory
                  </Text>
                </View>
              }
            />
          );
        })()}
      </View>
    </View>
  );
});

const CategoryItem = React.memo(function CategoryItem({
  cat,
  isActive,
  isDarkMode,
  bgColor,
  hasImage,
  config,
  onPress,
}: {
  cat: any;
  isActive: boolean;
  isDarkMode: boolean;
  bgColor: string;
  hasImage: boolean;
  config: any;
  onPress: () => void;
}) {
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const scale = useSharedValue(isActive ? 1.08 : 1.0);
  const borderOpacity = useSharedValue(isActive ? 1 : 0);
  const dotScale = useSharedValue(isActive ? 1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(isActive ? 1.08 : 1.0, { damping: 12, stiffness: 180 });
    borderOpacity.value = withSpring(isActive ? 1 : 0, { damping: 15, stiffness: 150 });
    dotScale.value = withSpring(isActive ? 1 : 0, { damping: 10, stiffness: 200 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedDotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: dotScale.value,
  }));

  const animatedBorderStyle = useAnimatedStyle(() => ({
    opacity: borderOpacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <ScalePressable
        onPress={onPress}
        scaleValue={0.95}
        haptic="light"
        style={{ width: 72, flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      >
        {/* Circular image/emoji container */}
        <View
          style={{
            width: 58,
            height: 58,
            borderRadius: 29,
            backgroundColor: bgColor,
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {hasImage ? (
            Platform.OS === 'web' ? (
              <RNImage
                source={config.image}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
            ) : (
              <ExpoImage
                source={config.image}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                placeholder={isDarkMode ? 'rgba(39,39,42,0.4)' : 'rgba(241,245,249,0.6)'}
              />
            )
          ) : (
            <Text style={{ fontSize: 22 }}>{cat.emoji}</Text>
          )}

          {/* Animated active border overlay */}
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                borderRadius: 29,
                borderWidth: 2.5,
                borderColor: THEME.COLORS.brand.primary,
              },
              animatedBorderStyle,
            ]}
            pointerEvents="none"
          />
        </View>

        {/* Category label */}
        <Text
          numberOfLines={2}
          allowFontScaling={false}
          style={{
            fontSize: 8.5,
            lineHeight: 11,
            fontWeight: isActive ? '900' : '700',
            color: isActive ? THEME.COLORS.brand.primary : colors.textMuted,
            marginTop: 6,
            textAlign: 'center',
            width: '100%',
            height: 24,
            letterSpacing: -0.1
          }}
        >
          {config ? config.name : cat.name}
        </Text>

        {/* Animated Active Indicator Dot */}
        <Animated.View
          style={[
            {
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: THEME.COLORS.brand.primary,
              marginTop: 3,
              alignSelf: 'center'
            },
            animatedDotStyle
          ]}
        />
      </ScalePressable>
    </Animated.View>
  );
});

export default function CategoryDetailScreen() {
  const { width: rawWidth } = useWindowDimensions();
  const screenWidth = rawWidth > 768 ? 540 : (rawWidth > 0 ? rawWidth : 390);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { getTotalItems, getSubtotal } = useCart();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH'>('RELEVANCE');
  const [activeSlug, setActiveSlug] = useState(slug);
  const [initialRenderDone, setInitialRenderDone] = useState(false);
  const normalizedSlug = useMemo(() => normalizeCategorySlug(slug), [slug]);

  const { data: serverCategories = [] } = useQuery<any[]>({
    queryKey: ['categories-list-all'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error('API failed');
      return res.json();
    },
    staleTime: 1000 * 60 * 15,
  });

  useEffect(() => {
    const s = slug?.toLowerCase().trim();
    if (s === 'cafe' || s === 'fastkirana-cafe' || s === 'as-cafe' || s === 'café' || normalizedSlug === 'cafe') {
      router.replace('/cafe');
    }
  }, [slug, normalizedSlug]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialRenderDone(true);
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  const flatListRef = useRef<FlatList>(null);
  const tabScrollViewRef = useRef<ScrollView>(null);

  const isCafe = slug && (
    DEFAULT_CAFE_MENU_SECTIONS.some(c => c.tag === slug) ||
    slug.startsWith('cafe-') ||
    slug === 'cafe'
  );

  const categoriesList = useMemo(() => {
    if (isCafe) {
      return DEFAULT_CAFE_MENU_SECTIONS.map(c => ({
        name: c.title,
        slug: c.tag,
        emoji: c.emoji
      }));
    }

    if (serverCategories && serverCategories.length > 0) {
      const groceryServerCategories = serverCategories.filter(c => c.slug !== 'cafe' && c.slug !== 'fastkirana-cafe' && c.slug !== 'restaurant');
      return groceryServerCategories.map(c => {
        const localMapped = GROCERY_CATEGORIES.find(gc => gc.slug === c.slug);
        const emoji = localMapped ? localMapped.emoji : '📦';
        return {
          name: c.name,
          slug: c.slug,
          emoji: emoji
        };
      });
    }

    return GROCERY_CATEGORIES;
  }, [isCafe, serverCategories]);

  const initialIndex = useMemo(() => {
    const idx = categoriesList.findIndex(c => c.slug === slug);
    return idx !== -1 ? idx : 0;
  }, [slug, categoriesList]);

  useEffect(() => {
    if (tabScrollViewRef.current) {
      const activeIdx = categoriesList.findIndex(c => c.slug === activeSlug);
      if (activeIdx !== -1) {
        const itemWidth = 84;
        const targetX = Math.max(0, (activeIdx * itemWidth) - (screenWidth / 2) + (itemWidth / 2));
        tabScrollViewRef.current.scrollTo({ x: targetX, animated: true });
      }
    }
  }, [activeSlug, categoriesList]);

  useEffect(() => {
    if (slug && slug !== activeSlug) {
      setActiveSlug(slug);
      const index = categoriesList.findIndex(c => c.slug === slug);
      if (index !== -1 && flatListRef.current) {
        flatListRef.current.scrollToIndex({ index, animated: false });
      }
    }
  }, [slug]);

  const handleSelectCategory = (targetSlug: string) => {
    const index = categoriesList.findIndex(c => c.slug === targetSlug);
    if (index !== -1 && flatListRef.current) {
      setActiveSlug(targetSlug);
      triggerHaptic('medium');
      flatListRef.current.scrollToIndex({ index, animated: true });
      router.setParams({ slug: targetSlug });
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index >= 0 && index < categoriesList.length) {
      const newSlug = categoriesList[index].slug;
      if (newSlug !== activeSlug) {
        setActiveSlug(newSlug);
      }
    }
  };

  const handleMomentumScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index >= 0 && index < categoriesList.length) {
      const newSlug = categoriesList[index].slug;
      if (newSlug !== activeSlug) {
        setActiveSlug(newSlug);
        triggerHaptic('light');
      }
      router.setParams({ slug: newSlug });
    }
  };

  const getCategoryBgColor = (categorySlug: string) => {
    const config = CATEGORIES_MAPPING[categorySlug];
    if (config) {
      return isDarkMode ? `${THEME.COLORS.brand.primary}12` : config.color;
    }
    return isDarkMode ? `${THEME.COLORS.brand.primary}12` : THEME.COLORS.light.borderLight;
  };

  const formattedSlug = activeSlug ? activeSlug.replace(/-/g, ' ') : 'Category';
  const selectedLocation = useUIStore((s) => s.selectedLocation);

  const categoryInfo = CATEGORIES.find(c => c.slug === activeSlug) ||
                       DEFAULT_CAFE_MENU_SECTIONS.find(c => c.tag === activeSlug);
  const categoryName = categoryInfo ? ((categoryInfo as any).name || (categoryInfo as any).title) : formattedSlug;

  const getItemLayout = (data: any, index: number) => ({
    length: screenWidth,
    offset: screenWidth * index,
    index,
  });

  const s = slug?.toLowerCase().trim();
  const isMainCafe = s === 'cafe' || s === 'fastkirana-cafe' || s === 'as-cafe' || s === 'café' || normalizedSlug === 'cafe';

  if (isMainCafe) {
    return (
      <View style={styles.cafeRedirectWrap}>
        <ActivityIndicator size="large" color={THEME.COLORS.brand.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {Platform.OS !== 'android' ? (
          <BlurView
            intensity={95}
            tint={isDarkMode ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.surface }]} />
        )}

        <BrandedTopHeader style={{ paddingHorizontal: 0, paddingVertical: 0, borderBottomWidth: 0, marginBottom: 12 }} />

        {/* Row 2: Search input placeholder */}
        <ScalePressable
          onPress={() => {
            router.push({
              pathname: '/search',
              params: {
                categorySlug: activeSlug,
                categoryName: categoryName
              }
            });
          }}
          scaleValue={0.99}
          style={[styles.searchBar, { borderColor: colors.border }]}
        >
          <Search size={16} color={THEME.COLORS.brand.primary} style={{ marginRight: 10 }} />
          <Text style={[styles.searchBarText, { color: colors.textMuted }]}>
            Search in {categoryName}
          </Text>

          {/* Vertical Divider */}
          <View style={[styles.searchDivider, { backgroundColor: colors.border }]} />

          <Mic size={16} color={THEME.COLORS.brand.accent} />
        </ScalePressable>

        {/* Row 3: Breadcrumbs Capsule */}
        <View style={[styles.breadcrumbWrap, { backgroundColor: colors.borderLight, borderColor: colors.border }]}>
          <ScalePressable
            onPress={() => {
              router.replace('/(tabs)');
            }}
            scaleValue={0.96}
          >
            <Text allowFontScaling={false} style={[styles.breadcrumbText, { color: THEME.COLORS.brand.primary }]}>HOME</Text>
          </ScalePressable>
          <ChevronRight size={8} color={colors.textMuted} style={{ marginHorizontal: 6 }} />
          <ScalePressable
            onPress={() => {
              if (isCafe) {
                router.push('/cafe');
              } else {
                router.replace('/(tabs)');
              }
            }}
            scaleValue={0.96}
          >
            <Text allowFontScaling={false} style={[styles.breadcrumbText, { color: THEME.COLORS.brand.primary }]}>
              {isCafe ? 'FASTKIRANA CAFE 🍩' : 'FASTKIRANA MART 🛒'}
            </Text>
          </ScalePressable>
          <ChevronRight size={8} color={colors.textMuted} style={{ marginHorizontal: 6 }} />
          <Text allowFontScaling={false} style={[styles.breadcrumbText, { color: colors.textMuted }]} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>
      </View>

      {/* Row 5: Horizontal Category Selection strip */}
      <View style={{ backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <ScrollView
          ref={tabScrollViewRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            gap: 12,
            alignItems: 'center'
          }}
        >
          {categoriesList.map((cat) => {
            const isActive = activeSlug === cat.slug;
            const config = CATEGORIES_MAPPING[cat.slug];
            const hasImage = !!config;
            const bgColor = getCategoryBgColor(cat.slug);

            return (
              <CategoryItem
                key={cat.slug}
                cat={cat}
                isActive={isActive}
                isDarkMode={isDarkMode}
                bgColor={bgColor}
                hasImage={hasImage}
                config={config}
                onPress={() => handleSelectCategory(cat.slug)}
              />
            );
          })}
        </ScrollView>
      </View>

      {/* Sort/Filter Bar */}
      <View style={[styles.sortBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', gap: THEME.SPACING.xs + 1 }}>
          {[
            { id: 'RELEVANCE', label: 'Relevance' },
            { id: 'PRICE_LOW', label: 'Price: Low' },
            { id: 'PRICE_HIGH', label: 'Price: High' }
          ].map((option) => (
            <ScalePressable
              key={option.id}
              onPress={() => setSortBy(option.id as any)}
              scaleValue={0.94}
              haptic="light"
              style={[
                styles.sortChip,
                {
                  borderColor: sortBy === option.id
                    ? (isDarkMode ? `${THEME.COLORS.brand.primary}80` : '#fecdd3')
                    : colors.borderLight,
                  backgroundColor: sortBy === option.id
                    ? (isDarkMode ? `${THEME.COLORS.brand.primary}20` : '#fff5f5')
                    : (isDarkMode ? colors.surfaceElevated : colors.surface),
                }
              ]}
            >
              <Text style={[
                styles.sortChipText,
                {
                  color: sortBy === option.id ? THEME.COLORS.brand.primary : colors.textMuted
                }
              ]}>
                {option.label}
              </Text>
            </ScalePressable>
          ))}
        </View>

        <ScalePressable
          scaleValue={0.95}
          haptic="light"
          style={[
            styles.filterChip,
            {
              borderColor: colors.border,
              backgroundColor: colors.borderLight,
            }
          ]}
        >
          <SlidersHorizontal size={12} color={colors.textMuted} />
          <Text style={[styles.filterChipText, { color: colors.textMuted }]}>Filters</Text>
        </ScalePressable>
      </View>

      <FlatList
        ref={flatListRef}
        data={categoriesList}
        keyExtractor={(item) => item.slug}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={getItemLayout}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollEndDrag={handleMomentumScrollEnd}
        style={{ flex: 1 }}
        renderItem={({ item }) => {
          const isActive = item.slug === activeSlug;
          if (!initialRenderDone && !isActive) {
            return <View style={{ width: screenWidth, flex: 1 }} />;
          }
          return (
            <CategoryProductPage
              categorySlug={item.slug}
              sortBy={sortBy}
              isDarkMode={isDarkMode}
              screenWidth={screenWidth}
            />
          );
        }}
      />

      {/* Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={8} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  cafeRedirectWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    zIndex: 20,
    overflow: 'hidden',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 36,
    width: '100%',
    marginTop: 10,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchBarText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  searchDivider: {
    width: 1,
    height: 16,
    marginRight: 10,
  },
  breadcrumbWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    marginTop: 10,
    borderWidth: 1,
  },
  breadcrumbText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skeletonWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingHorizontal: 8,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontWeight: '700',
    fontSize: 14,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm + 2,
    borderBottomWidth: 1,
    zIndex: 10,
  },
  sortChip: {
    paddingHorizontal: THEME.SPACING.sm + 2,
    paddingVertical: THEME.SPACING.xs + 1,
    borderRadius: 99,
    borderWidth: 1,
  },
  sortChipText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
    borderWidth: 1,
  },
  filterChipText: {
    fontWeight: '800',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
