import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { ScalePressable } from './ScalePressable';
import { ChevronRight } from 'lucide-react-native';
import { THEME } from '../../lib/theme';
import { useTheme } from '../../app/context/ThemeContext';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  icon?: React.ReactNode;
  badge?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  actionText,
  onActionPress,
  icon,
  badge,
  style,
  titleStyle,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const titleWeight: TextStyle['fontWeight'] = '800';
  const subtitleWeight: TextStyle['fontWeight'] = '600';
  const actionWeight: TextStyle['fontWeight'] = '800';

  return (
    <View style={[styles.container, style]}>
      <View style={styles.titleRow}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        <View style={styles.textWrap}>
          <View style={styles.headingBadgeRow}>
            <Text
              allowFontScaling={false}
              style={[
                styles.title,
                {
                  color: isDarkMode ? '#fafafa' : '#0f172a',
                  fontWeight: titleWeight,
                },
                titleStyle,
              ]}
            >
              {title}
            </Text>
            {badge && (
              <View style={[styles.badgePill, { backgroundColor: isDarkMode ? 'rgba(225,29,72,0.2)' : '#fff1f2' }]}>
                <Text allowFontScaling={false} style={styles.badgeText}>
                  {badge}
                </Text>
              </View>
            )}
          </View>
          {subtitle && (
            <Text
              allowFontScaling={false}
              style={[
                styles.subtitle,
                {
                  color: isDarkMode ? '#a1a1aa' : '#64748b',
                  fontWeight: subtitleWeight,
                },
              ]}
            >
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {actionText && onActionPress && (
        <ScalePressable
          onPress={onActionPress}
          scaleValue={0.96}
          haptic="light"
          style={styles.actionBtn}
        >
          <Text
            allowFontScaling={false}
            style={[
              styles.actionText,
              {
                color: '#e11d48',
                fontWeight: actionWeight,
              },
            ]}
          >
            {actionText}
          </Text>
          <ChevronRight size={14} color="#e11d48" strokeWidth={2.8} />
        </ScalePressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.md,
    marginVertical: THEME.SPACING.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  iconWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrap: {
    flex: 1,
  },
  headingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 18,
    letterSpacing: -0.3,
  },
  badgePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: THEME.RADIUS.pill,
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  badgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#e11d48',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 8,
  },
  actionText: {
    fontSize: 13,
    letterSpacing: -0.1,
  },
});
