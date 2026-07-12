import { View, Text, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingBag, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { useCart } from '../../hooks/use-cart';
import { formatPrice, isCafeProduct } from '../../lib/utils';
import { triggerHaptic } from '../../lib/haptic';
import { useTheme } from '../../app/context/ThemeContext';
import { useUIStore } from '../../stores/ui-store';
import { useMemo, useEffect, useRef } from 'react';
import { GROCERY_FREE_DELIVERY_THRESHOLD, CAFE_FREE_DELIVERY_THRESHOLD, COMBINED_FREE_DELIVERY_THRESHOLD } from '../../lib/constants';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    if (groceryItems.length > 0 && cafeItems.length > 0) {
      return COMBINED_FREE_DELIVERY_THRESHOLD;
    } else if (cafeItems.length > 0) {
      return CAFE_FREE_DELIVERY_THRESHOLD;
    }
    return GROCERY_FREE_DELIVERY_THRESHOLD;
  }, [groceryItems, cafeItems]);

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

  return (
    <Animated.View 
      className="absolute left-4 right-4 z-40" 
      style={{ bottom: finalBottom }}
      entering={SlideInDown.duration(350).easing(Easing.out(Easing.quad))}
    >
      <TouchableOpacity 
        onPress={handlePress}
        activeOpacity={0.65}
        style={[
          styles.innerCard,
          {
            backgroundColor: isDarkMode ? '#1c1c1e' : '#0c831f',
            shadowColor: '#0c831f',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDarkMode ? 0.25 : 0.15,
            shadowRadius: 16,
            elevation: 6,
            borderWidth: 1,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.15)',
          }
        ]}
      >
        {/* Rich solid green gradient backdrop */}
        {!isDarkMode && (
          <LinearGradient
            colors={['#0c831f', '#096a18']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        
        {/* Thin progress line at the very top of the bar */}
        <View style={styles.topProgressTrack}>
          <Animated.View 
            style={[progressAnimatedStyle, styles.topProgressFill]}
          />
        </View>

        {/* Slender Single-Row Content */}
        <View style={styles.rowContent}>
          {/* Left: Items Count & Price */}
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 12 }}>
            <View style={styles.iconContainer}>
              <ShoppingBag size={14} color="#ffffff" strokeWidth={2.5} />
              {/* Slender item badge */}
              <View style={[styles.badge, { borderColor: isDarkMode ? '#1c1c1e' : '#0c831f' }]}>
                <Text style={styles.badgeText}>{cartItemCount}</Text>
              </View>
            </View>
            <View style={{ marginLeft: 10, flex: 1 }}>
              <Text style={styles.priceText} numberOfLines={1}>
                {cartItemCount} {cartItemCount === 1 ? 'Item' : 'Items'}  •  {formatPrice(cartSubtotal)}
              </Text>
              <Text style={styles.subText} numberOfLines={1}>
                {cartSubtotal < minOrderValue
                  ? `🛒 Min order ₹${minOrderValue} (Add ₹${minOrderValue - cartSubtotal} more)`
                  : isFreeDelivery
                    ? '🎉 Free Delivery Unlocked!'
                    : `Add ${formatPrice(amountNeeded)} more for free delivery`
                }
              </Text>
            </View>
          </View>

          {/* Right: View Cart Button */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={styles.viewCartButton}>
              <Text style={[styles.viewCartText, { color: isDarkMode ? '#ffffff' : '#0c831f' }]}>View Cart</Text>
              <ChevronRight size={12} color={isDarkMode ? '#ffffff' : '#0c831f'} strokeWidth={3.5} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  innerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 54, // Fixed premium thin height
    justifyContent: 'center',
  },
  topProgressTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  topProgressFill: {
    height: '100%',
    backgroundColor: '#fbbf24', // Amber progress indicator
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 2.5, // Offset for top progress line
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#ef4444', // Red badge
    borderRadius: 8,
    minWidth: 15,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    textAlign: 'center',
  },
  priceText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: -0.2,
  },
  subText: {
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '700',
    fontSize: 9,
    marginTop: 0.5,
  },
  viewCartButton: {
    backgroundColor: '#ffffff', // Solid white pill button
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  viewCartText: {
    fontWeight: '900',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
