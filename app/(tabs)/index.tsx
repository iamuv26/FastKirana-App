import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Dimensions, Alert, StyleSheet, Platform, Image as RNImage, useWindowDimensions } from 'react-native';
const { height: screenHeight } = Dimensions.get('window');
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo, useRef, memo } from 'react';
const { width: rawWidth } = Dimensions.get('window');
const width = rawWidth > 768 ? 540 : rawWidth;
import { ShoppingBag, ChevronDown, ChevronRight, MapPin, Search, Zap, Clock, ShieldCheck, RefreshCw, Moon, Sun, Package, Heart, Menu, X, Check, Mic, Coffee, Utensils, Bell, Sparkles } from 'lucide-react-native';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withTiming, withSequence, withDelay, Easing, FadeIn, FadeInDown, FadeInUp, ZoomIn, interpolate, runOnJS, cancelAnimation } from 'react-native-reanimated';
import CategoryGrid from '../../components/home/CategoryGrid';
import CafeFlashDeals from '../../components/home/CafeFlashDeals';
import StoreSelectorHeader from '../../components/shared/StoreSelectorHeader';
import Logo from '../../components/shared/Logo';
import ProductCard, { Product } from '../../components/product/ProductCard';
import ProductCardSkeleton from '../../components/product/ProductCardSkeleton';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import { useTheme } from '../context/ThemeContext';
import { ScalePressable } from '../../components/shared/ScalePressable';
import { useCartActions } from '../../hooks/use-cart';
import DealsCurationHub from '../../components/home/DealsCurationHub';
import DeliveryBanner from '../../components/home/DeliveryBanner';
import TimeGreetingHero from '../../components/home/TimeGreetingHero';
import CafeCategoriesStrip from '../../components/home/CafeCategoriesStrip';
import GroceryPromoCarousel from '../../components/home/GroceryPromoCarousel';
import AppFooter from '../../components/home/AppFooter';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import { API_BASE_URL, ORDER_STATUS_LABELS, DEFAULT_CAFE_MENU_SECTIONS } from '../../lib/constants';
import { sendLocalNotification } from '../../lib/push-notifications';
import { triggerHaptic } from '../../lib/haptic';
import { formatPrice, formatHeaderAddress, getAppImageSource } from '../../lib/utils';
import Svg, { Path } from 'react-native-svg';

// ─── Premium Store Closed View ──────────────────────────────────────
// Helper component for pulsing red live indicator
function PulsingRedDot() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
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
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: '#ef4444',
          shadowColor: '#ef4444',
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 4,
          elevation: 2,
          marginRight: 6,
        },
        animatedStyle
      ]} 
    />
  );
}

function StoreClosedPremiumView({ isDarkMode, paddingTop = 0 }: { isDarkMode: boolean; paddingTop?: number }) {
  const pulse = useSharedValue(1);
  const glow = useSharedValue(0.3);
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);
  const [notified, setNotified] = useState(false);

  const storeOpenHour = useUIStore((s) => s.storeOpenHour);
  const storeCloseHour = useUIStore((s) => s.storeCloseHour);

  useEffect(() => {
    // Clock pulse animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // Glow ring animation
    glow.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // Blob drift animations
    blob1X.value = withRepeat(
      withSequence(
        withTiming(30, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-20, { duration: 5000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 4500, easing: Easing.inOut(Easing.ease) }),
        withTiming(25, { duration: 4500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob2X.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: 6000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 5500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-15, { duration: 5500, easing: Easing.inOut(Easing.ease) })
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
    transform: [{ scale: interpolate(glow.value, [0.2, 0.5], [0.95, 1.25]) }],
  }));

  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob1X.value }, { translateY: blob1Y.value }],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: blob2X.value }, { translateY: blob2Y.value }],
  }));

  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour === 12) return '12:00 PM';
    return hour > 12 ? `${hour - 12}:00 PM` : `${hour}:00 AM`;
  };

  const openTimeStr = formatHour(storeOpenHour ?? 6);
  const closeTimeStr = formatHour(storeCloseHour ?? 24);

  const hours = [
    { 
      label: 'Grocery Mart', 
      time: `${openTimeStr} – ${closeTimeStr}`, 
      lucideIcon: <ShoppingBag size={15} color="#e20a22" />,
      colorBg: isDarkMode ? 'rgba(226, 10, 34, 0.15)' : '#fff1f2'
    },
    { 
      label: 'FastKirana Food', 
      time: '7:00 AM – 11:00 PM', 
      lucideIcon: <Utensils size={15} color="#d97706" />,
      colorBg: isDarkMode ? 'rgba(217, 119, 6, 0.15)' : '#fef3c7'
    },
  ];

  const handleNotify = () => {
    triggerHaptic('medium');
    setNotified(true);
    Alert.alert(
      '🔔 Notification Set!',
      `We'll notify you as soon as FastKirana opens. See you at ${openTimeStr}!`,
      [{ text: 'Sounds Good', style: 'default' }]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDarkMode ? '#09090b' : '#fafbfe' }}>
      {/* Gradient mesh background blobs */}
      <Animated.View
        style={[blob1Style, {
          position: 'absolute',
          top: '15%',
          left: -40,
          width: 280,
          height: 280,
          borderRadius: 140,
          opacity: isDarkMode ? 0.16 : 0.13,
        }]}
      >
        <LinearGradient
          colors={isDarkMode ? ['#e20a22', '#ff8787', '#e20a22'] : ['#fecdd3', '#fda4af', '#fecdd3']}
          style={{ width: 280, height: 280, borderRadius: 140 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>
      <Animated.View
        style={[blob2Style, {
          position: 'absolute',
          bottom: '20%',
          right: -50,
          width: 240,
          height: 240,
          borderRadius: 120,
          opacity: isDarkMode ? 0.11 : 0.09,
        }]}
      >
        <LinearGradient
          colors={isDarkMode ? ['#7c3aed', '#c084fc', '#7c3aed'] : ['#ddd6fe', '#d8b4fe', '#ddd6fe']}
          style={{ width: 240, height: 240, borderRadius: 120 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Scrollable Container */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: paddingTop + 12,
          paddingHorizontal: 24,
          paddingBottom: 180, // Safe padding above bottom tabs and floating cart bar
          alignItems: 'center',
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Clock with glow ring */}
        <Animated.View entering={ZoomIn.duration(600).springify()} style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
          {/* Glow ring */}
          <Animated.View
            style={[glowStyle, {
              position: 'absolute',
              width: 110,
              height: 110,
              borderRadius: 55,
              backgroundColor: isDarkMode ? 'rgba(226,10,34,0.14)' : 'rgba(226,10,34,0.06)',
            }]}
          />
          {/* Clock container */}
          <Animated.View
            style={[clockStyle, {
              width: 76,
              height: 76,
              borderRadius: 38,
              backgroundColor: isDarkMode ? '#1c1c1f' : '#ffffff',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1.5,
              borderColor: isDarkMode ? 'rgba(226,10,34,0.3)' : '#fda4af',
              shadowColor: '#e20a22',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDarkMode ? 0.3 : 0.08,
              shadowRadius: 15,
              elevation: 5,
            }]}
          >
            <Clock size={32} color="#e20a22" strokeWidth={2.2} />
          </Animated.View>
        </Animated.View>

        {/* Status badge */}
        <Animated.View entering={FadeInDown.delay(100).duration(400).springify()}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 16,
              backgroundColor: isDarkMode ? 'rgba(239,68,68,0.12)' : '#fee2e2',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(239,68,68,0.2)' : '#fca5a5',
              marginBottom: 12,
            }}
          >
            <PulsingRedDot />
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#ef4444', letterSpacing: 1, textTransform: 'uppercase' }}>
              Currently Closed
            </Text>
          </View>
        </Animated.View>

        {/* Main heading */}
        <Animated.View entering={FadeInDown.delay(200).duration(400).springify()} style={{ alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '700',
              color: isDarkMode ? '#8e8e93' : '#64748b',
              textAlign: 'center',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            We'll be back at
          </Text>
          
          {/* Elegant Time Capsule */}
          <LinearGradient
            colors={['#e20a22', '#f43f5e']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              borderRadius: 24,
              paddingHorizontal: 26,
              paddingVertical: 10,
              marginTop: 10,
              shadowColor: '#e20a22',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 12,
              elevation: 6,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <Sparkles size={18} color="#ffffff" />
            <Text
              style={{
                fontSize: 26,
                fontWeight: '900',
                color: '#ffffff',
                textAlign: 'center',
                letterSpacing: 0.5,
              }}
            >
              {openTimeStr}
            </Text>
          </LinearGradient>
          
          <Text
            style={{
              fontSize: 13,
              color: isDarkMode ? '#a1a1aa' : '#475569',
              textAlign: 'center',
              marginTop: 16,
              lineHeight: 18,
              maxWidth: 270,
              fontWeight: '600',
            }}
          >
            Our team is resting up to bring you the freshest groceries & cafe treats tomorrow!
          </Text>
        </Animated.View>

        {/* Operating hours card */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(400).springify()}
          style={{
            marginTop: 22,
            width: '100%',
            maxWidth: 320,
            borderRadius: 24,
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDarkMode ? 0.3 : 0.04,
            shadowRadius: 16,
            elevation: 4,
            backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
          }}
        >
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '800',
                  color: isDarkMode ? '#8e8e93' : '#64748b',
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                }}
              >
                Store Hours
              </Text>
              <View style={{
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 6,
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
              }}>
                <Text style={{ fontSize: 8, fontWeight: '700', color: isDarkMode ? '#cbd5e1' : '#475569' }}>Daily</Text>
              </View>
            </View>

            {hours.map((item, idx) => (
              <View 
                key={idx} 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  paddingVertical: 8,
                  borderBottomWidth: idx < hours.length - 1 ? 1 : 0,
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)',
                }}
              >
                <View style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: item.colorBg,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                }}>
                  {item.lucideIcon}
                </View>
                
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isDarkMode ? '#fafafa' : '#1e293b' }}>
                    {item.label}
                  </Text>
                  <Text style={{ fontSize: 11, color: isDarkMode ? '#8e8e93' : '#64748b', marginTop: 1, fontWeight: '500' }}>
                    {item.time}
                  </Text>
                </View>

                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0',
                }}>
                  <Clock size={10} color={isDarkMode ? '#71717a' : '#94a3b8'} />
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Notify me button */}
        <Animated.View entering={FadeInUp.delay(400).duration(400).springify()} style={{ marginTop: 18, width: '100%', maxWidth: 320 }}>
          <ScalePressable
            onPress={handleNotify}
            disabled={notified}
            scaleValue={0.98}
            haptic="success"
            style={({ pressed }) => ({
              borderRadius: 24,
              opacity: pressed ? 0.88 : 1,
              elevation: 4,
              shadowColor: notified ? '#15803d' : '#e20a22',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
            })}
          >
            <LinearGradient
              colors={notified
                ? (isDarkMode ? ['#15803d', '#16a34a'] : ['#dcfce7', '#bbf7d0'])
                : ['#e20a22', '#f43f5e']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                paddingVertical: 14,
                paddingHorizontal: 20,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                borderRadius: 24,
                gap: 8,
              }}
            >
              {notified ? (
                <>
                  <Check size={16} color={isDarkMode ? '#bbf7d0' : '#15803d'} strokeWidth={3} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: isDarkMode ? '#bbf7d0' : '#15803d', letterSpacing: 0.5 }}>
                    You'll be Notified!
                  </Text>
                </>
              ) : (
                <>
                  <Bell size={16} color="#ffffff" strokeWidth={2.2} />
                  <Text style={{ fontSize: 13, fontWeight: '900', color: '#ffffff', letterSpacing: 1.0, textTransform: 'uppercase' }}>
                    Notify Me When Open
                  </Text>
                </>
              )}
            </LinearGradient>
          </ScalePressable>
        </Animated.View>

        {/* Subtle bottom text */}
        <Animated.View entering={FadeIn.delay(500).duration(500)}>
          <Text style={{ marginTop: 14, fontSize: 10, color: isDarkMode ? '#3f3f46' : '#94a3b8', textAlign: 'center', fontWeight: '500' }}>
            FastKirana · Delivery in 10 minutes
          </Text>
        </Animated.View>
      </ScrollView>
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
  const { width: windowWidth } = useWindowDimensions();
  const scrollViewPaddingTop = insets.top > 0 ? insets.top + 140 : 144;
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
  const scrollViewRef = useRef<any>(null);
  const horizontalTabsRef = useRef<ScrollView>(null);
  const lastScrollCheck = useRef(0);

  // Tab segmented control animated values
  const [localActiveSegment, setLocalActiveSegment] = useState<'grocery' | 'food'>('grocery');
  const tabIndicatorTranslateX = useSharedValue(0);

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

  // Cafe UI conditional states
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [vegOnly, setVegOnly] = useState<boolean>(false);
  const [showFloatingMenuBtn, setShowFloatingMenuBtn] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [sectionOffsets, setSectionOffsets] = useState<Record<string, number>>({});
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

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
    queryKey: ['cafe-products', assignedStoreId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?category=cafe&limit=500${assignedStoreId ? `&storeId=${assignedStoreId}` : ''}`);
      if (!response.ok) throw new Error('API Failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
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

    const shouldShowBtn = scrollYVal > 200;
    if (shouldShowBtn !== showFloatingMenuBtn) {
      setShowFloatingMenuBtn(shouldShowBtn);
    }

    // Throttle category tracking loop to run once every 120ms (saving scroll frame rates)
    const now = Date.now();
    if (now - lastScrollCheck.current > 120) {
      lastScrollCheck.current = now;
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
  const rotateSuggestion = () => {
    const nextIdx = (suggestionIndexRef.current + 1) % searchSuggestions.length;
    suggestionIndexRef.current = nextIdx;
    setCurrentSuggestion(searchSuggestions[nextIdx]);
    placeholderOpacity.value = withTiming(1, { duration: 250 });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      placeholderOpacity.value = withTiming(0, { duration: 250 }, (isFinished) => {
        if (isFinished) {
          runOnJS(rotateSuggestion)();
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
    staleTime: 10000, // 10s short cache
    refetchInterval: 10000, // Auto-refetch every 10s for real-time stock sync
  });

  // Prefetch top products and categories images in the background to speed up image loading
  useEffect(() => {
    if (products && products.length > 0) {
      const urls = products
        .map((p) => (p.imageUrl ? getAppImageSource(p.imageUrl)?.uri : null))
        .filter((url): url is string => !!url)
        .slice(0, 40); // Prefetch first 40 product images in the background
      if (urls.length > 0) {
        ExpoImage.prefetch(urls);
      }
    }
  }, [products]);

  // Helper to identify if a product is a Cafe product
  const isCafeProduct = (product: Product) => {
    return (
      product.category?.slug === 'cafe' || 
      product.tags?.includes('cafe') || 
      /^c\d+$/.test(product.id)
    );
  };

  const trendingProducts = useMemo(() => {
    return products.filter(p => p.isAvailable && !isCafeProduct(p) && (p.category?.slug === 'snacks-biscuits' || p.category?.slug === 'beverages' || p.id === 'sm1' || p.id === 'db2' || p.id === 'bv1')).slice(0, 6);
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
        categories: ['grocery-essential', 'fruits-vegetables']
      };
    } else if (currentHour >= 16 && currentHour < 20) {
      return {
        title: "Snack O'Clock",
        subtitle: 'Munchies, chips and quick bites',
        categories: ['snacks-biscuits']
      };
    } else {
      return {
        title: 'Late Night Cravings',
        subtitle: 'Sweet bites & cool drinks',
        categories: ['beverages', 'snacks-biscuits']
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
      if (prefix === 'de' && timeDetails.categories.includes('grocery-essential')) return true;
      if (prefix === 'sm' && timeDetails.categories.includes('snacks-biscuits')) return true;
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
    <View style={{ flex: 1 }} className="flex-1 bg-white dark:bg-zinc-950 relative">
      {/* Status Bar Solid Blocker */}
      <View 
        style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          height: insets.top, 
          backgroundColor: isDarkMode ? '#09090b' : '#ffffff', 
          zIndex: 25 
        }} 
      />

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
        <BlurView
          intensity={isDarkMode ? 45 : 65}
          tint={isDarkMode ? 'dark' : 'light'}
          style={{
            paddingHorizontal: 16,
            paddingTop: insets.top > 0 ? insets.top + 5 : 8,
            paddingBottom: 8,
            backgroundColor: isDarkMode ? 'rgba(9, 9, 11, 0.72)' : 'rgba(255, 255, 255, 0.75)',
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
          {/* Top Row: Left-Aligned Brand Logo/Text & Right-Aligned Address Capsule */}
          <Animated.View 
            pointerEvents={isCollapsed ? 'none' : 'auto'}
            style={[
              topRowAnimatedStyle,
              { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, width: '100%' }
            ]}
          >
            {/* Left: Brand Logo & Text */}
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

            {/* Right: Address Picker Capsule */}
            <ScalePressable 
              onPress={() => {
                router.push('/location-picker');
              }}
              scaleValue={0.96}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDarkMode ? 'rgba(225, 29, 72, 0.08)' : '#fff5f5',
                borderColor: isDarkMode ? 'rgba(225, 29, 72, 0.3)' : '#fecdd3',
                borderWidth: 1,
                borderRadius: 99,
                paddingHorizontal: 10,
                paddingVertical: 5,
                maxWidth: '62%',
              }}
            >
              <MapPin size={12} color="#e20a22" style={{ marginRight: 4, flexShrink: 0 }} />
              <Text 
                numberOfLines={1} 
                style={{ 
                  fontSize: 11, 
                  fontWeight: '800', 
                  color: isDarkMode ? '#f4f4f5' : '#0f172a',
                  marginRight: 3,
                  flexShrink: 1,
                }}
              >
                {formatHeaderAddress(selectedLocation)}
              </Text>
              <ChevronDown size={11} color={isDarkMode ? '#fda4af' : '#64748b'} style={{ flexShrink: 0 }} />
            </ScalePressable>
          </Animated.View>

          {/* Store Switcher Tab Pills - Segmented Control */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            height: 38,
            borderRadius: 19,
            borderWidth: 1.5,
            borderColor: isDarkMode ? '#27272a' : '#ffe4e6',
            backgroundColor: isDarkMode ? '#18181b' : '#fffcfc',
            padding: 3,
            marginTop: 6,
            marginBottom: 4,
          }}>
            {/* Grocery Segment */}
            <ScalePressable
              onPress={() => {
                triggerHaptic('light');
                setLocalActiveSegment('grocery');
              }}
              scaleValue={0.97}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                borderRadius: 16,
                backgroundColor: localActiveSegment === 'grocery' ? '#e20a22' : 'transparent',
              }}
            >
              <ShoppingBag size={14} color={localActiveSegment === 'grocery' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569')} strokeWidth={2.5} style={{ marginRight: 6 }} />
              <Text allowFontScaling={false} style={{ fontSize: 12, fontWeight: '900', letterSpacing: 0.5, color: localActiveSegment === 'grocery' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569'), textTransform: 'uppercase' }}>
                Grocery
              </Text>
            </ScalePressable>

            {/* Food Segment */}
            <ScalePressable
              onPress={() => {
                triggerHaptic('light');
                router.push('/cafe');
              }}
              scaleValue={0.97}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                borderRadius: 16,
                backgroundColor: localActiveSegment === 'food' ? '#e20a22' : 'transparent',
              }}
            >
              <Utensils size={14} color={localActiveSegment === 'food' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569')} strokeWidth={2.5} style={{ marginRight: 6 }} />
              <Text allowFontScaling={false} style={{ fontSize: 12, fontWeight: '900', letterSpacing: 0.5, color: localActiveSegment === 'food' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569'), textTransform: 'uppercase' }}>
                Food
              </Text>
            </ScalePressable>
          </View>

          {/* Bottom Row: Search Box Shortcut */}
          <ScalePressable 
            onPress={() => {
              router.push('/search');
            }}
            scaleValue={0.99}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
              borderWidth: 1,
              borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
              borderRadius: 18,
              paddingHorizontal: 16,
              height: 36,
              width: '100%',
              marginTop: 6,
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
            <Animated.Text style={[{ fontSize: 13, color: '#94a3b8', fontWeight: '500', flex: 1 }, placeholderStyle]}>
              {currentSuggestion}
            </Animated.Text>
            
            {/* Vertical Divider */}
            <View style={{ width: 1, height: 16, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', marginRight: 10 }} />
            
            <Mic size={16} color="#16a34a" />
          </ScalePressable>
        </BlurView>
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
      {false ? (
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
                ⚠️ Grocery Mart is temporarily closed. Food is open! 🍔
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
                    <ScalePressable
                      key={cat.tag}
                      onLayout={(e) => {
                        const { x, width } = e.nativeEvent.layout;
                        setTabLayouts(prev => ({ ...prev, [cat.tag]: { x, width } }));
                      }}
                      onPress={() => scrollToCategory(cat.tag)}
                      scaleValue={0.95}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 6,
                        borderRadius: 99,
                        borderWidth: 1,
                        borderColor: isActive ? 'transparent' : (isDarkMode ? '#27272a' : '#e2e8f0'),
                        backgroundColor: isActive ? 'transparent' : (isDarkMode ? '#27272a' : '#f8fafc'),
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        zIndex: 10,
                      }}
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
                    </ScalePressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          <Animated.ScrollView 
            ref={scrollViewRef}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            showsVerticalScrollIndicator={false}
            className="flex-1 bg-white dark:bg-zinc-950"
            contentContainerStyle={{ paddingTop: scrollViewPaddingTop, paddingBottom: 160 }}
            entering={FadeIn.duration(220)}
          >

            {/* Food Visual Cover Banner */}
            <View className="mx-4 mt-4 mb-6 rounded-3xl border border-[#3e241b] dark:border-amber-500/20 shadow-lg relative overflow-hidden">
              <LinearGradient
                colors={['#2a1711', '#1d0e0a', '#120805']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View className="p-5 flex-row justify-between items-center w-full">
                <View className="absolute right-[-10px] top-[-10px] opacity-10">
                  <Text className="text-8xl">🍔</Text>
                </View>
                <View className="z-10 flex-1 pr-4">
                  <View className="flex-row items-center gap-1.5 bg-amber-500/20 border border-amber-500/20 px-2.5 py-0.5 rounded-full self-start">
                    <Text className="text-amber-300 text-[8px] font-black uppercase tracking-wider">FastKirana Food 🍔</Text>
                  </View>
                  <Text className="text-white text-xl font-black mt-3 leading-6">Freshly Prepared.{"\n"}Fast Delivered.</Text>
                  <Text className="text-amber-100/70 text-[10px] mt-1.5 font-bold leading-4">Warm sandwiches, crispy rolls, momos & thick shakes dispatched instantly from our local store kitchen.</Text>
                </View>
                <View className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl items-center justify-center shadow-xs">
                  <Text className="text-4xl">🥪</Text>
                </View>
              </View>
            </View>

            {/* Render Food grouped sections */}
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

                {/* Food Product Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 }}>
                  {section.products.map((product: any, idx: number) => {
                    const cardWidth = windowWidth >= 900 ? '23.5%' : (windowWidth >= 600 ? '31.5%' : '48%');
                    return (
                      <View key={product.id} style={{ width: cardWidth, marginBottom: 16 }}>
                        <ProductCard product={product} className="w-full" index={idx} />
                      </View>
                    );
                  })}
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
                    <Text className="text-slate-400 dark:text-zinc-400 text-[10px] font-semibold">Additional food items and specials</Text>
                  </View>
                </View>

                {/* Food Product Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 8 }}>
                  {categorySections.moreItems.map((product: any, idx: number) => {
                    const cardWidth = windowWidth >= 900 ? '23.5%' : (windowWidth >= 600 ? '31.5%' : '48%');
                    return (
                      <View key={product.id} style={{ width: cardWidth, marginBottom: 16 }}>
                        <ProductCard product={product} className="w-full" index={idx} />
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View className="h-28" />
          </Animated.ScrollView>

          {/* Floating Menu Button (Swiggy Style FAB) */}
          {showFloatingMenuBtn && menuCategories.length > 0 && !isMenuOpen && (
            <View className="absolute bottom-24 left-0 right-0 items-center z-30">
              <ScalePressable
                onPress={() => {
                  setIsMenuOpen(true);
                }}
                scaleValue={0.95}
                style={{
                  backgroundColor: '#0f172a',
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#1e293b' : '#334155',
                  paddingHorizontal: 20,
                  paddingVertical: 12,
                  borderRadius: 99,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 10,
                    },
                    android: {
                      elevation: 6,
                    }
                  })
                }}
              >
                <Menu size={14} color="#fff" strokeWidth={3} />
                <Text className="text-white font-black text-xs uppercase tracking-wider">Menu</Text>
              </ScalePressable>
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
                  <Text className="text-slate-800 dark:text-zinc-100 font-black text-xs uppercase tracking-wider">Browse Food Categories</Text>
                  <ScalePressable 
                    onPress={() => setIsMenuOpen(false)}
                    scaleValue={0.9}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={16} color={isDarkMode ? "#a1a1aa" : "#64748b"} />
                  </ScalePressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
                  <View className="gap-2 pb-6">
                    {menuCategories.map((cat) => {
                      const isActive = activeCategory === cat.tag;
                      return (
                        <ScalePressable
                          key={cat.tag}
                          onPress={() => scrollToCategory(cat.tag)}
                          scaleValue={0.97}
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: 12,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: isActive 
                              ? (isDarkMode ? 'rgba(244,63,94,0.3)' : '#fecdd3')
                              : (isDarkMode ? '#27272a' : '#f1f5f9'),
                            backgroundColor: isActive
                              ? (isDarkMode ? 'rgba(244,63,94,0.1)' : '#fff5f5')
                              : (isDarkMode ? '#18181b' : '#ffffff'),
                          }}
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
                        </ScalePressable>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            </>
          )}
        </>
      ) : true ? (
        // Grocery Storefront View (matching the screenshot exactly)
         <Animated.ScrollView 
          onScroll={handleGroceryScroll}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          className="flex-1 bg-white dark:bg-zinc-950" 
          contentContainerStyle={{ backgroundColor: 'transparent', paddingTop: scrollViewPaddingTop, paddingBottom: 160 }} 
          showsVerticalScrollIndicator={false}
          entering={FadeIn.duration(220)}
        >
          {/* Top Promotional Carousel Banner */}
          <GroceryPromoCarousel />

          {!groceryMartOpen && (
            <BlurView
              intensity={isDarkMode ? 45 : 75}
              tint={isDarkMode ? 'dark' : 'light'}
              style={{
                marginHorizontal: 16,
                marginTop: 12,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: isDarkMode ? 'rgba(226, 10, 34, 0.2)' : 'rgba(226, 10, 34, 0.12)',
                backgroundColor: isDarkMode ? 'rgba(28, 28, 30, 0.85)' : 'rgba(255, 241, 242, 0.85)',
                overflow: 'hidden',
                paddingVertical: 10,
                paddingHorizontal: 14,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                ...Platform.select({
                  ios: {
                    shadowColor: '#e20a22',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                  },
                  android: {
                    elevation: 1,
                  }
                })
              }}
            >
              <Text style={{ fontSize: 16 }}>🌙</Text>
              <View style={{ flex: 1 }}>
                <Text allowFontScaling={false} style={{ color: '#e20a22', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  Mart is currently closed
                </Text>
                <Text allowFontScaling={false} style={{ color: isDarkMode ? '#a1a1aa' : '#475569', fontSize: 9.5, fontWeight: '700', marginTop: 1 }}>
                  Pre-orders are open! Explore items and build your cart. We reopen at 7:00 AM.
                </Text>
              </View>
            </BlurView>
          )}

          {/* Category Grid Section Title */}
          <View className="px-4 flex-row justify-between items-center mb-3">
            <Text className="text-base font-black tracking-tight" style={{ color: isDarkMode ? '#fafafa' : '#1e293b' }}>Trending Categories</Text>
            <ScalePressable 
              onPress={() => {
                router.push('/(tabs)/categories');
              }}
              scaleValue={0.93}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDarkMode ? 'rgba(226,10,34,0.12)' : '#fff1f2',
                paddingHorizontal: 9,
                paddingVertical: 4.5,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(226,10,34,0.25)' : '#ffe4e6',
                gap: 2,
              }}
            >
              <Text className="text-rose-600 dark:text-rose-450 font-extrabold text-[10px] uppercase tracking-wider">See all</Text>
              <ChevronRight size={11} color="#e20a22" strokeWidth={3} />
            </ScalePressable>
          </View>

          {/* Category Grid (2 rows x 4 icons) */}
          <CategoryGrid />

          {/* Active Order Tracker */}
          {activeOrder && (
            <ScalePressable 
              onPress={() => {
                router.push(`/order/${activeOrder.id}`);
              }}
              scaleValue={0.98}
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                borderRadius: 16,
                overflow: 'hidden',
              }}
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
            </ScalePressable>
          )}

          {/* Reorder Last Order Banner */}
          {!activeOrder && lastCompletedOrder && (
            <ScalePressable 
              onPress={handleReorderLast}
              scaleValue={0.97}
              haptic="medium"
              style={{
                marginHorizontal: 16,
                marginBottom: 18,
                borderRadius: 18,
                overflow: 'hidden',
                shadowColor: isDarkMode ? '#e11d48' : '#fda4af',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDarkMode ? 0.15 : 0.25,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <LinearGradient
                colors={isDarkMode ? ['#1e1b4b', '#0f172a'] : ['#fff7ed', '#fff1f2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 15,
                  borderWidth: 1.2,
                  borderColor: isDarkMode ? '#312e81' : '#fecdd3',
                  borderRadius: 18,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, paddingRight: 20 }}>
                  <View className="w-11 h-11 rounded-full bg-rose-500/10 dark:bg-rose-500/15 items-center justify-center border border-rose-500/20 shrink-0">
                    <RefreshCw size={18} color="#e11d48" strokeWidth={2.5} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: isDarkMode ? '#f4f4f5' : '#1e293b', letterSpacing: 0.1 }} numberOfLines={1}>
                        Reorder Last Order
                      </Text>
                      <View className="bg-rose-500/10 px-1.5 py-0.5 rounded-md shrink-0">
                        <Text className="text-rose-600 dark:text-rose-400 text-[8px] font-black uppercase">Quick</Text>
                      </View>
                    </View>
                    <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 10, fontWeight: '500', marginTop: 3 }} numberOfLines={1}>
                      {lastCompletedOrder.items?.map((it: any) => it.name).join(', ')}
                    </Text>
                  </View>
                </View>
                
                <View style={{ overflow: 'hidden', borderRadius: 99 }}>
                  <LinearGradient
                    colors={['#ea580c', '#e11d48']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4
                    }}
                  >
                    <Text className="text-white font-black text-[10px] uppercase tracking-wider">Reorder</Text>
                    <ChevronRight size={12} color="#fff" strokeWidth={3.5} />
                  </LinearGradient>
                </View>
              </LinearGradient>
            </ScalePressable>
          )}

          {/* Curated For You (Deals Curation Hub) */}
          {isReady ? (
            <>
              <DealsCurationHub products={products} isLoading={isLoading} />
              <DeliveryBanner />
              <AppFooter />
            </>
          ) : (
            <View style={{ height: 300, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator size="small" color="#e11d48" />
            </View>
          )}
          </Animated.ScrollView>
      ) : (
        // Store Completely Closed View (both Grocery and Cafe closed)
        <StoreClosedPremiumView isDarkMode={isDarkMode} paddingTop={scrollViewPaddingTop} />
      )}

      {/* Shared Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={88} />
    </View>
  );
}
