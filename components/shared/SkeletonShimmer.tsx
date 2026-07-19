import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, DimensionValue } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../../app/context/ThemeContext';

interface SkeletonShimmerProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonShimmer({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}: SkeletonShimmerProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 650 }),
        withTiming(0.35, { duration: 650 })
      ),
      -1, // Loop infinitely
      true // Alternate direction
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const containerBg = isDarkMode ? '#281c1e' : '#f6ebeb';

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: containerBg,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

/**
 * Skeleton component mimicking a Category Circle
 */
export function CategoryCircleSkeleton() {
  return (
    <View style={styles.categoryContainer}>
      <SkeletonShimmer width={64} height={64} borderRadius={32} style={{ marginBottom: 8 }} />
      <SkeletonShimmer width={50} height={12} borderRadius={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  categoryContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    width: 64,
  },
});
