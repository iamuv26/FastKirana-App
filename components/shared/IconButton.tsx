import React from 'react';
import { ViewStyle, StyleSheet } from 'react-native';
import { ScalePressable } from './ScalePressable';
import { THEME } from '../../lib/theme';

export interface IconButtonProps {
  icon: React.ReactNode;
  onPress: () => void;
  size?: number;
  variant?: 'primary' | 'secondary' | 'surface' | 'ghost';
  isDarkMode?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 40,
  variant = 'surface',
  isDarkMode = false,
  style,
  disabled = false,
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary':
        return '#e11d48';
      case 'secondary':
        return '#10b981';
      case 'ghost':
        return 'transparent';
      case 'surface':
      default:
        return isDarkMode ? '#27272a' : '#f8fafc';
    }
  };

  const getBorderColor = () => {
    if (variant === 'ghost') return 'transparent';
    return isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0';
  };

  return (
    <ScalePressable
      onPress={onPress}
      disabled={disabled}
      scaleValue={0.93}
      haptic="light"
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'ghost' ? 0 : 1,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {icon}
    </ScalePressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
