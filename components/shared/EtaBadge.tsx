import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../app/context/ThemeContext';
import { THEME } from '../../lib/theme';

export default function EtaBadge() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Smooth pulse for the indicator dot glow
  const pulse = useSharedValue(0);
  // Periodic attention-grabbing bounce
  const bounce = useSharedValue(1);

  useEffect(() => {
    // Continuous smooth pulse
    pulse.value = withRepeat(
      withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // Subtle scale bounce every 4 seconds to draw attention
    bounce.value = withRepeat(
      withSequence(
        withDelay(
          4000,
          withTiming(1.08, { duration: 200, easing: Easing.out(Easing.back(3)) })
        ),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(bounce);
    };
  }, []);

  // Animated style for the pulsing glow ring
  const glowStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 2.2]) }],
      opacity: interpolate(pulse.value, [0, 1], [0.5, 0]),
    };
  });

  // Animated style for the outer glow halo (larger, softer)
  const haloStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: interpolate(pulse.value, [0, 1], [1, 3]) }],
      opacity: interpolate(pulse.value, [0, 1], [0.25, 0]),
    };
  });

  // Animated style for the whole badge bounce
  const badgeBounceStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: bounce.value }],
    };
  });

  return (
    <Animated.View style={[badgeBounceStyle]}>
      <LinearGradient
        colors={
          isDark
            ? ['rgba(249, 115, 22, 0.18)', 'rgba(234, 88, 12, 0.10)']
            : ['#fff7ed', '#ffedd5']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            borderColor: isDark ? 'rgba(249, 115, 22, 0.30)' : '#fed7aa',
          },
        ]}
      >
        {/* Pulsing indicator dot with glow */}
        <View style={styles.dotContainer}>
          {/* Outer halo */}
          <Animated.View
            style={[
              styles.dotGlow,
              haloStyle,
              { backgroundColor: isDark ? '#fb923c' : '#f97316' },
            ]}
          />
          {/* Inner glow ring */}
          <Animated.View
            style={[
              styles.dotGlow,
              glowStyle,
              { backgroundColor: isDark ? '#fb923c' : '#f97316' },
            ]}
          />
          {/* Solid center dot */}
          <View
            style={[
              styles.dotCenter,
              { backgroundColor: isDark ? '#fb923c' : '#f97316' },
            ]}
          />
        </View>

        {/* Lightning bolt icon */}
        <Text style={[styles.bolt, { color: isDark ? '#fbbf24' : '#ea580c' }]}>
          ⚡
        </Text>

        {/* Text content */}
        <View style={styles.textContainer}>
          <Text
            style={[
              styles.mainText,
              { color: isDark ? '#fb923c' : '#ea580c' },
            ]}
          >
            10 MINS
          </Text>
          <Text
            style={[
              styles.subText,
              { color: isDark ? 'rgba(251, 146, 60, 0.7)' : 'rgba(234, 88, 12, 0.6)' },
            ]}
          >
            DELIVERY
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: THEME.RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  dotContainer: {
    position: 'relative',
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotGlow: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotCenter: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  bolt: {
    fontSize: 11,
    marginRight: -2,
  },
  textContainer: {
    alignItems: 'center',
  },
  mainText: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
    lineHeight: 14,
  },
  subText: {
    fontSize: 8.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    lineHeight: 10,
  },
});
