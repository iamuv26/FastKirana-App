import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle, GestureResponderEvent, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { triggerHaptic, HapticType } from '../../lib/haptic';
import { SPRING, SCALE } from '../../lib/animation-config';

export interface ScalePressableProps extends PressableProps {
  children?: React.ReactNode | ((state: { pressed: boolean }) => React.ReactNode);
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  scaleValue?: number;                 // Custom press-in scale (defaults to 0.96)
  haptic?: HapticType | null;          // Custom haptic type (defaults to 'light', null to disable)
  springConfig?: { damping: number; stiffness: number }; // Custom spring config override
  animatedContainerStyle?: StyleProp<ViewStyle>; // Additional style to apply directly to the Animated wrapper
}

export const ScalePressable: React.FC<ScalePressableProps> = ({
  children,
  style,
  scaleValue = SCALE.press,
  haptic = 'light',
  springConfig = SPRING.press,
  animatedContainerStyle,
  onPressIn,
  onPressOut,
  onPress,
  hitSlop = 8,
  ...rest
}) => {
  const scale = useSharedValue(1);
  const [isPressed, setIsPressed] = React.useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = (event: GestureResponderEvent) => {
    setIsPressed(true);
    scale.value = withSpring(scaleValue, springConfig);
    if (onPressIn) onPressIn(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    setIsPressed(false);
    scale.value = withSpring(1, springConfig);
    if (onPressOut) onPressOut(event);
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (haptic) {
      triggerHaptic(haptic);
    }
    if (onPress) onPress(event);
  };

  const resolvedStyle = typeof style === 'function' ? style({ pressed: isPressed }) : style;
  const flattenedStyle = StyleSheet.flatten(resolvedStyle) || {};
  const resolvedChildren = typeof children === 'function' ? children({ pressed: isPressed }) : children;

  const hasWidth = flattenedStyle.width !== undefined && flattenedStyle.width !== 'auto';
  const hasHeight = flattenedStyle.height !== undefined && flattenedStyle.height !== 'auto';
  const isFlex = flattenedStyle.flex !== undefined && flattenedStyle.flex > 0;
  const isStretch = flattenedStyle.alignSelf === 'stretch';

  const shouldFillWidth = hasWidth || isFlex || isStretch;
  const shouldFillHeight = hasHeight || isFlex || isStretch;

  return (
    <Animated.View
      style={[
        flattenedStyle,
        animatedStyle,
        animatedContainerStyle,
      ] as any}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        hitSlop={hitSlop}
        style={{
          width: shouldFillWidth ? '100%' : undefined,
          height: shouldFillHeight ? '100%' : undefined,
          flexDirection: flattenedStyle.flexDirection || 'row',
          alignItems: flattenedStyle.alignItems || 'center',
          justifyContent: flattenedStyle.justifyContent || 'flex-start',
        }}
        {...rest}
      >
        {resolvedChildren}
      </Pressable>
    </Animated.View>
  );
};
