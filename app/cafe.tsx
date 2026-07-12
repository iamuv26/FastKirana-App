import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Dimensions, Animated as RNAnimated, Platform, Image as RNImage, InteractionManager } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeInDown, interpolate } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, ShoppingBag, Menu, X, Plus, Minus, Check, ChevronRight, MapPin, ChevronDown, Sun, Moon, Mic, Coffee } from 'lucide-react-native';
import { useCart } from '../hooks/use-cart';
import { useUIStore } from '../stores/ui-store';
import { formatPrice, formatHeaderAddress } from '../lib/utils';
import { DEFAULT_CAFE_MENU_SECTIONS, API_BASE_URL } from '../lib/constants';
import { triggerHaptic } from '../lib/haptic';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import ProductCard from '../components/product/ProductCard';
import FloatingCartBar from '../components/shared/FloatingCartBar';
import { SkeletonShimmer } from '../components/shared/SkeletonShimmer';
import { useTheme } from './context/ThemeContext';
import Logo from '../components/shared/Logo';
import StoreSelectorHeader from '../components/shared/StoreSelectorHeader';
import CafePromoCarousel from '../components/shared/CafePromoCarousel';

const { width: rawWidth, height } = Dimensions.get('window');
const width = rawWidth > 768 ? 540 : rawWidth;

const MOCK_CAFE_PRODUCTS: any[] = [];

const CATEGORY_SIDEBAR_IMAGES: Record<string, string> = {
  'hot-beverage': 'https://www.fastkirana.in/cafe_brews_category.png',
  'hot-bite': 'https://www.fastkirana.in/cafe_snacks_category.png',
  'sandwiches': 'https://www.fastkirana.in/cafe_sandwiches_category.png',
  'frankie-rolls': 'https://www.fastkirana.in/cafe_rolls_category.png',
  'chinese': 'https://www.fastkirana.in/cafe_chinese_category.png',
  'italian-pasta': 'https://www.fastkirana.in/cafe_pasta_category.png',
  'bombay-bites': 'https://www.fastkirana.in/cafe_bombay_bites_category.png',
  'rice-dishes': 'https://www.fastkirana.in/cafe_rice_category.png',
  'shakes': 'https://www.fastkirana.in/cafe_shakes_category.png',
  'mocktails': 'https://www.fastkirana.in/cafe_mocktails_category.png',
  'cold-coffee': 'https://www.fastkirana.in/cafe_coffee_category.png',
  'south-indian': 'https://www.fastkirana.in/cafe_south_indian_category.png',
  'chilled': 'https://www.fastkirana.in/cafe_cold_drinks_category.png',
  'bakery': 'https://www.fastkirana.in/bakery_biscuits_category.png',
  'pizza': 'https://www.fastkirana.in/cafe_pizza_category.png',
  'burgers': 'https://www.fastkirana.in/cafe_burgers_category.png',
  'garlic-bread': 'https://www.fastkirana.in/cafe_garlic_bread_category.png',
  'desserts': 'https://www.fastkirana.in/cafe_desserts_category.png',
};

const getCategoryThemeColor = (tag: string) => {
  const mapping: Record<string, string> = {
    'hot-bite': '#ea580c', // Orange
    'sandwiches': '#16a34a', // Green
    'frankie-rolls': '#eab308', // Yellow
    'chinese': '#dc2626', // Red
    'italian-pasta': '#0891b2', // Teal
    'bombay-bites': '#ea580c', // Orange
    'hot-beverage': '#1e40af', // Blue
    'south-indian': '#16a34a', // Green
    'shakes': '#db2777', // Pink
    'mocktails': '#71717a', // Gray
    'cold-coffee': '#7c3aed', // Purple
    'rice-dishes': '#0d9488', // Teal
    'chilled': '#dc2626', // Red
    'bakery': '#d97706', // Amber
  };
  return mapping[tag.toLowerCase()] || '#ea580c';
};

export function VegIndicator({ isNonVeg }: { isNonVeg: boolean }) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  return (
    <View 
      className={`w-3.5 h-3.5 border items-center justify-center rounded-xs shrink-0 ${
        isNonVeg 
          ? (isDarkMode ? 'border-amber-600/60' : 'border-amber-800') 
          : (isDarkMode ? 'border-emerald-500/60' : 'border-emerald-600')
      }`}
    >
      <View 
        className={`w-1.5 h-1.5 shrink-0 ${
          isNonVeg ? 'bg-amber-800 rotate-45' : 'bg-emerald-600 rounded-full'
        }`}
      />
    </View>
  );
}

function CafeRowSkeleton() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const bgColor = isDarkMode ? '#18181b' : '#ffffff';
  const borderColor = isDarkMode ? '#27272a' : '#f1f5f9';
  const rowBorder = isDarkMode ? '#27272a' : '#f8f9fa';
  return (
    <View style={{ marginBottom: 24, backgroundColor: bgColor, borderTopWidth: 1, borderBottomWidth: 1, borderColor: borderColor, paddingHorizontal: 16, paddingVertical: 16 }}>
      {/* Section Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <SkeletonShimmer width={24} height={24} borderRadius={12} />
        <View style={{ gap: 4 }}>
          <SkeletonShimmer width={128} height={16} />
          <SkeletonShimmer width={192} height={12} />
        </View>
      </View>
      
      {/* List Rows */}
      {[1, 2].map((i) => (
        <View key={i} style={{ paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, borderTopWidth: 1, borderColor: rowBorder }}>
          <View style={{ flex: 1, paddingRight: 8, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <SkeletonShimmer width={14} height={14} borderRadius={3} />
              <SkeletonShimmer width={48} height={12} />
            </View>
            <SkeletonShimmer width={160} height={16} />
            <SkeletonShimmer width={64} height={12} />
            <SkeletonShimmer width="90%" height={12} />
            <SkeletonShimmer width="75%" height={12} />
          </View>
          
          <View style={{ alignItems: 'center', position: 'relative' }}>
            <SkeletonShimmer width={96} height={96} borderRadius={12} />
            <View style={{ position: 'absolute', bottom: -10, width: 76, height: 30, borderRadius: 8, overflow: 'hidden' }}>
              <SkeletonShimmer width="100%" height="100%" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const getGridCategoryColors = (tag: string, isActive: boolean, isDarkMode: boolean) => {
  const colorsMap: Record<string, { bg: string, border: string, text: string }> = {
    'hot-bite': { bg: '#fff7ed', border: '#ffedd5', text: '#ea580c' },
    'chinese': { bg: '#fef9c3', border: '#fef08a', text: '#ca8a04' },
    'frankie-rolls': { bg: '#faf5ff', border: '#f3e8ff', text: '#9333ea' },
    'sandwiches': { bg: '#fefce8', border: '#fef9c3', text: '#ca8a04' },
    'italian-pasta': { bg: '#ecfeff', border: '#cffafe', text: '#0891b2' },
    'bombay-bites': { bg: '#fff1f2', border: '#ffe4e6', text: '#e11d48' },
    'hot-beverage': { bg: '#eff6ff', border: '#dbeafe', text: '#1e40af' },
    'south-indian': { bg: '#f0fdf4', border: '#dcfce7', text: '#16a34a' },
    'shakes': { bg: '#fdf2f8', border: '#fce7f3', text: '#db2777' },
    'mocktails': { bg: '#f5f5f4', border: '#e7e5e4', text: '#57534e' },
    'cold-coffee': { bg: '#faf5ff', border: '#f3e8ff', text: '#7c3aed' },
    'rice-dishes': { bg: '#f0fdfa', border: '#ccfbf1', text: '#0d9488' },
  };

  const normalizedTag = tag.toLowerCase().includes('sandwich') ? 'sandwiches' : tag.toLowerCase();
  const defaultColors = { bg: '#fafafa', border: '#f1f5f9', text: '#64748b' };
  const palette = colorsMap[normalizedTag] || defaultColors;

  if (isDarkMode) {
    return {
      bg: isActive ? 'rgba(234, 88, 12, 0.2)' : '#1c1c1e',
      border: isActive ? '#ea580c' : '#27272a',
      text: isActive ? '#f97316' : '#a1a1aa',
    };
  } else {
    return {
      bg: isActive ? '#fff7ed' : palette.bg,
      border: isActive ? '#ea580c' : palette.border,
      text: isActive ? '#ea580c' : '#334155',
    };
  }
};

export default function CafeScreen() {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { getItemQuantity, addItem, updateQuantity, getTotalItems, getSubtotal } = useCart();
  const cafeOpen = useUIStore((s) => s.cafeOpen);
  const assignedStoreId = useUIStore((s) => s.assignedStoreId);
  const params = useLocalSearchParams<{ category?: string }>();

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isScreenTransitioning, setIsScreenTransitioning] = useState<boolean>(true);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsScreenTransitioning(false);
    });
    return () => task.cancel();
  }, []);

  const [showFloatingMenuBtn, setShowFloatingMenuBtn] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const horizontalTabsRef = useRef<ScrollView>(null);
  const stickyHorizontalTabsRef = useRef<ScrollView>(null);
  const isProgrammaticScrollRef = useRef(false);
  const [sectionOffsets, setSectionOffsets] = useState<Record<string, number>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Reanimated layout tracking for gliding tab indicator
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const indicatorLeft = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const hasLayouts = useSharedValue(0);

  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);

  const headerAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 50],
      [0, -48],
      'clamp'
    );
    return {
      transform: [{ translateY }],
    };
  });

  const topRowAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 40],
      [1, 0],
      'clamp'
    );
    const scale = interpolate(
      scrollY.value,
      [0, 40],
      [1, 0.95],
      'clamp'
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  const stickyBarAnimatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [140, 160],
      [0, 1],
      'clamp'
    );
    return {
      opacity,
    };
  });

  useEffect(() => {
    const layoutKeys = Object.keys(tabLayouts);
    if (layoutKeys.length > 0) {
      hasLayouts.value = 1;
    } else {
      hasLayouts.value = 0;
    }
    if (activeCategory && tabLayouts[activeCategory]) {
      const layout = tabLayouts[activeCategory];
      indicatorLeft.value = withSpring(layout.x, { damping: 15, stiffness: 120 });
      indicatorWidth.value = withSpring(layout.width, { damping: 15, stiffness: 120 });
    }
  }, [activeCategory, tabLayouts]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: indicatorLeft.value,
    width: indicatorWidth.value,
    height: 32,
    top: 10,
    borderRadius: 16,
    backgroundColor: '#e11d48',
    zIndex: 0,
    opacity: hasLayouts.value,
  }));

  // Query Cafe Products from Server
  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ['cafe-products', assignedStoreId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?category=cafe&limit=500${assignedStoreId ? `&storeId=${assignedStoreId}` : ''}`);
      if (!response.ok) throw new Error('API Failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    staleTime: 1000 * 60 * 5, // 5 min cache for instant loading
  });

  // Check if item is non-veg
  const getIsNonVeg = (item: any) => {
    const tagsLower = item.tags?.map((t: string) => t.toLowerCase()) || [];
    const nameLower = (item.name || item.slug || '').toLowerCase();
    return (
      tagsLower.includes('nonveg') || 
      tagsLower.includes('non-veg') || 
      tagsLower.includes('chicken') || 
      tagsLower.includes('egg') ||
      nameLower.includes('chicken') ||
      nameLower.includes('egg')
    );
  };

  // Helper to get premium fallback backgrounds and emojis for cafe items
  const getFallbackBgAndEmoji = (prod: any) => {
    const tagsLower = prod.tags?.map((t: string) => t.toLowerCase()) || [];
    const nameLower = (prod.name || prod.slug || '').toLowerCase();
    
    if (tagsLower.includes('cold-coffee') || tagsLower.includes('shakes') || nameLower.includes('coffee') || nameLower.includes('shake')) {
      return { bg: 'bg-amber-50/70', emoji: '🧋' };
    }
    if (tagsLower.includes('mocktails') || nameLower.includes('mojito') || nameLower.includes('lagoon')) {
      return { bg: 'bg-cyan-50/70', emoji: '🍹' };
    }
    if (tagsLower.includes('pizza') || nameLower.includes('pizza')) {
      return { bg: 'bg-orange-50/70', emoji: '🍕' };
    }
    if (tagsLower.includes('burgers') || nameLower.includes('burger')) {
      return { bg: 'bg-yellow-50/70', emoji: '🍔' };
    }
    if (tagsLower.includes('chinese') || nameLower.includes('noodles') || nameLower.includes('manchurian')) {
      return { bg: 'bg-orange-100/40', emoji: '🥢' };
    }
    return { bg: 'bg-rose-50/70', emoji: '🥪' };
  };

  // Filter products based on Veg-Only toggle & Search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.isAvailable === false) return false;
      // 1. Veg filter
      if (vegOnly && getIsNonVeg(p)) return false;

      // 2. Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          p.name?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.tags?.some((t: string) => t.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [products, vegOnly, searchQuery]);

  // Group filtered products into sections using matchTags
  const categorySections = useMemo(() => {
    const PREDEFINED_CATEGORIES = DEFAULT_CAFE_MENU_SECTIONS;
    
    // Grouping map
    const sectionsMap = new Map<string, any>();
    PREDEFINED_CATEGORIES.forEach((cat) => {
      sectionsMap.set(cat.tag, {
        tag: cat.tag,
        title: cat.title,
        emoji: cat.emoji,
        description: cat.description,
        products: [],
        matchedIds: new Set<string>()
      });
    });

    const assignedIds = new Set<string>();

    // Step 1: Assign to predefined categories based on matchTags
    filteredProducts.forEach((product) => {
      for (const cat of PREDEFINED_CATEGORIES) {
        const hasMatch = product.tags?.some((t: string) => 
          cat.matchTags.includes(t.toLowerCase())
        ) || (cat.tag === 'bakery' && ['croissant-butter', 'muffin-chocolate'].includes(product.slug));

        if (hasMatch) {
          const sec = sectionsMap.get(cat.tag);
          if (sec && !sec.matchedIds.has(product.id)) {
            sec.products.push(product);
            sec.matchedIds.add(product.id);
            assignedIds.add(product.id);
          }
        }
      }
    });

    // Step 2: Unassigned products with general tags -> dynamic categories
    const excludeTags = new Set([
      'cafe', 'popular', 'veg', 'paneer', 'cheese', 'spicy', 'protein', 
      'breakfast', 'essential', 'cooking', 'staple', 'premium', 'garnish', 'salad'
    ]);

    const dynamicTagsMap = new Map<string, any[]>();
    filteredProducts.forEach((product) => {
      if (assignedIds.has(product.id)) return;

      product.tags?.forEach((t: string) => {
        const lowerTag = t.toLowerCase();
        if (excludeTags.has(lowerTag)) return;

        if (!dynamicTagsMap.has(lowerTag)) {
          dynamicTagsMap.set(lowerTag, []);
        }
        dynamicTagsMap.get(lowerTag)?.push(product);
      });
    });

    const dynamicSections: any[] = [];
    dynamicTagsMap.forEach((prods, tag) => {
      const title = tag
        .split(/[-_ ]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      dynamicSections.push({
        tag,
        title,
        emoji: '✨',
        description: `Fresh items tagged under ${title}`,
        products: prods
      });
    });

    // Step 3: Compile final populated categories
    const finalSections: any[] = [];
    PREDEFINED_CATEGORIES.forEach((cat) => {
      const sec = sectionsMap.get(cat.tag);
      if (sec && sec.products.length > 0) {
        finalSections.push({
          tag: sec.tag,
          title: sec.title,
          emoji: sec.emoji,
          description: sec.description,
          products: sec.products
        });
      }
    });

    finalSections.push(...dynamicSections);

    // Group any remaining leftovers
    const allGroupedIds = new Set<string>();
    finalSections.forEach((sec) => sec.products.forEach((p: any) => allGroupedIds.add(p.id)));
    const moreItems = filteredProducts.filter((p) => !allGroupedIds.has(p.id));

    return {
      sections: finalSections,
      moreItems
    };
  }, [filteredProducts]);

  // Combined menu list for quick tabs
  const menuCategories = useMemo(() => {
    const list = categorySections.sections.map((sec) => ({
      tag: sec.tag,
      title: sec.title,
      emoji: sec.emoji,
      count: sec.products.length
    }));
    if (categorySections.moreItems.length > 0) {
      list.push({
        tag: 'more',
        title: 'More Specials',
        emoji: '🍽️',
        count: categorySections.moreItems.length
      });
    }
    return list;
  }, [categorySections]);

  // Set default active tab on load or product changes
  useEffect(() => {
    if (menuCategories.length > 0 && !activeCategory) {
      if (params.category && menuCategories.some((c) => c.tag === params.category)) {
        setActiveCategory(params.category);
      } else {
        setActiveCategory(menuCategories[0].tag);
      }
    }
  }, [menuCategories, params.category]);

  // Scroll to category on initial load when section offsets are populated
  useEffect(() => {
    if (params.category && sectionOffsets[params.category] !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: sectionOffsets[params.category] - (insets.top > 0 ? insets.top + 152 : 156), animated: true });
    }
  }, [params.category, sectionOffsets]);

  useEffect(() => {
    if (activeCategory) {
      const activeIdx = menuCategories.findIndex((c) => c.tag === activeCategory);
      if (activeIdx !== -1) {
        // 1. Scroll main category strip (explore by category)
        if (horizontalTabsRef.current) {
          const tabWidth = 116; // card width (104) + margin (12)
          const targetX = Math.max(0, (activeIdx * tabWidth) - (width / 2) + (tabWidth / 2));
          horizontalTabsRef.current.scrollTo({ x: targetX, animated: true });
        }
        // 2. Scroll top sticky horizontal tabs automatically
        if (stickyHorizontalTabsRef.current) {
          const pillWidth = 135; // average width of text pill tabs
          const targetX = Math.max(0, (activeIdx * pillWidth) - (width / 2) + (pillWidth / 2));
          stickyHorizontalTabsRef.current.scrollTo({ x: targetX, animated: true });
        }
      }
    }
  }, [activeCategory, menuCategories]);

  // Track scrolling coordinates to update active category highlighting in vertical sidebar
  const handleScroll = (event: any) => {
    const scrollYVal = event.nativeEvent.contentOffset.y;
    scrollY.value = scrollYVal;

    // Update isCollapsed state
    if (scrollYVal > 40 && !isCollapsed) {
      setIsCollapsed(true);
    } else if (scrollYVal <= 40 && isCollapsed) {
      setIsCollapsed(false);
    }

    // Update showStickyBar state
    if (scrollYVal > 130 && !showStickyBar) {
      setShowStickyBar(true);
    } else if (scrollYVal <= 130 && showStickyBar) {
      setShowStickyBar(false);
    }

    if (isProgrammaticScrollRef.current) return;

    let currentActive = '';
    const buffer = 40; // buffer for natural scroll alignment
    const paddingTop = insets.top > 0 ? insets.top + 152 : 156;

    for (const cat of menuCategories) {
      const top = sectionOffsets[cat.tag];
      if (top !== undefined && scrollYVal >= (top - paddingTop - buffer)) {
        currentActive = cat.tag;
      }
    }

    if (currentActive && currentActive !== activeCategory) {
      setActiveCategory(currentActive);
    }
  };

  // Scroll to measured section
  const scrollToCategory = (tag: string) => {
    const offset = sectionOffsets[tag];
    if (offset !== undefined && scrollViewRef.current) {
      isProgrammaticScrollRef.current = true;
      setActiveCategory(tag);
      const paddingTop = insets.top > 0 ? insets.top + 104 : 108; // align under collapsed header
      scrollViewRef.current.scrollTo({ y: offset - paddingTop, animated: true });
      triggerHaptic('light');
      
      // Release programmatic scroll flag after animation completes
      setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 500);
    }
  };

  const cartItemCount = getTotalItems();
  const cartSubtotal = getSubtotal();
  const selectedLocation = useUIStore((s) => s.selectedLocation);

  const activeCategoryObj = useMemo(() => {
    return menuCategories.find(c => c.tag === activeCategory) || menuCategories[0];
  }, [menuCategories, activeCategory]);

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950 relative">
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* 1. Redesigned Sticky Header (Row 1, Row 2, Row 3) */}
      <Animated.View
        style={[
          headerAnimatedStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 20,
            paddingHorizontal: 16,
            paddingTop: insets.top > 0 ? insets.top + 5 : 8,
            paddingBottom: 8,
            backgroundColor: isDarkMode ? 'rgba(9,9,11,0.95)' : 'rgba(255,255,255,0.95)',
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDarkMode ? 0.2 : 0.03,
                shadowRadius: 8,
              },
              android: {
                elevation: 2,
              },
              web: {
                // @ts-ignore
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
              },
            }),
          }
        ]}
      >
        {/* Row 1: Brand Info & Location */}
        <Animated.View 
          pointerEvents={isCollapsed ? 'none' : 'auto'}
          style={[
            topRowAnimatedStyle,
            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, width: '100%' }
          ]}
        >
          {/* Left: Brand Logo & Text */}
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }} 
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }]
            })}
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
          </Pressable>
 
          {/* Right: Location Capsule Picker */}
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              router.push('/location-picker');
            }} 
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              maxWidth: '60%'
            })}
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
          </Pressable>
        </Animated.View>
 
        {/* Store Switcher Tab Pills - Inline (Cafe Active) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 10 }}>
          {/* Grocery Pill (Inactive) */}
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: 38,
              borderRadius: 19,
              paddingHorizontal: 12,
              borderWidth: 1.5,
              backgroundColor: '#ffffff',
              borderColor: '#fecdd3',
              marginRight: 8,
              elevation: 1,
            }}
          >
            <ShoppingBag size={14} color="#e20a22" strokeWidth={2.5} style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 12.5, fontWeight: '900', letterSpacing: 0.2, color: '#e20a22' }}>
              Grocery
            </Text>
          </Pressable>

          {/* Café Pill (Active) */}
          <Pressable
            onPress={() => {
              triggerHaptic('light');
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: 38,
              borderRadius: 19,
              paddingHorizontal: 12,
              borderWidth: 1.5,
              backgroundColor: '#ea580c',
              borderColor: '#ea580c',
              elevation: 1,
            }}
          >
            <Coffee size={14} color="#ffffff" strokeWidth={2.5} style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 12.5, fontWeight: '900', letterSpacing: 0.2, color: '#ffffff' }}>
              Café
            </Text>
          </Pressable>
        </View>

        {/* Row 3: Real Search Box */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
            borderWidth: 1,
            borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
            borderRadius: 22,
            paddingHorizontal: 16,
            height: 44,
            width: '100%',
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
          }}
        >
          <Search size={16} color="#e20a22" style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Search Cafe Menu..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: '600',
              color: isDarkMode ? '#f4f4f5' : '#1e293b',
              padding: 0
            }}
          />
          {searchQuery.length > 0 && (
            <Pressable 
              onPress={() => {
                triggerHaptic('light');
                setSearchQuery('');
              }}
              style={{ padding: 4 }}
            >
              <X size={16} color={isDarkMode ? '#94a3b8' : '#64748b'} />
            </Pressable>
          )}
          
          {/* Vertical Divider */}
          <View style={{ width: 1, height: 16, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', marginHorizontal: 10 }} />
          
          <Mic size={16} color="#16a34a" />
        </View>

        {/* Glassmorphic border underline line */}
        <LinearGradient
          colors={isDarkMode 
            ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.08)'] 
            : ['rgba(226,232,240,0.8)', 'rgba(226,232,240,0.2)', 'rgba(226,232,240,0.8)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 1.2, width: '100%', position: 'absolute', bottom: 0, left: 0, right: 0 }}
        />
      </Animated.View>

      {/* Sticky Categories Selector (fades in when scrolling past carousel) */}
      {menuCategories.length > 0 && (
        <Animated.View
          pointerEvents={showStickyBar ? 'auto' : 'none'}
          style={[
            stickyBarAnimatedStyle,
            {
              position: 'absolute',
              top: insets.top > 0 ? insets.top + 104 : 108,
              left: 0,
              right: 0,
              zIndex: 15,
              backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
              borderBottomWidth: 1,
              borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
              paddingVertical: 8,
              ...Platform.select<any>({
                ios: {
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDarkMode ? 0.2 : 0.03,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 2,
                },
              })
            }
          ]}
        >
          <ScrollView
            ref={stickyHorizontalTabsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12 }}
          >
            {menuCategories.map((cat) => {
              const isActive = activeCategory === cat.tag;
              
              return (
                <Pressable
                  key={cat.tag}
                  onPress={() => scrollToCategory(cat.tag)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    marginRight: 8,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: isActive ? '#ea580c' : (isDarkMode ? '#27272a' : '#e2e8f0'),
                    backgroundColor: isActive 
                      ? (isDarkMode ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed') 
                      : (isDarkMode ? '#1c1c1e' : '#f8fafc'),
                  }}
                >
                  <Text style={{ fontSize: 13, marginRight: 4 }}>{cat.emoji}</Text>
                  <Text 
                    style={{
                      fontSize: 10,
                      fontWeight: '900',
                      color: isActive ? '#ea580c' : (isDarkMode ? '#a1a1aa' : '#475569'),
                    }}
                  >
                    {cat.title}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}

      {(isLoading || isScreenTransitioning) ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: isDarkMode ? '#09090b' : '#fafafa' }}
          contentContainerStyle={{ 
            paddingTop: insets.top > 0 ? insets.top + 172 : 176, 
            paddingBottom: 140 
          }}
        >
          {/* Promo Banner Shimmer */}
          <SkeletonShimmer height={128} borderRadius={16} style={{ marginHorizontal: 12, marginTop: 12, marginBottom: 20 }} />
          
          {/* Category Grid Shimmer */}
          <View style={{ paddingHorizontal: 12, marginBottom: 24, gap: 12 }}>
            <SkeletonShimmer width={180} height={18} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {[1, 2, 3, 4].map((i) => (
                <SkeletonShimmer key={i} width={64} height={80} borderRadius={12} />
              ))}
            </View>
          </View>
          
          {/* Section Shimmer */}
          <CafeRowSkeleton />
          <CafeRowSkeleton />
        </ScrollView>
      ) : filteredProducts.length === 0 ? (
        <View className="flex-1 justify-center items-center p-8 bg-white dark:bg-zinc-950">
          <Text className="text-5xl">🥪</Text>
          <Text className="text-slate-800 dark:text-zinc-200 font-black text-base mt-4">No café specials found</Text>
          <Text className="text-slate-400 dark:text-zinc-400 text-xs mt-1 text-center">
            {searchQuery ? `No matches found for "${searchQuery}"` : "Check back later or try clearing filters."}
          </Text>
        </View>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: isDarkMode ? '#09090b' : '#fafafa' }}
          contentContainerStyle={{ 
            paddingTop: insets.top > 0 ? insets.top + 172 : 176, 
            paddingBottom: 140 
          }}
          nestedScrollEnabled={true}
        >
          {/* 2.1 Premium Cafe Sliding Promotions */}
          <CafePromoCarousel />

          {/* 2.2 Explore by category 💜 */}
          {menuCategories.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              {/* Header Title */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, paddingHorizontal: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: isDarkMode ? '#f4f4f5' : '#1e293b', letterSpacing: -0.15 }}>
                  Explore by category 💜
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 6 }}
              >
                {menuCategories.map((cat) => {
                  const isActive = activeCategory === cat.tag;
                  const imgUrl = CATEGORY_SIDEBAR_IMAGES[cat.tag] || '';
                  const themeColor = getCategoryThemeColor(cat.tag);
                  
                  return (
                    <Pressable
                      key={cat.tag}
                      onPress={() => scrollToCategory(cat.tag)}
                      style={{
                        width: 104,
                        height: 156,
                        marginRight: 12,
                        borderRadius: 24,
                        borderWidth: isActive ? 2 : 1,
                        borderColor: isActive ? themeColor : (isDarkMode ? '#27272a' : '#f1f5f9'),
                        backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
                        alignItems: 'center',
                        paddingTop: 12,
                        paddingBottom: 8,
                        justifyContent: 'space-between',
                        ...Platform.select<any>({
                          ios: {
                            shadowColor: isActive ? themeColor : '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: isActive ? 0.15 : 0.03,
                            shadowRadius: 6,
                          },
                          android: {
                            elevation: isActive ? 3 : 1,
                          },
                        })
                      }}
                    >
                      {/* Circular Image Container with Overlaid Badge */}
                      <View style={{ width: 62, height: 62, position: 'relative', alignItems: 'center' }}>
                        <View style={{
                          width: 62,
                          height: 62,
                          borderRadius: 31,
                          overflow: 'hidden',
                          backgroundColor: isDarkMode ? '#27272a' : '#f8fafc',
                          borderWidth: 1.5,
                          borderColor: themeColor,
                        }}>
                          {imgUrl && !imageErrors[cat.tag] ? (
                            <ExpoImage
                              source={{ uri: imgUrl }}
                              contentFit="cover"
                              style={{ width: '100%', height: '100%' }}
                              onError={() => setImageErrors(prev => ({ ...prev, [cat.tag]: true }))}
                              transition={200}
                              cachePolicy="memory-disk"
                              placeholder={isDarkMode ? "rgba(39,39,42,0.4)" : "rgba(241,245,249,0.6)"}
                            />
                          ) : (
                            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                              <Text style={{ fontSize: 24 }}>🍽️</Text>
                            </View>
                          )}
                        </View>

                        {/* Overlaid Badge under the circle */}
                        <View style={{
                          position: 'absolute',
                          bottom: -6,
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          backgroundColor: themeColor,
                          justifyContent: 'center',
                          alignItems: 'center',
                          borderWidth: 1.5,
                          borderColor: isDarkMode ? '#1c1c1e' : '#ffffff',
                          zIndex: 10,
                        }}>
                          <Text style={{ fontSize: 9, color: '#ffffff' }}>{cat.emoji}</Text>
                        </View>
                      </View>
                      
                      {/* Title */}
                      <Text 
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: isDarkMode ? '#f4f4f5' : '#1e293b',
                          textAlign: 'center',
                          paddingHorizontal: 8,
                          lineHeight: 12,
                          marginTop: 10,
                        }}
                        numberOfLines={2}
                      >
                        {cat.title}
                      </Text>

                      {/* Small horizontal dash indicator at the bottom */}
                      <View style={{
                        width: 18,
                        height: 3,
                        borderRadius: 1.5,
                        backgroundColor: isActive ? themeColor : 'transparent',
                        marginTop: 4,
                      }} />
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 2.3 Veg Only Toggle */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginHorizontal: 12, marginBottom: 16 }}>
            <Pressable 
              onPress={() => {
                setVegOnly(!vegOnly);
                triggerHaptic('light');
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: vegOnly ? '#10b981' : (isDarkMode ? '#27272a' : '#e2e8f0'),
                backgroundColor: vegOnly ? (isDarkMode ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : 'transparent'
              }}
            >
              <View style={{
                width: 10,
                height: 10,
                borderWidth: 1,
                borderColor: vegOnly ? '#059669' : (isDarkMode ? '#52525b' : '#94a3b8'),
                backgroundColor: vegOnly ? '#10b981' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 2
              }}>
                {vegOnly && <Check size={7} color="#ffffff" strokeWidth={4} />}
              </View>
              <Text style={{ fontSize: 8.5, fontWeight: '900', color: vegOnly ? '#059669' : (isDarkMode ? '#a1a1aa' : '#64748b'), textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Veg Only
              </Text>
            </Pressable>
          </View>

          {/* 2.4 Render Grouped Category Sections */}
          {categorySections.sections.map((section) => (
            <View 
              key={section.tag}
              onLayout={(e) => {
                const y = e.nativeEvent.layout.y;
                setSectionOffsets(prev => ({ ...prev, [section.tag]: y }));
              }}
              style={{ marginBottom: 24 }}
            >
              {/* Category Section Header matching mockup */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>{section.emoji}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isDarkMode ? '#f4f4f5' : '#1e293b', letterSpacing: -0.15 }}>
                    {section.title}
                  </Text>
                </View>
              </View>

              {/* 2-Column Product Grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 12 }}>
                {section.products.map((product: any, idx: number) => (
                  <ProductCard key={product.id} product={product} className="w-[48%] mb-4" index={idx} isCafeStyle={true} />
                ))}
              </View>
            </View>
          ))}

          {/* 2.5 Catch-all More Specials */}
          {categorySections.moreItems.length > 0 && (
            <View 
              onLayout={(e) => {
                const y = e.nativeEvent.layout.y;
                setSectionOffsets(prev => ({ ...prev, more: y }));
              }}
              style={{ marginBottom: 24 }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingHorizontal: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>🍽️</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isDarkMode ? '#f4f4f5' : '#1e293b', letterSpacing: -0.15 }}>
                    More Specials
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 12 }}>
                {categorySections.moreItems.map((product: any, idx: number) => (
                  <ProductCard key={product.id} product={product} className="w-[48%] mb-4" index={idx} isCafeStyle={true} />
                ))}
              </View>
            </View>
          )}

        </ScrollView>
      )}

      {/* 3. Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={8} />
    </View>
  );
}
