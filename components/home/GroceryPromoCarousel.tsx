import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable, FlatList } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Image as ExpoImage } from 'expo-image';
import { Sparkles, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-keys';
import { THEME } from '../../lib/theme';
import { useTheme } from '../../app/context/ThemeContext';
import { triggerHaptic } from '../../lib/haptic';
import { getAppImageSource } from '../../lib/utils';
import { API_BASE_URL } from '../../lib/constants';
import { ScalePressable } from '../shared/ScalePressable';
import { useWindowDimensions } from 'react-native';

const AUTOPLAY_INTERVAL = 4500;

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  actionText: string;
  gradient: [string, string];
  route: string;
  params: { slug: string };
  emoji: string;
}

const PROMO_SLIDES: BannerSlide[] = [
  {
    id: 'slide-1',
    title: 'Super Saver Staples',
    subtitle: 'Daily Atta, Dal, Oils & Ghee at Wholesale prices',
    badge: 'UP TO 30% OFF',
    actionText: 'Shop Staples',
    gradient: [THEME.COLORS.brand.primary, THEME.COLORS.brand.primaryLight],
    route: '/category/grocery-essential',
    params: { slug: 'grocery-essential' },
    emoji: '\u{1F33E}',
  },
  {
    id: 'slide-2',
    title: 'Fresh Fruits & Veggies',
    subtitle: 'Direct from farms to your kitchen in 10 minutes',
    badge: '100% ORGANIC',
    actionText: 'Order Fresh',
    gradient: ['#10b981', '#059669'],
    route: '/category/fruits-vegetables',
    params: { slug: 'fruits-vegetables' },
    emoji: '\u{1F96C}',
  },
  {
    id: 'slide-3',
    title: 'Snack Attack Essentials',
    subtitle: 'Chips, cold beverages & chocolates delivered hot',
    badge: 'MOVIE NIGHT SPECIAL',
    actionText: 'Grab Munchies',
    gradient: ['#f59e0b', '#d97706'],
    route: '/category/snacks-biscuits',
    params: { slug: 'snacks-biscuits' },
    emoji: '\u{1F37F}',
  },
  {
    id: 'slide-4',
    title: 'Hot Food & Pizza',
    subtitle: 'Craving fresh food specials & snacks right now?',
    badge: 'LIVE KITCHEN',
    actionText: 'Order Food',
    gradient: ['#6366f1', '#4f46e5'],
    route: '/cafe',
    params: { slug: 'cafe' },
    emoji: '\u{1F354}',
  },
];

function PaginationDot({ isActive, isDarkMode }: { isActive: boolean; isDarkMode: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(isActive ? 20 : 6, { damping: 12 }),
      backgroundColor: isActive ? THEME.COLORS.brand.primary : (isDarkMode ? THEME.COLORS.dark.border : THEME.COLORS.light.border),
    };
  }, [isActive, isDarkMode]);

  return (
    <Animated.View
      style={[{ height: 6, borderRadius: 3 }, animatedStyle]}
    />
  );
}

export default function GroceryPromoCarousel() {
  const { width: screenWidth } = useWindowDimensions();
  const isSmallDevice = screenWidth < 360;
  const carouselWidth = screenWidth - THEME.SPACING.lg * 2;
  const carouselHeight = isSmallDevice ? 124 : 140;

  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<any>>(null);
  const autoplayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch active banners from server
  const { data: serverBanners = [] } = useQuery<any[]>({
    queryKey: ['promo-banners-grocery'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/banners?type=grocery`);
      if (!res.ok) throw new Error('API failed');
      return res.json();
    },
    staleTime: 1000 * 60 * 10,
  });

  const displaySlides = useMemo(() => {
    if (serverBanners && serverBanners.length > 0) {
      return serverBanners.map((b: any) => {
        let slideColors: [string, string] = [THEME.COLORS.brand.primary, THEME.COLORS.brand.primaryLight];
        if (b.gradient) {
          if (b.gradient.includes('from-rose-500')) slideColors = ['#f43f5e', '#fb7185'];
          else if (b.gradient.includes('from-emerald-600')) slideColors = ['#059669', '#34d399'];
          else if (b.gradient.includes('from-pink-500')) slideColors = ['#ec4899', '#fbcfe8'];
          else if (b.gradient.includes('from-violet-600')) slideColors = ['#7c3aed', '#c084fc'];
          else if (b.gradient.includes('from-primary') || b.gradient.includes('from-rose-600')) slideColors = [THEME.COLORS.brand.primary, THEME.COLORS.brand.primaryLight];
          else if (b.gradient.includes('from-accent')) slideColors = [THEME.COLORS.brand.success, THEME.COLORS.brand.successLight];
          else if (b.gradient.includes('from-discount') || b.gradient.includes('from-amber-600')) slideColors = [THEME.COLORS.brand.warning, THEME.COLORS.brand.warningLight];
          else if (b.gradient.includes('from-indigo-900')) slideColors = ['#312e81', '#4f46e5'];
        }

        let route = '/category/[slug]';
        let slug = 'grocery-essential';
        if (b.linkUrl) {
          if (b.linkUrl === '/cafe' || b.linkUrl.includes('/cafe')) {
            route = '/cafe';
            slug = 'cafe';
          } else if (b.linkUrl.includes('/category/')) {
            const rawSlug = b.linkUrl.split('/category/')[1] || 'grocery-essential';
            slug = rawSlug;
          } else {
            slug = b.linkUrl;
          }
        }

        let emoji = '\u{1F381}';
        if (b.type === 'fresh') emoji = '\u{1F96C}';
        else if (b.type === 'first-order') emoji = '\u{1F95B}';
        else if (b.type === 'festival') emoji = '\u{1F338}';
        else if (b.type === 'snacks') emoji = '\u{1F37F}';
        else if (b.type === 'express-delivery') emoji = '\u{1F69A}';
        else if (b.type === 'grocery') emoji = '\u{1F6D2}';
        else if (b.type === 'cafe') emoji = '\u{1F354}';

        const resolvedImg = b.imageUrl ? getAppImageSource(b.imageUrl) : null;
        const serverImage = resolvedImg ? resolvedImg.uri : null;

        return {
          id: b.id,
          title: b.title,
          subtitle: b.description,
          badge: b.code ? `CODE: ${b.code}` : 'SPECIAL OFFER',
          actionText: b.code ? 'Claim Coupon' : 'Shop Now',
          gradient: slideColors,
          route: route,
          params: { slug: slug },
          emoji: emoji,
          imageUrl: serverImage,
        };
      });
    }
    return PROMO_SLIDES;
  }, [serverBanners]);

  // Autoplay
  const startAutoplay = useCallback(() => {
    stopAutoplay();
    if (displaySlides.length <= 1) return;
    autoplayTimerRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % displaySlides.length;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, AUTOPLAY_INTERVAL);
  }, [activeIndex, displaySlides.length]);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [activeIndex, displaySlides, startAutoplay, stopAutoplay]);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    if (index !== activeIndex && index >= 0 && index < displaySlides.length) {
      setActiveIndex(index);
    }
  };

  const handleSlidePress = (slide: BannerSlide) => {
    triggerHaptic('light');
    if (slide.route === '/cafe') {
      router.push('/cafe');
    } else {
      router.push({
        pathname: '/category/[slug]',
        params: { slug: slide.params.slug }
      });
    }
  };

  return (
    <View style={[styles.container, { marginBottom: THEME.SPACING.lg }]}>
      {/* Carousel list wrapper */}
      <View style={[
        styles.carouselWrapper,
        {
          width: carouselWidth,
          height: carouselHeight,
          borderRadius: THEME.RADIUS.lg,
        }
      ]}>
        <FlatList
          ref={flatListRef}
          data={displaySlides}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollBeginDrag={stopAutoplay}
          onScrollEndDrag={startAutoplay}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => handleSlidePress(item)}
              style={{ width: carouselWidth, height: carouselHeight }}
            >
              {item.imageUrl ? (
                <ExpoImage
                  source={{ uri: item.imageUrl }}
                  contentFit="cover"
                  style={{ width: '100%', height: '100%' }}
                />
              ) : (
                <>
                  {/* Background gradient */}
                  <LinearGradient
                    colors={item.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />

                  {/* Aesthetic decor pattern */}
                  <View style={{ position: 'absolute', top: -48, right: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  <View style={{ position: 'absolute', bottom: -32, left: -24, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                  {/* Content Row */}
                  <View style={[
                    styles.contentRow,
                    { padding: isSmallDevice ? 10 : 16 }
                  ]}>
                    {/* Text Layout */}
                    <View style={{ flex: 1, justifyContent: 'space-between', paddingRight: isSmallDevice ? 6 : 16 }}>
                      {/* Badge */}
                      <View style={[
                        styles.badge,
                        {
                          borderRadius: THEME.RADIUS.xs,
                          paddingHorizontal: isSmallDevice ? 5 : 8,
                          paddingVertical: isSmallDevice ? 1 : 2,
                          backgroundColor: 'rgba(255,255,255,0.2)',
                          borderWidth: 1,
                          borderColor: 'rgba(255,255,255,0.1)',
                          alignSelf: 'flex-start',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        }
                      ]}>
                        <Sparkles size={8} color="#ffffff" />
                        <Text style={{ fontSize: isSmallDevice ? 8.5 : THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: '#ffffff', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                          {item.badge}
                        </Text>
                      </View>

                      {/* Heading Group */}
                      <View style={{ marginTop: 4 }}>
                        <Text style={{ fontSize: isSmallDevice ? THEME.TYPOGRAPHY.sizes.body : THEME.TYPOGRAPHY.sizes.titleSm, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: '#ffffff', letterSpacing: -0.2, lineHeight: 20 }}>
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: isSmallDevice ? THEME.TYPOGRAPHY.sizes.micro : THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.medium, color: 'rgba(255,255,255,0.8)', marginTop: 2, lineHeight: 14 }} numberOfLines={isSmallDevice ? 1 : 2}>
                          {item.subtitle}
                        </Text>
                      </View>

                      {/* Call-to-action button */}
                      <View style={[
                        styles.ctaButton,
                        {
                          borderRadius: THEME.RADIUS.xs,
                          paddingHorizontal: isSmallDevice ? 8 : 12,
                          paddingVertical: isSmallDevice ? 4 : 6,
                          backgroundColor: '#ffffff',
                          alignSelf: 'flex-start',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                          marginTop: 6,
                        }
                      ]}>
                        <Text style={{ color: item.gradient[0], fontSize: isSmallDevice ? 8.5 : THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.bold, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                          {item.actionText}
                        </Text>
                        <ChevronRight size={10} color={item.gradient[0]} strokeWidth={3} />
                      </View>
                    </View>

                    {/* Big Visual Emoji Backdrop */}
                    <View style={[
                      styles.emojiContainer,
                      {
                        width: isSmallDevice ? 48 : 64,
                        height: isSmallDevice ? 48 : 64,
                        borderRadius: THEME.RADIUS.sm,
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.1)',
                      }
                    ]}>
                      <Text style={{ fontSize: isSmallDevice ? 24 : 32 }}>{item.emoji}</Text>
                    </View>
                  </View>
                </>
              )}
            </Pressable>
          )}
        />
      </View>

      {/* Pagination Indicators (Dots) */}
      {displaySlides.length > 1 && (
        <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: THEME.SPACING.sm }}>
          {displaySlides.map((_, idx) => (
            <PaginationDot key={idx} isActive={idx === activeIndex} isDarkMode={isDarkMode} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  carouselWrapper: {
    overflow: 'hidden',
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  emojiContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
