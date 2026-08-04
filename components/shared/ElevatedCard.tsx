import React, { useMemo } from 'react';
import { View, ViewStyle, Platform, useColorScheme, StyleSheet } from 'react-native';
import Animated, { AnimatedStyleProp } from 'react-native-reanimated';
import { THEME } from '../../lib/theme';

type ShadowKey = 'sm' | 'md' | 'lg' | 'xl' | 'primaryGlow' | 'accentGlow';

interface ElevatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle | AnimatedStyleProp<ViewStyle>;
  shadow?: ShadowKey;
  padding?: keyof typeof THEME.SPACING | number;
  borderRadius?: keyof typeof THEME.RADIUS | number;
  borderWidth?: number;
  backgroundColor?: string;
  animated?: boolean;
  animatedStyle?: AnimatedStyleProp<ViewStyle>;
}

const getShadow = (key: ShadowKey) => {
  if (Platform.OS === 'android') {
    return { elevation: THEME.SHADOWS[key].elevation };
  }
  return THEME.SHADOWS[key];
};

export function ElevatedCard({
  children,
  style,
  shadow = 'sm',
  padding = 'lg',
  borderRadius = 'lg',
  borderWidth = 1,
  backgroundColor,
  animated = false,
  animatedStyle,
}: ElevatedCardProps) {
  const cardStyle = useMemo<ViewStyle>(() => ({
    backgroundColor: backgroundColor || 'transparent',
    borderRadius: typeof borderRadius === 'number' ? borderRadius : THEME.RADIUS[borderRadius],
    padding: typeof padding === 'number' ? padding : THEME.SPACING[padding],
    borderWidth: borderWidth,
    borderColor: backgroundColor
      ? 'rgba(0,0,0,0.06)'
      : THEME.COLORS.light.border,
    ...getShadow(shadow),
  }), [borderRadius, padding, borderWidth, backgroundColor, shadow]);

  const Wrapper = animated ? Animated.View : View;

  return (
    <Wrapper style={[cardStyle, style, animatedStyle]}>
      {children}
    </Wrapper>
  );
}
