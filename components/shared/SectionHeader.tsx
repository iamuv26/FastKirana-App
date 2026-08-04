import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { THEME } from '../../lib/theme';
import { useUIStore } from '../../stores/ui-store';
import { IconButton } from './IconButton';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  actionIcon?: React.ReactNode;
  emoji?: string;
  style?: ViewStyle;
  titleColor?: string;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
  actionIcon,
  emoji,
  style,
  titleColor,
}: SectionHeaderProps) {
  const isDarkMode = useUIStore((s) => s.theme) === 'dark';
  const textColor = titleColor || (isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary);
  const subTextColor = isDarkMode ? THEME.COLORS.dark.textSecondary : THEME.COLORS.light.textSecondary;

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: THEME.SPACING.lg,
        },
        style,
      ]}
    >
      <View style={{ flex: 1, paddingRight: THEME.SPACING.sm }}>
        {emoji && (
          <Text
            style={{
              fontSize: 18,
              marginBottom: THEME.SPACING.xs,
            }}
          >
            {emoji}
          </Text>
        )}
        <Text
          numberOfLines={1}
          style={{
            fontSize: THEME.TYPOGRAPHY.sizes.title,
            fontWeight: THEME.TYPOGRAPHY.weights.black,
            color: textColor,
            letterSpacing: -0.5,
            lineHeight: 26,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            numberOfLines={1}
            style={{
              fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
              fontWeight: THEME.TYPOGRAPHY.weights.medium,
              color: subTextColor,
              marginTop: THEME.SPACING.xs,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {(actionLabel || actionIcon) && onActionPress && (
        <View style={{ flexShrink: 0, justifyContent: 'center' }}>
          {actionLabel ? (
            <Text
              onPress={onActionPress}
              style={{
                fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
                fontWeight: THEME.TYPOGRAPHY.weights.semibold,
                color: THEME.COLORS.brand.primary,
              }}
            >
              {actionLabel}
            </Text>
          ) : (
            actionIcon
          )}
        </View>
      )}
    </View>
  );
}
