import { View, Text, Pressable, ScrollView, TextInput, ActivityIndicator, Dimensions, Animated as RNAnimated, Platform, Image as RNImage } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { useQuery } from '@tanstack/react-query';
import { useState, useMemo, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Search, ShoppingBag, Menu, X, Plus, Minus, Check, ChevronRight, MapPin, ChevronDown, Sun, Moon } from 'lucide-react-native';
import { useCart } from '../hooks/use-cart';
import { useUIStore } from '../stores/ui-store';
import { formatPrice } from '../lib/utils';
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

const { width: rawWidth, height } = Dimensions.get('window');
const width = rawWidth > 768 ? 540 : rawWidth;

const MOCK_CAFE_PRODUCTS: any[] = [];

const CATEGORY_SIDEBAR_IMAGES: Record<string, string> = {
  'hot-bite': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781008426/qqndbejndns9kr7sl9nk.png',
  'chinese': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781009115/hkhgalsbhqp0pqzsgft0.png',
  'frankie-rolls': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781033205/zpu9843cf5ehawocadv7.png',
  'sandwiches': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781232401/xlimxbbx1blqidujuel9.png',
  'italian-pasta': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781121488/t9qmcgycpxtmgjtvx316.png',
  'bombay-bites': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781122608/ouglyiehjertzyc9bqo5.png',
  'hot-beverage': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781036231/e5j1slyq1r2v4y9z7fcf.png',
  'south-indian': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781120117/gbiikta7wioj2fhofh1l.png',
  'shakes': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781204854/ovdfhpqpk9ln4x1upkvb.png',
  'mocktails': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781204854/ovdfhpqpk9ln4x1upkvb.png',
  'cold-coffee': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781204854/ovdfhpqpk9ln4x1upkvb.png',
  'rice-dishes': 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781115514/qqr9nlo6d9ybyhj2hhjp.png',
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

export default function CafeScreen() {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { getItemQuantity, addItem, updateQuantity, getTotalItems, getSubtotal } = useCart();
  const cafeOpen = useUIStore((s) => s.cafeOpen);
  const params = useLocalSearchParams<{ category?: string }>();

  const [activeCategory, setActiveCategory] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFloatingMenuBtn, setShowFloatingMenuBtn] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);
  const horizontalTabsRef = useRef<ScrollView>(null);
  const isProgrammaticScrollRef = useRef(false);
  const [sectionOffsets, setSectionOffsets] = useState<Record<string, number>>({});
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  
  // Reanimated layout tracking for gliding tab indicator
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const indicatorLeft = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const hasLayouts = useSharedValue(0);

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

  const pulseAnim = useRef(new RNAnimated.Value(0.4)).current;
  
  useEffect(() => {
    RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Query Cafe Products from Server
  const { data: products = [], isLoading } = useQuery<any[]>({
    queryKey: ['cafe-products'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?category=cafe&limit=500`);
      if (!response.ok) throw new Error('API Failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
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
          p.name.toLowerCase().includes(query) ||
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
      scrollViewRef.current.scrollTo({ y: sectionOffsets[params.category] - 110, animated: true });
    }
  }, [params.category, sectionOffsets]);

  useEffect(() => {
    if (activeCategory && horizontalTabsRef.current) {
      const activeIdx = menuCategories.findIndex((c) => c.tag === activeCategory);
      if (activeIdx !== -1) {
        const tabWidth = 130;
        const targetX = Math.max(0, (activeIdx * tabWidth) - (width / 2) + (tabWidth / 2));
        horizontalTabsRef.current.scrollTo({ x: targetX, animated: true });
      }
    }
  }, [activeCategory, menuCategories]);

  // Track scrolling coordinates to update active category highlighting in vertical sidebar
  const handleScroll = (event: any) => {
    if (isProgrammaticScrollRef.current) return;
    const scrollY = event.nativeEvent.contentOffset.y;

    let currentActive = '';
    const buffer = 40; // buffer for natural scroll alignment

    for (const cat of menuCategories) {
      const top = sectionOffsets[cat.tag];
      if (top !== undefined && scrollY >= top - buffer) {
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
      scrollViewRef.current.scrollTo({ y: offset - 10, animated: true });
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
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      
      {/* 1. Redesigned Sticky Header (Row 1, Row 2, Row 3) */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
          backgroundColor: isDarkMode ? 'rgba(9,9,11,0.95)' : 'rgba(255,255,255,0.95)',
          zIndex: 20
        }}
      >
        {/* Row 1: Back Button + Logo + Location dropdown + Theme Toggle */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 }}>
            {/* Logo & Location Details */}
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 }}>
              <Logo size={32} />
              <Pressable 
                onPress={() => {
                  triggerHaptic('light');
                  router.push('/location-picker');
                }} 
                style={({ pressed }) => [{
                  opacity: pressed ? 0.75 : 1,
                  flex: 1
                }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                  <View style={{ justifyContent: 'center', alignItems: 'center', marginTop: 1 }}>
                    <MapPin size={14} color="#e20a22" />
                  </View>
                  <View style={{ flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#0f172a', letterSpacing: -0.2 }}>
                      Fast Delivery
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 0.5, gap: 2 }}>
                      <Text 
                        style={{ fontSize: 9.5, fontWeight: '700', color: '#64748b', maxWidth: 180 }} 
                        numberOfLines={1}
                      >
                        {selectedLocation || 'Select Location'}
                      </Text>
                      <ChevronDown size={8} color="#94a3b8" />
                    </View>
                  </View>
                </View>
              </Pressable>
            </View>
          </View>

          {/* Theme Toggle Button */}
          <Pressable 
            onPress={() => {
              toggleTheme();
              triggerHaptic('light');
            }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isDarkMode ? '#1c1c1e' : '#f8fafc',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: isDarkMode ? '#2c2c2e' : '#e2e8f0',
              marginLeft: 8
            }}
          >
            {isDarkMode ? (
              <Sun size={14} color="#fbbf24" />
            ) : (
              <Moon size={14} color="#3b82f6" />
            )}
          </Pressable>
        </View>

        {/* Row 2: Search Box Shortcut */}
        <Pressable 
          onPress={() => {
            triggerHaptic('light');
            router.push('/search');
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
            borderWidth: 1,
            borderColor: isDarkMode ? '#2c2c2e' : '#e2e8f0',
            borderRadius: 24,
            paddingHorizontal: 16,
            paddingVertical: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 2,
            elevation: 1
          }}
        >
          <Search size={16} color="#e20a22" style={{ marginRight: 8 }} />
          <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '500', flex: 1 }}>
            Search "atta"
          </Text>
        </Pressable>

        {/* Row 3: Breadcrumbs Capsule */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          borderWidth: 1,
          borderColor: isDarkMode ? '#2c2c2e' : '#e2e8f0',
          borderRadius: 99,
          paddingHorizontal: 12,
          paddingVertical: 5,
          marginTop: 12,
          backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff'
        }}>
          <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#e20a22', letterSpacing: 0.5 }}>HOME</Text>
          <ChevronRight size={8} color="#64748b" style={{ marginHorizontal: 6 }} />
          <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#e20a22', letterSpacing: 0.5 }}>
            FASTKIRANA CAFE 🍩
          </Text>
          <ChevronRight size={8} color="#e20a22" style={{ marginHorizontal: 6 }} />
          <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#e20a22', letterSpacing: 0.5, textTransform: 'uppercase' }} numberOfLines={1}>
            {activeCategoryObj ? activeCategoryObj.title : 'ALL MENU'}
          </Text>
        </View>
      </View>
      {/* 2. Main Two-Column Split Layout */}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        
        {/* Left Column: Vertical Category Sidebar */}
        {menuCategories.length > 0 && (
          <View style={{
            width: 90,
            borderRightWidth: 1,
            borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
            backgroundColor: isDarkMode ? '#09090b' : '#ffffff'
          }}>
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 12 }}
              nestedScrollEnabled={true}
            >
              {menuCategories.map((cat) => {
                const isActive = activeCategory === cat.tag;
                const imgUrl = CATEGORY_SIDEBAR_IMAGES[cat.tag] || '';
                
                return (
                  <Pressable
                    key={cat.tag}
                    onPress={() => scrollToCategory(cat.tag)}
                    style={{
                      paddingVertical: 12,
                      alignItems: 'center',
                      position: 'relative',
                      width: '100%',
                      backgroundColor: isActive 
                        ? (isDarkMode ? 'rgba(225,29,72,0.05)' : 'rgba(225,29,72,0.02)') 
                        : 'transparent'
                    }}
                  >
                    {/* Left red indicator bar */}
                    {isActive && (
                      <View style={{
                        position: 'absolute',
                        left: 0,
                        top: 14,
                        bottom: 14,
                        width: 3.5,
                        backgroundColor: '#e11d48',
                        borderTopRightRadius: 4,
                        borderBottomRightRadius: 4
                      }} />
                    )}
                    
                    {/* Circular Category Thumbnail */}
                    <View style={{
                      width: 50,
                      height: 50,
                      borderRadius: 25,
                      borderWidth: 1.5,
                      borderColor: isActive ? '#e11d48' : (isDarkMode ? '#27272a' : '#e2e8f0'),
                      overflow: 'hidden',
                      backgroundColor: isDarkMode ? '#18181b' : '#f8fafc',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: 1.5
                    }}>
                      {(!imgUrl || imageErrors[cat.tag]) ? (
                        <Text style={{ fontSize: 20 }}>{cat.emoji}</Text>
                      ) : Platform.OS === 'web' ? (
                        <RNImage
                          source={{ uri: imgUrl }}
                          style={{ width: '100%', height: '100%', borderRadius: 23 }}
                          resizeMode="cover"
                          onError={() => setImageErrors(prev => ({ ...prev, [cat.tag]: true }))}
                        />
                      ) : (
                        <ExpoImage
                          source={{ uri: imgUrl }}
                          contentFit="cover"
                          style={{ width: '100%', height: '100%', borderRadius: 23 }}
                          onError={() => setImageErrors(prev => ({ ...prev, [cat.tag]: true }))}
                        />
                      )}
                    </View>

                    {/* Category Label */}
                    <Text style={{
                      fontSize: 9,
                      fontWeight: isActive ? '900' : '600',
                      color: isActive ? '#e11d48' : (isDarkMode ? '#a1a1aa' : '#475569'),
                      textAlign: 'center',
                      marginTop: 6,
                      paddingHorizontal: 4,
                      lineHeight: 11
                    }} numberOfLines={2}>
                      {cat.title}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Right Column: Scrollable Content Grid */}
        <View style={{ flex: 1, backgroundColor: isDarkMode ? '#09090b' : '#f8fafc' }}>
          
          {isLoading ? (
            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            >
              <SkeletonShimmer height={128} borderRadius={16} style={{ marginHorizontal: 12, marginTop: 12, marginBottom: 20 }} />
              <View style={{ paddingHorizontal: 12 }}><SkeletonShimmer width={120} height={16} /></View>
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
              contentContainerStyle={{ paddingBottom: 140 }}
              nestedScrollEnabled={true}
            >
              


              {/* 2.2 Cover Category Hero Banner */}
              <LinearGradient
                colors={isDarkMode ? ['#1e0c10', '#0a0304'] : ['#3f121a', '#1e0508']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  marginHorizontal: 12,
                  marginTop: 8,
                  marginBottom: 16,
                  borderRadius: 16,
                  padding: 16,
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {/* Floating Category Emoji Backdrop */}
                <View style={{ position: 'absolute', right: -6, bottom: -12, opacity: 0.15 }}>
                  <Text style={{ fontSize: 84 }}>{activeCategoryObj?.emoji || '🥟'}</Text>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={{ color: '#fb7185', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginBottom: 4 }}>
                      ⚡ FASTKIRANA CAFÉ
                    </Text>
                    <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '900', marginBottom: 2 }}>
                      {activeCategoryObj?.title || 'Quick Bites & Snacks'}
                    </Text>
                    <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9.5, fontWeight: '600', lineHeight: 13 }}>
                      {categorySections.sections.find(s => s.tag === activeCategory)?.description || 'Prepared Fresh & Delivered Fast'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 38 }}>{activeCategoryObj?.emoji || '🥟'}</Text>
                </View>
              </LinearGradient>

              {/* 2.3 Search Input Box */}
              <View style={{
                marginHorizontal: 12,
                marginBottom: 12,
                backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: isDarkMode ? '#2c2c2e' : '#e2e8f0'
              }}>
                <Search size={14} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                <TextInput
                  placeholder="Search Cafe Menu..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: '600',
                    color: isDarkMode ? '#f4f4f5' : '#1e293b',
                    padding: 0
                  }}
                />
                {searchQuery.length > 0 && (
                  <Pressable onPress={() => setSearchQuery('')}>
                    <X size={14} color={isDarkMode ? '#94a3b8' : '#64748b'} />
                  </Pressable>
                )}
              </View>

              {/* 2.4 Veg Only Toggle */}
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

              {/* 2.5 Render Grouped Category Sections */}
              {categorySections.sections.map((section) => (
                <View 
                  key={section.tag}
                  onLayout={(e) => {
                    const y = e.nativeEvent.layout.y;
                    setSectionOffsets(prev => ({ ...prev, [section.tag]: y }));
                  }}
                  style={{
                    marginBottom: 20,
                    backgroundColor: isDarkMode ? '#121214' : '#ffffff',
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
                    paddingHorizontal: 12,
                    paddingVertical: 14
                  }}
                >
                  {/* Category Section Header matching web exactly */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 15 }}>{section.emoji}</Text>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: isDarkMode ? '#f4f4f5' : '#1e293b', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        {section.title}
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: isDarkMode ? 'rgba(225,29,72,0.15)' : '#ffe4e6',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10
                    }}>
                      <Text style={{ fontSize: 8, fontWeight: '900', color: '#e11d48' }}>
                        {section.products.length} Items
                      </Text>
                    </View>
                  </View>

                  {/* 2-Column Product Grid */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4 }}>
                    {section.products.map((product: any, idx: number) => (
                      <ProductCard key={product.id} product={product} className="w-[48%] mb-4" index={idx} />
                    ))}
                  </View>
                </View>
              ))}

              {/* 2.6 Catch-all More Specials */}
              {categorySections.moreItems.length > 0 && (
                <View 
                  onLayout={(e) => {
                    const y = e.nativeEvent.layout.y;
                    setSectionOffsets(prev => ({ ...prev, more: y }));
                  }}
                  style={{
                    marginBottom: 20,
                    backgroundColor: isDarkMode ? '#121214' : '#ffffff',
                    borderTopWidth: 1,
                    borderBottomWidth: 1,
                    borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
                    paddingHorizontal: 12,
                    paddingVertical: 14
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 15 }}>🍽️</Text>
                      <Text style={{ fontSize: 11, fontWeight: '900', color: isDarkMode ? '#f4f4f5' : '#1e293b', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                        More Specials
                      </Text>
                    </View>
                    <View style={{
                      backgroundColor: isDarkMode ? 'rgba(225,29,72,0.15)' : '#ffe4e6',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 10
                    }}>
                      <Text style={{ fontSize: 8, fontWeight: '900', color: '#e11d48' }}>
                        {categorySections.moreItems.length} Items
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 4 }}>
                    {categorySections.moreItems.map((product: any, idx: number) => (
                      <ProductCard key={product.id} product={product} className="w-[48%] mb-4" index={idx} />
                    ))}
                  </View>
                </View>
              )}

            </ScrollView>
          )}

        </View>
      </View>

      {/* 3. Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={8} />
    </SafeAreaView>
  );
}
