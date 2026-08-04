import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { THEME } from '../../lib/theme';

export interface ElevatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  animatedStyle?: AnimatedStyle<ViewStyle>;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  isDarkMode?: boolean;
}

export const ElevatedCard: React.FC<ElevatedCardProps> = ({
  children,
  style,
  animatedStyle,
  elevation = 'md',
  isDarkMode = false,
}) => {
  const getShadowStyle = () => {
    switch (elevation) {
      case 'sm':
        return styles.shadowSm;
      case 'lg':
        return styles.shadowLg;
      case 'xl':
        return styles.shadowXl;
      case 'md':
      default:
        return styles.shadowMd;
    }
  };

  return (
    <Animated.View
      style={[
        styles.card,
        isDarkMode ? styles.darkCard : styles.lightCard,
        getShadowStyle(),
        style,
        animatedStyle,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: THEME.RADIUS.lg,
    overflow: 'hidden',
  },
  lightCard: {
    backgroundColor: '#ffffff',
    borderColor: '#f1f5f9',
    borderWidth: 1,
  },
  darkCard: {
    backgroundColor: '#18181b',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
  },
  shadowSm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  shadowMd: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 4,
  },
  shadowLg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  shadowXl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
});
