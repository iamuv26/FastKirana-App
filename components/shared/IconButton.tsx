import React, { cloneElement, isValidElement } from 'react';
import { View, ViewStyle, Platform } from 'react-native';
import { THEME } from '../../lib/theme';
import { triggerHaptic } from '../../lib/haptic';
import { ScalePressable } from './ScalePressable';

interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: number;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  iconTint?: string;
  style?: ViewStyle;
}

export function IconButton({
  icon,
  onPress,
  size = 40,
  variant = 'secondary',
  disabled = false,
  iconTint: overrideTint,
  style,
}: IconButtonProps) {
  const backgroundColor = variant === 'primary'
    ? THEME.COLORS.brand.primary
    : variant === 'secondary'
      ? THEME.COLORS.light.surface
      : 'transparent';

  const borderColor = variant === 'primary'
    ? 'transparent'
    : THEME.COLORS.light.border;

  const iconTint = overrideTint || (variant === 'primary' ? '#ffffff' : THEME.COLORS.light.textPrimary);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor,
    borderWidth: variant === 'ghost' ? 0 : 1,
    borderColor,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: variant === 'ghost' ? 0 : 1,
      },
    }),
  };

  const resolvedIcon = isValidElement(icon)
    ? cloneElement(icon as React.ReactElement<{ color?: string; size?: number }>, {
        color: iconTint,
        size: size * 0.44,
      })
    : icon;

  return (
    <ScalePressable
      onPress={() => {
        triggerHaptic('light');
        onPress();
      }}
      disabled={disabled}
      scaleValue={0.9}
      hitSlop={8}
      style={[containerStyle, style]}
    >
      {resolvedIcon}
    </ScalePressable>
  );
}
