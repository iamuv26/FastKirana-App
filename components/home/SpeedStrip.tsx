import React from 'react';
import { View, Text, Platform, Pressable } from 'react-native';
import { Zap, Eye, Heart } from 'lucide-react-native';
import { useTheme } from '../../app/context/ThemeContext';
import { THEME } from '../../lib/theme';

export default function SpeedStrip() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

  return (
    <View
      style={{
        marginHorizontal: THEME.SPACING.lg,
        marginBottom: THEME.SPACING.lg,
        padding: THEME.SPACING.md,
        borderRadius: THEME.RADIUS.lg,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: isDarkMode ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.85)',
        borderColor: isDarkMode ? THEME.COLORS.dark.borderLight : 'rgba(0,0,0,0.04)',
        ...Platform.select({
          ios: THEME.SHADOWS.sm,
          android: {
            elevation: 2,
          },
        }),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Zap size={14} color={THEME.COLORS.brand.primary} fill={THEME.COLORS.brand.primary} />
        <View>
          <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: colors.textPrimary, lineHeight: 16 }}>8 Min Delivery</Text>
          <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.medium, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 }}>Average Speed</Text>
        </View>
      </View>
      <View style={{ width: 1, height: 24, backgroundColor: isDarkMode ? THEME.COLORS.dark.border : THEME.COLORS.light.border }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Eye size={14} color="#0284c7" />
        <View>
          <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: colors.textPrimary, lineHeight: 16 }}>1,231+ Buyers</Text>
          <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.medium, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 }}>Online Now</Text>
        </View>
      </View>
      <View style={{ width: 1, height: 24, backgroundColor: isDarkMode ? THEME.COLORS.dark.border : THEME.COLORS.light.border }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Heart size={13} color={THEME.COLORS.brand.primary} fill={THEME.COLORS.brand.primary} />
        <View>
          <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: colors.textPrimary, lineHeight: 16 }}>5,000+ Orders</Text>
          <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.medium, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.3 }}>Delivered</Text>
        </View>
      </View>
    </View>
  );
}
