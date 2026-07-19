import { View, Text, ScrollView, Dimensions, Pressable } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ScalePressable } from '../shared/ScalePressable';
import { triggerHaptic } from '../../lib/haptic';
import { THEME } from '../../lib/theme';

const { width } = Dimensions.get('window');
const bannerWidth = width;

const BANNERS = [
  {
    id: 1,
    tag: '⚡ FASTEST',
    title: 'Ghar Ka Samaan,\nChutkiyon Mein!',
    desc: 'Get fresh groceries delivered in 8 minutes to Ghatampur.',
    colors: ['#e20a22', '#80030e'] as [string, string],
    code: 'FAST8',
  },
  {
    id: 2,
    tag: '🍔 FOOD SPECIAL',
    title: 'Warm Brews &\nHot Samosas!',
    desc: 'Delicious snacks from FastKirana Food, prepared fresh.',
    colors: ['#ea580c', '#9a3412'] as [string, string],
    code: 'FOOD20',
  },
  {
    id: 3,
    tag: '🥬 FRESH HARVEST',
    title: 'Farm Fresh Fruits\n& Vegetables!',
    desc: 'Directly sourced from fields for healthy everyday meals.',
    colors: ['#10b981', '#065f46'] as [string, string],
    code: 'FRESH25',
  }
];

function PaginationDot({ isActive }: { isActive: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(isActive ? 20 : 6, { damping: 12 }),
      backgroundColor: isActive ? THEME.COLORS.brand.primary : THEME.COLORS.light.border,
    };
  }, [isActive]);

  return (
    <Animated.View
      style={[{ height: 6, borderRadius: 3 }, animatedStyle]}
    />
  );
}

export default function HeroBanner() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = (activeIndex + 1) % BANNERS.length;
      setActiveIndex(nextIndex);
      scrollViewRef.current?.scrollTo({
        x: nextIndex * bannerWidth,
        animated: true,
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const handleMomentumScrollEnd = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / bannerWidth);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  return (
    <Animated.View entering={FadeIn.duration(300)} style={{ marginBottom: THEME.SPACING.lg }} className="overflow-hidden">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={{ width: width, height: 170 }}
      >
        {BANNERS.map((banner) => (
          <View
            key={banner.id}
            style={{ width: width, paddingHorizontal: 16, height: 170 }}
          >
            <ScalePressable
              onPress={() => {}}
              scaleValue={0.98}
              style={{
                width: '100%',
                height: 170,
              }}
              className="rounded-2xl overflow-hidden shadow-sm"
            >
              <LinearGradient
                colors={banner.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View className="p-6 relative flex-col justify-between h-full w-full">
                {/* Glossy decorative background accents */}
                <View style={{ position: 'absolute', right: -40, top: -40, width: 192, height: 192, borderRadius: 96, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.03)', zIndex: 0 }} />
                <View style={{ position: 'absolute', right: -20, bottom: -20, width: 144, height: 144, borderRadius: 72, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 0 }} />

                {/* Overlay Graphic */}
                <View className="absolute right-[-10px] bottom-[-10px] opacity-15 z-0">
                  <ShoppingBag size={130} color="#fff" />
                </View>

                {/* Tag & Offer */}
                <View className="flex-row items-center justify-between z-10">
                  <View className="bg-white/20 px-2.5 py-1 rounded-md">
                    <Text className="text-white font-extrabold text-[9px] uppercase tracking-wider">{banner.tag}</Text>
                  </View>
                  <View className="bg-white/10 px-2 py-0.5 rounded-full flex-row items-center gap-1">
                    <Text className="text-white text-[8px] font-bold">10 Mins</Text>
                  </View>
                </View>

                {/* Heading & Button */}
                <View className="flex-row justify-between items-end z-10">
                  <View className="flex-1 pr-4">
                    <Text className="text-white font-black text-lg leading-tight uppercase" style={{ letterSpacing: -0.5 }}>{banner.title}</Text>
                    <Text className="text-white/85 text-[10px] font-bold mt-1">{banner.desc}</Text>
                  </View>
                  <View className="bg-white px-4 py-2 rounded-xl shadow-md">
                    <Text style={{ color: banner.colors[0], fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700' }} className="uppercase tracking-wider">
                      Order Now
                    </Text>
                  </View>
                </View>
              </View>
            </ScalePressable>
          </View>
        ))}
      </ScrollView>

      {/* Dynamic Animated Pagination indicators */}
      <View className="flex-row justify-center items-center gap-1.5 mt-3">
        {BANNERS.map((_, index) => (
          <PaginationDot key={index} isActive={activeIndex === index} />
        ))}
      </View>
    </Animated.View>
  );
}
