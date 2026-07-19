import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonShimmer } from '../shared/SkeletonShimmer';
import { useTheme } from '../../app/context/ThemeContext';
import { THEME } from '../../lib/theme';

const { width: rawWidth } = Dimensions.get('window');
const width = rawWidth > 768 ? 540 : rawWidth;

interface ProductCardSkeletonProps {
  className?: string;
  style?: any;
}

export default function ProductCardSkeleton({ className, style }: ProductCardSkeletonProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <View 
      style={[
        styles.cardContainer,
        { 
          backgroundColor: isDarkMode ? THEME.COLORS.dark.surface : THEME.COLORS.light.surface,
          borderColor: isDarkMode ? THEME.COLORS.dark.border : THEME.COLORS.light.border
        },
        style
      ]}
    >
      <View 
        style={[
          styles.imagePlaceholder,
          { backgroundColor: isDarkMode ? THEME.COLORS.dark.surfaceElevated : THEME.COLORS.light.borderLight }
        ]}
      >
        <SkeletonShimmer width="90%" height="90%" borderRadius={THEME.RADIUS.sm} />
      </View>
      <SkeletonShimmer width="80%" height={16} style={{ marginTop: 12, marginBottom: 6 }} />
      <SkeletonShimmer width="45%" height={12} style={{ marginBottom: 16 }} />
      
      <View style={styles.footerRow}>
        <View style={{ gap: 4, width: '45%' }}>
          <SkeletonShimmer width="100%" height={18} />
          <SkeletonShimmer width="80%" height={10} />
        </View>
        <SkeletonShimmer width={78} height={32} borderRadius={THEME.RADIUS.xs} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: '100%',
    borderWidth: 1,
    borderRadius: THEME.RADIUS.md,
    padding: 10,
    marginBottom: THEME.SPACING.md,
    height: 290,
  },
  imagePlaceholder: {
    height: 140,
    borderRadius: THEME.RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 'auto',
  },
});
