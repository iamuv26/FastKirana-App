import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Truck, Sparkles, ShieldCheck, Store } from 'lucide-react-native';
import { useTheme } from '../../app/context/ThemeContext';
import { THEME } from '../../lib/theme';

export default function DeliveryBanner() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

  const sectionHeaderBg = isDarkMode ? 'rgba(39,39,42,0.5)' : '#fafafa';
  const iconContainerBg = isDarkMode ? 'rgba(226,10,34,0.08)' : '#fff5f5';
  const iconBorderColor = isDarkMode ? 'rgba(226,10,34,0.12)' : 'rgba(226,232,240,0.5)';

  return (
    <View style={{ marginHorizontal: THEME.SPACING.lg, marginTop: THEME.SPACING.md, marginBottom: THEME.SPACING.lg, borderRadius: THEME.RADIUS.lg, borderWidth: 1, borderColor: isDarkMode ? THEME.COLORS.dark.border : THEME.COLORS.light.border, overflow: 'hidden', ...Platform.select({
      ios: THEME.SHADOWS.sm,
      android: { elevation: 1 },
    }) }}>
      {/* Tagline */}
      <View style={{ paddingHorizontal: THEME.SPACING.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9', backgroundColor: sectionHeaderBg, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Store size={14} color={THEME.COLORS.brand.primary} />
        <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.semibold, color: colors.textPrimary, textAlign: 'center' }}>
          From Your Town's Dark Store — Packed & Delivered by <Text style={{ color: THEME.COLORS.brand.primary, fontWeight: THEME.TYPOGRAPHY.weights.extrabold }}>FastKirana</Text>
        </Text>
      </View>

      <View style={{ padding: THEME.SPACING.lg, gap: THEME.SPACING.lg }}>
        {/* Instant Delivery */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: THEME.SPACING.md }}>
          <View style={{ width: 40, height: 40, borderRadius: THEME.RADIUS.sm, backgroundColor: iconContainerBg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: iconBorderColor }}>
            <Truck size={20} color={THEME.COLORS.brand.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: colors.textPrimary, lineHeight: 18 }}>Fast Instant Delivery</Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.medium, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
              Our network of local dark stores delivers your groceries fresh to your doorstep with our fast delivery service.
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View style={{ height: 1, backgroundColor: isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9' }} />

        {/* Free Shipping */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: THEME.SPACING.md }}>
          <View style={{ width: 40, height: 40, borderRadius: THEME.RADIUS.sm, backgroundColor: isDarkMode ? 'rgba(217,119,6,0.1)' : '#fffbeb', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDarkMode ? 'rgba(217,119,6,0.15)' : 'rgba(254,243,199,0.5)' }}>
            <Sparkles size={20} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: colors.textPrimary, lineHeight: 18 }}>Smart Shipping Rates</Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.medium, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
              📍 0 to 2 km: FREE delivery above ₹199 (else ₹25)
            </Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.medium, color: colors.textSecondary, marginTop: 2, lineHeight: 18 }}>
              📍 2 to 3 km: FREE delivery above ₹249 (else ₹35)
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View style={{ height: 1, backgroundColor: isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9' }} />

        {/* Freshness */}
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: THEME.SPACING.md }}>
          <View style={{ width: 40, height: 40, borderRadius: THEME.RADIUS.sm, backgroundColor: isDarkMode ? 'rgba(5,150,105,0.1)' : '#f0fdf4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDarkMode ? 'rgba(5,150,105,0.15)' : 'rgba(220,252,231,0.5)' }}>
            <ShieldCheck size={20} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: colors.textPrimary, lineHeight: 18 }}>Super Fresh Guarantee</Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.medium, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
              Handpicked vegetables and fruits sourced daily. If you are not satisfied, return at the door.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
