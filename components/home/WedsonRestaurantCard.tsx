import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  ActivityIndicator, 
  Platform 
} from 'react-native';
import { ChevronRight, Utensils, Flame, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import ProductCard, { Product } from '../product/ProductCard';
import { useTheme } from '../../app/context/ThemeContext';
import { ScalePressable } from '../shared/ScalePressable';
import { triggerHaptic } from '../../lib/haptic';
import { API_BASE_URL } from '../../lib/constants';
import { router } from 'expo-router';
import { useUIStore } from '../../stores/ui-store';

export interface WedsonCategory {
  id: string;
  name: string;
  emoji: string;
}

const WEDSON_CATEGORIES: WedsonCategory[] = [
  { id: 'all', name: "Chef's Specials", emoji: '🔥' },
  { id: 'biryani', name: 'Biryani & Thali', emoji: '🍛' },
  { id: 'rotis', name: 'North Indian & Rotis', emoji: '🫓' },
  { id: 'chinese', name: 'Chinese & Starters', emoji: '🥢' },
  { id: 'pizza', name: 'Pizzas & Fast Food', emoji: '🍕' },
  { id: 'shakes', name: 'Shakes & Drinks', emoji: '🧋' },
];

export default function WedsonRestaurantCard() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const cafeOpen = useUIStore((s) => s.cafeOpen);

  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Real Database Data Fetching
  const { data: realProducts = [], isLoading } = useQuery<Product[]>({
    queryKey: ['wedson-restaurant-products-v3'],
    queryFn: async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/products?limit=500`);
        if (!response.ok) throw new Error('API fetch failed');
        const data = await response.json();
        const list = Array.isArray(data) ? data : (data.products || []);
        
        // Filter for food/cafe/restaurant items
        const cafeList = list.filter((p: Product) => {
          const catSlug = p.category?.slug?.toLowerCase() || '';
          const tags = p.tags?.map((t: string) => t.toLowerCase()) || [];
          return catSlug.includes('cafe') || 
                 catSlug.includes('food') || 
                 catSlug.includes('restaurant') ||
                 tags.some((t: string) => ['cafe', 'restaurant', 'chinese', 'sandwich', 'pizza', 'shake', 'biryani', 'meal'].includes(t));
        });

        return cafeList.length > 0 ? cafeList : list.slice(0, 10);
      } catch (e) {
        return [];
      }
    },
    staleTime: 0,
  });

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'all') return realProducts;

    return realProducts.filter((p) => {
      const catSlug = p.category?.slug?.toLowerCase() || '';
      const tags = p.tags?.map((t: string) => t.toLowerCase()) || [];
      const nameLower = p.name?.toLowerCase() || '';

      const matches = (keywords: string[]) => {
        return (
          keywords.some((k) => catSlug.includes(k)) ||
          keywords.some((k) => tags.some((t) => t.includes(k))) ||
          keywords.some((k) => nameLower.includes(k))
        );
      };

      if (activeCategory === 'biryani') {
        return matches(['biryani', 'thali', 'rice', 'pulav', 'pulao', 'combo', 'meal']);
      }
      if (activeCategory === 'rotis') {
        return matches(['roti', 'naan', 'paratha', 'paneer', 'curry', 'dal', 'makhani', 'sabzi', 'north-indian', 'butter', 'tandoori']);
      }
      if (activeCategory === 'chinese') {
        return matches(['chinese', 'momo', 'noodles', 'noodle', 'manchurian', 'chilli', 'spring-roll', 'chowmein']);
      }
      if (activeCategory === 'pizza') {
        return matches(['pizza', 'pasta', 'burger', 'sandwich', 'italian', 'garlic-bread', 'fries', 'snack']);
      }
      if (activeCategory === 'shakes') {
        return matches(['shake', 'drink', 'beverage', 'cooler', 'mocktail', 'coffee', 'iced-coffee', 'tea', 'lassi', 'cold-drink']);
      }

      return matches([activeCategory]);
    });
  }, [realProducts, activeCategory]);

  const displayProducts = filteredProducts;

  const handleSeeAll = () => {
    triggerHaptic('medium');
    router.push('/cafe');
  };

  return (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={isDarkMode ? ['#27170c', '#18181b', '#09090b'] : ['#fff7ed', '#fffaf5', '#ffffff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.outerCard, isDarkMode ? styles.outerCardDark : styles.outerCardLight]}
      >
        {/* Sleek Gourmet Header */}
        <View style={styles.bannerHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
            <View style={styles.badgeCapsule}>
              <Flame size={11} color="#ea580c" style={{ marginRight: 3 }} />
              <Text style={styles.badgeText}>WEDSON SPECIALS</Text>
            </View>
            <View style={[styles.liveBadge, !cafeOpen && { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <View style={[styles.liveDot, !cafeOpen && { backgroundColor: '#ef4444' }]} />
              <Text style={[styles.liveText, !cafeOpen && { color: '#ef4444' }]}>{cafeOpen ? 'FRESH PREP' : 'CLOSED NOW'}</Text>
            </View>
          </View>

          <Text style={[styles.bannerSubTitle, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
            Fresh & Hot Gourmet Meals from
          </Text>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text style={[styles.bannerMainTitle, isDarkMode ? styles.textLight : styles.textDark]}>
              Wedson Restaurant
            </Text>
            <Text style={{ fontSize: 20 }}>👨‍🍳🍛🍕</Text>
          </View>
        </View>

        {/* Category Pills Strip */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScrollContainer}
        >
          {WEDSON_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <ScalePressable
                key={cat.id}
                onPress={() => {
                  triggerHaptic('light');
                  setActiveCategory(cat.id);
                }}
                scaleValue={0.96}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 18,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: isActive ? '#ea580c' : (isDarkMode ? '#27272a' : '#ffffff'),
                  borderWidth: 1.2,
                  borderColor: isActive ? '#ea580c' : (isDarkMode ? '#3f3f46' : '#fed7aa'),
                  shadowColor: isActive ? '#ea580c' : '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.3 : 0.04,
                  shadowRadius: 4,
                  elevation: isActive ? 3 : 1,
                }}
              >
                <Text style={{ fontSize: 12.5 }}>{cat.emoji}</Text>
                <Text style={{
                  fontSize: 12,
                  fontWeight: '900',
                  color: isActive ? '#ffffff' : (isDarkMode ? '#f4f4f5' : '#1e293b'),
                }}>
                  {cat.name}
                </Text>
              </ScalePressable>
            );
          })}
        </ScrollView>

        {/* Grocery Product Cards Carousel (Exact Grocery Match & Real Sync) */}
        {isLoading ? (
          <View style={{ height: 180, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#ea580c" />
            <Text style={{ fontSize: 12, fontWeight: '700', color: isDarkMode ? '#a1a1aa' : '#64748b', marginTop: 8 }}>
              Syncing Wedson Menu...
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productScrollContainer}
          >
            {displayProducts.slice(0, 12).map((prod, idx) => (
              <View key={prod.id || idx} style={{ width: 144, height: 270 }}>
                <ProductCard 
                  product={prod} 
                  index={idx} 
                  className="w-full" 
                  isCafeStyle={true}
                />
              </View>
            ))}
          </ScrollView>
        )}

        {/* Premium Footer Action Button */}
        <View style={styles.footerWrap}>
          <ScalePressable
            onPress={handleSeeAll}
            scaleValue={0.97}
            style={{
              width: '100%',
              height: 46,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: isDarkMode ? '#ea580c' : '#fed7aa',
              backgroundColor: isDarkMode ? 'rgba(234, 88, 12, 0.15)' : '#fff7ed',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              ...Platform.select({
                ios: {
                  shadowColor: '#ea580c',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.12,
                  shadowRadius: 6,
                },
                android: {
                  elevation: 2,
                }
              })
            }}
          >
            <Utensils size={15} color="#ea580c" />
            <Text style={{ color: '#ea580c', fontSize: 13.5, fontWeight: '900', letterSpacing: 0.2 }}>
              Explore Full Wedson Restaurant Menu
            </Text>
            <ChevronRight size={15} color="#ea580c" strokeWidth={3} />
          </ScalePressable>
        </View>

      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginHorizontal: 16,
    marginVertical: 12,
  },
  outerCard: {
    borderRadius: 24,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1.5,
    ...Platform.select({
      ios: {
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      }
    })
  },
  outerCardLight: {
    borderColor: '#fed7aa',
  },
  outerCardDark: {
    borderColor: '#451a03',
  },
  bannerHeader: {
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  badgeCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#ea580c',
    letterSpacing: 0.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  liveText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#15803d',
    letterSpacing: 0.4,
  },
  bannerSubTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  bannerMainTitle: {
    fontSize: 21,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  textLight: {
    color: '#f4f4f5',
  },
  textDark: {
    color: '#0f172a',
  },
  subtextLight: {
    color: '#ea580c',
  },
  subtextDark: {
    color: '#fb923c',
  },
  categoryScrollContainer: {
    paddingHorizontal: 18,
    gap: 8,
    paddingBottom: 12,
  },
  productScrollContainer: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 12,
  },
  footerWrap: {
    paddingHorizontal: 18,
    marginTop: 10,
  },
});
