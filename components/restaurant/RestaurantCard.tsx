import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Image } from 'react-native';
import { Heart, Clock, MapPin, Award, Flame, MoreVertical, Zap, Navigation } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTheme } from '../../app/context/ThemeContext';
import { triggerHaptic } from '../../lib/haptic';
import { ScalePressable } from '../shared/ScalePressable';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  address?: string | null;
  city?: string | null;
  cuisineTags: string[];
  rating: number;
  reviewCount: number;
  deliveryTime?: string;
  distance?: string | null;
  isVeg?: boolean;
  isPureVeg?: boolean;
  isOpen?: boolean;
  discountOffer?: string | null;
  discountBadge?: string | null;
  isActive?: boolean;
  _count?: { products: number };
  openTime?: string | null;
  closeTime?: string | null;
}

const imageUrl = (img?: string | null) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  if (img.startsWith('/')) return `https://www.fastkirana.in${img}`;
  return img;
};

interface RestaurantCardProps {
  restaurant: Restaurant;
  index?: number;
  onPress?: () => void;
  variant?: 'horizontal' | 'compact';
  isGrid?: boolean;
}

export function RestaurantCard({
  restaurant,
  index = 0,
  onPress,
  variant = 'horizontal',
  isGrid = false,
}: RestaurantCardProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [isFav, setIsFav] = useState(false);

  const isClosed = restaurant.isOpen === false;
  const img = imageUrl(restaurant.bannerUrl || restaurant.logoUrl);
  const cuisineDisplay = (restaurant.cuisineTags || []).slice(0, 4).join(', ');
  const locationText = restaurant.address || restaurant.city || 'Nearby';
  const isTopRated = restaurant.rating >= 4.0;
  const offerText =
    restaurant.discountOffer || restaurant.discountBadge || '5% EXTRA OFF';
  const prepTime = restaurant.deliveryTime || '30m Prep';

  const handlePress = () => {
    triggerHaptic('light');
    if (onPress) {
      onPress();
    } else {
      router.push(`/restaurants/${restaurant.slug}`);
    }
  };

  const handleFav = (e: any) => {
    e.stopPropagation();
    triggerHaptic('light');
    setIsFav((v) => !v);
  };

  const cardScale = useSharedValue(1);
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const onPressIn = () => {
    cardScale.value = withSpring(0.98, { damping: 20, stiffness: 300 });
  };
  const onPressOut = () => {
    cardScale.value = withSpring(1, { damping: 20, stiffness: 300 });
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      style={[
        styles.card,
        isGrid && styles.cardGrid,
        {
          backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
          borderColor: isDarkMode ? 'rgba(39,39,42,0.6)' : '#fde2dc',
          opacity: isClosed ? 0.6 : 1,
          ...Platform.select({
            ios: {
              shadowColor: '#e20a22',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: isDarkMode ? 0.2 : 0.07,
              shadowRadius: 8,
            },
            android: { elevation: isDarkMode ? 3 : 2 },
          }),
        },
        animatedCardStyle,
      ]}
    >
      {/* ── Image (top in grid, left in horizontal) ── */}
      <View style={[styles.imageWrap, isGrid && styles.imageWrapGrid]}>
        {img ? (
          <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Text style={{ fontSize: 30 }}>🍽️</Text>
          </View>
        )}

        {/* "OPENS AT" pink pill */}
        {restaurant.openTime && (
          <View style={styles.opensPill}>
            <Text style={styles.opensPillText}>
              OPENS AT {restaurant.openTime}
            </Text>
          </View>
        )}

        {/* Heart top-right of image */}
        <Pressable
          hitSlop={8}
          onPress={handleFav}
          style={({ pressed }) => [
            styles.heartBtn,
            {
              backgroundColor: isDarkMode
                ? 'rgba(0,0,0,0.45)'
                : 'rgba(255,255,255,0.95)',
              transform: [{ scale: pressed ? 0.9 : 1 }],
            },
          ]}
        >
          <Heart
            size={14}
            color={isFav ? '#e20a22' : isDarkMode ? '#e4e4e7' : '#3f3f46'}
            fill={isFav ? '#e20a22' : 'none'}
            strokeWidth={isFav ? 3 : 2.2}
          />
        </Pressable>

        {/* Closed badge overlay */}
        {isClosed && (
          <View style={styles.closedOverlay}>
            <View style={styles.closedPill}>
              <Text style={styles.closedText}>CLOSED</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Right: Info ── */}
      <View style={[styles.infoWrap, isGrid && styles.infoWrapGrid]}>
        {/* Name + more icon */}
        <View style={styles.nameRow}>
          <Text
            numberOfLines={1}
            style={[
              styles.name,
              { color: isDarkMode ? '#fafafa' : '#0f172a' },
            ]}
          >
            {restaurant.name}
          </Text>
          <Pressable hitSlop={8} onPress={(e) => e.stopPropagation()} style={styles.moreBtn}>
            <MoreVertical size={14} color={isDarkMode ? '#71717a' : '#94a3b8'} />
          </Pressable>
        </View>

        {/* TOP RATED badge */}
        {isTopRated && (
          <View
            style={[
              styles.topRatedBadge,
              {
                backgroundColor: isDarkMode
                  ? 'rgba(234,88,12,0.18)'
                  : '#fff1e6',
                borderColor: isDarkMode
                  ? 'rgba(234,88,12,0.35)'
                  : '#fed7aa',
              },
            ]}
          >
            <Award size={10} color="#ea580c" fill="#ea580c" strokeWidth={0} />
            <Text style={styles.topRatedText}>TOP RATED</Text>
          </View>
        )}

        {/* Cuisine text */}
        <Text
          numberOfLines={1}
          style={[
            styles.cuisineText,
            { color: isDarkMode ? '#a1a1aa' : '#64748b' },
          ]}
        >
          {cuisineDisplay}
        </Text>

        {/* Location Pin */}
        <View style={styles.locationPin}>
          <Navigation size={11} color="#e20a22" strokeWidth={2.5} />
          <Text
            numberOfLines={1}
            style={[styles.locationText, { color: '#e20a22' }]}
          >
            {locationText}
          </Text>
        </View>

        {/* EXTRA OFF badge */}
        <View
          style={[
            styles.offerBadge,
            {
              backgroundColor: isDarkMode
                ? 'rgba(234,88,12,0.12)'
                : '#fff5ec',
              borderColor: isDarkMode ? 'rgba(234,88,12,0.25)' : '#fed7aa',
            },
          ]}
        >
          <Flame size={10} color="#ea580c" fill="#ea580c" strokeWidth={0} />
          <Text style={styles.offerText}>{offerText}</Text>
        </View>

        {/* Prep time + EXPLORE */}
        <View style={styles.bottomRow}>
          <View style={styles.prepRow}>
            <Zap size={11} color={isDarkMode ? '#a1a1aa' : '#64748b'} strokeWidth={2.5} />
            <Text
              style={[
                styles.prepText,
                { color: isDarkMode ? '#a1a1aa' : '#475569' },
              ]}
            >
              {prepTime}
            </Text>
          </View>

          <ScalePressable
            onPress={(e: any) => {
              e.stopPropagation();
              handlePress();
            }}
            scaleValue={0.95}
            style={({ pressed }: any) => [
              styles.exploreBtn,
              {
                backgroundColor: pressed ? '#c2410c' : '#ea580c',
              },
            ]}
          >
            <Text style={styles.exploreText}>EXPLORE</Text>
            <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900', marginLeft: 2 }}>→</Text>
          </ScalePressable>
        </View>
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginHorizontal: 14,
    marginVertical: 6,
    height: 155,
  },
  cardGrid: {
    flexDirection: 'column',
    marginHorizontal: 0,
    height: undefined,
  },
  imageWrap: {
    width: 130,
    height: '100%',
    position: 'relative',
    backgroundColor: '#fef3c7',
  },
  imageWrapGrid: {
    width: '100%',
    height: 150,
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: { justifyContent: 'center', alignItems: 'center' },
  opensPill: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    right: 6,
    backgroundColor: '#f472b6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    alignItems: 'center',
  },
  opensPillText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  heartBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  closedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closedPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  closedText: {
    color: '#0f172a',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  infoWrap: {
    flex: 1,
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 3,
  },
  infoWrapGrid: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  name: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.3,
    lineHeight: 17,
  },
  moreBtn: { padding: 2 },
  topRatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    gap: 3,
  },
  topRatedText: {
    color: '#ea580c',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  cuisineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  cuisineText: {
    fontSize: 10.5,
    fontWeight: '600',
    lineHeight: 13,
  },
  locationPin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  locationText: {
    fontSize: 10,
    fontWeight: '800',
  },
  offerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    gap: 3,
  },
  offerText: {
    color: '#ea580c',
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
  prepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  prepText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 3,
    ...Platform.select({
      ios: {
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
      },
      android: { elevation: 3 },
    }),
  },
  exploreText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  exploreArrow: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
    marginTop: -1,
  },
});