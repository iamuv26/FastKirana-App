import React, { useEffect, useState } from 'react';
import { StyleSheet, Dimensions, View } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withDelay, 
  withTiming, 
  runOnJS 
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const COLORS = ['#FFC107', '#FF5722', '#E91E63', '#9C27B0', '#3F51B5', '#00BCD4', '#4CAF50', '#8BC34A'];

interface ConfettiParticleProps {
  index: number;
  onAnimationEnd?: () => void;
}

function ConfettiParticle({ index, onAnimationEnd }: ConfettiParticleProps) {
  const size = Math.random() * 8 + 6; // random size between 6 and 14
  const startX = Math.random() * SCREEN_WIDTH;
  const endX = startX + (Math.random() * 100 - 50); // drift left/right
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  
  const y = useSharedValue(-20);
  const x = useSharedValue(startX);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    const duration = Math.random() * 1500 + 2000; // 2s to 3.5s
    const delay = Math.random() * 800; // stagger start

    y.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 20, { duration }, (finished) => {
        if (finished && onAnimationEnd && index === 0) {
          runOnJS(onAnimationEnd)();
        }
      })
    );

    x.value = withDelay(
      delay,
      withTiming(endX, { duration })
    );

    rotation.value = withDelay(
      delay,
      withTiming(Math.random() * 1080 + 360, { duration })
    );

    opacity.value = withDelay(
      delay + duration - 500,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: y.value },
      { translateX: x.value },
      { rotate: rotation.value + 'deg' },
      { scale: scale.value }
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          width: size,
          height: size,
          backgroundColor: color,
          borderRadius: Math.random() > 0.5 ? size / 2 : 2, // mix circles and squares
        },
        animatedStyle,
      ]}
    />
  );
}

export default function Confetti({ count = 60, onComplete }: { count?: number; onComplete?: () => void }) {
  const particles = Array.from({ length: count });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((_, i) => (
        <ConfettiParticle key={i} index={i} onAnimationEnd={onComplete} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 99999,
  },
});
