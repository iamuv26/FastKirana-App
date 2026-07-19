import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Dimensions, Animated as RNAnimated, Platform, Image as RNImage, InteractionManager, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeIn, FadeInDown, interpolate, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, ShoppingBag, Menu, X, Plus, Minus, Check, ChevronRight, MapPin, ChevronDown, Sun, Moon, Mic, Coffee, Utensils, ChefHat, Sparkles } from 'lucide-react-native';
import { useCart } from '../hooks/use-cart';
import { useUIStore } from '../stores/ui-store';
import { formatPrice, formatHeaderAddress, getAppImageSource } from '../lib/utils';
import { DEFAULT_CAFE_MENU_SECTIONS, DEFAULT_RESTAURANT_MENU_SECTIONS, API_BASE_URL } from '../lib/constants';
import { triggerHaptic } from '../lib/haptic';
import { toast } from '../lib/toast';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import ProductCard from '../components/product/ProductCard';
import ProductCardSkeleton from '../components/product/ProductCardSkeleton';
import FloatingCartBar from '../components/shared/FloatingCartBar';
import { SkeletonShimmer } from '../components/shared/SkeletonShimmer';
import { useTheme } from './context/ThemeContext';
import { ScalePressable } from '../components/shared/ScalePressable';
import Logo from '../components/shared/Logo';
import StoreSelectorHeader from '../components/shared/StoreSelectorHeader';
import CafePromoCarousel from '../components/shared/CafePromoCarousel';
import { THEME } from '../lib/theme';


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
  'beverages': 'https://www.fastkirana.in/cafe_cold_drinks_category.png',
  'drinks': 'https://www.fastkirana.in/cafe_cold_drinks_category.png',
  'cafe-bakery': 'https://www.fastkirana.in/bakery_biscuits_category.webp',
  'pizza': 'https://www.fastkirana.in/cafe_pizza_category.png',
  'burgers': 'https://www.fastkirana.in/cafe_burgers_category.png',
  'garlic-bread': 'https://www.fastkirana.in/cafe_garlic_bread_category.png',
  'desserts': 'https://www.fastkirana.in/ice_cream_category.png',
  'north-indian': 'https://www.fastkirana.in/cafe_south_indian_category.png',
  'biryani-rice': 'https://www.fastkirana.in/cafe_rice_category.png',
  'bakery': 'https://www.fastkirana.in/bakery_biscuits_category.webp',
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
    'cafe-bakery': '#d97706', // Amber
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
  return (
    <View style={{ marginBottom: 24, paddingHorizontal: 12 }}>
      {/* Section Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <SkeletonShimmer width={20} height={20} borderRadius={10} />
        <SkeletonShimmer width={120} height={16} />
      </View>
      
      {/* Horizontal Scroll Track Skeletons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={{ width: 156, height: 268 }}>
            <ProductCardSkeleton style={{ width: '100%', height: '100%' }} />
          </View>
        ))}
      </ScrollView>
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
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [searchVal, setSearchVal] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchVal]);

  const [isScreenTransitioning, setIsScreenTransitioning] = useState<boolean>(true);
  const [experienceMode, setExperienceMode] = useState<'cafe' | 'restaurant'>('cafe');
  const [displayMode, setDisplayMode] = useState<'cafe' | 'restaurant'>('cafe');
  const contentOpacity = useSharedValue(1);
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  const handleExperienceSwitch = (mode: 'cafe' | 'restaurant') => {
    if (mode === experienceMode) return;
    setExperienceMode(mode);
    
    contentOpacity.value = withTiming(0, { duration: 150 });
    setTimeout(() => {
      setDisplayMode(mode);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      contentOpacity.value = withTiming(1, { duration: 250 });
    }, 160);
  };
  const isNotified = false; // Resolved isNotified unused placeholder check

  const pulseAnim = useSharedValue(1);
  useEffect(() => {
    pulseAnim.value = withRepeat(
      withTiming(1.3, { duration: 1500 }),
      -1,
      true
    );
  }, []);
  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
    opacity: interpolate(pulseAnim.value, [1, 1.3], [0.6, 0])
  }));

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setIsScreenTransitioning(false);
    });
    return () => task.cancel();
  }, []);

  const [showFloatingMenuBtn, setShowFloatingMenuBtn] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const scrollViewRef = useRef<any>(null);
  const horizontalTabsRef = useRef<ScrollView>(null);
  const stickyHorizontalTabsRef = useRef<ScrollView>(null);
  const isProgrammaticScrollRef = useRef(false);
  const [sectionOffsets, setSectionOffsets] = useState<Record<string, number>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Tab segmented control animated values
  const [localActiveSegment, setLocalActiveSegment] = useState<'grocery' | 'food'>('food');
  const tabIndicatorTranslateX = useSharedValue(1);

  const slidingIndicatorStyle = useAnimatedStyle(() => {
    const translationX = interpolate(
      tabIndicatorTranslateX.value,
      [0, 1],
      [0, (width - 36) / 2]
    );
    return {
      transform: [{ translateX: translationX }],
    };
  });

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
    queryKey: ['cafe-products', assignedStoreId, displayMode],
    queryFn: async () => {
      const categoryQuery = displayMode === 'restaurant' ? 'restaurant' : 'cafe,ice-cream,beverages';
      const response = await fetch(`${API_BASE_URL}/products?category=${categoryQuery}&limit=500`);
      if (!response.ok) throw new Error('API Failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    staleTime: 0, // Fresh fetch on every mount
  });

  // Prefetch cafe products images in the background to speed up image loading
  useEffect(() => {
    if (products && products.length > 0) {
      const urls = products
        .map((p) => (p.imageUrl ? getAppImageSource(p.imageUrl)?.uri : null))
        .filter((url): url is string => !!url)
        .slice(0, 45); // Prefetch first 45 cafe product images
      if (urls.length > 0) {
        ExpoImage.prefetch(urls);
      }
    }
  }, [products]);

  // Query Store Settings from Server to get real categories configuration
  const { data: settingsMap = {} } = useQuery<Record<string, string>>({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      return await response.json();
    },
    staleTime: 60000,
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
    const customSectionsStr = displayMode === 'restaurant'
      ? (settingsMap.restaurant_menu_sections || settingsMap.RESTAURANT_MENU_SECTIONS)
      : (settingsMap.cafe_menu_sections || settingsMap.CAFE_MENU_SECTIONS);

    let parsedSections = null;
    if (customSectionsStr) {
      try {
        const parsed = JSON.parse(customSectionsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedSections = parsed;
        }
      } catch (e) {
        console.warn('Failed to parse custom menu sections from settings:', e);
      }
    }

    const rawCategories = parsedSections || (displayMode === 'restaurant' ? DEFAULT_RESTAURANT_MENU_SECTIONS : DEFAULT_CAFE_MENU_SECTIONS);
    const PREDEFINED_CATEGORIES = rawCategories.filter((cat: any) => !cat.disabled);
    
    // Grouping map
    const sectionsMap = new Map<string, any>();
    PREDEFINED_CATEGORIES.forEach((cat) => {
      sectionsMap.set(cat.tag, {
        tag: cat.tag,
        title: cat.title,
        emoji: cat.emoji || '🍽️',
        description: cat.description || '',
        imageUrl: cat.imageUrl || cat.image,
        image: cat.imageUrl || cat.image,
        products: [],
        matchedIds: new Set<string>()
      });
    });

    const assignedIds = new Set<string>();

    // Step 1: Assign to predefined categories based on matchTags
    filteredProducts.forEach((product) => {
      for (const cat of PREDEFINED_CATEGORIES) {
        const hasMatch = product.tags?.some((t: string) => 
          cat.matchTags?.map((mt: string) => mt.toLowerCase()).includes(t.toLowerCase())
        ) || (cat.tag === 'cafe-bakery' && ['croissant-butter', 'muffin-chocolate'].includes(product.slug));

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
          imageUrl: sec.imageUrl || sec.image,
          image: sec.imageUrl || sec.image,
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
  }, [filteredProducts, settingsMap, displayMode]);

  // Combined menu list for quick tabs
  const menuCategories = useMemo(() => {
    const list = categorySections.sections.map((sec) => ({
      tag: sec.tag,
      title: sec.title,
      emoji: sec.emoji,
      count: sec.products.length,
      imageUrl: sec.imageUrl || sec.image,
      image: sec.imageUrl || sec.image,
    }));
    if (categorySections.moreItems.length > 0) {
      list.push({
        tag: 'more',
        title: 'More Specials',
        emoji: '🍽️',
        count: categorySections.moreItems.length,
        imageUrl: undefined,
        image: undefined
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
          const layout = tabLayouts[activeCategory];
          if (layout) {
            const targetX = Math.max(0, layout.x - (width / 2) + (layout.width / 2));
            stickyHorizontalTabsRef.current.scrollTo({ x: targetX, animated: true });
          }
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
          <ScalePressable 
            onPress={() => {
              router.back();
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
        </Animated.View>
 
        {/* Store Switcher Tab Pills - Segmented Control */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          width: '100%',
          height: 36,
          borderRadius: 18,
          borderWidth: 1,
          borderColor: isDarkMode ? '#27272a' : '#fed7aa',
          backgroundColor: isDarkMode ? '#18181b' : '#f8fafc',
          padding: 2,
          marginVertical: 6,
          position: 'relative',
        }}>
          {/* Sliding highlight indicator pill */}
          <Animated.View style={[
            slidingIndicatorStyle,
            {
              position: 'absolute',
              left: 2,
              top: 2,
              width: '50%',
              height: 30,
              borderRadius: 15,
              backgroundColor: '#ea580c',
              elevation: 1.5,
              shadowColor: '#ea580c',
              shadowOffset: { width: 0, height: 1.5 },
              shadowOpacity: 0.18,
              shadowRadius: 2.5,
            }
          ]} />

          {/* Grocery Segment */}
          <ScalePressable
            onPress={() => {
              triggerHaptic('light');
              setLocalActiveSegment('grocery');
              tabIndicatorTranslateX.value = withSpring(0, { damping: 18, stiffness: 160 });
              setTimeout(() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)');
                }
              }, 120);
            }}
            scaleValue={0.97}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              borderRadius: 16,
              backgroundColor: 'transparent',
            }}
          >
            <ShoppingBag size={12} color={localActiveSegment === 'grocery' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#64748b')} strokeWidth={2.5} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11.5, fontWeight: '900', letterSpacing: 0.3, color: localActiveSegment === 'grocery' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#64748b'), textTransform: 'uppercase' }}>
              Grocery
            </Text>
          </ScalePressable>

          {/* Food Segment */}
          <ScalePressable
            onPress={() => {}}
            scaleValue={0.97}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              borderRadius: 16,
              backgroundColor: 'transparent',
            }}
          >
            <Utensils size={12} color={localActiveSegment === 'food' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#64748b')} strokeWidth={2.5} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11.5, fontWeight: '900', letterSpacing: 0.3, color: localActiveSegment === 'food' ? '#ffffff' : (isDarkMode ? '#94a3b8' : '#64748b'), textTransform: 'uppercase' }}>
              Food
            </Text>
          </ScalePressable>
        </View>

        {/* Row 3: Real Search Box */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
            borderWidth: 1,
            borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
            borderRadius: 19,
            paddingHorizontal: 16,
            height: 38,
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
            placeholder="Search Food Menu..."
            placeholderTextColor="#94a3b8"
            value={searchVal}
            onChangeText={setSearchVal}
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: '600',
              color: isDarkMode ? '#f4f4f5' : '#1e293b',
              padding: 0
            }}
          />
          {searchVal.length > 0 && (
            <ScalePressable 
              onPress={() => {
                setSearchVal('');
                setSearchQuery('');
              }}
              scaleValue={0.9}
              hitSlop={12}
              style={{ padding: 4 }}
            >
              <X size={16} color={isDarkMode ? '#94a3b8' : '#64748b'} />
            </ScalePressable>
          )}
          
          {/* Vertical Divider */}
          <View style={{ width: 1, height: 16, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', marginHorizontal: 10 }} />
          
          <Mic size={16} color="#e20a22" />
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
              top: insets.top > 0 ? insets.top + 90 : 94,
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
                <ScalePressable
                  key={cat.tag}
                  onLayout={(e) => {
                    const { x, width } = e.nativeEvent.layout;
                    setTabLayouts(prev => ({ ...prev, [cat.tag]: { x, width } }));
                  }}
                  onPress={() => scrollToCategory(cat.tag)}
                  scaleValue={0.95}
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
                </ScalePressable>
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
            paddingTop: insets.top > 0 ? insets.top + 144 : 148, 
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
          <Text className="text-slate-800 dark:text-zinc-200 font-black text-base mt-4">No food specials found</Text>
          <Text className="text-slate-400 dark:text-zinc-400 text-xs mt-1 text-center">
            {searchQuery ? `No matches found for "${searchQuery}"` : "Check back later or try clearing filters."}
          </Text>
        </View>
      ) : (
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          style={{ flex: 1, backgroundColor: isDarkMode ? '#09090b' : '#fafafa' }}
          contentContainerStyle={{ 
            paddingTop: insets.top > 0 ? insets.top + 144 : 148, 
            paddingBottom: 140 
          }}
          nestedScrollEnabled={true}
          entering={FadeIn.duration(220)}
        >
          <CafePromoCarousel />

          {/* Sub-selector (A.S Cafe vs Wedson Restaurant) */}
          <View style={{
            flexDirection: 'row',
            width: width - 24,
            alignSelf: 'center',
            marginVertical: 12,
            height: 125,
            position: 'relative',
            justifyContent: 'space-between',
          }}>
            {/* Left Card: Cafe */}
            <ScalePressable
              onPress={() => {
                triggerHaptic('medium');
                handleExperienceSwitch('cafe');
              }}
              scaleValue={0.97}
              style={{
                width: '48.5%',
                height: 125,
                borderRadius: 20,
                borderWidth: experienceMode === 'cafe' ? 2 : 1,
                borderColor: experienceMode === 'cafe' ? '#ea580c' : (isDarkMode ? '#27272a' : 'rgba(0,0,0,0.06)'),
                backgroundColor: experienceMode === 'cafe' 
                  ? '#ea580c'
                  : (isDarkMode ? '#1e293b' : '#fdf6ee'),
                elevation: experienceMode === 'cafe' ? 6 : 2,
                shadowColor: '#ea580c',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: experienceMode === 'cafe' ? 0.35 : 0.05,
                shadowRadius: 8,
                overflow: 'hidden',
              }}
            >
              <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                {/* Food Image aligned to the right */}
                <ExpoImage
                  source={require('../assets/as_food_card.webp')}
                  contentFit="cover"
                  style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '58%' }}
                />

                {/* Left-to-Right Gradient Blend masking the food image edges */}
                <LinearGradient
                  colors={
                    experienceMode === 'cafe'
                      ? ['#ea580c', '#ea580c', 'rgba(234, 88, 12, 0.95)', 'transparent']
                      : (isDarkMode 
                          ? ['#1e293b', '#1e293b', 'rgba(30, 41, 59, 0.95)', 'transparent'] 
                          : ['#fdf6ee', '#fdf6ee', 'rgba(253, 246, 238, 0.95)', 'transparent'])
                  }
                  locations={[0, 0.42, 0.52, 0.95]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />

                  <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '65%', justifyContent: 'space-between', zIndex: 10, padding: 14 }}>
                  {/* Icon Badge */}
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: experienceMode === 'cafe' ? '#f97316' : (isDarkMode ? '#27272a' : '#ffedd5'),
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Coffee size={18} color={experienceMode === 'cafe' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#ea580c')} />
                  </View>

                  <View>
                    <Text numberOfLines={2} style={{
                      fontSize: 13.5,
                      fontWeight: '900',
                      color: experienceMode === 'cafe' ? '#ffffff' : (isDarkMode ? '#fafafa' : '#451a03'),
                      letterSpacing: -0.2,
                      lineHeight: 16,
                    }}>
                      A.S Cafe
                    </Text>
                    <Text numberOfLines={2} style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: experienceMode === 'cafe' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#78350f'),
                      marginTop: 3,
                      lineHeight: 12,
                    }}>
                      Noodles, Rolls & More
                    </Text>
                    <View style={{
                      width: 22,
                      height: 2.5,
                      borderRadius: 1,
                      backgroundColor: experienceMode === 'cafe' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#451a03'),
                      marginTop: 8,
                    }} />
                  </View>
                </View>
              </View>
            </ScalePressable>

            {/* Right Card: Restaurant */}
            <ScalePressable
              onPress={() => {
                triggerHaptic('medium');
                handleExperienceSwitch('restaurant');
              }}
              scaleValue={0.97}
              style={{
                width: '48.5%',
                height: 125,
                borderRadius: 20,
                borderWidth: experienceMode === 'restaurant' ? 2 : 1,
                borderColor: experienceMode === 'restaurant' ? '#e20a22' : (isDarkMode ? '#27272a' : 'rgba(0,0,0,0.06)'),
                backgroundColor: experienceMode === 'restaurant' 
                  ? '#e20a22'
                  : (isDarkMode ? '#1e293b' : '#fdf6ee'),
                elevation: experienceMode === 'restaurant' ? 6 : 2,
                shadowColor: '#e20a22',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: experienceMode === 'restaurant' ? 0.25 : 0.05,
                shadowRadius: 8,
                overflow: 'hidden',
              }}
            >
              <View style={{ width: '100%', height: '100%', position: 'relative' }}>
                {/* Food Image aligned to the right */}
                <ExpoImage
                  source={require('../assets/wedson_restaurant_card.webp')}
                  contentFit="cover"
                  style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '58%' }}
                />

                {/* Left-to-Right Gradient Blend masking the food image edges */}
                <LinearGradient
                  colors={
                    experienceMode === 'restaurant'
                      ? ['#e20a22', '#e20a22', 'rgba(226, 10, 34, 0.95)', 'transparent']
                      : (isDarkMode 
                          ? ['#1e293b', '#1e293b', 'rgba(30, 41, 59, 0.95)', 'transparent'] 
                          : ['#fdf6ee', '#fdf6ee', 'rgba(253, 246, 238, 0.95)', 'transparent'])
                  }
                  locations={[0, 0.42, 0.52, 0.95]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />

                {/* Content Container (placed left side over the blend) */}
                <View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '65%', justifyContent: 'space-between', zIndex: 10, padding: 14 }}>
                  {/* Icon Badge */}
                  <View style={{
                    width: 36, height: 36, borderRadius: 18,
                    backgroundColor: experienceMode === 'restaurant' ? '#ef4444' : (isDarkMode ? '#27272a' : '#ffedd5'),
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ChefHat size={18} color={experienceMode === 'restaurant' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#7c2d12')} />
                  </View>

                  <View>
                    <Text numberOfLines={2} style={{
                      fontSize: 13.5,
                      fontWeight: '900',
                      color: experienceMode === 'restaurant' ? '#ffffff' : (isDarkMode ? '#fafafa' : '#451a03'),
                      letterSpacing: -0.2,
                      lineHeight: 16,
                    }}>
                      Wedson Restaurant
                    </Text>
                    <Text numberOfLines={2} style={{
                      fontSize: 10,
                      fontWeight: '700',
                      color: experienceMode === 'restaurant' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#78350f'),
                      marginTop: 3,
                      lineHeight: 12,
                    }}>
                      Paneer Sabji & Meals
                    </Text>
                    <View style={{
                      width: 22,
                      height: 2.5,
                      borderRadius: 1,
                      backgroundColor: experienceMode === 'restaurant' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#451a03'),
                      marginTop: 8,
                    }} />
                  </View>
                </View>
              </View>
            </ScalePressable>
          </View>

          <Animated.View style={contentAnimatedStyle}>
            {displayMode === 'cafe' && !cafeOpen && (
            /* Café Closed Warning Banner */
            <View style={{
              backgroundColor: isDarkMode ? 'rgba(217, 119, 6, 0.1)' : '#fffbeb',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(217, 119, 6, 0.2)' : '#fde68a',
              borderRadius: 16,
              padding: 12,
              marginHorizontal: 12,
              marginTop: 12,
              marginBottom: 4,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
            }}>
              <Text style={{ fontSize: 18 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: isDarkMode ? '#fbbf24' : '#b45309' }}>Food Kitchen is Currently Closed</Text>
                <Text style={{ fontSize: 10, fontWeight: '600', color: isDarkMode ? '#a1a1aa' : '#d97706', marginTop: 2 }}>
                  You can browse the menu, but ordering is disabled right now.
                </Text>
              </View>
            </View>
          )}

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
                  const imgUrl = cat.imageUrl || cat.image || CATEGORY_SIDEBAR_IMAGES[cat.tag] || '';
                  const themeColor = displayMode === 'restaurant' ? '#e20a22' : getCategoryThemeColor(cat.tag);
                  
                  return (
                    <ScalePressable
                      key={cat.tag}
                      onPress={() => scrollToCategory(cat.tag)}
                      scaleValue={0.94}
                      style={{
                        width: 104,
                        height: 156,
                        marginRight: 12,
                        borderRadius: 24,
                        borderWidth: isActive ? 2 : 1,
                        borderColor: isActive ? themeColor : (isDarkMode ? '#27272a' : '#f1f5f9'),
                        backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
                        flexDirection: 'column',
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
                    </ScalePressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* 2.3 Veg Only Toggle */}
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginHorizontal: 12, marginBottom: 16 }}>
            <ScalePressable 
              onPress={() => {
                setVegOnly(!vegOnly);
              }}
              scaleValue={0.95}
              haptic="light"
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
            </ScalePressable>
          </View>

          {/* 2.4 Render Grouped Category Sections */}
          {categorySections.sections.map((section) => {
            const isExpanded = !!expandedCategories[section.tag];
            return (
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

                  {/* See All Button */}
                  <ScalePressable
                    onPress={() => {
                      setExpandedCategories(prev => ({ ...prev, [section.tag]: !prev[section.tag] }));
                    }}
                    scaleValue={0.96}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                  >
                    <Text style={{ color: '#ea580c', fontSize: 11.5, fontWeight: '700' }}>
                      {isExpanded ? 'Show Less' : 'See All'}
                    </Text>
                    <ChevronRight 
                      size={13} 
                      color="#ea580c" 
                      style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}
                    />
                  </ScalePressable>
                </View>

                {/* Conditional Layout: 2-Column Grid when expanded, else Horizontal scroll track */}
                {isExpanded ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 12 }}>
                    {section.products.map((product: any, idx: number) => (
                      <ProductCard key={product.id} product={product} className="w-[47%] mb-4" index={idx} isCafeStyle={true} />
                    ))}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 12, gap: 12, paddingBottom: 6 }}
                    decelerationRate="fast"
                  >
                    {section.products.map((product: any, idx: number) => (
                      <View key={product.id} style={{ width: 156 }}>
                        <ProductCard product={product} className="w-full" index={idx} isCafeStyle={true} />
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            );
          })}

          {/* 2.5 Catch-all More Specials */}
          {categorySections.moreItems.length > 0 && (() => {
            const isMoreExpanded = !!expandedCategories.more;
            return (
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

                  {/* See All Button */}
                  <ScalePressable
                    onPress={() => {
                      setExpandedCategories(prev => ({ ...prev, more: !prev.more }));
                    }}
                    scaleValue={0.96}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
                  >
                    <Text style={{ color: '#ea580c', fontSize: 11.5, fontWeight: '700' }}>
                      {isMoreExpanded ? 'Show Less' : 'See All'}
                    </Text>
                    <ChevronRight 
                      size={13} 
                      color="#ea580c" 
                      style={{ transform: [{ rotate: isMoreExpanded ? '90deg' : '0deg' }] }}
                    />
                  </ScalePressable>
                </View>

                {/* Conditional Layout: 2-Column Grid when expanded, else Horizontal scroll track */}
                {isMoreExpanded ? (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 12 }}>
                    {categorySections.moreItems.map((product: any, idx: number) => (
                      <ProductCard key={product.id} product={product} className="w-[47%] mb-4" index={idx} isCafeStyle={true} />
                    ))}
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 12, gap: 12, paddingBottom: 6 }}
                    decelerationRate="fast"
                  >
                    {categorySections.moreItems.map((product: any, idx: number) => (
                      <View key={product.id} style={{ width: 156 }}>
                        <ProductCard product={product} className="w-full" index={idx} isCafeStyle={true} />
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            );
          })()}
          </Animated.View>
        </Animated.ScrollView>
      )}

      {/* 3. Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={8} />
    </View>
  );
}
