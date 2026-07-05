import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Dimensions, Alert, StyleSheet, Platform, Image as RNImage } from 'react-native';
const { height: screenHeight } = Dimensions.get('window');
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useRef, memo } from 'react';
const { width: rawWidth } = Dimensions.get('window');
const width = rawWidth > 768 ? 540 : rawWidth;
import { ShoppingBag, ChevronDown, ChevronRight, MapPin, Search, Zap, Clock, ShieldCheck, RefreshCw, Moon, Sun, Package, Heart, Menu, X, Check, Mic } from 'lucide-react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, withSequence, withDelay, Easing, FadeIn, FadeInDown, FadeInUp, ZoomIn, interpolate, runOnJS, cancelAnimation } from 'react-native-reanimated';
import SpeedStrip from '../../components/home/SpeedStrip';
import CategoryGrid from '../../components/home/CategoryGrid';
import CafeFlashDeals from '../../components/home/CafeFlashDeals';
import Logo from '../../components/shared/Logo';
import ProductCard, { Product } from '../../components/product/ProductCard';
import ProductCardSkeleton from '../../components/product/ProductCardSkeleton';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import { useTheme } from '../context/ThemeContext';
import { useCartActions } from '../../hooks/use-cart';
import DealsCurationHub from '../../components/home/DealsCurationHub';
import DeliveryBanner from '../../components/home/DeliveryBanner';
import TimeGreetingHero from '../../components/home/TimeGreetingHero';
import CafeCategoriesStrip from '../../components/home/CafeCategoriesStrip';
import AppFooter from '../../components/home/AppFooter';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import { API_BASE_URL, ORDER_STATUS_LABELS, DEFAULT_CAFE_MENU_SECTIONS } from '../../lib/constants';
import { sendLocalNotification } from '../../lib/push-notifications';
import { triggerHaptic } from '../../lib/haptic';
import { formatPrice } from '../../lib/utils';
import Svg, { Path } from 'react-native-svg';

// ─── Premium Store Closed View ──────────────────────────────────────
function StoreClosedPremiumView({ isDarkMode, paddingTop = 0 }: { isDarkMode: boolean; paddingTop?: number }) {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.3);
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    // Clock pulse animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // Glow ring animation
    glow.value = withRepeat(
      withSequence(
        withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // Blob drift animations
    blob1X.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-20, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(25, { duration: 3500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob2X.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 4500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-15, { duration: 4500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(glow);
      cancelAnimation(blob1X);
      cancelAnimation(blob1Y);
      cancelAnimation(blob2X);
      cancelAnimation(blob2Y);
    };
  }, []);

  const clockStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: interpolate(glow.value, [0.2, 0.7], [1, 1.4]) }],
  }));

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob1X.value }, { translateY: blob1Y.value }],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob2X.value }, { translateY: blob2Y.value }],
  }));

  const hours = [
    { label: 'Grocery Mart', time: '6:00 AM – 12:00 AM', icon: '🛒' },
    { label: 'FastKirana Cafe', time: '7:00 AM – 11:00 PM', icon: '☕' },
  ];

  const handleNotify = () => {
    triggerHaptic('medium');
    setNotified(true);
    Alert.alert(
      '🔔 Notification Set!',
      "We'll notify you as soon as FastKirana opens. See you bright and early!",
      [{ text: 'Sounds Good', style: 'default' }]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#09090b' : '#ffffff', paddingTop }}>
      {/* Gradient mesh background blobs */}
      <Animated.View
        style={[blob1Style, {
          position: 'absolute',
          top: '15%',
          left: -40,
          width: 260,
          height: 260,
          borderRadius: 130,
          opacity: isDarkMode ? 0.15 : 0.12,
        }]}
      >
        <LinearGradient
          colors={isDarkMode ? ['#e20a22', '#ff6b6b', '#e20a22'] : ['#fecdd3', '#fda4af', '#fecdd3']}
          style={{ width: 260, height: 260, borderRadius: 130 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      <Animated.View
        style={[blob2Style, {
          position: 'absolute',
          bottom: '20%',
          right: -50,
          width: 220,
          height: 220,
          borderRadius: 110,
          opacity: isDarkMode ? 0.1 : 0.08,
        }]}
      >
        <LinearGradient
          colors={isDarkMode ? ['#7c3aed', '#a78bfa', '#7c3aed'] : ['#ddd6fe', '#c4b5fd', '#ddd6fe']}
          style={{ width: 220, height: 220, borderRadius: 110 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      {/* Third subtle blob */}
      <View
        style={{
          position: 'absolute',
          top: '55%',
          left: '30%',
          width: 180,
          height: 180,
          borderRadius: 90,
          opacity: isDarkMode ? 0.08 : 0.06,
        }}
      >
        <LinearGradient
          colors={isDarkMode ? ['#f59e0b', '#fbbf24', '#f59e0b'] : ['#fef3c7', '#fde68a', '#fef3c7']}
          style={{ width: 180, height: 180, borderRadius: 90 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Content */}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 40 }}>

        {/* Animated Clock with glow ring */}
        <Animated.View entering={ZoomIn.duration(600).springify()} style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          {/* Glow ring */}
          <Animated.View
            style={[glowStyle, {
              position: 'absolute',
              width: 120,
              height: 120,
              borderRadius: 60,
              backgroundColor: isDarkMode ? '#e20a22' : '#fecdd3',
            }]}
          />
          {/* Clock container */}
          <Animated.View
            style={[clockStyle, {
              width: 88,
              height: 88,
              borderRadius: 44,
              backgroundColor: isDarkMode ? '#18181b' : '#fff1f2',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: isDarkMode ? '#27272a' : '#fecdd3',
              shadowColor: '#e20a22',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 8,
            }]}
          >
            <Text style={{ fontSize: 40, lineHeight: 48 }}>🕐</Text>
          </Animated.View>
        </Animated.View>

        {/* Status badge */}
        <Animated.View entering={FadeInDown.delay(200).duration(500).springify()}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 20,
              backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.08)',
              marginBottom: 16,
              gap: 6,
            }}
          >
            <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: '#ef4444' }} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#ef4444', letterSpacing: 1, textTransform: 'uppercase' }}>
              Currently Closed
            </Text>
          </View>
        </Animated.View>

        {/* Main heading */}
        <Animated.View entering={FadeInDown.delay(350).duration(500).springify()} style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 24,
              fontWeight: '900',
              color: isDarkMode ? '#fafafa' : '#18181b',
              textAlign: 'center',
              letterSpacing: -0.5,
              lineHeight: 30,
            }}
          >
            We'll be back at
          </Text>
          <Text
            style={{
              fontSize: 40,
              fontWeight: '900',
              color: '#e20a22',
              textAlign: 'center',
              letterSpacing: -1,
              marginTop: 4,
              lineHeight: 48,
            }}
          >
            6:00 AM
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: isDarkMode ? '#a1a1aa' : '#71717a',
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 18,
              maxWidth: 260,
            }}
          >
            Our team is resting up to bring you the freshest groceries & cafe treats tomorrow!
          </Text>
        </Animated.View>

        {/* Operating hours card */}
        <Animated.View
          entering={FadeInUp.delay(500).duration(500).springify()}
          style={{
            marginTop: 32,
            width: '100%',
            maxWidth: 320,
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1,
            borderColor: isDarkMode ? '#27272a' : '#f4f4f5',
          }}
        >
          <LinearGradient
            colors={isDarkMode ? ['#18181b', '#1c1c1f'] : ['#ffffff', '#fafafa']}
            style={{ paddingVertical: 20, paddingHorizontal: 20 }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: isDarkMode ? '#71717a' : '#a1a1aa',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 16,
              }}
            >
              Store Hours
            </Text>
            {hours.map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: idx < hours.length - 1 ? 16 : 0 }}>
                {/* Timeline dot & line */}
                <View style={{ alignItems: 'center', marginRight: 14, width: 20 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: isDarkMode ? '#27272a' : '#f4f4f5',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  </View>
                </View>
                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: isDarkMode ? '#e4e4e7' : '#27272a' }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: isDarkMode ? '#71717a' : '#a1a1aa', marginTop: 2 }}>
                    {item.time}
                  </Text>
                </View>
                {/* Clock icon */}
                <Clock size={16} color={isDarkMode ? '#52525b' : '#d4d4d8'} />
              </View>
            ))}
          </LinearGradient>
        </Animated.View>

        {/* Notify me button */}
        <Animated.View entering={FadeInUp.delay(650).duration(500).springify()} style={{ marginTop: 28, width: '100%', maxWidth: 320 }}>
          <Pressable
            onPress={handleNotify}
            disabled={notified}
            style={({ pressed }) => ({
              borderRadius: 16,
              overflow: 'hidden',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }],
            })}
          >
            <LinearGradient
              colors={notified
                ? (isDarkMode ? ['#166534', '#15803d'] : ['#bbf7d0', '#86efac'])
                : ['#e20a22', '#dc2626']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 16,
                paddingHorizontal: 24,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              {notified ? (
                <>
                  <Check size={18} color={isDarkMode ? '#bbf7d0' : '#166534'} strokeWidth={3} />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: isDarkMode ? '#bbf7d0' : '#166534' }}>
                    You'll be Notified!
                  </Text>
                </>
              ) : (
                <>
                  <Moon size={18} color="#ffffff" strokeWidth={2.5} />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#ffffff', letterSpacing: 0.3 }}>
                    Notify Me When Open
                  </Text>
                </>
              )}
            </LinearGradient>
          </Pressable>
        </Animated.View>

        {/* Subtle bottom text */}
        <Animated.View entering={FadeIn.delay(800).duration(600)}>
          <Text style={{ marginTop: 20, fontSize: 11, color: isDarkMode ? '#3f3f46' : '#d4d4d8', textAlign: 'center' }}>
            FastKirana · Delivery in 10 minutes
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

function PulsingStatusDot() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 650 }),
        withTiming(0.4, { duration: 650 })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[
        {
          width: 7,
          height: 7,
          borderRadius: 3.5,
          backgroundColor: '#ffffff',
          shadowColor: '#ffffff',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 3,
        },
        animatedStyle
      ]} 
    />
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewPaddingTop = insets.top > 0 ? insets.top + 130 : 135;
  const searchSuggestions = [
    'Search "milk"',
    'Search "fresh paneer"',
    'Search "crispy momos"',
    'Search "fortune mustard oil"',
    'Search "alphonso mangoes"',
    'Search "cold coffee"',
    'Search "atta"'
  ];
  const placeholderOpacity = useSharedValue(1);
  const [currentSuggestion, setCurrentSuggestion] = useState(searchSuggestions[0]);

  const placeholderStyle = useAnimatedStyle(() => {
    const translateY = interpolate(placeholderOpacity.value, [0, 1], [4, 0]);
    return {
      opacity: placeholderOpacity.value,
      transform: [{ translateY }],
    };
  });
  const groceryMartOpen = useUIStore((s) => s.groceryMartOpen);
  const cafeOpen = useUIStore((s) => s.cafeOpen);
  const selectedLocation = useUIStore((s) => s.selectedLocation);
  const assignedStoreId = useUIStore((s) => s.assignedStoreId);

  // Home states and refs
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const scrollViewRef = useRef<ScrollView>(null);
  const horizontalTabsRef = useRef<ScrollView>(null);

  // Cafe UI conditional states
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [showFloatingMenuBtn, setShowFloatingMenuBtn] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [sectionOffsets, setSectionOffsets] = useState<Record<string, number>>({});

  // Reanimated layout tracking for gliding tab indicator
  const [tabLayouts, setTabLayouts] = useState<Record<string, { x: number; width: number }>>({});
  const indicatorLeft = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const hasLayouts = useSharedValue(0);

  // Collapsible sticky header scroll tracking
  const scrollY = useSharedValue(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

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
  // Fetch ALL cafe products from API (no hardcoded fallback)
  const { data: cafeProducts = [] } = useQuery<any[]>({
    queryKey: ['cafe-products-home', assignedStoreId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?category=cafe&limit=500${assignedStoreId ? `&storeId=${assignedStoreId}` : ''}`);
      if (!response.ok) throw new Error('API Failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    staleTime: 1000 * 60 * 2, // 2 min cache
  });

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

  const filteredCafeProducts = useMemo(() => {
    return cafeProducts.filter((p) => {
      if (p.isAvailable === false) return false;
      if (vegOnly && getIsNonVeg(p)) return false;
      return true;
    });
  }, [cafeProducts, vegOnly]);

  const categorySections = useMemo(() => {
    const PREDEFINED_CATEGORIES = DEFAULT_CAFE_MENU_SECTIONS;
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

    filteredCafeProducts.forEach((product) => {
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

    const excludeTags = new Set([
      'cafe', 'popular', 'veg', 'paneer', 'cheese', 'spicy', 'protein', 
      'breakfast', 'essential', 'cooking', 'staple', 'premium', 'garnish', 'salad'
    ]);

    const dynamicTagsMap = new Map<string, any[]>();
    filteredCafeProducts.forEach((product) => {
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

    const allGroupedIds = new Set<string>();
    finalSections.forEach((sec) => sec.products.forEach((p: any) => allGroupedIds.add(p.id)));
    const moreItems = filteredCafeProducts.filter((p) => !allGroupedIds.has(p.id));

    return {
      sections: finalSections,
      moreItems
    };
  }, [filteredCafeProducts]);

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

  useEffect(() => {
    if (menuCategories.length > 0 && !activeCategory) {
      setActiveCategory(menuCategories[0].tag);
    }
  }, [menuCategories]);

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

  const handleScroll = (event: any) => {
    const scrollYVal = event.nativeEvent.contentOffset.y;
    scrollY.value = scrollYVal;

    // Update isCollapsed state
    if (scrollYVal > 40 && !isCollapsed) {
      setIsCollapsed(true);
    } else if (scrollYVal <= 40 && isCollapsed) {
      setIsCollapsed(false);
    }

    setShowFloatingMenuBtn(scrollYVal > 200);

    let currentActive = '';
    const buffer = 130;

    for (const cat of menuCategories) {
      const top = sectionOffsets[cat.tag];
      if (top !== undefined && scrollYVal >= top - buffer) {
        currentActive = cat.tag;
      }
    }

    if (currentActive && currentActive !== activeCategory) {
      setActiveCategory(currentActive);
    }
  };

  const handleGroceryScroll = (event: any) => {
    const scrollYVal = event.nativeEvent.contentOffset.y;
    scrollY.value = scrollYVal;

    // Update isCollapsed state
    if (scrollYVal > 40 && !isCollapsed) {
      setIsCollapsed(true);
    } else if (scrollYVal <= 40 && isCollapsed) {
      setIsCollapsed(false);
    }
  };

  const scrollToCategory = (tag: string) => {
    const offset = sectionOffsets[tag];
    if (offset !== undefined && scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: offset - 110, animated: true });
      setActiveCategory(tag);
      setIsMenuOpen(false);
      triggerHaptic('light');
    }
  };

  const suggestionIndexRef = useRef(0);
  useEffect(() => {
    const interval = setInterval(() => {
      placeholderOpacity.value = withTiming(0, { duration: 250 }, (isFinished) => {
        if (isFinished) {
          runOnJS(() => {
            const nextIdx = (suggestionIndexRef.current + 1) % searchSuggestions.length;
            suggestionIndexRef.current = nextIdx;
            setCurrentSuggestion(searchSuggestions[nextIdx]);
            placeholderOpacity.value = withTiming(1, { duration: 250 });
          })();
        }
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { user } = useAuthStore();
  const getAuthHeaders = (): Record<string, string> => {
    if (!user) return {};
    return {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-role': user.role,
      'x-user-email': user.email || '',
      'x-user-name': user.name || '',
      'x-user-phone': user.phone || '',
    };
  };

  const { data: orders = [], refetch: refetchOrders } = useQuery<any[]>({
    queryKey: ['active-orders'],
    queryFn: async () => {
      if (!user) return [];
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) return [];
      return await response.json();
    },
    enabled: !!user,
  });

  const activeOrder = useMemo(() => {
    return orders.find(o => !['DELIVERED', 'CANCELLED'].includes(o.status));
  }, [orders]);

  const { addItem } = useCartActions();

  const lastCompletedOrder = useMemo(() => {
    return orders.find(o => o.status === 'DELIVERED');
  }, [orders]);

  const handleReorderLast = () => {
    if (!lastCompletedOrder || !lastCompletedOrder.items) return;
    
    triggerHaptic('success');
    
    lastCompletedOrder.items.forEach((item: any) => {
      const matchedProd = products.find(p => p.id === item.productId || p.slug === item.productSlug);
      
      addItem({
        id: item.productId || matchedProd?.id || '',
        name: item.name || matchedProd?.name || '',
        slug: item.productSlug || matchedProd?.slug || '',
        imageUrl: item.imageUrl || matchedProd?.imageUrl || null,
        mrp: item.mrp || matchedProd?.mrp || item.price || 0,
        price: item.price || matchedProd?.price || 0,
        discount: (item.mrp && item.price) ? (item.mrp - item.price) : 0,
        unit: item.unit || matchedProd?.unit || '1 unit',
        stock: matchedProd?.stock || 50,
        isAvailable: matchedProd?.isAvailable !== false,
        category: matchedProd?.category || null,
      });
    });

    Alert.alert(
      "Reordered! 🛒",
      "All items from your previous order have been added to your cart."
    );
  };



  useEffect(() => {
    if (!activeOrder) return;
    const interval = setInterval(() => {
      refetchOrders();
    }, 8000);
    return () => clearInterval(interval);
  }, [activeOrder]);

  const prevStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!activeOrder) {
      prevStatusRef.current = null;
      return;
    }
    
    if (prevStatusRef.current !== null && prevStatusRef.current !== activeOrder.status) {
      const statusLabel = ORDER_STATUS_LABELS[activeOrder.status] || activeOrder.status;
      sendLocalNotification(
        `⚡ Order Status: ${statusLabel}`,
        `Your order #${activeOrder.id.slice(-6).toUpperCase()} is now ${statusLabel.toLowerCase()}!`
      );
    }
    prevStatusRef.current = activeOrder.status;
  }, [activeOrder]);

  // Fetch ALL live products from Next.js backend (no hardcoded fallback)
  const { data: products = [], isLoading } = useQuery<Product[]>({
    queryKey: ['home-products', assignedStoreId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?limit=500${assignedStoreId ? `&storeId=${assignedStoreId}` : ''}`);
      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    staleTime: 1000 * 60 * 2, // 2 min cache
  });

  // Helper to identify if a product is a Cafe product
  const isCafeProduct = (product: Product) => {
    return (
      product.category?.slug === 'cafe' || 
      product.tags?.includes('cafe') || 
      /^c\d+$/.test(product.id)
    );
  };

  const trendingProducts = useMemo(() => {
    return products.filter(p => p.isAvailable && !isCafeProduct(p) && (p.category?.slug === 'snacks-munchies' || p.category?.slug === 'beverages' || p.id === 'sm1' || p.id === 'db2' || p.id === 'bv1')).slice(0, 6);
  }, [products]);

  const topPicksProducts = useMemo(() => {
    return products.filter(p => p.isAvailable && !isCafeProduct(p) && (p.category?.slug === 'fruits-vegetables' || p.category?.slug === 'dairy-breakfast' || p.id === 'fv3' || p.id === 'db4' || p.id === 'db3')).slice(0, 6);
  }, [products]);

  // Dynamic Hour-based suggestion filter (IST equivalent)
  const currentHour = new Date().getHours();
  
  const timeDetails = useMemo(() => {
    if (currentHour >= 6 && currentHour < 11) {
      return {
        title: 'Breakfast Essentials',
        subtitle: 'Start your morning fresh',
        categories: ['dairy-breakfast', 'bakery']
      };
    } else if (currentHour >= 11 && currentHour < 16) {
      return {
        title: 'Lunch Time Picks',
        subtitle: 'Spices, staples and produce',
        categories: ['atta-rice-dal', 'fruits-vegetables']
      };
    } else if (currentHour >= 16 && currentHour < 20) {
      return {
        title: "Snack O'Clock",
        subtitle: 'Munchies, chips and quick bites',
        categories: ['snacks-munchies']
      };
    } else {
      return {
        title: 'Late Night Cravings',
        subtitle: 'Sweet bites & cool drinks',
        categories: ['beverages', 'snacks-munchies']
      };
    }
  }, [currentHour]);

  const suggestionProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.isAvailable === false) return false;
      if (isCafeProduct(p)) return false;
      const categorySlug = p.category?.slug || '';
      if (categorySlug && timeDetails.categories.includes(categorySlug)) {
        return true;
      }
      // Fallback for mock prefix IDs
      const prefix = p.id.slice(0, 2);
      if (prefix === 'db' && timeDetails.categories.includes('dairy-breakfast')) return true;
      if (prefix === 'bb' && timeDetails.categories.includes('bakery')) return true;
      if (prefix === 'fv' && timeDetails.categories.includes('fruits-vegetables')) return true;
      if (prefix === 'de' && timeDetails.categories.includes('atta-rice-dal')) return true;
      if (prefix === 'sm' && timeDetails.categories.includes('snacks-munchies')) return true;
      if (prefix === 'bv' && timeDetails.categories.includes('beverages')) return true;
      
      return false;
    }).slice(0, 10);
  }, [products, timeDetails]);

  // Best Sellers (overall top rated or explicitly flagged as bestseller)
  const bestSellers = useMemo(() => {
    const dbBestsellers = products.filter(p => p.isAvailable && !isCafeProduct(p) && (p.tags?.includes('popular') || p.tags?.includes('essential')));
    if (dbBestsellers.length > 0) return dbBestsellers.slice(0, 6);

    // Fallback to static selection for mock products
    return products.filter(p => p.isAvailable !== false && (p.id === 'db1' || p.id === 'sm2' || p.id === 'fv1' || p.id === 'def2' || p.id === 'db3' || p.id === 'bv2'));
  }, [products]);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 relative">
      {/* Gradient Mesh Blobs */}
      <View className="absolute inset-0 overflow-hidden pointer-events-none z-0" style={{ pointerEvents: 'none' }}>
        <LinearGradient
          colors={isDarkMode ? ['rgba(226,10,34,0.12)', 'rgba(226,10,34,0)'] : ['rgba(226,10,34,0.08)', 'rgba(226,10,34,0)']}
          style={{ position: 'absolute', top: -50, left: -50, width: 250, height: 250, borderRadius: 125 }}
        />
        <LinearGradient
          colors={isDarkMode ? ['rgba(0,177,64,0.08)', 'rgba(0,177,64,0)'] : ['rgba(0,177,64,0.06)', 'rgba(0,177,64,0)']}
          style={{ position: 'absolute', top: 300, right: -80, width: 280, height: 280, borderRadius: 140 }}
        />
      </View>

      {/* Header Container */}
      <Animated.View style={[headerAnimatedStyle, { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20 }]}>
        <View
          style={{
            paddingHorizontal: 16,
            paddingTop: insets.top > 0 ? insets.top + 6 : 12,
            paddingBottom: 12,
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
          }}
        >
          {/* Top Row: Left-Aligned Delivery Info & Right-Aligned Theme Toggle */}
          <Animated.View 
            pointerEvents={isCollapsed ? 'none' : 'auto'}
            style={[
              topRowAnimatedStyle,
              { 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginBottom: 12,
                width: '100%'
              }
            ]}
          >
            <Pressable 
              onPress={() => {
                triggerHaptic('light');
                router.push('/location-picker');
              }}
              style={({ pressed }) => [
                {
                  flex: 1,
                  marginRight: 16,
                  opacity: pressed ? 0.85 : 1,
                }
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {/* Logo wrapper for perfect alignment */}
                <View className="bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/50 shadow-xs">
                  <Logo size={24} />
                </View>
                
                {/* Text column */}
                <View style={{ flex: 1, justifyContent: 'center', marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={{ backgroundColor: isDarkMode ? '#be123c' : '#e11d48', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, textTransform: 'uppercase', flexShrink: 0 }} numberOfLines={1}>INSTANT</Text>
                    </View>
                    <Text style={{ marginLeft: 6, color: isDarkMode ? '#71717a' : '#94a3b8', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                      Delivery to
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Text 
                      className="text-slate-800 dark:text-zinc-100 text-sm font-black tracking-tight"
                      numberOfLines={1}
                      style={{ maxWidth: '85%' }}
                    >
                      {selectedLocation && selectedLocation.startsWith('Lat:') ? 'Swaroop Nagar, Kanpur' : (selectedLocation || 'Select Location')}
                    </Text>
                    <ChevronDown size={12} color={isDarkMode ? '#e4e4e7' : '#1e293b'} style={{ marginLeft: 2 }} />
                  </View>
                </View>
              </View>
            </Pressable>

            {/* Right: Theme Toggle */}
            <Pressable 
              onPress={() => {
                toggleTheme();
                triggerHaptic('light');
              }}
              style={({ pressed }) => [{
                transform: [{ scale: pressed ? 0.92 : 1 }],
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
              }]}
            >
              {isDarkMode ? (
                <Sun size={16} color="#fbbf24" />
              ) : (
                <Moon size={16} color="#3b82f6" />
              )}
            </Pressable>
          </Animated.View>

          {/* Bottom Row: Search Box Shortcut */}
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              router.push('/search');
            }}
            className="flex-row items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full px-4 h-11 w-full active:scale-[0.99]"
            style={Platform.OS === 'ios' ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 6,
            } : Platform.OS === 'android' ? {
              elevation: 2,
            } : undefined}
          >
            <Search size={16} color="#e20a22" style={{ marginRight: 10 }} />
            <Animated.Text style={[{ fontSize: 13, color: '#94a3b8', fontWeight: '500', flex: 1 }, placeholderStyle]}>
              {currentSuggestion}
            </Animated.Text>
            <Mic size={16} color="#94a3b8" />
          </Pressable>
        </View>
        {/* Glassmorphic border underline line */}
        <LinearGradient
          colors={isDarkMode 
            ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.08)'] 
            : ['rgba(226,232,240,0.8)', 'rgba(226,232,240,0.2)', 'rgba(226,232,240,0.8)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: 1.2, width: '100%' }}
        />
      </Animated.View>

      {/* Scrollable Content */}
      {!groceryMartOpen && cafeOpen ? (
        // Cafe Storefront View when Grocery is Closed
        <>
          {/* Warning Banner: Grocery is closed, Cafe is open */}
          <LinearGradient
            colors={['#f97316', '#e11d48']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ marginHorizontal: 16, marginTop: 12, borderRadius: 12 }}
          >
            <View className="flex-row items-center justify-center py-2.5 px-4">
              <Text className="text-white text-xs font-black text-center">
                ⚠️ Grocery Mart is temporarily closed. Cafe is open! ☕
              </Text>
            </View>
          </LinearGradient>

          {/* Sticky Horizontal Categories Tab Bar */}
          {menuCategories.length > 0 && (
            <View className="border-b border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 mt-4 shadow-xs">
              <ScrollView 
                ref={horizontalTabsRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8, position: 'relative' }}
              >
                {/* Gliding background pill */}
                <Animated.View style={animatedIndicatorStyle} />

                {menuCategories.map((cat) => {
                  const isActive = activeCategory === cat.tag;
                  return (
                    <Pressable
                      key={cat.tag}
                      onLayout={(e) => {
                        const { x, width } = e.nativeEvent.layout;
                        setTabLayouts(prev => ({ ...prev, [cat.tag]: { x, width } }));
                      }}
                      onPress={() => scrollToCategory(cat.tag)}
                      className={`px-3.5 py-1.5 rounded-full border flex-row items-center gap-1.5 z-10 ${
                        isActive 
                          ? 'border-transparent' 
                          : 'bg-slate-50 dark:bg-zinc-800 border-slate-200/80 dark:border-zinc-700 hover:bg-slate-100 dark:hover:bg-zinc-700'
                      }`}
                      style={{ borderStyle: 'solid', borderWidth: 1 }}
                    >
                      <Text className="text-xs">{cat.emoji}</Text>
                      <Text className={`text-xs font-black shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-600 dark:text-zinc-300'
                      }`}>
                        {cat.title}
                      </Text>
                      <View className={`rounded-full px-1.5 py-0.5 ${
                        isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-zinc-700'
                      }`}>
                        <Text className={`text-[8px] font-black ${
                          isActive ? 'text-white' : 'text-slate-500 dark:text-zinc-400'
                        }`}>{cat.count}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <ScrollView 
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            className="flex-1 bg-white dark:bg-zinc-950"
            contentContainerStyle={{ paddingTop: scrollViewPaddingTop, paddingBottom: 160 }}
          >

            {/* Cafe Visual Cover Banner */}
            <View className="mx-4 mt-4 mb-6 rounded-3xl border border-[#3e241b] dark:border-amber-500/20 shadow-lg relative overflow-hidden">
              <LinearGradient
                colors={['#2a1711', '#1d0e0a', '#120805']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View className="p-5 flex-row justify-between items-center w-full">
                <View className="absolute right-[-10px] top-[-10px] opacity-10">
                  <Text className="text-8xl">☕</Text>
                </View>
                <View className="z-10 flex-1 pr-4">
                  <View className="flex-row items-center gap-1.5 bg-amber-500/20 border border-amber-500/20 px-2.5 py-0.5 rounded-full self-start">
                    <Text className="text-amber-300 text-[8px] font-black uppercase tracking-wider">FastKirana Cafe ☕</Text>
                  </View>
                  <Text className="text-white text-xl font-black mt-3 leading-6">Freshly Prepared.{"\n"}Fast Delivered.</Text>
                  <Text className="text-amber-100/70 text-[10px] mt-1.5 font-bold leading-4">Warm sandwiches, crispy rolls, momos & thick shakes dispatched instantly from our local store kitchen.</Text>
                </View>
                <View className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl items-center justify-center shadow-xs">
                  <Text className="text-4xl">🥪</Text>
                </View>
              </View>
            </View>

            {/* Render Cafe grouped sections */}
            {categorySections.sections.map((section) => (
              <View 
                key={section.tag}
                onLayout={(e) => {
                  const y = e.nativeEvent.layout.y;
                  setSectionOffsets(prev => ({ ...prev, [section.tag]: y }));
                }}
                className="mb-6 bg-white dark:bg-zinc-900 border-y border-slate-100 dark:border-zinc-800/80 px-4 py-4"
              >
                {/* Section Header */}
                <View className="flex-row items-center gap-2 mb-4">
                  <Text className="text-xl">{section.emoji}</Text>
                  <View>
                    <Text className="text-slate-800 dark:text-zinc-200 font-black text-sm uppercase tracking-wider">{section.title}</Text>
                    <Text className="text-slate-400 dark:text-zinc-400 text-[10px] font-semibold">{section.description}</Text>
                  </View>
                </View>

                {/* Cafe Product Grid */}
                <View className="flex-row flex-wrap justify-between mt-2">
                  {section.products.map((product: any, idx: number) => (
                    <ProductCard key={product.id} product={product} className="w-[48%] mb-4" index={idx} />
                  ))}
                </View>
              </View>
            ))}

            {/* Catch-all More Specials */}
            {categorySections.moreItems.length > 0 && (
              <View 
                onLayout={(e) => {
                  const y = e.nativeEvent.layout.y;
                  setSectionOffsets(prev => ({ ...prev, more: y }));
                }}
                className="mb-6 bg-white dark:bg-zinc-900 border-y border-slate-100 dark:border-zinc-800/80 px-4 py-4"
              >
                <View className="flex-row items-center gap-2 mb-4">
                  <Text className="text-xl">🍽️</Text>
                  <View>
                    <Text className="text-slate-800 dark:text-zinc-200 font-black text-sm uppercase tracking-wider">More Specials</Text>
                    <Text className="text-slate-400 dark:text-zinc-400 text-[10px] font-semibold">Additional café items and specials</Text>
                  </View>
                </View>

                {/* Cafe Product Grid */}
                <View className="flex-row flex-wrap justify-between mt-2">
                  {categorySections.moreItems.map((product: any, idx: number) => (
                    <ProductCard key={product.id} product={product} className="w-[48%] mb-4" index={idx} />
                  ))}
                </View>
              </View>
            )}

            <View className="h-28" />
          </ScrollView>

          {/* Floating Menu Button (Swiggy Style FAB) */}
          {showFloatingMenuBtn && menuCategories.length > 0 && !isMenuOpen && (
            <View className="absolute bottom-24 left-0 right-0 items-center z-30">
              <Pressable
                onPress={() => {
                  setIsMenuOpen(true);
                  triggerHaptic('light');
                }}
                className="bg-slate-900 border border-slate-800 px-5 py-3 rounded-full shadow-2xl flex-row items-center gap-2 active:scale-95 transition-all"
              >
                <Menu size={14} color="#fff" strokeWidth={3} />
                <Text className="text-white font-black text-xs uppercase tracking-wider">Menu</Text>
              </Pressable>
            </View>
          )}

          {/* Quick Menu Bottom Drawer Sheet Overlay */}
          {isMenuOpen && (
            <>
              {/* Dark Backdrop */}
              <Pressable 
                onPress={() => setIsMenuOpen(false)}
                className="absolute inset-0 bg-black/50 z-40"
              />

              {/* Sliding Categories Drawer */}
              <View className="absolute bottom-0 left-0 right-0 bg-white dark:bg-zinc-900 rounded-t-3xl shadow-2xl z-50 p-5 max-h-[60%] flex-col border-t border-slate-100 dark:border-zinc-800">
                <View className="flex-row justify-between items-center pb-3 border-b border-slate-100 dark:border-zinc-800 mb-3 shrink-0">
                  <Text className="text-slate-800 dark:text-zinc-100 font-black text-xs uppercase tracking-wider">Browse Café Categories</Text>
                  <Pressable 
                    onPress={() => setIsMenuOpen(false)}
                    className="w-7 h-7 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center"
                  >
                    <X size={16} color={isDarkMode ? "#a1a1aa" : "#64748b"} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                  <View className="gap-2 pb-6">
                    {menuCategories.map((cat) => {
                      const isActive = activeCategory === cat.tag;
                      return (
                        <Pressable
                          key={cat.tag}
                          onPress={() => scrollToCategory(cat.tag)}
                          className={`flex-row justify-between items-center p-3 rounded-xl border ${
                            isActive 
                              ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60' 
                              : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800 active:bg-slate-50 dark:active:bg-zinc-800'
                          }`}
                        >
                          <View className="flex-row items-center gap-3">
                            <Text className="text-lg">{cat.emoji}</Text>
                            <Text className={`text-sm font-extrabold ${isActive ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-zinc-200'}`}>
                              {cat.title}
                            </Text>
                          </View>
                          <View className={`rounded-full px-2.5 py-0.5 ${
                            isActive ? 'bg-rose-600' : 'bg-slate-200 dark:bg-zinc-800'
                          }`}>
                            <Text className={`text-[10px] font-black ${
                              isActive ? 'text-white' : 'text-slate-500 dark:text-zinc-400'
                            }`}>{cat.count}</Text>
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </>
          )}
        </>
      ) : groceryMartOpen ? (
        // Grocery Storefront View (matching the screenshot exactly)
        <ScrollView 
          onScroll={handleGroceryScroll}
          scrollEventThrottle={16}
          className="flex-1 bg-white dark:bg-zinc-950" 
          contentContainerStyle={{ backgroundColor: 'transparent', paddingTop: scrollViewPaddingTop, paddingBottom: 160 }} 
          showsVerticalScrollIndicator={false}
        >
          {/* Warning Banner: Grocery is open, Cafe is closed */}
          {!cafeOpen && (
            <LinearGradient
              colors={['#f97316', '#e11d48']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 12 }}
            >
              <View className="flex-row items-center justify-center py-2.5 px-4">
                <Text className="text-white text-xs font-black text-center">
                  ⚠️ Cafe Kitchen is temporarily closed. Grocery Mart is open! 🛒
                </Text>
              </View>
            </LinearGradient>
          )}

          {/* Time Greeting Hero */}
          <TimeGreetingHero />

          {/* Category Grid Section Title */}
          <View className="px-4 flex-row justify-between items-center mb-3">
            <Text className="text-title text-base">Trending Categories</Text>
            <Pressable 
              onPress={() => {
                triggerHaptic('light');
                router.push('/(tabs)/categories');
              }}
              style={({ pressed }) => [{
                opacity: pressed ? 0.7 : 1
              }]}
              className="flex-row items-center"
            >
              <Text className="text-rose-600 dark:text-rose-400 font-bold text-xs">See all</Text>
              <ChevronRight size={14} color="#e11d48" />
            </Pressable>
          </View>

          {/* Category Grid (2 rows x 4 icons) */}
          <CategoryGrid />

          {/* Speed ticker strip */}
          <SpeedStrip />

          {/* FastKirana Café banner - Premium Cinematic Entrance */}
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              router.push('/cafe');
            }}
            style={({ pressed }) => [{
              transform: [{ scale: pressed ? 0.98 : 1 }],
              shadowColor: '#f59e0b',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDarkMode ? 0.15 : 0.08,
              shadowRadius: 12,
              elevation: 4,
            }]}
            className="mx-4 mb-5 h-44 rounded-2xl overflow-hidden border border-amber-500/20"
          >
            {/* Food photography background */}
            {Platform.OS === 'web' ? (
              <RNImage
                source={require('../../assets/cafe_banner.png')}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <ExpoImage 
                source={require('../../assets/cafe_banner.png')}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            )}
            {/* Rich cinematic dark gradient overlay */}
            <LinearGradient
              colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.92)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {/* Banner content */}
            <View className="flex-1 justify-end p-5 z-10">
              <View className="flex-row items-end justify-between">
                <View className="flex-1 pr-4">
                  {/* LIVE KITCHEN Badge with pulsing indicator */}
                  <View className="flex-row items-center gap-1.5 self-start bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-full mb-2.5 shadow-xs">
                    <PulsingStatusDot />
                    <Text className="text-emerald-400 font-extrabold text-[8.5px] uppercase tracking-wider">LIVE KITCHEN</Text>
                  </View>
                  
                  <View className="flex-row items-center gap-2">
                    <Text className="text-white font-light text-2xl tracking-tight leading-none" style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }}>
                      FastKirana <Text className="font-black text-amber-300">Café</Text>
                    </Text>
                    <Text style={{ fontSize: 18 }}>☕</Text>
                  </View>
                  <Text className="text-zinc-200 text-[11px] font-semibold mt-2 leading-relaxed max-w-[280px]" numberOfLines={2} style={{ textShadowColor: 'rgba(0,0,0,0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 }}>
                    Freshly prepared sandwiches, rolls, Chinese, Italian pasta & beverages — delivered hot!
                  </Text>
                </View>

                {/* Menu Button - Gradient & Shadow */}
                <View className="bg-rose-600 border border-rose-500/30 px-4 py-2 rounded-full flex-row items-center gap-1 shadow-md">
                  <Text className="text-white font-black text-[10px] uppercase tracking-wider">Order Now</Text>
                  <ChevronRight size={10} color="#ffffff" strokeWidth={3.5} />
                </View>
              </View>
            </View>
          </Pressable>

          {/* Cafe Categories Horizontal scroll strip */}
          <CafeCategoriesStrip />

          {/* Active Order Tracker */}
          {activeOrder && (
            <Pressable 
              onPress={() => {
                triggerHaptic('light');
                router.push(`/order/${activeOrder.id}`);
              }}
              style={({ pressed }) => [{
                transform: [{ scale: pressed ? 0.98 : 1 }],
                marginHorizontal: 16,
                marginBottom: 16,
                borderRadius: 16,
                overflow: 'hidden',
              }]}
            >
              <LinearGradient
                colors={['#10b981', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 14, borderWidth: 1, borderColor: '#34d399', borderRadius: 16 }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2 flex-1 pr-2">
                    <Zap size={16} color="#fff" />
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-white font-black text-xs uppercase">Active Delivery Run</Text>
                        <PulsingStatusDot />
                      </View>
                      <Text className="text-white/95 text-[10px] font-bold mt-0.5" numberOfLines={1}>
                        {activeOrder.items?.map((it: any) => `${it.name} x${it.quantity}`).join(', ')}
                      </Text>
                      <Text className="text-emerald-100 text-[9px] font-bold mt-0.5">
                        Status: {ORDER_STATUS_LABELS[activeOrder.status] || activeOrder.status}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color="#fff" />
                </View>
                
                {/* Timeline Progress Bar */}
                <View className="flex-row items-center gap-1.5 mt-3 pt-2 border-t border-emerald-500/30">
                  {['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'].map((step, idx) => {
                    const stepOrder = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'];
                    const currentIdx = stepOrder.indexOf(activeOrder.status);
                    const isCompleted = idx <= currentIdx;
                    return (
                      <View 
                        key={step} 
                        className={`flex-1 h-1 rounded-full ${
                          isCompleted ? 'bg-white' : 'bg-emerald-800'
                        }`}
                      />
                    );
                  })}
                </View>
              </LinearGradient>
            </Pressable>
          )}

          {/* Reorder Last Order Banner */}
          {!activeOrder && lastCompletedOrder && (
            <Pressable 
              onPress={handleReorderLast}
              style={({ pressed }) => [{
                transform: [{ scale: pressed ? 0.98 : 1 }],
                marginHorizontal: 16,
                marginBottom: 16,
                borderRadius: 16,
                overflow: 'hidden',
              }]}
            >
              <LinearGradient
                colors={isDarkMode ? ['#1e1b4b', '#0f172a'] : ['#fff5f5', '#ffffff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#2e1065' : '#ffe4e6',
                  borderRadius: 16,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View className="flex-row items-center gap-3 flex-1 pr-2">
                  <View className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/30 items-center justify-center">
                    <RefreshCw size={18} color="#e11d48" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-800 dark:text-zinc-100 font-bold text-xs uppercase tracking-wider">Reorder Previous Order</Text>
                    <Text className="text-slate-500 dark:text-zinc-400 text-[10px] font-semibold mt-0.5" numberOfLines={1}>
                      {lastCompletedOrder.items?.map((it: any) => it.name).join(', ')}
                    </Text>
                  </View>
                </View>
                <View className="bg-rose-600 px-3 py-1.5 rounded-xl">
                  <Text className="text-white font-bold text-[10px] uppercase tracking-wider">Reorder</Text>
                </View>
              </LinearGradient>
            </Pressable>
          )}

          {/* Curated For You (Deals Curation Hub) */}
          <DealsCurationHub products={products} />

          {/* Delivery & Value Propositions Banner */}
          <DeliveryBanner />

          {/* App Footer */}
          <AppFooter />
        </ScrollView>
      ) : (
        // Store Completely Closed View (both Grocery and Cafe closed)
        <StoreClosedPremiumView isDarkMode={isDarkMode} paddingTop={scrollViewPaddingTop} />
      )}

      {/* Shared Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={88} />
    </SafeAreaView>
  );
}
