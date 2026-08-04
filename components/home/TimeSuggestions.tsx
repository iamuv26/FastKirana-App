import React from 'react';
import { View, Text, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Utensils, Cookie, Moon } from 'lucide-react-native';
import ProductCard, { Product } from '../product/ProductCard';
import { useTheme } from '../../app/context/ThemeContext';
import { THEME } from '../../lib/theme';

interface TimeSuggestionsProps {
  products: Product[];
}

export default function TimeSuggestions({ products }: TimeSuggestionsProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

  if (!products || products.length === 0) return null;

  const currentHour = new Date().getHours();

  // Determine configuration based on hour
  let icon = <Sun size={18} color={THEME.COLORS.brand.warning} />;
  let title = 'Breakfast Essentials';
  let subtitle = 'Start your morning fresh';
  let gradientColors: [string, string] = isDarkMode
    ? ['rgba(245,158,11,0.06)', 'rgba(24,24,27,0.8)']
    : ['#fffbeb', '#ffffff'];
  let borderColor = isDarkMode ? 'rgba(245,158,11,0.15)' : '#fef3c7';

  if (currentHour >= 6 && currentHour < 11) {
    // Breakfast Essentials
    icon = <Sun size={18} color={THEME.COLORS.brand.warning} />;
    title = 'Breakfast Essentials';
    subtitle = 'Start your morning fresh';
    gradientColors = isDarkMode
      ? ['rgba(245,158,11,0.06)', 'rgba(24,24,27,0.8)']
      : ['#fffbeb', '#ffffff'];
    borderColor = isDarkMode ? 'rgba(245,158,11,0.15)' : '#fef3c7';
  } else if (currentHour >= 11 && currentHour < 16) {
    // Lunch Time Picks
    icon = <Utensils size={18} color="#ea580c" />;
    title = 'Lunch Time Picks';
    subtitle = 'Spices, staples and produce';
    gradientColors = isDarkMode
      ? ['rgba(120,113,108,0.06)', 'rgba(24,24,27,0.8)']
      : ['#fafaf9', '#ffffff'];
    borderColor = isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9';
  } else if (currentHour >= 16 && currentHour < 20) {
    // Snack O'Clock
    icon = <Cookie size={18} color="#b45309" />;
    title = "Snack O'Clock";
    subtitle = 'Munchies, chips and quick bites';
    gradientColors = isDarkMode
      ? ['rgba(249,115,22,0.06)', 'rgba(24,24,27,0.8)']
      : ['#fff7ed', '#ffffff'];
    borderColor = isDarkMode ? 'rgba(249,115,22,0.15)' : '#ffedd5';
  } else {
    // Late Night Cravings
    icon = <Moon size={18} color="#6366f1" fill={isDarkMode ? 'rgba(99,102,241,0.2)' : undefined} />;
    title = 'Late Night Cravings';
    subtitle = 'Sweet bites & cool drinks';
    gradientColors = isDarkMode
      ? ['rgba(99,102,241,0.06)', 'rgba(24,24,27,0.8)']
      : ['#f5f3ff', '#ffffff'];
    borderColor = isDarkMode ? 'rgba(99,102,241,0.15)' : '#ede9fe';
  }

  return (
    <View style={{ marginHorizontal: THEME.SPACING.lg, marginVertical: THEME.SPACING.sm, borderRadius: THEME.RADIUS.lg, borderWidth: 1, borderColor: borderColor, overflow: 'hidden', ...Platform.select({
      ios: THEME.SHADOWS.sm,
      android: { elevation: 1 },
    }) }}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ padding: THEME.SPACING.lg }}
      >
        {/* Section Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm, marginBottom: THEME.SPACING.md }}>
          <View style={{ width: 36, height: 36, borderRadius: THEME.RADIUS.sm, backgroundColor: isDarkMode ? colors.surfaceElevated : '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDarkMode ? colors.border : '#f1f5f9' }}>
            {icon}
          </View>
          <View>
            <Text style={{ fontSize: 15, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: colors.textPrimary }}>{title}</Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.medium, color: colors.textSecondary, marginTop: 1 }}>{subtitle}</Text>
          </View>
        </View>

        {/* Horizontal scroll of products */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: THEME.SPACING.md, paddingBottom: 4 }}
          decelerationRate="fast"
        >
          {products.map((product, idx) => (
            <View key={product.id} style={{ width: 144, height: 248 }}>
              <ProductCard product={product} index={idx} className="w-full" />
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
