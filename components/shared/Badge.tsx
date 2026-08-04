import React from 'react';
import { View, Text, ViewStyle, Platform } from 'react-native';
import { THEME } from '../../lib/theme';

type BadgeVariant = 'count' | 'discount' | 'status' | 'trending' | 'tag' | 'success' | 'warning';
type BadgeSize = 'sm' | 'md';
type TrendRank = 1 | 2 | 3;

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  trendRank?: TrendRank;
  backgroundColor?: string;
  textColor?: string;
  borderColor?: string;
  style?: ViewStyle;
}

const TREND_COLORS: Record<TrendRank, { bg: string; text: string }> = {
  1: { bg: '#fef3c7', text: '#b45309' },
  2: { bg: '#f1f5f9', text: '#475569' },
  3: { bg: '#fef2f2', text: '#b91c1c' },
};

export function Badge({
  label,
  variant = 'count',
  size = 'sm',
  trendRank,
  backgroundColor,
  textColor,
  borderColor,
  style,
}: BadgeProps) {
  const resolved = (() => {
    if (trendRank) {
      const tc = TREND_COLORS[trendRank];
      return {
        backgroundColor: tc.bg,
        textColor: tc.text,
        borderColor: 'transparent',
      };
    }

    switch (variant) {
      case 'count':
        return {
          backgroundColor: THEME.COLORS.brand.primary,
          textColor: '#ffffff',
          borderColor: 'transparent',
        };
      case 'discount':
        return {
          backgroundColor: THEME.COLORS.brand.successLight,
          textColor: THEME.COLORS.brand.successDark,
          borderColor: THEME.COLORS.brand.success,
        };
      case 'status':
        return {
          backgroundColor: THEME.COLORS.light.borderLight,
          textColor: THEME.COLORS.light.textSecondary,
          borderColor: THEME.COLORS.light.border,
        };
      case 'tag':
        return {
          backgroundColor: THEME.COLORS.brand.primaryLight,
          textColor: THEME.COLORS.brand.primaryDark,
          borderColor: THEME.COLORS.brand.primary,
        };
      case 'success':
        return {
          backgroundColor: THEME.COLORS.brand.successLight,
          textColor: THEME.COLORS.brand.successDark,
          borderColor: THEME.COLORS.brand.success,
        };
      case 'warning':
        return {
          backgroundColor: THEME.COLORS.brand.warningLight,
          textColor: THEME.COLORS.brand.warningDark,
          borderColor: THEME.COLORS.brand.warning,
        };
      default:
        return {
          backgroundColor: THEME.COLORS.light.borderLight,
          textColor: THEME.COLORS.light.textSecondary,
          borderColor: 'transparent',
        };
    }
  })();

  const fontSize = size === 'sm' ? THEME.TYPOGRAPHY.sizes.micro : THEME.TYPOGRAPHY.sizes.caption;
  const paddingH = size === 'sm' ? 6 : THEME.SPACING.sm;
  const paddingV = size === 'sm' ? 2 : THEME.SPACING.xs;
  const borderRadius = size === 'sm' ? THEME.RADIUS.sm : THEME.RADIUS.md;

  const badgeStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: backgroundColor || resolved.backgroundColor,
    borderColor: borderColor || resolved.borderColor,
    borderWidth: borderColor && borderColor !== 'transparent' ? 1 : 0,
    borderRadius,
    paddingHorizontal: paddingH,
    paddingVertical: paddingV,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  };

  return (
    <View style={[badgeStyle, style]}>
      <Text
        numberOfLines={1}
        style={{
          fontSize,
          fontWeight: THEME.TYPOGRAPHY.weights.bold,
          color: textColor || resolved.textColor,
          letterSpacing: 0.3,
          lineHeight: fontSize + 2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}
