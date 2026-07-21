import React from 'react';
import { View, Text } from 'react-native';
import { Truck, Sparkles, ShieldCheck, Store } from 'lucide-react-native';
import { useTheme } from '../../app/context/ThemeContext';
import { THEME } from '../../lib/theme';

export default function DeliveryBanner() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <View style={{ marginHorizontal: THEME.SPACING.lg, marginTop: THEME.SPACING.md, marginBottom: 20, borderRadius: THEME.RADIUS.lg }} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 shadow-xs overflow-hidden">
      {/* Tagline */}
      <View style={{ paddingHorizontal: THEME.SPACING.lg, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9' }} className="bg-rose-50/40 dark:bg-zinc-800/40 flex-row items-center justify-center gap-1.5">
        <Store size={14} color={THEME.COLORS.brand.primary} />
        <Text style={{ fontSize: 11, fontWeight: '600', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }} className="text-center">
          From Your Town's Dark Store — Packed & Delivered by <Text style={{ color: THEME.COLORS.brand.primary, fontWeight: '750' as any }}>FastKirana</Text>
        </Text>
      </View>

      <View style={{ padding: THEME.SPACING.lg, gap: THEME.SPACING.lg }}>
        {/* Instant Delivery */}
        <View className="flex-row items-start gap-3.5">
          <View style={{ width: 40, height: 40, borderRadius: THEME.RADIUS.sm }} className="bg-rose-50 dark:bg-rose-950/20 items-center justify-center border border-rose-100/10">
            <Truck size={20} color={THEME.COLORS.brand.primary} />
          </View>
          <View className="flex-1">
            <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }}>Fast Instant Delivery</Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '500', color: isDarkMode ? THEME.COLORS.dark.textSecondary : THEME.COLORS.light.textSecondary, marginTop: 4 }} className="leading-relaxed">
              Our network of local dark stores delivers your groceries fresh to your doorstep with our fast delivery service.
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View style={{ height: 1, backgroundColor: isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9' }} />

        {/* Free Shipping */}
        <View className="flex-row items-start gap-3.5">
          <View style={{ width: 40, height: 40, borderRadius: THEME.RADIUS.sm }} className="bg-amber-50 dark:bg-amber-950/20 items-center justify-center border border-amber-100/10">
            <Sparkles size={20} color="#d97706" />
          </View>
          <View className="flex-1">
            <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }}>Smart Shipping Rates</Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '500', color: isDarkMode ? THEME.COLORS.dark.textSecondary : THEME.COLORS.light.textSecondary, marginTop: 4 }} className="leading-relaxed">
              📍 0 to 2 km: FREE delivery above ₹199 (else ₹25)
            </Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '500', color: isDarkMode ? THEME.COLORS.dark.textSecondary : THEME.COLORS.light.textSecondary, marginTop: 2 }} className="leading-relaxed">
              📍 2 to 3 km: FREE delivery above ₹249 (else ₹35)
            </Text>
          </View>
        </View>

        {/* Separator */}
        <View style={{ height: 1, backgroundColor: isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9' }} />

        {/* Freshness */}
        <View className="flex-row items-start gap-3.5">
          <View style={{ width: 40, height: 40, borderRadius: THEME.RADIUS.sm }} className="bg-emerald-50 dark:bg-emerald-950/20 items-center justify-center border border-emerald-100/10">
            <ShieldCheck size={20} color="#059669" />
          </View>
          <View className="flex-1">
            <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }}>Super Fresh Guarantee</Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '500', color: isDarkMode ? THEME.COLORS.dark.textSecondary : THEME.COLORS.light.textSecondary, marginTop: 4 }} className="leading-relaxed">
              Handpicked vegetables and fruits sourced daily. If you are not satisfied, return at the door.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
