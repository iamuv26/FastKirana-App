import { View, Text, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingBag, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCart } from '../../hooks/use-cart';
import { formatPrice, isCafeProduct } from '../../lib/utils';
import { triggerHaptic } from '../../lib/haptic';
import { useTheme } from '../../app/context/ThemeContext';
import { ScalePressable } from './ScalePressable';
import { useUIStore } from '../../stores/ui-store';
import { useMemo, useEffect, useRef } from 'react';
import { GROCERY_FREE_DELIVERY_THRESHOLD, CAFE_FREE_DELIVERY_THRESHOLD } from '../../lib/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { THEME } from '../../lib/theme';

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  SlideInDown,
  FadeIn,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FloatingCartBarProps {
  bottomOffset?: number;
  onTap?: () => void;
}

export default function FloatingCartBar({ bottomOffset = 16, onTap }: FloatingCartBarProps) {
  const { items, getTotalItems, getSubtotal, getSavings } = useCart();
  const { theme } = useTheme();
  const minOrderValue = useUIStore((s) => typeof s.minOrderValue === 'number' ? s.minOrderValue : 99);
  const groceryThreshold = useUIStore((s) => s.groceryFreeDeliveryThreshold || GROCERY_FREE_DELIVERY_THRESHOLD);
  const cafeThreshold = useUIStore((s) => s.cafeFreeDeliveryThreshold || CAFE_FREE_DELIVERY_THRESHOLD);
  const isDarkMode = theme === 'dark';
  
  const cartItemCount = getTotalItems();
  const cartSubtotal = getSubtotal();
  const cartSavings = getSavings();

  const groceryItems = useMemo(() => items.filter(item => !isCafeProduct(item.product)), [items]);
  const cafeItems = useMemo(() => items.filter(item => isCafeProduct(item.product)), [items]);

  const threshold = useMemo(() => {
    if (cafeItems.length > 0) {
      return cafeThreshold;
    }
    return groceryThreshold;
  }, [cafeItems, cafeThreshold, groceryThreshold]);

  // --- Animation shared values ---
  const badgeScale = useSharedValue(1);
  const shimmerPosition = useSharedValue(-1);
  const glowOpacity = useSharedValue(0.4);
  const prevCountRef = useRef(cartItemCount);
  const progressShared = useSharedValue(0);
  const trackWidth = useSharedValue(0);
  const truckScale = useSharedValue(1);

  // Smooth scale-swell badge and truck when item count changes
  useEffect(() => {
    if (cartItemCount > 0 && cartItemCount !== prevCountRef.current) {
      badgeScale.value = withSequence(
        withTiming(1.15, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.quad) })
      );
      truckScale.value = withSequence(
        withTiming(1.2, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.quad) })
      );
    }
    prevCountRef.current = cartItemCount;
  }, [cartItemCount]);

  const progressPercent = Math.min((cartSubtotal / threshold) * 100, 100);
  
  // Smoothly animate progress bar and truck
  useEffect(() => {
    progressShared.value = withTiming(progressPercent, { duration: 500, easing: Easing.out(Easing.quad) });
  }, [progressPercent]);

  // Shimmer on progress bar
  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
    return () => {
      cancelAnimation(shimmerPosition);
    };
  }, []);

  // Pulsing glow on View Cart button
  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(glowOpacity);
    };
  }, []);

  // Animated styles
  const badgeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  const shimmerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(
          shimmerPosition.value,
          [-1, 1],
          [-120, 120]
        ),
      },
    ],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const progressAnimatedStyle = useAnimatedStyle(() => ({
    width: (progressShared.value + '%') as any,
  }));

  const insets = useSafeAreaInsets();

  if (cartItemCount === 0) return null;

  const handlePress = () => {
    triggerHaptic('light');
    if (onTap) {
      onTap();
    } else {
      router.push('/cart');
    }
  };

  const isTabBarVisible = useUIStore((s) => s.isTabBarVisible);
  const isFreeDelivery = cartSubtotal >= threshold;
  const amountNeeded = threshold - cartSubtotal;

  const bottomAnimShared = useSharedValue(bottomOffset);

  useEffect(() => {
    const targetBottom = isTabBarVisible ? bottomOffset : 16;
    bottomAnimShared.value = withTiming(targetBottom, {
      duration: 280,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    });
  }, [isTabBarVisible, bottomOffset]);

  const animatedBottomStyle = useAnimatedStyle(() => ({
    bottom: bottomAnimShared.value + (insets.bottom > 0 ? insets.bottom - 8 : 0),
  }));

  const isCafe = cafeItems.length > 0;
  const activeBrandColor = isCafe ? '#ea580c' : '#e20a22';
  const progressColor = isFreeDelivery ? '#22c55e' : '#facc15';

  const gradientColors = (isDarkMode
    ? ['rgba(39, 39, 42, 0.95)', 'rgba(24, 24, 27, 0.98)']
    : isCafe
      ? ['#ea580c', '#f97316']
      : ['#e20a22', '#f43f5e']) as [string, string];

  return (
    <Animated.View 
      style={[
        { 
          position: 'absolute',
          left: 16,
          right: 16,
          maxWidth: 440,
          width: 'auto',
          alignSelf: 'center',
          zIndex: 40,
        },
        animatedBottomStyle,
      ]} 
      entering={SlideInDown.duration(350).easing(Easing.out(Easing.quad))}
    >
      <ScalePressable 
        onPress={handlePress}
        scaleValue={0.97}
        haptic="medium"
        style={[
          styles.innerCard,
          {
            shadowColor: activeBrandColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.35 : 0.22,
            shadowRadius: 12,
            elevation: 6,
            borderWidth: 1.2,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.25)',
          }
        ]}
      >
        {/* Glassmorphic Backdrop */}
        <BlurView
          intensity={isDarkMode ? 80 : 90}
          tint={isDarkMode ? 'dark' : 'default'}
          style={StyleSheet.absoluteFill}
        />

        {/* Gradient Overlay */}
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        
        {/* Thin progress line at the very top of the bar */}
        <View style={styles.topProgressTrack}>
          <Animated.View 
            style={[
              progressAnimatedStyle, 
              styles.topProgressFill, 
              { backgroundColor: progressColor }
            ]}
          />
        </View>

        {/* Slender Single-Row Content */}
        <View style={styles.rowContent}>
          {/* Left: Items Count & Price */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
            <View style={styles.iconContainer}>
              <ShoppingBag size={15} color="#ffffff" strokeWidth={2.4} />
              {/* Slender item badge */}
              <Animated.View style={[styles.badge, { borderColor: isDarkMode ? '#27272a' : activeBrandColor }, badgeAnimatedStyle]}>
                <Text allowFontScaling={false} style={styles.badgeText}>{cartItemCount}</Text>
              </Animated.View>
            </View>
            <View style={{ marginLeft: 9, flex: 1 }}>
              <Text allowFontScaling={false} style={styles.priceText} numberOfLines={1}>
                {cartItemCount} {cartItemCount === 1 ? 'Item' : 'Items'}  •  {formatPrice(cartSubtotal)}
              </Text>
              <Text allowFontScaling={false} style={styles.subText} numberOfLines={1}>
                {cartSubtotal < minOrderValue
                  ? `Add ₹${minOrderValue - cartSubtotal} for Min Order`
                  : isFreeDelivery
                    ? '🎉 FREE Delivery Unlocked!'
                    : `Add ₹${amountNeeded} for FREE Delivery`
                }
              </Text>
            </View>
          </View>

          {/* Right: View Cart Button with Animated Pulsing Halo */}
          <View style={{ flexDirection: 'row', alignItems: 'center', position: 'relative' }}>
            <Animated.View
              style={[
                glowAnimatedStyle,
                {
                  position: 'absolute',
                  top: -3,
                  left: -3,
                  right: -3,
                  bottom: -3,
                  borderRadius: 99,
                  borderWidth: 1.5,
                  borderColor: isDarkMode ? '#fafafa' : 'rgba(255, 255, 255, 0.4)',
                }
              ]}
            />
            <View style={styles.viewCartButton}>
              <Text allowFontScaling={false} style={[styles.viewCartText, { color: isDarkMode ? '#ffffff' : activeBrandColor }]}>View Cart</Text>
              <ChevronRight size={11} color={isDarkMode ? '#ffffff' : activeBrandColor} strokeWidth={3} />
            </View>
          </View>
        </View>
      </ScalePressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  innerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 52, // Compact, slender height
    justifyContent: 'center',
  },
  topProgressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3.5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  topProgressFill: {
    height: '100%',
  },
  rowContent: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 2,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#fbbf24',
    borderRadius: 9,
    minWidth: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.2,
  },
  badgeText: {
    color: '#1e293b',
    fontSize: 9,
    fontWeight: '900',
    textAlign: 'center',
  },
  priceText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: -0.15,
  },
  subText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: '700',
    fontSize: 9.5,
    marginTop: 0.5,
  },
  viewCartButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  viewCartText: {
    fontWeight: '900',
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
