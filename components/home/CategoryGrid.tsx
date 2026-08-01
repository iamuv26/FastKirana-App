import { View, Text, Pressable, Platform, ScrollView, StyleSheet, Image as RNImage } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-keys';
import { useMemo } from 'react';
import { API_BASE_URL } from '../../lib/constants';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { triggerHaptic } from '../../lib/haptic';
import { useTheme } from '../../app/context/ThemeContext';
import { getAppImageSource } from '../../lib/utils';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../lib/theme';
import { LayoutGrid, ArrowRight } from 'lucide-react-native';


interface LocalConfig {
  name: string;
  image: any;
  colors: [string, string];
  darkColors: [string, string];
}

const LOCAL_CONFIGS: Record<string, LocalConfig> = {
  'fruits-vegetables': { name: 'Fruits &\nVegetables', image: require('../../assets/fruits_vegetables_category.webp'), colors: ['#f0fdf4', '#dcfce7'], darkColors: ['#064e3b', '#022c22'] },
  'dairy-breakfast': { name: 'Dairy &\nBreakfast', image: require('../../assets/dairy_breakfast_category.webp'), colors: ['#eff6ff', '#dbeafe'], darkColors: ['#1e3a8a', '#172554'] },
  'grocery-essential': { name: 'Atta, Rice\n& Dal', image: require('../../assets/atta_rice_dal_category.webp'), colors: ['#fefce8', '#fef9c3'], darkColors: ['#713f12', '#451a03'] },
  'snacks-biscuits': { name: 'Snacks &\nBiscuits', image: require('../../assets/snacks_munchies_category.webp'), colors: ['#fff7ed', '#ffedd5'], darkColors: ['#7c2d12', '#431407'] },
  'beverages': { name: 'Beverages', image: require('../../assets/beverages_category.webp'), colors: ['#f0f9ff', '#e0f2fe'], darkColors: ['#0c4a6e', '#082f49'] },
  'ice-cream': { name: 'Ice Cream', image: require('../../assets/ice_cream_category.webp'), colors: ['#f0fdfa', '#ccfbf1'], darkColors: ['#115e59', '#134e4a'] },
  'bakery': { name: 'Bakery', image: require('../../assets/bakery_biscuits_category.webp'), colors: ['#fafaf9', '#f5f5f4'], darkColors: ['#44403c', '#292524'] },
  'personal-care': { name: 'Personal\nCare', image: require('../../assets/personal_care_category.webp'), colors: ['#fdf2f8', '#fce7f3'], darkColors: ['#831843', '#500724'] },
  'household': { name: 'Home\nCleaners', image: require('../../assets/household_category.webp'), colors: ['#ecfeff', '#cffafe'], darkColors: ['#164e63', '#083344'] },
};

// Server→slug mapper used only for edge-case names the backend might send
const SERVER_SLUG_MAP: Record<string, string> = {
  'fruits': 'fruits-vegetables',
  'vegetables': 'fruits-vegetables',
  'dairy': 'dairy-breakfast',
  'atta': 'grocery-essential',
  'rice': 'grocery-essential',
  'dal': 'grocery-essential',
  'snacks': 'snacks-biscuits',
  'biscuits': 'snacks-biscuits',
  'drinks': 'beverages',
  'icecream': 'ice-cream',
};

function resolveSlug(name: string, slug: string): string {
  const lower = slug.toLowerCase();
  if (LOCAL_CONFIGS[lower]) return lower;
  if (SERVER_SLUG_MAP[lower]) return SERVER_SLUG_MAP[lower];
  return lower;
}

function CategoryGridItem({ category, index, isDarkMode, itemWidth }: { category: any; index: number; isDarkMode: boolean; itemWidth?: any }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View
      entering={undefined}
      style={{ width: itemWidth || '23%', alignItems: 'center' }}
    >
      <Animated.View style={[{ width: '100%' }, animatedStyle]}>
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            if (category.slug.toLowerCase().includes('cafe') || category.slug.toLowerCase().includes('café')) {
              router.push('/cafe');
            } else {
              router.push(`/category/${category.slug}`);
            }
          }}
          onPressIn={() => {
            scale.value = withSpring(0.95, { damping: 12, stiffness: 180 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 12, stiffness: 180 });
          }}
          style={{
            width: '100%',
            height: 126,
            backgroundColor: isDarkMode ? '#1e1e24' : '#ffffff',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: isDarkMode ? '#2d2d34' : '#f1f5f9',
            paddingVertical: 10,
            paddingHorizontal: 4,
            alignItems: 'center',
            justifyContent: 'center',
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDarkMode ? 0.35 : 0.04,
                shadowRadius: 6,
              },
              android: {
                elevation: 2,
              },
              web: {
                // @ts-ignore
                boxShadow: isDarkMode 
                  ? '0 4px 12px rgba(0,0,0,0.3)' 
                  : '0 4px 12px rgba(0, 0, 0, 0.03)',
              }
            })
          }}
        >
          {/* Inner Circle Image Container */}
          <View 
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
              overflow: 'hidden',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDarkMode ? '#27272a' : '#f8fafc',
            }}
          >
            {/* Visual Gradient Background */}
            <LinearGradient
              colors={isDarkMode ? category.darkColors : category.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            {category.emoji ? (
              <Text style={{ fontSize: 26 }}>{category.emoji}</Text>
            ) : (
              <ExpoImage 
                source={category.source}
                contentFit="cover"
                style={{ width: '100%', height: '100%' }}
                transition={200}
                cachePolicy="memory-disk"
                placeholder={isDarkMode ? "rgba(39,39,42,0.4)" : "rgba(241,245,249,0.6)"}
              />
            )}
          </View>
          
          {/* Label with upgraded typography */}
          <Text 
            numberOfLines={2} 
            allowFontScaling={false}
            style={{
              color: isDarkMode ? '#f4f4f5' : '#0f172a',
              fontSize: 10.5,
              fontWeight: '800',
              marginTop: 8,
              letterSpacing: -0.2,
              lineHeight: 13,
              textAlign: 'center',
              width: '100%',
              paddingHorizontal: 2,
            }}
          >
            {category.name}
          </Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

export default function CategoryGrid() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const { data: serverCategories = [] } = useQuery<any[]>({
    queryKey: queryKeys.categories.trending(),
    queryFn: async () => {
      // Try /categories?trending=true first (preferred)
      try {
        const res = await fetch(`${API_BASE_URL}/categories?trending=true`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) return data;
        }
      } catch {
        // fall through to fallback
      }
      // Fallback: fetch all categories and filter by isTrending flag
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      if (!Array.isArray(data)) return [];
      return data.filter((c: any) => c.isTrending !== false);
    },
    initialData: [],
    staleTime: 1000 * 60 * 15, // 15 mins cache validity
  });

  const displayCategories = useMemo(() => {
    if (serverCategories && Array.isArray(serverCategories) && serverCategories.length > 0) {
      try {
        // Filter: trending = true (or undefined, meaning we already got only trending via query param)
        const trending = serverCategories.filter(
          (c: any) => c && c.slug && (c.isTrending === true || c.isTrending === undefined)
        );

        // Sort by displayOrder / sortOrder (lowest first)
        const sorted = [...trending].sort((a: any, b: any) => {
          const ao = typeof a.displayOrder === 'number' ? a.displayOrder :
                     typeof a.sortOrder === 'number' ? a.sortOrder : 999;
          const bo = typeof b.displayOrder === 'number' ? b.displayOrder :
                     typeof b.sortOrder === 'number' ? b.sortOrder : 999;
          return ao - bo;
        });

        const list = sorted.map((serverCat: any) => {
          const normalizedSlug = resolveSlug(serverCat.name || '', serverCat.slug);
          const local = LOCAL_CONFIGS[normalizedSlug] || {
            name: serverCat.name,
            image: null,
            colors: ['#f0fdf4', '#dcfce7'] as [string, string],
            darkColors: ['#064e3b', '#022c22'] as [string, string]
          };

          const source = serverCat.imageUrl
            ? getAppImageSource(serverCat.imageUrl)
            : local.image;

          // Check if imageUrl is actually an emoji
          const isEmoji = serverCat.imageUrl &&
                          serverCat.imageUrl.length < 5 &&
                          !serverCat.imageUrl.startsWith('http') &&
                          !serverCat.imageUrl.startsWith('/');
          const emoji = isEmoji ? serverCat.imageUrl : null;

          const rawName = serverCat.name || local.name || '';
          const isCafe = normalizedSlug.toLowerCase().includes('cafe') ||
                         normalizedSlug.toLowerCase().includes('café') ||
                         rawName.toLowerCase().includes('cafe') ||
                         rawName.toLowerCase().includes('café');

          return {
            name: isCafe ? 'Food' : rawName,
            slug: normalizedSlug,
            colors: isCafe ? ['#fff7ed', '#ffedd5'] as [string, string] : local.colors,
            darkColors: isCafe ? ['#7c2d12', '#431407'] as [string, string] : local.darkColors,
            source: isCafe ? null : (emoji ? null : source),
            emoji: isCafe ? '🍔' : emoji
          };
        });

        if (list.length > 0) return list;
      } catch (err) {
        console.warn('Failed to parse server categories, falling back:', err);
      }
    }

    // Fallback: If empty, show hardcoded
    return Object.keys(LOCAL_CONFIGS).map(slug => {
      const local = LOCAL_CONFIGS[slug];
      return {
        name: local.name,
        slug: slug,
        colors: local.colors,
        darkColors: local.darkColors,
        source: local.image,
        emoji: null
      };
    });
  }, [serverCategories]);

  // Pair categories into 2-row vertical columns for horizontal sliding 2-row matrix layout
  const categoryPairs = useMemo(() => {
    const pairs: any[][] = [];
    for (let i = 0; i < displayCategories.length; i += 2) {
      pairs.push(displayCategories.slice(i, i + 2));
    }
    return pairs;
  }, [displayCategories]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: THEME.SPACING.lg,
        paddingBottom: 6,
        gap: 12,
      }}
      style={{ marginBottom: THEME.SPACING.lg }}
    >
      {categoryPairs.map((pair, colIndex) => (
        <View key={`col-${colIndex}`} style={{ width: 84, gap: 12 }}>
          {pair.map((category, rowIndex) => (
            <CategoryGridItem
              key={`${category.slug}-${rowIndex}`}
              category={category}
              index={colIndex * 2 + rowIndex}
              isDarkMode={isDarkMode}
              itemWidth="100%"
            />
          ))}
        </View>
      ))}

      {/* "See All Categories" End Card */}
      <View style={{ width: 84, justifyContent: 'center' }}>
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            router.push('/(tabs)/categories');
          }}
          style={{
            width: '100%',
            height: 264, // Full 2-row height
            backgroundColor: isDarkMode ? '#1e1e24' : '#fff1f2',
            borderRadius: 24,
            borderWidth: 1,
            borderColor: isDarkMode ? '#e20a22' : '#ffe4e6',
            paddingVertical: 12,
            paddingHorizontal: 4,
            alignItems: 'center',
            justifyContent: 'center',
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDarkMode ? 0.35 : 0.04,
                shadowRadius: 6,
              },
              android: {
                elevation: 2,
              },
            })
          }}
        >
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: isDarkMode ? 'rgba(226,10,34,0.2)' : '#ffe4e6',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 10,
            }}
          >
            <LayoutGrid size={22} color="#e20a22" />
          </View>
          <Text
            style={{
              color: '#e20a22',
              fontSize: 10,
              fontWeight: '900',
              textAlign: 'center',
              textTransform: 'uppercase',
              letterSpacing: -0.2,
              lineHeight: 13,
            }}
          >
            See All{'\n'}Categories
          </Text>
          <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <ArrowRight size={14} color="#e20a22" />
          </View>
        </Pressable>
      </View>
    </ScrollView>
  );
}

