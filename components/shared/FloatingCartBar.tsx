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
}

export default function FloatingCartBar({ bottomOffset = 16 }: FloatingCartBarProps) {
  const { items, getTotalItems, getSubtotal, getSavings } = useCart();
  const { theme } = useTheme();
  const minOrderValue = useUIStore((s) => typeof s.minOrderValue === 'number' ? s.minOrderValue : 99);
  const isDarkMode = theme === 'dark';
  
  const cartItemCount = getTotalItems();
  const cartSubtotal = getSubtotal();
  const cartSavings = getSavings();

  const groceryItems = useMemo(() => items.filter(item => !isCafeProduct(item.product)), [items]);
  const cafeItems = useMemo(() => items.filter(item => isCafeProduct(item.product)), [items]);

  const threshold = useMemo(() => {
    if (cafeItems.length > 0) {
      return CAFE_FREE_DELIVERY_THRESHOLD;
    }
    return GROCERY_FREE_DELIVERY_THRESHOLD;
  }, [cafeItems]);

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

  const truckAnimatedStyle = useAnimatedStyle(() => {
    const translationX = (progressShared.value / 100) * trackWidth.value;
    return {
      transform: [
        { translateX: translationX - 10 },
        { scale: truckScale.value }
      ]
    };
  });

  const dynamicETA = useMemo(() => {
    const time = new Date();
    time.setMinutes(time.getMinutes() + 10);
    let hours = time.getHours();
    const minutes = time.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${minutesStr} ${ampm}`;
  }, [cartItemCount]);

  const insets = useSafeAreaInsets();

  if (cartItemCount === 0) return null;

  const handlePress = () => {
    triggerHaptic('light');
    router.push('/cart');
  };

  const isFreeDelivery = cartSubtotal >= threshold;
  const amountNeeded = threshold - cartSubtotal;

  const finalBottom = bottomOffset + (insets.bottom > 0 ? insets.bottom - 8 : 0);

  const isCafe = cafeItems.length > 0;
  const activeBrandColor = isCafe ? '#ea580c' : '#e20a22';
  const progressColor = isFreeDelivery ? '#22c55e' : '#facc15';

  const gradientColors = (isDarkMode
    ? ['rgba(39, 39, 42, 0.9)', 'rgba(24, 24, 27, 0.95)']
    : isCafe
      ? ['#ea580c', '#f97316']
      : ['#e20a22', '#f43f5e']) as [string, string];

  return (
    <Animated.View 
      className="absolute left-4 right-4 z-40" 
      style={{ bottom: finalBottom }}
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
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDarkMode ? 0.35 : 0.25,
            shadowRadius: 16,
            elevation: 8,
            borderWidth: 1.5,
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.2)',
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
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
            <View style={styles.iconContainer}>
              <ShoppingBag size={16} color="#ffffff" strokeWidth={2.4} />
              {/* Slender item badge */}
              <View style={[styles.badge, { borderColor: isDarkMode ? '#27272a' : activeBrandColor }]}>
                <Text allowFontScaling={false} style={styles.badgeText}>{cartItemCount}</Text>
              </View>
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text allowFontScaling={false} style={styles.priceText} numberOfLines={1}>
                {cartItemCount} {cartItemCount === 1 ? 'Item' : 'Items'}  •  {formatPrice(cartSubtotal)}
              </Text>
              <Text allowFontScaling={false} style={styles.subText} numberOfLines={1}>
                {cartSubtotal < minOrderValue
                  ? `Add ₹${minOrderValue - cartSubtotal} for Min Order`
                  : isFreeDelivery
                    ? '🎉 Free Delivery!'
                    : `Add ₹${amountNeeded} for Free Del.`
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
                  top: -3.5,
                  left: -3.5,
                  right: -3.5,
                  bottom: -3.5,
                  borderRadius: 99,
                  borderWidth: 2,
                  borderColor: isDarkMode ? '#fafafa' : 'rgba(255, 255, 255, 0.4)',
                }
              ]}
            />
            <View style={styles.viewCartButton}>
              <Text allowFontScaling={false} style={[styles.viewCartText, { color: isDarkMode ? '#ffffff' : activeBrandColor }]}>View Cart</Text>
              <ChevronRight size={12} color={isDarkMode ? '#ffffff' : activeBrandColor} strokeWidth={3} />
            </View>
          </View>
        </View>
      </ScalePressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  innerCard: {
    borderRadius: 22,
    overflow: 'hidden',
    height: 66, // Increased height for visual spacing
    justifyContent: 'center',
  },
  topProgressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4.5,
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
    paddingHorizontal: 16,
    paddingTop: 4, // Offset for top progress line
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
    backgroundColor: '#fbbf24', // Amber/warning gold count badge
    borderRadius: 10,
    minWidth: 19,
    height: 19,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
  },
  badgeText: {
    color: '#1e293b',
    fontSize: 9.5,
    fontWeight: '900',
    textAlign: 'center',
  },
  priceText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: -0.15,
  },
  subText: {
    color: 'rgba(255,255,255,0.88)',
    fontWeight: '700',
    fontSize: 10,
    marginTop: 1,
  },
  viewCartButton: {
    backgroundColor: '#ffffff', // Solid white pill button
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  viewCartText: {
    fontWeight: '900',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
