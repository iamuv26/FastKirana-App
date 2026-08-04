import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ChevronRight, CloudRain, Umbrella, Coffee, Cookie } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import ProductCard, { Product } from '../product/ProductCard';
import { ScalePressable } from '../shared/ScalePressable';
import { useTheme } from '../../app/context/ThemeContext';
import { THEME } from '../../lib/theme';
import { triggerHaptic } from '../../lib/haptic';
import { API_BASE_URL } from '../../lib/constants';
import { router } from 'expo-router';

export interface MonsoonCategory {
  id: string;
  name: string;
  emoji: string;
  keywords: string[];
}

const MONSOON_CATEGORIES: MonsoonCategory[] = [
  { id: 'all', name: 'All Essentials', emoji: '🌧️', keywords: [] },
  { id: 'chai-snacks', name: 'Chai & Snacks', emoji: '☕', keywords: ['tea', 'chai', 'biscuit', 'namkeen', 'snack', 'chips', 'biscuits', 'cookies'] },
  { id: 'bhajiya', name: 'Bhajiya Mixes', emoji: '🧅', keywords: ['bhajiya', 'pakora', 'mix', 'besan', 'onion', 'batter'] },
  { id: 'hot-beverages', name: 'Hot Beverages', emoji: '☕', keywords: ['coffee', 'tea', 'hot-chocolate', 'soup', 'chocolate', 'instant'] },
  { id: 'dry-fruits', name: 'Dry Fruits & Seeds', emoji: '🥜', keywords: ['dry-fruit', 'nut', 'seed', 'almond', 'cashew', 'raisin', 'walnut', 'kaju', 'badam'] },
  { id: 'soups-noodles', name: 'Soups & Noodles', emoji: '🍜', keywords: ['noodle', 'soup', 'maggi', 'pasta', 'vermicelli', 'cornflakes', 'oats'] },
  { id: 'personal-care', name: 'Rain Care', emoji: '🌿', keywords: ['umbrella', 'boot', 'rain', 'waterproof', 'sanitizer', 'handwash', 'soap'] },
];

export default function MonsoonCategoryCard() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

  const [activeCategory, setActiveCategory] = useState<string>('all');

  const { data: allProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['monsoon-products'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products?limit=500`);
        if (!response.ok) throw new Error('API fetch failed');
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.products || []);
        return list;
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
  });

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') {
      const allKeywords = MONSOON_CATEGORIES
        .filter((c) => c.id !== 'all')
        .flatMap((c) => c.keywords);
      const scored = allProducts.map((p) => {
        const searchStr =
          `${p.name} ${p.category?.name || ''} ${p.category?.slug || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
        const matchCount = allKeywords.filter((k) => searchStr.includes(k)).length;
        return { product: p, score: matchCount };
      });
      scored.sort((a, b) => b.score - a.score);
      const unique = Array.from(new Map(scored.map((s) => [s.product.id, s.product])).values());
      return unique.slice(0, 16);
    }

    const category = MONSOON_CATEGORIES.find((c) => c.id === activeCategory);
    if (!category || category.keywords.length === 0) return allProducts.slice(0, 12);

    return allProducts.filter((p) => {
      const searchStr =
        `${p.name} ${p.category?.name || ''} ${p.category?.slug || ''} ${(p.tags || []).join(' ')}`.toLowerCase();
      return category.keywords.some((k) => searchStr.includes(k));
    });
  }, [allProducts, activeCategory]);

  const handleSeeAll = () => {
    triggerHaptic('medium');
    router.push('/category/monsoon-essentials');
  };

  const gradientStart = isDarkMode ? 'rgba(99,102,241,0.08)' : '#f5f3ff';
  const gradientEnd = isDarkMode ? THEME.COLORS.dark.background : '#ffffff';
  const pillActiveBg = '#6366f1';
  const pillActiveBorder = 'rgba(99,102,241,0.3)';
  const pillInactiveBg = isDarkMode ? '#27272a' : '#ffffff';
  const pillInactiveBorder = isDarkMode ? '#3f3f46' : '#e2e8f0';
  const pillInactiveText = isDarkMode ? '#d4d4d8' : '#475569';

  return (
    <View style={[styles.cardContainer, { marginHorizontal: THEME.SPACING.lg, marginVertical: THEME.SPACING.sm }]}>
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[
          styles.outerCard,
          {
            borderRadius: THEME.RADIUS.xl,
            borderWidth: 1.5,
            borderColor: colors.border,
            ...Platform.select({
              ios: {
                shadowColor: '#6366f1',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 12,
              },
              android: { elevation: 2 },
            }),
          },
        ]}
      >
        {/* ── Monsoon Header ── */}
        <View style={{ paddingHorizontal: THEME.SPACING.lg, paddingTop: THEME.SPACING.lg, marginBottom: THEME.SPACING.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: isDarkMode ? 'rgba(99,102,241,0.1)' : '#ede9fe',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(99,102,241,0.2)' : '#ddd6fe',
              paddingHorizontal: THEME.SPACING.sm,
              paddingVertical: 4,
              borderRadius: THEME.RADIUS.sm,
              gap: 4,
            }}>
              <CloudRain size={12} color="#6366f1" />
              <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, color: '#6366f1', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                Monsoon Special
              </Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Umbrella size={12} color={isDarkMode ? '#a78bfa' : '#6366f1'} />
              <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.semibold, color: isDarkMode ? '#a78bfa' : '#6366f1' }}>
                Rainy Season
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{
              fontSize: THEME.TYPOGRAPHY.sizes.title,
              fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
              color: colors.textPrimary,
              letterSpacing: -0.5,
            }}>
              Monsoon Essentials
            </Text>
            <Text style={{ fontSize: 22 }}>🌧️</Text>
          </View>
          <Text style={{
            fontSize: THEME.TYPOGRAPHY.sizes.caption,
            fontWeight: THEME.TYPOGRAPHY.weights.regular,
            color: colors.textSecondary,
            marginTop: 2,
            lineHeight: 16,
          }}>
            Everything you need for cozy rainy days — delivered in minutes
          </Text>
        </View>

        {/* ── Category Pills Strip ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: THEME.SPACING.lg, gap: THEME.SPACING.sm, paddingBottom: THEME.SPACING.md }}
          decelerationRate="fast"
        >
          {MONSOON_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <ScalePressable
                key={cat.id}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveCategory(cat.id);
                }}
                scaleValue={0.95}
              >
                {isActive ? (
                  <View style={{
                    borderRadius: THEME.RADIUS.pill,
                    backgroundColor: pillActiveBg,
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    shadowColor: pillActiveBg,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 3,
                  }}>
                    <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
                    <Text style={{
                      fontSize: THEME.TYPOGRAPHY.sizes.caption,
                      fontWeight: THEME.TYPOGRAPHY.weights.bold,
                      color: '#ffffff',
                      letterSpacing: 0.2,
                    }}>
                      {cat.name}
                    </Text>
                  </View>
                ) : (
                  <View style={{
                    borderRadius: THEME.RADIUS.pill,
                    backgroundColor: pillInactiveBg,
                    paddingVertical: 7,
                    paddingHorizontal: 14,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    borderWidth: 1.2,
                    borderColor: pillInactiveBorder,
                    shadowColor: '#000000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.04,
                    shadowRadius: 2,
                    elevation: 1,
                  }}>
                    <Text style={{ fontSize: 12 }}>{cat.emoji}</Text>
                    <Text style={{
                      fontSize: THEME.TYPOGRAPHY.sizes.caption,
                      fontWeight: THEME.TYPOGRAPHY.weights.medium,
                      color: pillInactiveText,
                    }}>
                      {cat.name}
                    </Text>
                  </View>
                )}
              </ScalePressable>
            );
          })}
        </ScrollView>

        {/* ── Product Cards ── */}
        {isLoading ? (
          <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, color: colors.textSecondary, marginTop: THEME.SPACING.md }}>
              Loading monsoon deals...
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: THEME.SPACING.lg, gap: THEME.SPACING.md, paddingBottom: THEME.SPACING.md }}
            decelerationRate="fast"
          >
            {filteredProducts.slice(0, 12).map((product, idx) => (
              <View key={product.id || idx} style={{ width: 144, height: 248 }}>
                <ProductCard product={product} index={idx} className="w-full" />
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Footer CTA ── */}
        <View style={{ paddingHorizontal: THEME.SPACING.lg, paddingBottom: THEME.SPACING.lg }}>
          <ScalePressable onPress={handleSeeAll} scaleValue={0.97}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              paddingVertical: THEME.SPACING.sm,
              borderRadius: THEME.RADIUS.md,
              backgroundColor: isDarkMode ? 'rgba(99,102,241,0.08)' : '#f5f3ff',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(99,102,241,0.15)' : '#e0d7ff',
            }}>
              <Coffee size={14} color="#6366f1" />
              <Text style={{
                fontSize: THEME.TYPOGRAPHY.sizes.caption,
                fontWeight: THEME.TYPOGRAPHY.weights.bold,
                color: '#6366f1',
                letterSpacing: 0.2,
              }}>
                See All Monsoon Essentials
              </Text>
              <ChevronRight size={14} color="#6366f1" strokeWidth={2.5} />
            </View>
          </ScalePressable>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginVertical: THEME.SPACING.sm,
  },
  outerCard: {
    paddingTop: 0,
    paddingBottom: 0,
    overflow: 'hidden',
  },
});
