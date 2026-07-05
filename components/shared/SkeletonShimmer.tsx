import React, { useEffect } from 'react';
import { StyleSheet, View, ViewStyle, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../../app/context/ThemeContext';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

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
  const shimmerPosition = useSharedValue(-1);
  const containerWidth = useSharedValue(200);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 1200 }),
      -1, // infinite loop
      false // do not reverse direction
    );
    return () => {
      cancelAnimation(shimmerPosition);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const w = containerWidth.value || 200;
    return {
      transform: [
        {
          translateX: interpolate(
            shimmerPosition.value,
            [-1, 1],
            [-w, w]
          ),
        },
      ],
    };
  });

  const containerBg = isDarkMode ? '#1e293b' : '#f1f5f9';
  const colors: readonly [string, string, string] = isDarkMode 
    ? ['#1e293b', '#334155', '#1e293b'] 
    : ['#f1f5f9', '#e2e8f0', '#f1f5f9'];

  return (
    <View
      onLayout={(e) => {
        containerWidth.value = e.nativeEvent.layout.width || 200;
      }}
      style={[
        styles.container,
        { width, height, borderRadius, backgroundColor: containerBg },
        style,
      ]}
    >
      <AnimatedLinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[StyleSheet.absoluteFill, animatedStyle]}
      />
    </View>
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
  container: {
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
    position: 'relative',
  },
  categoryContainer: {
    alignItems: 'center',
    marginHorizontal: 12,
  },
});
