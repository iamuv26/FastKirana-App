import { View, Text, ScrollView, Dimensions, Pressable } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { triggerHaptic } from '../../lib/haptic';

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
    tag: '☕ CAFE SPECIAL',
    title: 'Warm Brews &\nHot Samosas!',
    desc: 'Delicious snacks from FastKirana Cafe, prepared fresh.',
    colors: ['#d97706', '#92400e'] as [string, string],
    code: 'CAFE20',
  },
  {
    id: 3,
    tag: '🥬 FRESH HARVEST',
    title: 'Farm Fresh Fruits\n& Vegetables!',
    desc: 'Directly sourced from fields for healthy everyday meals.',
    colors: ['#059669', '#065f46'] as [string, string],
    code: 'FRESH25',
  }
];

function PaginationDot({ isActive }: { isActive: boolean }) {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(isActive ? 20 : 6, { damping: 12 }),
      backgroundColor: isActive ? '#e20a22' : '#cbd5e1',
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
    <Animated.View entering={FadeIn.duration(300)} className="mb-5 overflow-hidden">
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        style={{ width: width, height: 160 }}
      >
        {BANNERS.map((banner) => (
          <View
            key={banner.id}
            style={{ width: width, paddingHorizontal: 16, height: 160 }}
          >
            <Pressable
              onPress={() => triggerHaptic('light')}
              style={({ pressed }) => [{
                width: '100%',
                height: 160,
                transform: [{ scale: pressed ? 0.98 : 1 }]
              }]}
              className="rounded-2xl overflow-hidden shadow-sm shadow-slate-200/50"
            >
              <LinearGradient
                colors={banner.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View className="p-6 relative flex-col justify-between h-full w-full">
                {/* Glossy decorative background accents */}
                <View className="absolute right-[-40px] top-[-40px] w-48 h-48 rounded-full border border-white/5 bg-white/[0.03] z-0" />
                <View className="absolute right-[-20px] bottom-[-20px] w-36 h-36 rounded-full border border-white/10 bg-white/[0.05] z-0" />

                {/* Overlay Graphic */}
                <View className="absolute right-[-10px] bottom-[-10px] opacity-15 z-0">
                  <ShoppingBag size={110} color="#fff" />
                </View>

                <View className="z-10 flex-1">
                  <Text className="text-white text-[9px] font-black uppercase tracking-widest bg-white/25 px-2.5 py-1 rounded-full self-start">
                    {banner.tag}
                  </Text>
                  <Text className="text-white text-xl font-black mt-2.5 leading-6">
                    {banner.title}
                  </Text>
                  <Text className="text-rose-100/90 text-xs mt-1" numberOfLines={1}>
                    {banner.desc}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center z-10 mt-2">
                  <View className="bg-white/20 border border-white/10 px-2.5 py-1 rounded-lg">
                    <Text className="text-white font-extrabold text-[10px]">CODE: {banner.code}</Text>
                  </View>
                  <View className="bg-white px-4 py-2 rounded-xl shadow-md shadow-black/10">
                    <Text style={{ color: banner.colors[0] }} className="font-black text-[10px] uppercase tracking-wider">
                      Order Now
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
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
