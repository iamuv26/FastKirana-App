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
  const insets = useSafeAreaInsets();
  const { items, getTotalItems, getSubtotal, getSavings } = useCart();
  const { theme } = useTheme();
  const isTabBarVisible = useUIStore((s) => s.isTabBarVisible);
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
  const bottomAnimShared = useSharedValue(bottomOffset);

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

  useEffect(() => {
    let resolvedOffset = bottomOffset;
    if (isTabBarVisible && bottomOffset >= 75) {
      resolvedOffset = (insets.bottom > 0 ? insets.bottom : 0) + 98;
    }
    const targetBottom = isTabBarVisible 
      ? resolvedOffset 
      : (bottomOffset < 75 ? (insets.bottom > 0 ? insets.bottom + bottomOffset : bottomOffset) : 16);
    bottomAnimShared.value = withTiming(targetBottom, {
      duration: 280,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    });
  }, [isTabBarVisible, bottomOffset, insets.bottom]);

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

  const animatedBottomStyle = useAnimatedStyle(() => ({
    bottom: bottomAnimShared.value + (insets.bottom > 0 ? insets.bottom - 8 : 0),
  }));

  if (cartItemCount === 0) return null;

  const handlePress = () => {
    triggerHaptic('light');
    if (onTap) {
      onTap();
    } else {
      router.push('/cart');
    }
  };

  const isFreeDelivery = cartSubtotal >= threshold;
  const amountNeeded = threshold - cartSubtotal;

  const isCafe = cafeItems.length > 0;
  const activeBrandColor = isCafe ? THEME.COLORS.brand.accent : THEME.COLORS.brand.primary;
  const progressColor = isFreeDelivery ? THEME.COLORS.brand.success : THEME.COLORS.brand.warning;

  const gradientColors = (isDarkMode
    ? ['rgba(39, 39, 42, 0.95)', 'rgba(24, 24, 27, 0.98)']
    : isCafe
      ? [THEME.COLORS.brand.accent, THEME.COLORS.brand.accentDark]
      : [THEME.COLORS.brand.primary, THEME.COLORS.brand.primaryDark]) as [string, string];

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
              <ShoppingBag size={15} color={isDarkMode ? THEME.COLORS.dark.surfaceElevated : '#ffffff'} strokeWidth={2.4} />
              {/* Slender item badge */}
              <Animated.View style={[styles.badge, { borderColor: isDarkMode ? THEME.COLORS.dark.borderLight : activeBrandColor }, badgeAnimatedStyle]}>
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
                  borderColor: isDarkMode ? THEME.COLORS.light.surface : 'rgba(255, 255, 255, 0.4)',
                }
              ]}
            />
            <View style={styles.viewCartButton}>
              <Text allowFontScaling={false} style={[styles.viewCartText, { color: isDarkMode ? THEME.COLORS.dark.textPrimary : activeBrandColor }]}>View Cart</Text>
              <ChevronRight size={11} color={isDarkMode ? THEME.COLORS.dark.textPrimary : activeBrandColor} strokeWidth={3} />
            </View>
          </View>
        </View>
      </ScalePressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  innerCard: {
    borderRadius: THEME.RADIUS.lg,
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm + 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: '#e20a22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.sm,
    flex: 1,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: THEME.RADIUS.pill,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.2,
  },
  badgeText: {
    color: THEME.COLORS.brand.primary,
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    textAlign: 'center',
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
    paddingHorizontal: THEME.SPACING.md,
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
  badgeText: {
    color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary,
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    textAlign: 'center',
  },
  priceText: {
    color: '#ffffff',
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    letterSpacing: -0.15,
  },
  subText: {
    color: 'rgba(255,255,255,0.92)',
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    marginTop: 0.5,
  },
  viewCartButton: {
    backgroundColor: '#ffffff',
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.xs + 1,
    borderRadius: THEME.RADIUS.pill,
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
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
