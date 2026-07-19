import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, Pressable, ScrollView, FlatList, ActivityIndicator, Dimensions, Platform, StyleSheet, Image as RNImage } from 'react-native';
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
import { BlurView } from 'expo-blur';
import { formatHeaderAddress, getAppImageSource } from '../../lib/utils';

const { width: rawWidth } = Dimensions.get('window');
const screenWidth = rawWidth > 768 ? 540 : rawWidth;

const GROCERY_CATEGORIES = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', emoji: '🥬' },
  { name: 'Dairy & Breakfast', slug: 'dairy-breakfast', emoji: '🥛' },
  { name: 'Snacks & Munchies', slug: 'snacks-biscuits', emoji: '🍿' },
  { name: 'Beverages', slug: 'beverages', emoji: '🥤' },
  { name: 'Ice Cream', slug: 'ice-cream', emoji: '🍦' },
  { name: 'Personal Care', slug: 'personal-care', emoji: '🧴' },
  { name: 'Household', slug: 'household', emoji: '🏠' },
  { name: 'Bakery & Biscuits', slug: 'bakery', emoji: '🍞' },
  { name: 'Atta, Rice & Dal', slug: 'grocery-essential', emoji: '🌾' },
];

const CATEGORIES_MAPPING: Record<string, { name: string; image: any; color: string }> = {
  'fruits-vegetables': { name: 'Fruits & Veg', image: require('../../assets/fruits_vegetables_category.webp'), color: '#ecf7ed' },
  'beverages': { name: 'Beverages', image: require('../../assets/beverages_category.webp'), color: '#eef2f6' },
  'ice-cream': { name: 'Ice Cream', image: require('../../assets/ice_cream_category.webp'), color: '#e0f2f1' },
  'cafe': { name: 'Cafe', image: require('../../assets/cafe_category.webp'), color: '#fff8e1' },
  'personal-care': { name: 'Personal Care', image: require('../../assets/personal_care_category.webp'), color: '#fce4ec' },
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
    { name: 'Personal Care', emoji: '🪥', tags: ['toothpaste', 'colgate', 'dabur', 'gel'] }
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
  ]
};

const DEFAULT_SUBCATEGORIES = [
  { name: 'All', emoji: '📦', tags: [] },
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
          ? (isDarkMode ? '#18181b' : '#ffffff')
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
            backgroundColor: '#e20a22'
          }}
        />
      )}
      {/* Animated Emoji / Icon container */}
      <Animated.View 
        style={[
          { 
            width: 32, 
            height: 32, 
            borderRadius: 16, 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: isActive 
              ? (isDarkMode ? 'rgba(225, 29, 72, 0.2)' : 'rgba(225, 29, 72, 0.12)')
              : 'transparent'
          },
          animatedIconStyle
        ]}
      >
        <Text style={{ fontSize: 18 }}>{sub.emoji}</Text>
      </Animated.View>
      {/* Text Label */}
      <Text 
        style={{ 
          fontSize: 8.5, 
          lineHeight: 11,
          fontWeight: isActive ? '900' : '700', 
          color: isActive ? '#e20a22' : (isDarkMode ? '#a1a1aa' : '#64748b'),
          textAlign: 'center',
          marginTop: 5,
          width: '92%',
          letterSpacing: -0.1
        }}
        numberOfLines={2}
        allowFontScaling={false}
      >
        {sub.name}
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
  const assignedStoreId = useUIStore((s) => s.assignedStoreId);
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['category-products', categorySlug],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?category=${categorySlug}&limit=500`);
      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    staleTime: 5000, // 5s short cache
    refetchInterval: 10000, // Auto-refetch every 10s for real-time stock sync
  });

  // Prefetch category products images in the background to speed up image loading
  useEffect(() => {
    if (products && products.length > 0) {
      const urls = products
        .map((p) => (p.imageUrl ? getAppImageSource(p.imageUrl)?.uri : null))
        .filter((url): url is string => !!url)
        .slice(0, 30); // Prefetch first 30 product images in this category
      if (urls.length > 0) {
        ExpoImage.prefetch(urls);
      }
    }
  }, [products]);

  const subcategoryList = useMemo(() => {
    return SUBCATEGORIES_DATA[categorySlug] || DEFAULT_SUBCATEGORIES;
  }, [categorySlug]);

  const [activeSub, setActiveSub] = useState('All');
  const sidebarScrollViewRef = useRef<ScrollView>(null);

  // Reset activeSub when categorySlug changes
  useEffect(() => {
    setActiveSub('All');
  }, [categorySlug]);

  // Synchronize left sidebar vertical scroll offset to center the active subcategory item
  useEffect(() => {
    if (sidebarScrollViewRef.current) {
      const activeIdx = subcategoryList.findIndex(s => s.name === activeSub);
      if (activeIdx !== -1) {
        const itemHeight = 72; // scroll element item height (approximate padding + content)
        const targetY = Math.max(0, (activeIdx * itemHeight) - 150); // center target y offset
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
      const hasVariants = p.variants && Array.isArray(p.variants) && p.variants.length > 0;
      if (!hasVariants) return (p.stock || 0) <= 0;
      const totalStock = (p.variants as any[]).reduce((sum, v) => sum + (v.stock || 0), 0);
      return totalStock <= 0;
    };

    let list = products.filter(p => p.isAvailable !== false);

    // Apply primary sorting (pushing out-of-stock to bottom, then sorting by chosen criteria)
    const listWithIndex = list.map((p, index) => ({ product: p, index }));

    listWithIndex.sort((itemA, itemB) => {
      const a = itemA.product;
      const b = itemB.product;
      const aOut = isProductOutOfStock(a);
      const bOut = isProductOutOfStock(b);
      
      // Out-of-stock items are always pushed to the bottom
      if (aOut && !bOut) return 1;
      if (!aOut && bOut) return -1;

      // Secondary sorting by price
      if (sortBy === 'PRICE_LOW') {
        return getProductPrice(a) - getProductPrice(b);
      } else if (sortBy === 'PRICE_HIGH') {
        return getProductPrice(b) - getProductPrice(a);
      }
      
      // Relevance/Default: Preserve the exact order returned by the API server
      return itemA.index - itemB.index;
    });

    list = listWithIndex.map(item => item.product);

    const activeSubItem = subcategoryList.find(s => s.name === activeSub);
    if (!activeSubItem || activeSubItem.name === 'All') {
      return list;
    }

    // Default filters
    if (activeSubItem.name === 'Deals') {
      return list.filter(p => p.discount > 0);
    } else if (activeSubItem.name === 'Trending') {
      return list.filter(p => (p.tags && p.tags.includes('trending')) || p.price > 30);
    } else if (activeSubItem.name === 'Popular') {
      return list.filter(p => (p.tags && p.tags.includes('popular')) || p.discount > 10);
    }

    // Keyword matching
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
  }, [products, activeSub, subcategoryList, sortBy]);

  return (
    <View style={{ width: screenWidth, flex: 1, flexDirection: 'row' }}>
      {/* Left Sidebar (Subcategories) */}
      <View 
        style={{ 
          width: 90, 
          borderRightWidth: 1, 
          borderColor: isDarkMode ? '#27272a' : '#f1f5f9', 
          backgroundColor: isDarkMode ? '#09090b' : '#f8fafc' 
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
          <View className="flex-1 flex-row flex-wrap justify-between pt-3">
            {[1, 2, 3, 4].map((i) => (
              <ProductCardSkeleton key={i} style={{ width: '48%' }} />
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
                  <ProductCard product={item} index={index} className="w-full" isCategoryGrid={true} />
                </View>
              )}
              ListEmptyComponent={
                <View className="flex-1 justify-center items-center py-20">
                  <Text className="text-slate-400 dark:text-zinc-500 font-bold text-sm">No products in this subcategory</Text>
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
                placeholder={isDarkMode ? "rgba(39,39,42,0.4)" : "rgba(241,245,249,0.6)"}
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
                borderColor: '#e20a22',
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
            color: isActive ? '#e20a22' : (isDarkMode ? '#a1a1aa' : '#64748b'),
            marginTop: 6,
            textAlign: 'center',
            width: '100%',
            height: 24, // Fix height to ensure vertical alignment is identical!
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
              backgroundColor: '#e20a22',
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
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { getTotalItems, getSubtotal } = useCart();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const [sortBy, setSortBy] = useState<'RELEVANCE' | 'PRICE_LOW' | 'PRICE_HIGH'>('RELEVANCE');
  const [activeSlug, setActiveSlug] = useState(slug);
  const [initialRenderDone, setInitialRenderDone] = useState(false);

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
    return GROCERY_CATEGORIES;
  }, [isCafe]);

  const initialIndex = useMemo(() => {
    const idx = categoriesList.findIndex(c => c.slug === slug);
    return idx !== -1 ? idx : 0;
  }, [slug, categoriesList]);

  // Synchronize top categories selector offset to center the active category item
  useEffect(() => {
    if (tabScrollViewRef.current) {
      const activeIdx = categoriesList.findIndex(c => c.slug === activeSlug);
      if (activeIdx !== -1) {
        const itemWidth = 84; // scroll element item width + margin spacing
        const targetX = Math.max(0, (activeIdx * itemWidth) - (screenWidth / 2) + (itemWidth / 2));
        tabScrollViewRef.current.scrollTo({ x: targetX, animated: true });
      }
    }
  }, [activeSlug, categoriesList]);

  // If path slug parameter changes externally, sync swiper active page
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
      return isDarkMode ? 'rgba(255,255,255,0.08)' : config.color;
    }
    return isDarkMode ? 'rgba(255,255,255,0.08)' : '#f8fafc';
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

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {/* Header */}
      <View style={{
        paddingHorizontal: 12,
        paddingTop: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        backgroundColor: 'transparent',
        zIndex: 20,
        overflow: 'hidden'
      }}>
        {Platform.OS !== 'android' ? (
          <BlurView 
            intensity={95}
            tint={isDarkMode ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? 'rgba(9,9,11,0.95)' : 'rgba(255,255,255,0.95)' }]} />
        )}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          {/* Left: Brand Logo & Text (Matched with Landing Page) */}
          <ScalePressable 
            onPress={() => {
              router.replace('/(tabs)');
            }} 
            scaleValue={0.97}
            style={{}}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9', 
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 8, 
                borderWidth: 1, 
                borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                flexShrink: 0
              }}>
                <Logo size={22} />
              </View>
              <View style={{ marginLeft: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: -0.5, lineHeight: 18 }}>
                  <Text style={{ color: isDarkMode ? '#fafafa' : '#0f172a' }}>Fast</Text>
                  <Text style={{ color: '#e20a22' }}>Kirana</Text>
                </Text>
                <Text style={{ fontSize: 7, fontWeight: '900', color: '#16a34a', letterSpacing: 0.3, marginTop: 0 }}>
                  DELIVERY APP
                </Text>
              </View>
            </View>
          </ScalePressable>
          
          {/* Right: Location Capsule Picker (Matched with Landing Page) */}
          <ScalePressable 
            onPress={() => {
              router.push('/location-picker');
            }} 
            scaleValue={0.96}
            style={{
              maxWidth: '60%'
            }}
          >
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: isDarkMode ? 'rgba(226,10,34,0.1)' : '#fff5f5', 
              borderWidth: 1, 
              borderColor: isDarkMode ? 'rgba(226,10,34,0.25)' : '#fecdd3', 
              borderRadius: 20, 
              paddingHorizontal: 8, 
              paddingVertical: 5,
              justifyContent: 'center',
            }}>
              <MapPin size={11} color="#e20a22" style={{ flexShrink: 0, marginRight: 3 }} />
              <Text 
                numberOfLines={1} 
                style={{ 
                  fontSize: 10, 
                  fontWeight: 'bold', 
                  color: isDarkMode ? '#fafafa' : '#0f172a',
                  flexShrink: 1,
                  marginRight: 3
                }}
              >
                {formatHeaderAddress(selectedLocation)}
              </Text>
              <ChevronDown size={8} color={isDarkMode ? '#cbd5e1' : '#64748b'} style={{ flexShrink: 0 }} />
            </View>
          </ScalePressable>
        </View>

        {/* Row 2: Search input placeholder (Matched with Landing Page) */}
        <ScalePressable 
          onPress={() => {
            router.push('/search');
          }}
          scaleValue={0.99}
          className="flex-row items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full px-4 h-11 w-full"
          style={Platform.OS === 'ios' ? {
            marginTop: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
          } : Platform.OS === 'android' ? {
            marginTop: 10,
            elevation: 2,
          } : { marginTop: 10 }}
        >
          <Search size={16} color="#e20a22" style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '500', flex: 1 }}>
            Search in {categoryName}
          </Text>
          
          {/* Vertical Divider */}
          <View style={{ width: 1, height: 16, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', marginRight: 10 }} />
          
          <Mic size={16} color="#e20a22" />
        </ScalePressable>

        {/* Row 3: Breadcrumbs Capsule */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          borderRadius: 99,
          paddingHorizontal: 10,
          paddingVertical: 4.5,
          marginTop: 10,
          marginBottom: 2,
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
          borderWidth: 1,
          borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
        }}>
          <ScalePressable 
            onPress={() => {
              router.replace('/(tabs)');
            }}
            scaleValue={0.96}
            style={{}}
          >
            <Text allowFontScaling={false} style={{ fontSize: 9.5, fontWeight: '800', color: '#e20a22', letterSpacing: 0.5 }}>HOME</Text>
          </ScalePressable>
          <ChevronRight size={8} color="#94a3b8" style={{ marginHorizontal: 6 }} />
          <ScalePressable 
            onPress={() => {
              if (isCafe) {
                router.push('/cafe');
              } else {
                router.replace('/(tabs)');
              }
            }}
            scaleValue={0.96}
            style={{}}
          >
            <Text allowFontScaling={false} style={{ fontSize: 9.5, fontWeight: '800', color: '#e20a22', letterSpacing: 0.5 }}>
              {isCafe ? 'FASTKIRANA CAFE 🍩' : 'FASTKIRANA MART 🛒'}
            </Text>
          </ScalePressable>
          <ChevronRight size={8} color="#94a3b8" style={{ marginHorizontal: 6 }} />
          <Text allowFontScaling={false} style={{ fontSize: 9.5, fontWeight: '800', color: isDarkMode ? '#a1a1aa' : '#64748b', letterSpacing: 0.5, textTransform: 'uppercase' }} numberOfLines={1}>
            {categoryName}
          </Text>
        </View>


      </View>

      {/* Row 5: Horizontal Category Selection strip (web style parity) */}
      <View>
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
          style={{
            backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
            borderBottomWidth: 1,
            borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
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
      <View className="bg-white/80 dark:bg-zinc-900/80 border-b border-slate-100/65 dark:border-zinc-800/80 px-4 py-2 flex-row justify-between items-center z-10">
        <View className="flex-row gap-1.5">
          {[
            { id: 'RELEVANCE', label: 'Relevance' },
            { id: 'PRICE_LOW', label: 'Price: Low' },
            { id: 'PRICE_HIGH', label: 'Price: High' }
          ].map((option) => (
            <ScalePressable
              key={option.id}
              onPress={() => {
                setSortBy(option.id as any);
              }}
              scaleValue={0.94}
              haptic="light"
              className={`px-3 py-1.5 rounded-full border ${
                sortBy === option.id 
                  ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-250 dark:border-rose-900/50' 
                  : 'bg-slate-50/50 dark:bg-zinc-800/40 border-slate-100/50 dark:border-zinc-800/60'
              }`}
            >
              <Text className={`text-[9px] font-black uppercase tracking-wider ${
                sortBy === option.id ? 'text-primary' : 'text-slate-500 dark:text-zinc-400'
              }`}>
                {option.label}
              </Text>
            </ScalePressable>
          ))}
        </View>

        <ScalePressable 
          scaleValue={0.95}
          haptic="light"
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 99,
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(39, 39, 42, 0.8)' : 'rgba(241, 245, 249, 0.8)',
            backgroundColor: isDarkMode ? 'rgba(39, 39, 42, 0.3)' : 'rgba(248, 250, 252, 0.5)',
          }}
        >
          <SlidersHorizontal size={12} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
          <Text className="text-slate-500 dark:text-zinc-400 font-extrabold text-[9px] uppercase tracking-wider">Filters</Text>
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

