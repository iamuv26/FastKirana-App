import { View, Text, ScrollView, Pressable, ActivityIndicator, TextInput, Alert, StyleSheet, Platform, Image as RNImage, useWindowDimensions, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useState, useEffect, useMemo, useRef, useCallback, memo } from 'react';
import { ShoppingBag, ChevronDown, ChevronRight, MapPin, Search, Zap, Clock, ShieldCheck, RefreshCw, Moon, Sun, Package, Heart, Menu, X, Check, Mic, Coffee, Utensils, Bell, Sparkles } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedScrollHandler, withSpring, withRepeat, withTiming, withSequence, withDelay, Easing, FadeIn, FadeInDown, FadeInUp, FadeOut, ZoomIn, interpolate, runOnJS, cancelAnimation } from 'react-native-reanimated';
import CategoryGrid from '../../components/home/CategoryGrid';
import StoreSelectorHeader from '../../components/shared/StoreSelectorHeader';
import Logo from '../../components/shared/Logo';
import ProductCard, { Product } from '../../components/product/ProductCard';
import ProductCardSkeleton from '../../components/product/ProductCardSkeleton';
import { FoodSpecialCard } from '../../components/restaurant/FoodSpecialCard';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import CartQuickPreviewSheet from '../../components/shared/CartQuickPreviewSheet';
import { useTheme } from '../context/ThemeContext';
import { ScalePressable } from '../../components/shared/ScalePressable';
import { useCartActions } from '../../hooks/use-cart';
import DealsCurationHub from '../../components/home/DealsCurationHub';
import DeliveryBanner from '../../components/home/DeliveryBanner';
import TimeGreetingHero from '../../components/home/TimeGreetingHero';
import GroceryPromoCarousel from '../../components/home/GroceryPromoCarousel';
import AppFooter from '../../components/home/AppFooter';
import AddressQuickSwitcherSheet from '../../components/shared/AddressQuickSwitcherSheet';
import BrandedTopHeader from '../../components/shared/BrandedTopHeader';
import { useAuthStore } from '../../stores/auth-store';
import { useUIStore } from '../../stores/ui-store';
import { API_BASE_URL, ORDER_STATUS_LABELS } from '../../lib/constants';
import { sendLocalNotification } from '../../lib/push-notifications';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';
import { useResponsive, getCenteredContainerStyle } from '../../lib/responsive';
import { useScrollTabBar } from '../../hooks/use-scroll-tab-bar';
import { formatPrice, formatHeaderAddress, getAppImageSource, isRestaurantProduct, formatDisplayOrderId } from '../../lib/utils';
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
  const responsive = useResponsive();

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
      {/* Background blobs - full width */}
      {/* Gradient mesh background blobs */}
      <Animated.View
        style={[blob1Style, {
          position: 'absolute',
          top: '8%',
          left: -60,
          width: 320,
          height: 320,
          borderRadius: 160,
          opacity: isDarkMode ? 0.12 : 0.1,
        }]}
      >
        <LinearGradient
          colors={(isDarkMode ? ['#e20a22', '#ff8787', '#e20a22'] : ['#fecdd3', '#fda4af', '#fecdd3']) as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: '100%', height: '100%', borderRadius: 160 }}
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
          colors={(isDarkMode ? ['#7c3aed', '#c084fc', '#7c3aed'] : ['#ddd6fe', '#d8b4fe', '#ddd6fe']) as any}
          style={{ width: 240, height: 240, borderRadius: 120 }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Responsive content wrapper */}
      <View style={{ flex: 1, ...getCenteredContainerStyle(responsive) }}>
      {/* Scrollable Container */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: paddingTop + 12,
          paddingHorizontal: responsive.spacing.page,
          paddingBottom: 180,
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
            {"We'll be back at"}
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
            Our team is resting up to bring you the freshest groceries & treats tomorrow!
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
                    {"You'll be Notified!"}
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
  const responsive = useResponsive();
  const width = responsive.isLargeScreen
    ? Math.min(responsive.contentMaxWidth, windowWidth > 0 ? windowWidth : 1024)
    : (windowWidth > 0 ? windowWidth : 390);

  const [headerHeight, setHeaderHeight] = useState(0);
  const [foodSectionY, setFoodSectionY] = useState(0);

  const scrollViewPaddingTop = headerHeight > 0
    ? headerHeight + 12
    : (insets.top > 0
      ? insets.top + (responsive.isTablet ? 230 : responsive.isLargeScreen ? 245 : 215)
      : (responsive.isLargeScreen ? 245 : 220));
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
  const selectedLocation = useUIStore((s) => s.selectedLocation);
  const assignedStoreId = useUIStore((s) => s.assignedStoreId);
  const validStoreId = (assignedStoreId && !assignedStoreId.startsWith('default-')) ? assignedStoreId : null;
  const [showAddressSheet, setShowAddressSheet] = useState(false);
  const [showCartSheet, setShowCartSheet] = useState(false);

  // Home states and refs
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { onScroll: onTabBarScroll, onTouchStart: onTabBarTouchStart } = useScrollTabBar();
  const scrollViewRef = useRef<any>(null);
  const horizontalTabsRef = useRef<ScrollView>(null);
  const lastScrollCheck = useRef(0);

  const [localActiveSegment, setLocalActiveSegment] = useState<'grocery' | 'food'>('grocery');
  const [isSwitching, setIsSwitching] = useState<'none' | 'grocery' | 'food'>('none');
  const loaderTranslateX = useSharedValue(-150);
  const loaderTranslateY = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isSwitching !== 'none') {
      loaderTranslateX.value = -150;
      loaderTranslateX.value = withRepeat(
        withTiming(width > 0 ? width : 400, { duration: 480, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
    } else {
      loaderTranslateX.value = -150;
    }
  }, [isSwitching, width]);

  const loaderAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: loaderTranslateX.value }]
  }));

  const tabIndicatorTranslateX = useSharedValue(0);
  const [measuredPillWidth, setMeasuredPillWidth] = useState(width * 0.92);

  useFocusEffect(
    useCallback(() => {
      setIsSwitching('grocery');
      setLocalActiveSegment('grocery');
      tabIndicatorTranslateX.value = withTiming(0, { duration: 120 });
      setIsReady(true);

      const timer = setTimeout(() => {
        setIsSwitching('none');
      }, 400); // Hold for 400ms for a smooth transition!
      return () => clearTimeout(timer);
    }, [])
  );

  // ── Stable renderItem for both FlashLists (prevents scroll jitter) ──
  const renderProductCard = useCallback(({ item, index }: any) => (
    <ProductCard product={item} className="w-full" index={index} />
  ), []);
  const productKeyExtractor = useCallback((item: any) => item.id, []);
  const ItemSeparator = useMemo(() => () => <View style={{ height: 16 }} />, []);

  const slidingIndicatorStyle = useAnimatedStyle(() => {
    const translationX = interpolate(
      tabIndicatorTranslateX.value,
      [0, 1],
      [0, 100]
    );
    return {
      transform: [{ translateX: `${translationX}%` }],
    };
  });

  const reelAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: loaderTranslateY.value }],
  }));

  // Removed Cafe UI conditional states
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  // Removed Reanimated layout tracking for gliding tab indicator

  // Collapsible sticky header scroll tracking
  const scrollY = useSharedValue(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      'worklet';
      scrollY.value = event.contentOffset.y;
    },
  });

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
    refetchInterval: 5000,
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

    toast.success("Reordered! 🛍️ All items from your previous order have been added to your cart.");
  };



  // Redundant 8s refetch interval removed as useQuery('active-orders') already polls every 5 seconds.

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
        `Your order #${formatDisplayOrderId(activeOrder.id, activeOrder.readableId)} is now ${statusLabel.toLowerCase()}!`
      );
    }
    prevStatusRef.current = activeOrder.status;
  }, [activeOrder]);

  // Fetch ALL live products from Next.js backend (no hardcoded fallback)
  const { data: products = [], isLoading, refetch: refetchAllProducts } = useQuery<Product[]>({
    queryKey: ['home-products', validStoreId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?limit=500${validStoreId ? `&storeId=${validStoreId}` : ''}`);
      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    staleTime: 60000, // 60s cache validity
    refetchInterval: 90000, // Auto-refetch every 90s for stock sync
  });

  const foodProducts = useMemo(() => {
    return products.filter((p: any) => {
      const catSlug = (p.category?.slug || p.categorySlug || '').toLowerCase();
      const tags = (p.tags || []).map((t: string) => String(t).toLowerCase());
      const name = (p.name || '').toLowerCase();
      return (
        catSlug.includes('restaurant') ||
        tags.includes('restaurant') ||
        tags.includes('food') ||
        tags.includes('wedson') ||
        name.includes('momo') ||
        name.includes('roll') ||
        name.includes('burger') ||
        name.includes('pizza') ||
        name.includes('noodle') ||
        name.includes('shake') ||
        name.includes('coffee')
      );
    }).slice(0, 10);
  }, [products]);

  // Pull-to-refresh implementation
  const [isRefreshing, setIsRefreshing] = useState(false);
  const onRefresh = async () => {
    setIsRefreshing(true);
    triggerHaptic('medium');
    try {
      await Promise.all([
        refetchOrders(),
        refetchAllProducts(),
      ]);
    } catch (e) {
      console.warn('Pull-to-refresh failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const [showModeSwitchLoader, setShowModeSwitchLoader] = useState(true);

  // We should hide the loader only when products are loaded AND we are not transitioning
  useEffect(() => {
    if (!isLoading && isSwitching === 'none') {
      const timer = setTimeout(() => {
        setShowModeSwitchLoader(false);
      }, 500); // 500ms minimum display duration for premium feeling
      return () => clearTimeout(timer);
    } else {
      setShowModeSwitchLoader(true);
    }
  }, [isLoading, isSwitching]);

  useEffect(() => {
    if (showModeSwitchLoader) {
      loaderTranslateY.value = 0;
      loaderTranslateY.value = withRepeat(
        withTiming(-400, { duration: 3000, easing: Easing.linear }),
        -1,
        false
      );
      pulseScale.value = withRepeat(
        withTiming(1.08, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      loaderTranslateY.value = 0;
      pulseScale.value = 1;
    }
  }, [showModeSwitchLoader]);

  const pulsingRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Prefetch top products and categories images in the background to speed up image loading
  useEffect(() => {
    if (products && products.length > 0) {
      const urls = products
        .map((p) => (p.imageUrl ? getAppImageSource(p.imageUrl)?.uri : null))
        .filter((url): url is string => !!url)
        .slice(0, 24); // Prefetch first 24 product images (was 40; reduce RAM/IO during scrolling)
      if (urls.length > 0) {
        ExpoImage.prefetch(urls);
      }
    }
  }, [products]);


  const trendingProducts = useMemo(() => {
    const list = products.filter(p => p.isAvailable !== false && !isRestaurantProduct(p));
    if (list.length > 0) return list.slice(0, 8);
    return [];
  }, [products]);

  const topPicksProducts = useMemo(() => {
    const list = products.filter(p => p.isAvailable !== false && !isRestaurantProduct(p));
    if (list.length > 0) return list.slice(4, 12);
    return [];
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
    const dbBestsellers = products.filter(p => p.isAvailable !== false && (p.tags?.includes('popular') || p.tags?.includes('essential')));
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
        <View 
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - headerHeight) > 1) {
              setHeaderHeight(h);
            }
          }}
          style={{
            paddingHorizontal: 16,
            paddingTop: insets.top > 0 ? insets.top + 5 : 8,
          paddingBottom: 8,
          backgroundColor: isDarkMode ? 'rgba(9, 9, 11, 0.94)' : 'rgba(255, 255, 255, 0.94)',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDarkMode ? 0.15 : 0.02,
              shadowRadius: 6,
            },
            android: {
              elevation: 1,
            },
          }),
        }}>
          {/* Top Row: Branded Header & Location Capsule */}
          <BrandedTopHeader style={{ paddingHorizontal: 0, paddingVertical: 0, borderBottomWidth: 0 }} onLocationPress={() => setShowAddressSheet(true)} />

          {/* Search Box Shortcut right under Branding */}
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
              borderRadius: 22,
              paddingHorizontal: 16,
              height: 42,
              width: '100%',
              marginTop: 4,
              marginBottom: 6,
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
            <Search size={16} color={isDarkMode ? '#a1a1aa' : '#64748b'} style={{ marginRight: 10 }} />
            <Animated.Text style={[{ fontSize: 13, color: '#94a3b8', fontWeight: '600', flex: 1 }, placeholderStyle]}>
              {currentSuggestion}
            </Animated.Text>
            
            {/* Vertical Divider */}
            <View style={{ width: 1, height: 16, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', marginHorizontal: 10 }} />
            
            <Mic size={16} color="#e20a22" />
          </ScalePressable>

          {/* Store Switcher Tab Pills - Zepto / Swiggy Gliding Segmented Control matching media__1785285067014.png */}
          <View 
            onLayout={(e) => {
              const w = e.nativeEvent.layout.width;
              if (w > 0 && Math.abs(w - measuredPillWidth) > 0.5) {
                setMeasuredPillWidth(w);
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              alignSelf: 'stretch',
              width: '100%',
              height: 48,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDarkMode ? '#27272a' : 'rgba(0,0,0,0.06)',
              backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
              padding: 3,
              marginTop: 2,
              marginBottom: 6,
              position: 'relative',
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                },
                android: {
                  elevation: 2,
                },
              }),
            }}
          >
            {/* Sliding Active Pill Background */}
            <Animated.View style={[{
              position: 'absolute',
              width: '48.8%',
              top: 3,
              bottom: 3,
              left: 3,
              borderRadius: 21,
              backgroundColor: localActiveSegment === 'grocery' ? '#e20a22' : '#ea580c',
              shadowColor: localActiveSegment === 'grocery' ? '#e20a22' : '#ea580c',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 4,
            }, slidingIndicatorStyle]} />

            {/* Grocery Segment */}
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setLocalActiveSegment('grocery');
                tabIndicatorTranslateX.value = withTiming(0, { duration: 130, easing: Easing.out(Easing.quad) });
                if (scrollViewRef.current) {
                  scrollViewRef.current.scrollTo({ y: 0, animated: true });
                }
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                zIndex: 2,
                gap: 8,
              }}
            >
              <ShoppingBag size={18} color={localActiveSegment === 'grocery' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569')} strokeWidth={2.2} />
              <View>
                <Text allowFontScaling={false} style={{ fontSize: 13, fontWeight: '900', color: localActiveSegment === 'grocery' ? '#ffffff' : (isDarkMode ? '#fafafa' : '#1e293b'), lineHeight: 15 }}>
                  Grocery
                </Text>
                <Text allowFontScaling={false} style={{ fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5, color: localActiveSegment === 'grocery' ? '#ffffff' : '#64748b', textTransform: 'uppercase' }}>
                  FAST DELIVERY
                </Text>
              </View>
            </Pressable>

            {/* Food Segment */}
            <Pressable
              onPress={() => {
                triggerHaptic('medium');
                setLocalActiveSegment('food');
                tabIndicatorTranslateX.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.quad) });
                router.push('/restaurants');
              }}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                zIndex: 2,
                gap: 8,
              }}
            >
              <Utensils size={18} color={localActiveSegment === 'food' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569')} strokeWidth={2.2} />
              <View>
                <Text allowFontScaling={false} style={{ fontSize: 13, fontWeight: '900', color: localActiveSegment === 'food' ? '#ffffff' : (isDarkMode ? '#fafafa' : '#1e293b'), lineHeight: 15 }}>
                  Food
                </Text>
                <Text allowFontScaling={false} style={{ fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5, color: localActiveSegment === 'food' ? '#fde047' : '#ea580c', textTransform: 'uppercase' }}>
                  RESTAURANT
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
        {/* Hairline underline & Top Loading Progress Bar */}
        {isSwitching !== 'none' ? (
          <View style={{ height: 3, width: '100%', backgroundColor: isDarkMode ? '#27272a' : '#fecdd3', overflow: 'hidden' }}>
            <Animated.View 
              style={[{ height: '100%', width: '45%', backgroundColor: '#e20a22', borderRadius: 2 }, loaderAnimatedStyle]} 
            />
          </View>
        ) : (
          <LinearGradient
            colors={isDarkMode 
              ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0.08)'] 
              : ['rgba(226,232,240,0.8)', 'rgba(226,232,240,0.2)', 'rgba(226,232,240,0.8)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1.2, width: '100%' }}
          />
        )}
      </Animated.View>

      {/* Scrollable Content */}

      {/* Grocery Storefront View (matching the screenshot exactly) */}
         <Animated.ScrollView 
          ref={scrollViewRef}
          onScroll={(e) => {
            scrollY.value = e.nativeEvent.contentOffset.y;
            onTabBarScroll(e);
          }}
          onTouchStart={onTabBarTouchStart}
          scrollEventThrottle={16}
          style={{ flex: 1 }}
          className="flex-1 bg-white dark:bg-zinc-950" 
          contentContainerStyle={{ backgroundColor: 'transparent', paddingTop: scrollViewPaddingTop, paddingBottom: insets.bottom + 195 }} 
          showsVerticalScrollIndicator={false}
          entering={FadeIn.duration(220)}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={isDarkMode ? "#ffffff" : "#e20a22"}
              colors={["#e20a22"]}
            />
          }
        >
          {/* Top Promotional Carousel Banner */}
          <GroceryPromoCarousel />

          {/* Category Grid Section Title */}
          <View className="px-4 flex-row justify-between items-center mb-3 mt-1">
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
                alignSelf: 'stretch',
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
                style={{ width: '100%', padding: 14, borderWidth: 1, borderColor: '#34d399', borderRadius: 16 }}
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
                alignSelf: 'stretch',
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
                  width: '100%',
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

      {/* Shared Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={insets.bottom > 0 ? insets.bottom + 80 : 86} onTap={() => setShowCartSheet(true)} />
      <AddressQuickSwitcherSheet visible={showAddressSheet} onClose={() => setShowAddressSheet(false)} />
      <CartQuickPreviewSheet visible={showCartSheet} onClose={() => setShowCartSheet(false)} />

      {/* 4. Branded Mode Switch Doorstep Loader Screen Overlay */}
      {showModeSwitchLoader && (
        <Animated.View
          entering={FadeIn.duration(150)}
          exiting={FadeOut.duration(150)}
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
              zIndex: 99999,
              justifyContent: 'center',
              alignItems: 'center',
            }
          ]}
        >
          <View style={{ alignItems: 'center', gap: 24 }}>
            {/* Pulsing Outer Rings */}
            <Animated.View
              entering={FadeIn.duration(200)}
              style={[
                {
                  width: 110,
                  height: 110,
                  borderRadius: 55,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.015)',
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  shadowColor: isDarkMode ? '#000000' : '#e2e8f0',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  overflow: 'hidden',
                },
                pulsingRingStyle
              ]}
            >
              <View style={{ height: 50, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' }}>
                <Animated.View style={[{ alignItems: 'center' }, reelAnimatedStyle]}>
                  {(isSwitching === 'food' || (isSwitching === 'none' && localActiveSegment === 'food')
                    ? ['🍕', '🍔', '🥪', '🥢', '🧋', '🍟', '🍜', '🧁', '🍕', '🍔', '🥪', '🥢', '🧋', '🍟', '🍜', '🧁']
                    : ['🛍️', '🍎', '🥦', '🥑', '🥛', '🍳', '🧀', '🍌', '🛍️', '🍎', '🥦', '🥑', '🥛', '🍳', '🧀', '🍌']
                  ).map((emoji, idx) => (
                    <View key={idx} style={{ height: 50, justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 40, lineHeight: 50 }}>{emoji}</Text>
                    </View>
                  ))}
                </Animated.View>
              </View>
            </Animated.View>

            {/* Doorstep Message matching user's splash screen typography */}
            <View style={{ paddingHorizontal: 40, alignItems: 'center', marginTop: 12 }}>
              <Text 
                style={{
                  fontSize: 14.5,
                  fontWeight: '700',
                  color: isDarkMode ? '#a1a1aa' : '#64748b',
                  textAlign: 'center',
                  lineHeight: 22,
                  letterSpacing: -0.2,
                }}
              >
                {isSwitching === 'food' || (isSwitching === 'none' && localActiveSegment === 'food')
                  ? "Cooking fresh food, delivered at your doorstep" 
                  : "Everything you need, delivered at your doorstep"}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
