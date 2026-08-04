import { View, Text, ScrollView, Pressable, TextInput, Image, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import { SkeletonShimmer } from '../../components/shared/SkeletonShimmer';
import { triggerHaptic } from '../../lib/haptic';
import { Search, ShoppingBag, X, Mic } from 'lucide-react-native';
import { useUIStore } from '../../stores/ui-store';
import { ScalePressable } from '../../components/shared/ScalePressable';
import { useState, useMemo, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../lib/constants';
import { getAppImageSource, formatHeaderAddress } from '../../lib/utils';
import { THEME } from '../../lib/theme';
import { useScrollTabBar } from '../../hooks/use-scroll-tab-bar';
import BrandedTopHeader from '../../components/shared/BrandedTopHeader';

// Local assets mapping for styling and fallback
const LOCAL_CATEGORY_CONFIGS: Record<string, { name: string; image: any; description: string; color: string }> = {
  'fruits-vegetables': {
    name: 'Fruits & Vegetables',
    image: require('../../assets/fruits_vegetables_category.webp'),
    description: '100% Farm-Fresh Organic',
    color: '#059669'
  },
  'dairy-breakfast': {
    name: 'Dairy & Breakfast',
    image: require('../../assets/dairy_breakfast_category.webp'),
    description: 'Milk, Butter, Bread & Eggs',
    color: '#1d4ed8'
  },
  'snacks-biscuits': {
    name: 'Snacks & Munchies',
    image: require('../../assets/snacks_munchies_category.webp'),
    description: 'Chips, Cookies & Popcorn',
    color: '#d97706'
  },
  'beverages': {
    name: 'Beverages',
    image: require('../../assets/beverages_category.webp'),
    description: 'Soft Drinks & Coolers',
    color: '#7c3aed'
  },
  'ice-cream': {
    name: 'Ice Cream',
    image: require('../../assets/ice_cream_category.webp'),
    description: 'Frozen Desserts & Tubs',
    color: '#0ea5e9'
  },
  'cafe': {
    name: 'FastKirana Cafe',
    image: require('../../assets/cafe_category.webp'),
    description: 'Hot Pizza, Rolls & Coffee',
    color: THEME.COLORS.brand.primary
  },
  'personal-care': {
    name: 'Personal Care',
    image: require('../../assets/personal_care_category.webp'),
    description: 'Soaps, Shampoos & Hygiene',
    color: '#db2777'
  },
  'household': {
    name: 'Household & Cleaning',
    image: require('../../assets/household_category.webp'),
    description: 'Detergents, Cleaners & Tools',
    color: '#4b5563'
  },
  'home-cleaners': {
    name: 'Home Cleaners',
    image: require('../../assets/household_category.webp'),
    description: 'Detergents, Cleaners & Dishwash',
    color: '#0284c7'
  },
  'fastkirana-cafe': {
    name: 'FastKirana Cafe',
    image: require('../../assets/cafe_category.webp'),
    description: 'Hot Pizza, Rolls & Coffee',
    color: THEME.COLORS.brand.primary
  },
  'bakery': {
    name: 'Bakery & Biscuits',
    image: require('../../assets/bakery_biscuits_category.webp'),
    description: 'Fresh Bread, Buns & Cookies',
    color: '#c2410c'
  },
  'grocery-essential': {
    name: 'Atta, Rice & Dal',
    image: require('../../assets/atta_rice_dal_category.webp'),
    description: 'Grains, Flours & Lentils',
    color: '#854d0e'
  }
};

function CategoryCard({ category, isDarkMode }: { category: any; isDarkMode: boolean }) {
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = windowWidth >= 900 ? '23.5%' : (windowWidth >= 600 ? '31.5%' : '48%');
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 180 }) }],
  }));

  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const imageBg = category.color
    ? (isDarkMode ? `${category.color}20` : `${category.color}08`)
    : (isDarkMode ? THEME.COLORS.dark.surfaceElevated : THEME.COLORS.light.background);

  return (
    <Animated.View
      entering={undefined}
      style={[{ width: cardWidth as any, marginBottom: THEME.SPACING.sm }, animatedStyle]}
    >
      <Pressable
        onPress={() => {
          triggerHaptic('light');
          if (category.slug === 'cafe') {
            router.push('/restaurants');
          } else {
            router.push(`/category/${category.slug}`);
          }
        }}
        onPressIn={() => { scale.value = 0.96; }}
        onPressOut={() => { scale.value = 1.0; }}
        style={{
          width: '100%',
          backgroundColor: colors.surface,
          borderRadius: THEME.RADIUS.md,
          borderWidth: 1,
          borderColor: colors.border,
          padding: THEME.SPACING.sm,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: THEME.SPACING.xs },
              shadowOpacity: isDarkMode ? 0.2 : 0.03,
              shadowRadius: 4,
            },
            android: {
              elevation: 2,
            }
          })
        }}
      >
        {/* Image Area with tinted background & Badge */}
        <View
          style={{
            width: '100%',
            height: 110,
            borderRadius: THEME.RADIUS.sm,
            backgroundColor: imageBg,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          {/* Badge top-left */}
          <View
            style={{
              position: 'absolute',
              top: THEME.SPACING.xs,
              left: THEME.SPACING.xs,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: THEME.RADIUS.pill,
              paddingHorizontal: THEME.SPACING.xs,
              paddingVertical: 2,
              gap: 2,
              zIndex: 10
            }}
          >
            <ShoppingBag size={8} color={THEME.COLORS.brand.primary} />
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, color: '#ffffff', letterSpacing: 0.3 }}>
              {`${category.itemCount} ITEMS`}
            </Text>
          </View>

          {category.emoji ? (
            <Text style={{ fontSize: 36 }}>{category.emoji}</Text>
          ) : (
            <Image
              source={category.serverImage ? { uri: category.serverImage } : category.image}
              style={{
                width: '100%',
                height: '100%',
                resizeMode: 'cover',
              }}
            />
          )}
        </View>

        {/* Info Area */}
        <View style={{ marginTop: THEME.SPACING.xs, paddingHorizontal: 2 }}>
          <Text
            numberOfLines={2}
            style={{
              color: category.color || colors.textPrimary,
              fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
              fontWeight: THEME.TYPOGRAPHY.weights.bold,
              letterSpacing: -0.2,
              lineHeight: 16
            }}
          >
            {category.name}
          </Text>

          <Text
            numberOfLines={2}
            style={{
              color: colors.textSecondary,
              fontSize: THEME.TYPOGRAPHY.sizes.micro,
              fontWeight: THEME.TYPOGRAPHY.weights.medium,
              marginTop: 2,
            }}
          >
            {category.description}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CategoriesScreen() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { onScroll: onTabBarScroll, onTouchStart: onTabBarTouchStart } = useScrollTabBar();
  const selectedLocation = useUIStore((s) => s.selectedLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch live categories from database
  const { data: serverCategories = [], isLoading } = useQuery<any[]>({
    queryKey: ['categories-list-all'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error('API failed');
      return res.json();
    },
    staleTime: 1000 * 60 * 15,
  });

  // Fetch cafe products to get counts dynamically
  const { data: cafeProductsData } = useQuery<any>({
    queryKey: ['cafe-total-count-all'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?category=fastkirana-cafe&limit=1`);
      if (!response.ok) return { pagination: { total: 81 } };
      return response.json();
    },
    staleTime: 1000 * 60 * 15,
  });
  const cafeCount = cafeProductsData?.pagination?.total ?? 79;

  // Build the list of display categories based on local configs merged with server updates
  const displayCategories = useMemo(() => {
    if (serverCategories && serverCategories.length > 0) {
      return serverCategories.map(serverCat => {
        const local = LOCAL_CATEGORY_CONFIGS[serverCat.slug] || {
          name: serverCat.name,
          description: 'Quality Grocery & Essentials',
          color: THEME.COLORS.brand.success,
          image: null
        };

        const resolvedImg = serverCat.imageUrl ? getAppImageSource(serverCat.imageUrl) : null;
        const serverImage = resolvedImg ? resolvedImg.uri : null;

        // Check if imageUrl is actually an emoji
        const isEmoji = serverCat.imageUrl &&
                        serverCat.imageUrl.length < 5 &&
                        !serverCat.imageUrl.startsWith('http') &&
                        !serverCat.imageUrl.startsWith('/');
        const emoji = isEmoji ? serverCat.imageUrl : null;

        let itemCount = 0;
        if (serverCat.slug === 'cafe') {
          itemCount = cafeCount;
        } else {
          itemCount = serverCat._count?.products ?? 0;
        }

        return {
          name: serverCat.name || local.name,
          slug: serverCat.slug,
          image: local.image,
          serverImage: emoji ? null : serverImage,
          emoji: emoji,
          itemCount: itemCount,
          description: local.description || 'Quality Grocery & Essentials',
          color: local.color || THEME.COLORS.brand.success
        };
      });
    }

    // Fallback: serverCategories is empty
    return Object.keys(LOCAL_CATEGORY_CONFIGS).map(slug => {
      const local = LOCAL_CATEGORY_CONFIGS[slug];
      let itemCount = 0;
      if (slug === 'cafe') {
        itemCount = cafeCount;
      }

      return {
        name: local.name,
        slug: slug,
        image: local.image,
        serverImage: null,
        emoji: null,
        itemCount: itemCount,
        description: local.description,
        color: local.color
      };
    });
  }, [serverCategories, cafeCount]);

  const filteredCategories = displayCategories.filter(cat =>
    (cat.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cat.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {/* Premium Header */}
      <View
        style={{
          width: '100%',
          backgroundColor: colors.background,
          zIndex: 50,
          borderBottomWidth: 1,
          borderColor: isDarkMode ? THEME.COLORS.dark.borderLight : THEME.COLORS.light.borderLight,
        }}
      >
        <View style={{ paddingHorizontal: THEME.SPACING.lg, paddingTop: THEME.SPACING.sm, paddingBottom: THEME.SPACING.sm }}>
          <BrandedTopHeader style={{ paddingHorizontal: 0, paddingVertical: 0, borderBottomWidth: 0 }} />
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 160, paddingTop: THEME.SPACING.md }}
        showsVerticalScrollIndicator={false}
        onScroll={onTabBarScroll}
        onTouchStart={onTabBarTouchStart}
        scrollEventThrottle={16}
      >
        {/* Title Header Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: THEME.SPACING.lg, marginBottom: THEME.SPACING.lg }}>
          <View style={{ flex: 1, paddingRight: THEME.SPACING.lg }}>
            {/* Breadcrumb */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.xs, marginBottom: THEME.SPACING.sm }}>
              <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textMuted, letterSpacing: 0.5 }}>
                HOME
              </Text>
              <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: colors.textMuted }}>
                &gt;
              </Text>
              <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, color: THEME.COLORS.brand.primary, letterSpacing: 0.5 }}>
                CATEGORIES DIRECTORY
              </Text>
            </View>

            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.hero, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary, letterSpacing: -0.8 }}>
              Shop by Category
            </Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.semibold, color: colors.textSecondary, marginTop: THEME.SPACING.sm, lineHeight: 18 }}>
              Explore our curated catalog of groceries and hot cafe treats
            </Text>
          </View>

          {/* Right Image */}
          <Image
            source={require('../../assets/grocery_bag_banner.webp')}
            style={{ width: 85, height: 85, resizeMode: 'contain' }}
          />
        </View>

        {/* Search Bar Section */}
        <View style={{ paddingHorizontal: THEME.SPACING.lg, marginBottom: THEME.SPACING.xl }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: THEME.RADIUS.pill,
              paddingHorizontal: THEME.SPACING.lg,
              height: 44,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDarkMode ? 0.1 : 0.02,
              shadowRadius: 2,
              elevation: 1
            }}
          >
            <Search size={16} color={THEME.COLORS.brand.primary} style={{ marginRight: THEME.SPACING.sm }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search categories..."
              placeholderTextColor={colors.textMuted}
              style={{
                flex: 1,
                color: colors.textPrimary,
                fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
                fontWeight: THEME.TYPOGRAPHY.weights.semibold,
                padding: 0
              }}
            />
            {searchQuery.length > 0 ? (
              <ScalePressable onPress={() => setSearchQuery('')} scaleValue={0.9} hitSlop={12} style={{ padding: 4 }}>
                <X size={14} color={colors.textMuted} />
              </ScalePressable>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 1, height: 16, backgroundColor: colors.border, marginRight: THEME.SPACING.sm }} />
                <ScalePressable onPress={() => router.push('/search')} scaleValue={0.9} hitSlop={12} style={{ padding: 4 }}>
                  <Mic size={16} color={THEME.COLORS.brand.primary} />
                </ScalePressable>
              </View>
            )}
          </View>
        </View>

        {/* Categories Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: THEME.SPACING.lg }}>
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <View
                key={i}
                style={{
                  width: '48%',
                  marginBottom: THEME.SPACING.sm,
                  backgroundColor: colors.surface,
                  borderRadius: THEME.RADIUS.md,
                  borderWidth: 1,
                  borderColor: colors.border,
                  padding: THEME.SPACING.sm,
                  height: 150,
                }}
              >
                <SkeletonShimmer width="100%" height={110} borderRadius={THEME.RADIUS.sm} />
                <SkeletonShimmer width="75%" height={10} style={{ marginTop: THEME.SPACING.sm, marginBottom: 2 }} />
              </View>
            ))
          ) : (
            filteredCategories.map((category, index) => (
              <CategoryCard
                key={category.slug}
                category={category}
                isDarkMode={isDarkMode}
              />
            ))
          )}
          {!isLoading && filteredCategories.length === 0 && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, width: '100%' }}>
              <Text style={{ color: colors.textMuted, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.semibold }}>
                No categories found matching "{searchQuery}"
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={88} />
    </SafeAreaView>
  );
}
