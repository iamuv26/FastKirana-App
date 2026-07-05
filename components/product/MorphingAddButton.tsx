import React, { useEffect } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Plus, Minus } from 'lucide-react-native';

interface MorphingAddButtonProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onAdd: () => void;
  maxQuantity: number;
  isDark: boolean;
  fullWidth?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MorphingAddButton({
  quantity,
  onIncrement,
  onDecrement,
  onAdd,
  maxQuantity,
  isDark,
  fullWidth = false,
}: MorphingAddButtonProps) {
  // 0 is "ADD" state, 1 is "Stepper" state
  const animState = useSharedValue(quantity > 0 ? 1 : 0);

  useEffect(() => {
    animState.value = withSpring(quantity > 0 ? 1 : 0, {
      damping: 16,
      stiffness: 180,
    });
  }, [quantity]);

  // Animated styles for the main button container
  const containerStyle = useAnimatedStyle(() => {
    // Width animation
    let width: string | number = '100%';
    if (!fullWidth) {
      width = interpolate(
        animState.value,
        [0, 1],
        [78, 88],
        Extrapolate.CLAMP
      );
    }

    // Background color animation
    const bg = quantity > 0
      ? (isDark ? '#14532d' : '#2d5a27') // Stepper bg
      : (isDark ? '#1e1b1b' : '#ffffff'); // Add button bg

    const borderColor = quantity > 0
      ? (isDark ? '#166534' : '#20461c')
      : (isDark ? '#22c55e' : '#0c831f');

    return {
      width: width as any,
      backgroundColor: bg,
      borderColor: borderColor,
    };
  });

  // Animated style for the "ADD +" text wrapper
  const addTextStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animState.value,
      [0, 0.4],
      [1, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      animState.value,
      [0, 1],
      [1, 0.75],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
      position: 'absolute',
      pointerEvents: quantity === 0 ? 'auto' : 'none',
    };
  });

  // Animated style for the controls wrapper
  const controlsStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      animState.value,
      [0.6, 1],
      [0, 1],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      animState.value,
      [0, 1],
      [0.85, 1],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      pointerEvents: quantity > 0 ? 'auto' : 'none',
    };
  });

  return (
    <AnimatedPressable
      style={[
        styles.btnContainer,
        containerStyle,
      ]}
      onPress={quantity === 0 ? onAdd : undefined}
    >
      {/* ADD Label */}
      <Animated.View style={[styles.centerWrapper, addTextStyle]}>
        <Text style={[styles.addText, { color: isDark ? '#22c55e' : '#0c831f' }]}>ADD</Text>
        <Text style={[styles.plusText, { color: isDark ? '#22c55e' : '#0c831f' }]}>+</Text>
      </Animated.View>

      {/* Stepper Controls */}
      <Animated.View style={controlsStyle}>
        <Pressable
          onPress={onDecrement}
          style={({ pressed }) => [
            styles.controlBtn,
            pressed && { opacity: 0.7 }
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 10, right: 4 }}
        >
          <Minus size={12} color="#ffffff" strokeWidth={3.5} />
        </Pressable>

        <View style={styles.qtyTextWrapper}>
          <Text style={styles.qtyText}>
            {quantity}
          </Text>
        </View>

        <Pressable
          onPress={onIncrement}
          disabled={quantity >= maxQuantity}
          style={({ pressed }) => [
            styles.controlBtn,
            pressed && { opacity: 0.7 },
            quantity >= maxQuantity && { opacity: 0.3 }
          ]}
          hitSlop={{ top: 8, bottom: 8, left: 4, right: 10 }}
        >
          <Plus size={12} color="#ffffff" strokeWidth={3.5} />
        </Pressable>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btnContainer: {
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  centerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    width: '100%',
    height: '100%',
  },
  addText: {
    fontSize: 11.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  plusText: {
    fontSize: 14.5,
    fontWeight: '600',
    marginTop: -2.5,
  },
  controlBtn: {
    paddingHorizontal: 8,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyTextWrapper: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '900',
  },
});
