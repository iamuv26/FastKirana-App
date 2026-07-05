import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SkeletonShimmer } from '../shared/SkeletonShimmer';
import { useTheme } from '../../app/context/ThemeContext';

const { width: rawWidth } = Dimensions.get('window');
const width = rawWidth > 768 ? 540 : rawWidth;

interface ProductCardSkeletonProps {
  className?: string;
}

export default function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <View 
      style={[
        styles.cardContainer,
        { 
          backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
          borderColor: isDarkMode ? '#27272a' : '#f1f5f9'
        }
      ]}
    >
      <View 
        style={[
          styles.imagePlaceholder,
          { backgroundColor: isDarkMode ? '#27272a' : '#f8f9fa' }
        ]}
      >
        <SkeletonShimmer width="90%" height="90%" borderRadius={12} />
      </View>
      <SkeletonShimmer width="80%" height={16} style={{ marginTop: 12, marginBottom: 6 }} />
      <SkeletonShimmer width="45%" height={12} style={{ marginBottom: 16 }} />
      
      <View style={styles.footerRow}>
        <View style={{ gap: 4, width: '45%' }}>
          <SkeletonShimmer width="100%" height={18} />
          <SkeletonShimmer width="80%" height={10} />
        </View>
        <SkeletonShimmer width={80} height={34} borderRadius={8} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: (width - 44) / 2, // Fits 2-column flex layout perfectly with gap margins
    borderWidth: 1,
    borderRadius: 16,
    padding: 10,
    marginBottom: 12,
    minHeight: 260,
  },
  imagePlaceholder: {
    height: 130,
    borderRadius: 12,
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
