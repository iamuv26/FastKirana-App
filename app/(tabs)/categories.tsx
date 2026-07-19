import { View, Text, ScrollView, Pressable, TextInput, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import { SkeletonShimmer } from '../../components/shared/SkeletonShimmer';
import { triggerHaptic } from '../../lib/haptic';
import { ArrowLeft, ChevronRight, ChevronDown, MapPin, Search, ShoppingBag, Moon, Sun, X, Mic } from 'lucide-react-native';
import { useUIStore } from '../../stores/ui-store';
import { ScalePressable } from '../../components/shared/ScalePressable';
import Logo from '../../components/shared/Logo';
import { useState, useMemo, useRef } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../lib/constants';
import { getAppImageSource, formatHeaderAddress } from '../../lib/utils';
import { THEME } from '../../lib/theme';


// Local assets mapping for styling and fallback
const LOCAL_CATEGORY_CONFIGS: Record<string, { name: string; image: any; description: string; color: string }> = {
  'fruits-vegetables': {
    name: 'Fruits & Vegetables',
    image: require('../../assets/fruits_vegetables_category.webp'),
    description: '100% Farm-Fresh Organic',
    color: '#059669' // emerald-600
  },
  'dairy-breakfast': {
    name: 'Dairy & Breakfast',
    image: require('../../assets/dairy_breakfast_category.webp'),
    description: 'Milk, Butter, Bread & Eggs',
    color: '#1d4ed8' // blue-700
  },
  'snacks-biscuits': {
    name: 'Snacks & Munchies',
    image: require('../../assets/snacks_munchies_category.webp'),
    description: 'Chips, Cookies & Popcorn',
    color: '#d97706' // amber-600
  },
  'beverages': {
    name: 'Beverages',
    image: require('../../assets/beverages_category.webp'),
    description: 'Soft Drinks & Coolers',
    color: '#7c3aed' // violet-600
  },
  'ice-cream': {
    name: 'Ice Cream',
    image: require('../../assets/ice_cream_category.webp'),
    description: 'Frozen Desserts & Tubs',
    color: '#0ea5e9' // sky-600
  },
  'cafe': {
    name: 'FastKirana Cafe',
    image: require('../../assets/cafe_category.webp'),
    description: 'Hot Pizza, Rolls & Coffee',
    color: '#e20a22' // primary brand red
  },
  'personal-care': {
    name: 'Personal Care',
    image: require('../../assets/personal_care_category.webp'),
    description: 'Soaps, Shampoos & Hygiene',
    color: '#db2777' // pink-600
  },
  'household': {
    name: 'Household',
    image: require('../../assets/household_category.webp'),
    description: 'Detergents, Cleaners & Tools',
    color: '#4b5563' // grey-600
  },
  'bakery': {
    name: 'Bakery & Biscuits',
    image: require('../../assets/bakery_biscuits_category.webp'),
    description: 'Fresh Bread, Buns & Cookies',
    color: '#c2410c' // orange-700
  },
  'grocery-essential': {
    name: 'Atta, Rice & Dal',
    image: require('../../assets/atta_rice_dal_category.webp'),
    description: 'Grains, Flours & Lentils',
    color: '#854d0e' // yellow-800
  }
};

function CategoryCard({ category, isDarkMode, index }: { category: any; isDarkMode: boolean; index: number }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 180 }) }],
  }));

  // Create a light tinted color background using the category color
  const imageBg = category.color 
    ? (isDarkMode ? `${category.color}20` : `${category.color}08`) 
    : (isDarkMode ? '#1c1c1e' : '#f8fafc');

  return (
    <Animated.View 
      entering={undefined}
      style={[{ width: '48%', marginBottom: 12 }, animatedStyle]}
    >
      <Pressable
        onPress={() => {
          triggerHaptic('light');
          if (category.slug === 'cafe') {
            router.push('/cafe');
          } else {
            router.push(`/category/${category.slug}`);
          }
        }}
        onPressIn={() => { scale.value = 0.96; }}
        onPressOut={() => { scale.value = 1.0; }}
        style={{
          width: '100%',
          backgroundColor: isDarkMode ? THEME.COLORS.dark.surface : '#ffffff',
          borderRadius: THEME.RADIUS.md,
          borderWidth: 1,
          borderColor: isDarkMode ? THEME.COLORS.dark.border : '#e2e8f0',
          padding: 8,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
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
              top: 6,
              left: 6,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              borderRadius: THEME.RADIUS.pill,
              paddingHorizontal: 6,
              paddingVertical: 2,
              gap: 2,
              zIndex: 10
            }}
          >
            <ShoppingBag size={8} color={THEME.COLORS.brand.primary} />
            <Text style={{ fontSize: 7, fontWeight: '700', color: '#ffffff', letterSpacing: 0.3 }}>
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
        <View style={{ marginTop: 6, paddingHorizontal: 2 }}>
          <Text 
            numberOfLines={1}
            style={{ 
              color: category.color || (isDarkMode ? '#f4f4f5' : '#0f172a'), 
              fontSize: 12.5, 
              fontWeight: '700',
              letterSpacing: -0.2
            }}
          >
            {category.name}
          </Text>
          
          <Text 
            numberOfLines={1}
            style={{ 
              color: isDarkMode ? '#a1a1aa' : '#64748b', 
              fontSize: THEME.TYPOGRAPHY.sizes.micro, 
              fontWeight: '500', 
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
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
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
    staleTime: 1000 * 60 * 15, // 15 mins cache validity
  });

  // Fetch cafe products to get counts dynamically
  const { data: cafeProductsData } = useQuery<any>({
    queryKey: ['cafe-total-count-all'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?category=cafe&limit=1`);
      if (!response.ok) return { pagination: { total: 79 } };
      return response.json();
    },
    staleTime: 1000 * 60 * 15, // 15 mins cache validity
  });
  const cafeCount = cafeProductsData?.pagination?.total ?? 79;

  // Build the list of display categories based on local configs merged with server updates to ensure they never disappear
  const displayCategories = useMemo(() => {
    if (serverCategories && serverCategories.length > 0) {
      const serverSlugs = new Set(serverCategories.map(c => c.slug));
      
      const list = serverCategories.map(serverCat => {
        const local = LOCAL_CATEGORY_CONFIGS[serverCat.slug] || {
          name: serverCat.name,
          description: 'Quality Grocery & Essentials',
          color: '#16a34a', // Default green
          image: null
        };

        const resolvedImg = serverCat.imageUrl ? getAppImageSource(serverCat.imageUrl) : null;
        const serverImage = resolvedImg ? resolvedImg.uri : null;

        // Check if imageUrl is actually an emoji (less than 5 chars and doesn't start with http/data//)
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
          color: local.color || '#16a34a'
        };
      });

      // Also append any local config categories that are NOT present on the server
      Object.keys(LOCAL_CATEGORY_CONFIGS).forEach(slug => {
        if (!serverSlugs.has(slug)) {
          const local = LOCAL_CATEGORY_CONFIGS[slug];
          let itemCount = 0;
          if (slug === 'cafe') itemCount = cafeCount;

          list.push({
            name: local.name,
            slug: slug,
            image: local.image,
            serverImage: null,
            emoji: null,
            itemCount: itemCount,
            description: local.description,
            color: local.color
          });
        }
      });

      return list;
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#09090b' : '#f8fafc' }}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {/* Premium Header */}
      <View 
        style={{
          width: '100%',
          backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
          zIndex: 50,
          borderBottomWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
          {/* Top Row: Location & Theme */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Left: Brand Logo & Text (Interactive scroll-to-top) */}
            <ScalePressable 
              onPress={() => {
                scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              }}
              scaleValue={0.97}
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

            {/* Right: Location Capsule Picker */}
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
        </View>
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Header Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={{ flex: 1, paddingRight: 16 }}>
            {/* Breadcrumb */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 6 }}>
              <Text style={{ fontSize: 9, fontWeight: '800', color: isDarkMode ? '#71717a' : '#94a3b8', letterSpacing: 0.5 }}>
                HOME
              </Text>
              <Text style={{ fontSize: 8, fontWeight: 'bold', color: isDarkMode ? '#52525b' : '#cbd5e1' }}>
                &gt;
              </Text>
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#e20a22', letterSpacing: 0.5 }}>
                CATEGORIES DIRECTORY
              </Text>
            </View>
            
            <Text style={{ fontSize: 28, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#0f172a', letterSpacing: -0.8 }}>
              Shop by Category
            </Text>
            <Text style={{ fontSize: 12, fontWeight: '600', color: isDarkMode ? '#a1a1aa' : '#64748b', marginTop: 4, lineHeight: 16 }}>
              Explore our curated catalog of groceries and hot café treats
            </Text>
          </View>
          
          {/* Right Image */}
          <Image 
            source={require('../../assets/grocery_bag_banner.webp')}
            style={{ width: 85, height: 85, resizeMode: 'contain' }}
          />
        </View>

        {/* Search Bar Section */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <View 
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDarkMode ? '#121212' : '#ffffff',
              borderWidth: 1,
              borderColor: isDarkMode ? '#1c1c1e' : '#e2e8f0',
              borderRadius: 22,
              paddingHorizontal: 16,
              height: 44,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDarkMode ? 0.1 : 0.02,
              shadowRadius: 2,
              elevation: 1
            }}
          >
            <Search size={16} color="#e20a22" style={{ marginRight: 10 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search categories..."
              placeholderTextColor="#94a3b8"
              style={{
                flex: 1,
                color: isDarkMode ? '#ffffff' : '#0f172a',
                fontSize: 13,
                fontWeight: '600',
                padding: 0
              }}
            />
            {searchQuery.length > 0 ? (
              <ScalePressable onPress={() => setSearchQuery('')} scaleValue={0.9} hitSlop={12} style={{ padding: 4 }}>
                <X size={14} color="#94a3b8" />
              </ScalePressable>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 1, height: 16, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', marginRight: 10 }} />
                <ScalePressable onPress={() => router.push('/search')} scaleValue={0.9} hitSlop={12} style={{ padding: 4 }}>
                  <Mic size={16} color="#e20a22" />
                </ScalePressable>
              </View>
            )}
          </View>
        </View>

        {/* Categories Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16 }}>
          {isLoading ? (
            [1, 2, 3, 4, 5, 6].map((i) => (
              <View 
                key={i} 
                style={{ 
                  width: '48%', 
                  marginBottom: 12,
                  backgroundColor: isDarkMode ? '#121212' : '#ffffff',
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#1c1c1e' : '#e2e8f0',
                  padding: 8,
                  height: 150,
                }}
              >
                <SkeletonShimmer width="100%" height={110} borderRadius={12} />
                <SkeletonShimmer width="75%" height={10} style={{ marginTop: 8, marginBottom: 2 }} />
              </View>
            ))
          ) : (
            filteredCategories.map((category, index) => (
              <CategoryCard 
                key={category.slug} 
                category={category} 
                isDarkMode={isDarkMode} 
                index={index}
              />
            ))
          )}
          {!isLoading && filteredCategories.length === 0 && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, width: '100%' }}>
              <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>
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
