import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, ScrollView, Pressable, FlatList, NativeSyntheticEvent, NativeScrollEvent, Platform, useWindowDimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronRight, Sparkles, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { triggerHaptic } from '../../lib/haptic';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../lib/constants';
import { getAppImageSource } from '../../lib/utils';
import { THEME } from '../../lib/theme';
import { useTheme } from '../../app/context/ThemeContext';


// Sizing constants removed from global scope to use responsive useWindowDimensions inside component hook

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
    gradient: ['#e20a22', '#ff5a5a'], // Brand Red/Rose
    route: '/category/grocery-essential',
    params: { slug: 'grocery-essential' },
    emoji: '🌾',
  },
  {
    id: 'slide-2',
    title: 'Fresh Fruits & Veggies',
    subtitle: 'Direct from farms to your kitchen in 10 minutes',
    badge: '100% ORGANIC',
    actionText: 'Order Fresh',
    gradient: ['#10b981', '#059669'], // Emerald Green
    route: '/category/fruits-vegetables',
    params: { slug: 'fruits-vegetables' },
    emoji: '🥬',
  },
  {
    id: 'slide-3',
    title: 'Snack Attack Essentials',
    subtitle: 'Chips, cold beverages & chocolates delivered hot',
    badge: 'MOVIE NIGHT SPECIAL',
    actionText: 'Grab Munchies',
    gradient: ['#f59e0b', '#d97706'], // Amber Yellow
    route: '/category/snacks-biscuits',
    params: { slug: 'snacks-biscuits' },
    emoji: '🍿',
  },
  {
    id: 'slide-4',
    title: 'Hot Food & Pizza',
    subtitle: 'Craving fresh food specials & snacks right now?',
    badge: 'LIVE KITCHEN',
    actionText: 'Order Food',
    gradient: ['#6366f1', '#4f46e5'], // Indigo Blue
    route: '/cafe',
    params: { slug: 'cafe' },
    emoji: '🍔',
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
  const carouselWidth = screenWidth > 768 ? 508 : screenWidth - 32; // match container margins
  const isSmallDevice = screenWidth < 360;
  const carouselHeight = isSmallDevice ? 124 : 140;

  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoplayTimerRef = useRef<any | null>(null);

  // Fetch active banners from server
  const { data: serverBanners = [] } = useQuery<any[]>({
    queryKey: ['promo-banners-grocery'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/banners?type=grocery`);
      if (!res.ok) throw new Error('API failed');
      return res.json();
    },
    staleTime: 1000 * 60 * 10, // 10 mins cache
  });

  const displaySlides = useMemo(() => {
    if (serverBanners && serverBanners.length > 0) {
      return serverBanners.map((b: any) => {
        let colors: [string, string] = ['#ea580c', '#f97316'];
        if (b.gradient) {
          if (b.gradient.includes('from-rose-500')) colors = ['#f43f5e', '#fb7185'];
          else if (b.gradient.includes('from-emerald-600')) colors = ['#059669', '#34d399'];
          else if (b.gradient.includes('from-pink-500')) colors = ['#ec4899', '#fbcfe8'];
          else if (b.gradient.includes('from-violet-600')) colors = ['#7c3aed', '#c084fc'];
          else if (b.gradient.includes('from-primary') || b.gradient.includes('from-rose-600')) colors = ['#e20a22', '#ff5a5a'];
          else if (b.gradient.includes('from-accent')) colors = ['#10b981', '#059669'];
          else if (b.gradient.includes('from-discount') || b.gradient.includes('from-amber-600')) colors = ['#f59e0b', '#d97706'];
          else if (b.gradient.includes('from-indigo-900')) colors = ['#312e81', '#4f46e5'];
        }

        let route = '/category/[slug]';
        let slug = 'grocery-essential';
        if (b.linkUrl) {
          if (b.linkUrl === '/cafe' || b.linkUrl.includes('/cafe')) {
            route = '/cafe';
            slug = 'cafe';
          } else if (b.linkUrl.includes('/category/')) {
            slug = b.linkUrl.split('/category/')[1] || 'grocery-essential';
          }
        }

        let emoji = '🎁';
        if (b.type === 'fresh') emoji = '🥬';
        else if (b.type === 'first-order') emoji = '🥛';
        else if (b.type === 'festival') emoji = '🌸';
        else if (b.type === 'snacks') emoji = '🍿';
        else if (b.type === 'express-delivery') emoji = '🚚';
        else if (b.type === 'grocery') emoji = '🛒';
        else if (b.type === 'cafe') emoji = '🍕';

        // Check if imageUrl is valid
        const resolvedImg = b.imageUrl ? getAppImageSource(b.imageUrl) : null;
        const serverImage = resolvedImg ? resolvedImg.uri : null;

        return {
          id: b.id,
          title: b.title,
          subtitle: b.description,
          badge: b.code ? `CODE: ${b.code}` : 'SPECIAL OFFER',
          actionText: b.code ? 'Claim Coupon' : 'Shop Now',
          gradient: colors,
          route: route,
          params: { slug: slug },
          emoji: emoji,
          imageUrl: serverImage
        };
      });
    }
    return PROMO_SLIDES;
  }, [serverBanners]);

  // Autoplay function
  const startAutoplay = () => {
    stopAutoplay();
    if (displaySlides.length <= 1) return;
    autoplayTimerRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % displaySlides.length;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
    }, 4500);
  };

  const stopAutoplay = () => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
    }
  };

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [activeIndex, displaySlides]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    if (index !== activeIndex && index >= 0 && index < displaySlides.length) {
      setActiveIndex(index);
    }
  };

  const handleSlidePress = (slide: any) => {
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
    <View style={{ marginBottom: THEME.SPACING.lg }} className="items-center">
      {/* Carousel list wrapper */}
      <View style={{ width: carouselWidth, height: carouselHeight, borderRadius: THEME.RADIUS.lg }} className="overflow-hidden shadow-sm">
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
              className="relative overflow-hidden"
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
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                  />

                  {/* Aesthetic decor pattern */}
                  <View style={{ position: 'absolute', top: -48, right: -32, width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(255,255,255,0.08)' }} />
                  <View style={{ position: 'absolute', bottom: -32, left: -24, width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                  {/* Content Row */}
                  <View style={{ padding: isSmallDevice ? 10 : 16 }} className="flex-row flex-1 items-center justify-between z-10">
                    {/* Text Layout */}
                    <View style={{ paddingRight: isSmallDevice ? 6 : 16, paddingVertical: isSmallDevice ? 1 : 4 }} className="flex-1 justify-between h-full">
                      {/* Badge */}
                      <View style={{ borderRadius: THEME.RADIUS.xs, paddingHorizontal: isSmallDevice ? 5 : 8, paddingVertical: isSmallDevice ? 1 : 2 }} className="bg-white/20 self-start flex-row items-center gap-1 border border-white/10">
                        <Sparkles size={8} color="#fff" />
                        <Text style={{ fontSize: isSmallDevice ? 8.5 : THEME.TYPOGRAPHY.sizes.micro, fontWeight: '750' as any }} className="text-white tracking-wider uppercase">{item.badge}</Text>
                      </View>

                      {/* Heading Group */}
                      <View className="mt-1">
                        <Text style={{ fontSize: isSmallDevice ? THEME.TYPOGRAPHY.sizes.body : THEME.TYPOGRAPHY.sizes.titleSm, fontWeight: '700' }} className="text-white tracking-tight leading-tight">
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: isSmallDevice ? THEME.TYPOGRAPHY.sizes.micro : THEME.TYPOGRAPHY.sizes.caption, fontWeight: '500' }} className="text-white/80 mt-0.5 leading-tight" numberOfLines={isSmallDevice ? 1 : 2}>
                          {item.subtitle}
                        </Text>
                      </View>

                      {/* Call-to-action button */}
                      <View style={{ borderRadius: THEME.RADIUS.xs, paddingHorizontal: isSmallDevice ? 8 : 12, paddingVertical: isSmallDevice ? 4 : 6 }} className="bg-white self-start flex-row items-center gap-1 mt-2 active:scale-95">
                        <Text style={{ color: item.gradient[0], fontSize: isSmallDevice ? 8.5 : THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700' }} className="uppercase tracking-wider">
                          {item.actionText}
                        </Text>
                        <ChevronRight size={10} color={item.gradient[0]} strokeWidth={3} />
                      </View>
                    </View>

                    {/* Big Visual Emoji Backdrop */}
                    <View style={{ width: isSmallDevice ? 48 : 64, height: isSmallDevice ? 48 : 64, borderRadius: THEME.RADIUS.sm }} className="bg-white/15 items-center justify-center border border-white/10 shadow-sm">
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
        <View className="flex-row gap-1.5 justify-center mt-2.5">
          {displaySlides.map((_, idx) => (
            <PaginationDot key={idx} isActive={idx === activeIndex} isDarkMode={isDarkMode} />
          ))}
        </View>
      )}
    </View>
  );
}
