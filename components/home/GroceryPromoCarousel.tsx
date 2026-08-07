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
import { getAppImageSource, normalizeCategorySlug } from '../../lib/utils';
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
  const carouselHeight = isSmallDevice ? 142 : 160;

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
        let colors: [string, string] = ['#e20a22', '#ff5a5a'];
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
          if (b.linkUrl === '/cafe' || b.linkUrl.includes('/cafe') || b.linkUrl.includes('/restaurant')) {
            route = '/restaurants';
            slug = 'restaurants';
          } else if (b.linkUrl.includes('/category/')) {
            const rawSlug = b.linkUrl.split('/category/')[1] || 'grocery-essential';
            slug = normalizeCategorySlug(rawSlug);
          } else {
            slug = normalizeCategorySlug(b.linkUrl);
          }
        }

        let emoji = '🎁';
        if (b.type === 'fresh') emoji = '🥬';
        else if (b.type === 'first-order') emoji = '🥛';
        else if (b.type === 'festival') emoji = '🌸';
        else if (b.type === 'snacks') emoji = '🍿';
        else if (b.type === 'express-delivery') emoji = '🚚';
        else if (b.type === 'grocery') emoji = '🛒';
        else if (b.type === 'cafe' || b.type === 'food') emoji = '🍕';

        // Check if imageUrl is valid
        const resolvedImg = b.imageUrl ? getAppImageSource(b.imageUrl) : null;
        const serverImage = resolvedImg ? resolvedImg.uri : null;

        // Clean up legacy cafe text in server subtitle if present
        let cleanSubtitle = b.description || '';
        if (cleanSubtitle.toLowerCase().includes('cafe items')) {
          cleanSubtitle = cleanSubtitle.replace(/cafe items/gi, 'Food Specials');
        }

        return {
          id: b.id,
          title: b.title,
          subtitle: cleanSubtitle,
          badge: b.code ? `CODE: ${b.code}` : 'SPECIAL OFFER',
          actionText: b.code ? 'Claim Coupon' : 'SHOP NOW',
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
    if (slide.route === '/cafe' || slide.route === '/restaurants') {
      router.push('/restaurants');
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
      <View style={{ width: carouselWidth, height: carouselHeight, borderRadius: 24 }} className="overflow-hidden shadow-sm">
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
                  <View style={{ position: 'absolute', top: -30, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.1)' }} />
                  <View style={{ position: 'absolute', bottom: -20, left: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.08)' }} />

                  {/* Content Row */}
                  <View style={{ paddingHorizontal: isSmallDevice ? 12 : 16, paddingVertical: isSmallDevice ? 10 : 12 }} className="flex-row flex-1 items-center justify-between z-10">
                    {/* Text Layout */}
                    <View style={{ paddingRight: isSmallDevice ? 8 : 14 }} className="flex-1 justify-between h-full">
                      {/* Badge */}
                      <View style={{ borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 }} className="bg-white/20 self-start flex-row items-center gap-1 border border-white/20">
                        <Sparkles size={9} color="#fff" />
                        <Text style={{ fontSize: isSmallDevice ? 8.5 : 9.5, fontWeight: '800' }} className="text-white tracking-widest uppercase">{item.badge}</Text>
                      </View>

                      {/* Heading Group */}
                      <View style={{ marginVertical: 3 }}>
                        <Text style={{ fontSize: isSmallDevice ? 14 : 16, fontWeight: '800', lineHeight: isSmallDevice ? 18 : 20 }} className="text-white tracking-tight" numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={{ fontSize: isSmallDevice ? 10 : 11, fontWeight: '500', opacity: 0.9, marginTop: 2, lineHeight: 14 }} className="text-white" numberOfLines={2}>
                          {item.subtitle}
                        </Text>
                      </View>

                      {/* Call-to-action button */}
                      <View 
                        style={{ 
                          borderRadius: 20, 
                          paddingHorizontal: isSmallDevice ? 10 : 14, 
                          paddingVertical: isSmallDevice ? 4 : 5.5,
                          backgroundColor: '#ffffff',
                          alignSelf: 'flex-start',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15,
                          shadowRadius: 4,
                          elevation: 3,
                        }}
                      >
                        <Text style={{ color: item.gradient[0] === '#e20a22' ? '#e20a22' : item.gradient[0], fontSize: isSmallDevice ? 9 : 10, fontWeight: '900', letterSpacing: 0.5 }}>
                          {item.actionText}
                        </Text>
                        <ChevronRight size={12} color={item.gradient[0] === '#e20a22' ? '#e20a22' : item.gradient[0]} strokeWidth={3} />
                      </View>
                    </View>

                    {/* Visual Emoji Glass Container */}
                    <View style={{ width: isSmallDevice ? 52 : 62, height: isSmallDevice ? 52 : 62, borderRadius: 20 }} className="bg-white/20 items-center justify-center border border-white/25 shadow-sm">
                      <Text style={{ fontSize: isSmallDevice ? 26 : 32 }}>{item.emoji}</Text>
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
