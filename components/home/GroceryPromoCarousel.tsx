import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChevronRight, Sparkles, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { triggerHaptic } from '../../lib/haptic';

const { width: screenWidth } = Dimensions.get('window');
const carouselWidth = screenWidth > 768 ? 508 : screenWidth - 32; // match container margins

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
    route: '/category/atta-rice-dal',
    params: { slug: 'atta-rice-dal' },
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
    route: '/category/snacks-munchies',
    params: { slug: 'snacks-munchies' },
    emoji: '🍿',
  },
  {
    id: 'slide-4',
    title: 'Cafe Hot Coffee & Pizza',
    subtitle: 'Craving fresh cafe sandwiches & snacks right now?',
    badge: 'LIVE KITCHEN',
    actionText: 'Order Cafe',
    gradient: ['#6366f1', '#4f46e5'], // Indigo Blue
    route: '/cafe',
    params: { slug: 'cafe' },
    emoji: '☕',
  },
];

export default function GroceryPromoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoplayTimerRef = useRef<any | null>(null);

  // Autoplay function
  const startAutoplay = () => {
    stopAutoplay();
    autoplayTimerRef.current = setInterval(() => {
      const nextIndex = (activeIndex + 1) % PROMO_SLIDES.length;
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
  }, [activeIndex]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    if (index !== activeIndex && index >= 0 && index < PROMO_SLIDES.length) {
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
    <View className="mb-6 items-center">
      {/* Carousel list wrapper */}
      <View style={{ width: carouselWidth, height: 135 }} className="rounded-2xl overflow-hidden shadow-sm">
        <FlatList
          ref={flatListRef}
          data={PROMO_SLIDES}
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
              style={{ width: carouselWidth, height: 135 }}
              className="relative overflow-hidden"
            >
              {/* Background gradient */}
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
              />

              {/* Aesthetic decor pattern */}
              <View className="absolute -top-12 -right-8 w-32 h-32 rounded-full bg-white/10" />
              <View className="absolute -bottom-8 -left-6 w-24 h-24 rounded-full bg-white/10" />

              {/* Content Row */}
              <View className="flex-row flex-1 p-4 items-center justify-between z-10">
                {/* Text Layout */}
                <View className="flex-1 pr-4 justify-between h-full py-1">
                  {/* Badge */}
                  <View className="bg-white/20 self-start px-2 py-0.5 rounded-md flex-row items-center gap-1 border border-white/10">
                    <Sparkles size={8} color="#fff" />
                    <Text className="text-white text-[8px] font-black tracking-wider uppercase">{item.badge}</Text>
                  </View>

                  {/* Heading Group */}
                  <View className="mt-1">
                    <Text className="text-white text-lg font-black tracking-tight leading-tight">
                      {item.title}
                    </Text>
                    <Text className="text-white/80 text-[10px] font-bold mt-0.5 leading-tight" numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </View>

                  {/* Call-to-action button */}
                  <View className="bg-white px-3 py-1.5 rounded-lg self-start flex-row items-center gap-1 mt-2 active:scale-95">
                    <Text style={{ color: item.gradient[0] }} className="text-[9px] font-black uppercase tracking-wider">
                      {item.actionText}
                    </Text>
                    <ChevronRight size={10} color={item.gradient[0]} strokeWidth={3} />
                  </View>
                </View>

                {/* Big Visual Emoji Backdrop */}
                <View className="w-16 h-16 rounded-2xl bg-white/15 items-center justify-center border border-white/10 shadow-sm">
                  <Text style={{ fontSize: 32 }}>{item.emoji}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      </View>

      {/* Pagination Indicators (Dots) */}
      <View className="flex-row gap-1.5 justify-center mt-2.5">
        {PROMO_SLIDES.map((_, idx) => {
          const isActive = idx === activeIndex;
          return (
            <View
              key={idx}
              className={`h-1.5 rounded-full ${
                isActive ? 'w-5 bg-rose-600 dark:bg-rose-500' : 'w-1.5 bg-slate-200 dark:bg-zinc-800'
              }`}
              style={Platform.OS === 'web' ? { transition: 'width 0.2s ease' } as any : undefined}
            />
          );
        })}
      </View>
    </View>
  );
}
