import { View, Text, ScrollView, useWindowDimensions, Pressable, StyleSheet, Platform } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { ShoppingBag } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ScalePressable } from '../shared/ScalePressable';
import { triggerHaptic } from '../../lib/haptic';
import { THEME } from '../../lib/theme';
import { useTheme } from '../../app/context/ThemeContext';

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

export default function HeroBanner() {
  const { width } = useWindowDimensions();
  const bannerWidth = width > 0 ? width : 390;
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
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
    <Animated.View entering={FadeIn.duration(300)} style={{ marginBottom: THEME.SPACING.lg, overflow: 'hidden' }}>
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
            style={{ width: width, paddingHorizontal: THEME.SPACING.lg, height: 170 }}
          >
            <ScalePressable
              onPress={() => {}}
              scaleValue={0.98}
              style={{
                width: '100%',
                height: 170,
                borderRadius: THEME.RADIUS.xl,
                overflow: 'hidden',
                ...Platform.select({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.05,
                    shadowRadius: 8,
                  },
                  android: { elevation: 2 },
                }),
              }}
            >
              <LinearGradient
                colors={banner.colors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
              />
              <View style={{ padding: THEME.SPACING.lg, position: 'relative', flexDirection: 'column', justifyContent: 'space-between', height: '100%', width: '100%' }}>
                {/* Glossy decorative background accents */}
                <View style={{ position: 'absolute', right: -40, top: -40, width: 192, height: 192, borderRadius: 96, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.03)', zIndex: 0 }} />
                <View style={{ position: 'absolute', right: -20, bottom: -20, width: 144, height: 144, borderRadius: 72, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 0 }} />

                {/* Overlay Graphic */}
                <View style={{ position: 'absolute', right: -10, bottom: -10, opacity: 0.15, zIndex: 0 }}>
                  <ShoppingBag size={130} color="#fff" />
                </View>

                {/* Tag & Offer */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: THEME.RADIUS.sm }}>
                    <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: THEME.TYPOGRAPHY.weights.extrabold, textTransform: 'uppercase', letterSpacing: 0.5 }}>{banner.tag}</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: THEME.RADIUS.pill, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: THEME.TYPOGRAPHY.weights.bold }}>10 Mins</Text>
                  </View>
                </View>

                {/* Heading & Button */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 10 }}>
                  <View style={{ flex: 1, paddingRight: THEME.SPACING.md }}>
                    <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: THEME.TYPOGRAPHY.weights.black, textTransform: 'uppercase', lineHeight: 20, letterSpacing: -0.5 }}>{banner.title}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 10, fontWeight: THEME.TYPOGRAPHY.weights.bold, marginTop: 4 }}>{banner.desc}</Text>
                  </View>
                  <View style={{ backgroundColor: '#ffffff', paddingHorizontal: 16, paddingVertical: 8, borderRadius: THEME.RADIUS.md }}>
                    <Text style={{ color: banner.colors[0], fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.bold, textTransform: 'uppercase', letterSpacing: 0.3 }}>
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
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: THEME.SPACING.sm }}>
        {BANNERS.map((_, index) => (
          <PaginationDot key={index} isActive={activeIndex === index} isDarkMode={isDarkMode} />
        ))}
      </View>
    </Animated.View>
  );
}
