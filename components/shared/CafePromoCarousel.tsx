import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Pressable, Dimensions, Platform, StyleSheet } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { triggerHaptic } from '../../lib/haptic';

const { width: screenWidth } = Dimensions.get('window');
const carouselWidth = screenWidth > 768 ? 540 - 24 : screenWidth - 24; // Remove sidebar width subtraction since it is single column!

interface PromoSlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  imageUrl: string;
  gradient: [string, string];
  tagColor: string;
}

const CAROUSEL_SLIDES: PromoSlide[] = [
  {
    id: 'slide-1',
    title: 'Chai & Hot Snacks',
    subtitle: 'Freshly brewed tea with warm samosas & bites',
    tag: 'COMBOS FROM ₹49',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80',
    gradient: ['#7c2d12', '#4c0519'], // Warm Dark Rust to Deep Maroon
    tagColor: '#ea580c',
  },
  {
    id: 'slide-2',
    title: 'Gourmet Sandwiches',
    subtitle: 'Prepared fresh on order in 10 minutes',
    tag: 'FRESH & TOASTED',
    imageUrl: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=500&auto=format&fit=crop&q=80',
    gradient: ['#065f46', '#022c22'], // Deep Teal/Green gradient
    tagColor: '#10b981',
  },
  {
    id: 'slide-3',
    title: 'Monsoon Specials',
    subtitle: 'Crispy fritters & hot coffee for rainy days',
    tag: '50% OFF ON CLASSICS',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df056fb4ce78?w=500&auto=format&fit=crop&q=80',
    gradient: ['#831843', '#4c0519'], // Deep Plum to Rose-Wine
    tagColor: '#f43f5e',
  },
];

export default function CafePromoCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = activeIndex + 1;
      if (nextIndex >= CAROUSEL_SLIDES.length) {
        nextIndex = 0;
      }
      
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          x: nextIndex * carouselWidth,
          animated: true,
        });
        setActiveIndex(nextIndex);
      }
    }, 4000);

    return () => clearInterval(timer);
  }, [activeIndex]);

  const handleScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / carouselWidth);
    if (index !== activeIndex && index >= 0 && index < CAROUSEL_SLIDES.length) {
      setActiveIndex(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        decelerationRate="fast"
        snapToInterval={carouselWidth}
        snapToAlignment="center"
        style={{ width: carouselWidth }}
        contentContainerStyle={{ height: 140 }}
      >
        {CAROUSEL_SLIDES.map((slide) => (
          <Pressable
            key={slide.id}
            onPress={() => triggerHaptic('light')}
            style={{ width: carouselWidth }}
          >
            <LinearGradient
              colors={slide.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.slideCard}
            >
              {/* Left Info Column */}
              <View style={styles.textColumn}>
                <View style={[styles.badge, { backgroundColor: slide.tagColor }]}>
                  <Text style={[styles.badgeText, { color: '#ffffff' }]}>
                    {slide.tag}
                  </Text>
                </View>
                <Text style={styles.titleText}>{slide.title}</Text>
                <Text style={styles.subtitleText} numberOfLines={2}>
                  {slide.subtitle}
                </Text>

                {/* Simulated Order Now Button */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: '#ffffff',
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  borderRadius: 14,
                  alignSelf: 'flex-start',
                  marginTop: 10,
                }}>
                  <Text style={{ fontSize: 9.5, fontWeight: '900', color: '#0f172a', marginRight: 5 }}>Order Now</Text>
                  <View style={{
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    backgroundColor: slide.tagColor,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '900', marginTop: -1.5 }}>→</Text>
                  </View>
                </View>
              </View>

              {/* Right Image Column */}
              <View style={styles.imageColumn}>
                <ExpoImage
                  source={{ uri: slide.imageUrl }}
                  contentFit="cover"
                  style={styles.image}
                  transition={200}
                />
                {/* Visual Glow overlay inside card */}
                <LinearGradient
                  colors={['transparent', 'rgba(0,0,0,0.45)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </View>
            </LinearGradient>
          </Pressable>
        ))}
      </ScrollView>

      {/* Slide pagination indicator dots */}
      <View style={styles.dotsContainer}>
        {CAROUSEL_SLIDES.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
  slideCard: {
    flexDirection: 'row',
    height: 130,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  textColumn: {
    flex: 1.3,
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'center',
    zIndex: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 2,
    letterSpacing: -0.15,
  },
  subtitleText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 13,
  },
  imageColumn: {
    flex: 0.7,
    height: '100%',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  activeDot: {
    width: 14,
    backgroundColor: '#ea580c', // Orange
  },
  inactiveDot: {
    width: 4,
    backgroundColor: '#cbd5e1',
  },
});
