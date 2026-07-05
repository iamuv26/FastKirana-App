import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sun, Utensils, Cookie, Moon } from 'lucide-react-native';
import ProductCard, { Product } from '../product/ProductCard';
import { useTheme } from '../../app/context/ThemeContext';

interface TimeSuggestionsProps {
  products: Product[];
}

export default function TimeSuggestions({ products }: TimeSuggestionsProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  if (!products || products.length === 0) return null;

  const currentHour = new Date().getHours();

  // Determine configuration based on hour
  let icon = <Sun size={18} color="#d97706" />;
  let title = 'Breakfast Essentials';
  let subtitle = 'Start your morning fresh';
  let gradientColors: [string, string] = isDarkMode 
    ? ['rgba(245,158,11,0.06)', 'rgba(24,24,27,0.8)'] 
    : ['#fffbeb', '#fff'];
  let borderTint = isDarkMode ? 'border-amber-500/10' : 'border-amber-100';

  if (currentHour >= 6 && currentHour < 11) {
    // Breakfast Essentials
    icon = <Sun size={18} color="#d97706" />;
    title = 'Breakfast Essentials';
    subtitle = 'Start your morning fresh';
    gradientColors = isDarkMode 
      ? ['rgba(245,158,11,0.06)', 'rgba(24,24,27,0.8)'] 
      : ['#fffbeb', '#fff'];
    borderTint = isDarkMode ? 'border-amber-500/10' : 'border-amber-100';
  } else if (currentHour >= 11 && currentHour < 16) {
    // Lunch Time Picks
    icon = <Utensils size={18} color="#ea580c" />;
    title = 'Lunch Time Picks';
    subtitle = 'Spices, staples and produce';
    gradientColors = isDarkMode 
      ? ['rgba(120,113,108,0.06)', 'rgba(24,24,27,0.8)'] 
      : ['#fafaf9', '#fff'];
    borderTint = isDarkMode ? 'border-zinc-800' : 'border-slate-100';
  } else if (currentHour >= 16 && currentHour < 20) {
    // Snack O'Clock
    icon = <Cookie size={18} color="#b45309" />;
    title = "Snack O'Clock";
    subtitle = 'Munchies, chips and quick bites';
    gradientColors = isDarkMode 
      ? ['rgba(249,115,22,0.06)', 'rgba(24,24,27,0.8)'] 
      : ['#fff7ed', '#fff'];
    borderTint = isDarkMode ? 'border-orange-500/10' : 'border-orange-100';
  } else {
    // Late Night Cravings
    icon = <Moon size={18} color="#6366f1" fill={isDarkMode ? 'rgba(99,102,241,0.2)' : undefined} />;
    title = 'Late Night Cravings';
    subtitle = 'Sweet bites & cool drinks';
    gradientColors = isDarkMode 
      ? ['rgba(99,102,241,0.06)', 'rgba(24,24,27,0.8)'] 
      : ['#f5f3ff', '#fff'];
    borderTint = isDarkMode ? 'border-indigo-500/10' : 'border-indigo-100';
  }

  return (
    <View className="mx-4 my-3 rounded-2xl overflow-hidden border shadow-xs" style={{ borderColor: isDarkMode ? '#27272a' : '#f1f5f9' }}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ padding: 16 }}
      >
        {/* Section Header */}
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 items-center justify-center shadow-xs border border-slate-100 dark:border-zinc-700/50">
            {icon}
          </View>
          <View>
            <Text className="text-title text-sm">{title}</Text>
            <Text className="text-subtitle text-[10px]">{subtitle}</Text>
          </View>
        </View>

        {/* Horizontal scroll of products */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
          decelerationRate="fast"
        >
          {products.map((product, idx) => (
            <View key={product.id} className="w-[155px]" style={{ height: 290 }}>
              <ProductCard product={product} index={idx} className="w-full" />
            </View>
          ))}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
