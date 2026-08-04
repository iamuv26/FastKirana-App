import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { THEME } from '../../lib/theme';

export interface BadgeProps {
  label: string;
  variant?: 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  textStyle,
}) => {
  const getVariantStyles = (): { bg: string; border: string; text: string } => {
    switch (variant) {
      case 'accent':
        return {
          bg: '#fff7ed',
          border: '#ffedd5',
          text: '#ea580c',
        };
      case 'success':
        return {
          bg: '#ecfdf5',
          border: '#a7f3d0',
          text: '#10b981',
        };
      case 'warning':
        return {
          bg: '#fffbeb',
          border: '#fde68a',
          text: '#f59e0b',
        };
      case 'error':
        return {
          bg: '#fef2f2',
          border: '#fecaca',
          text: '#ef4444',
        };
      case 'outline':
        return {
          bg: 'transparent',
          border: '#e2e8f0',
          text: '#64748b',
        };
      case 'primary':
      default:
        return {
          bg: '#fff1f2',
          border: '#fecdd3',
          text: '#e11d48',
        };
    }
  };

  const getSizeStyles = (): { paddingH: number; paddingV: number; fontSize: number } => {
    switch (size) {
      case 'sm':
        return { paddingH: 6, paddingV: 2, fontSize: 9.5 };
      case 'lg':
        return { paddingH: 12, paddingV: 5, fontSize: 12.5 };
      case 'md':
      default:
        return { paddingH: 8, paddingV: 3, fontSize: 11 };
    }
  };

  const vStyles = getVariantStyles();
  const sStyles = getSizeStyles();

  const fontWeightVal: TextStyle['fontWeight'] = '800';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: vStyles.bg,
          borderColor: vStyles.border,
          paddingHorizontal: sStyles.paddingH,
          paddingVertical: sStyles.paddingV,
        },
        style,
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        allowFontScaling={false}
        style={[
          styles.text,
          {
            color: vStyles.text,
            fontSize: sStyles.fontSize,
            fontWeight: fontWeightVal,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: THEME.RADIUS.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: 4,
  },
  text: {
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
