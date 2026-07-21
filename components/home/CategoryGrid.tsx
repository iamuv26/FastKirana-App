import { View, Text, Pressable, Platform, ScrollView, StyleSheet, Image as RNImage } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { API_BASE_URL } from '../../lib/constants';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { triggerHaptic } from '../../lib/haptic';
import { useTheme } from '../../app/context/ThemeContext';
import { getAppImageSource } from '../../lib/utils';
import { LinearGradient } from 'expo-linear-gradient';
import { THEME } from '../../lib/theme';


interface LocalConfig {
  name: string;
  image: any;
  colors: [string, string];
  darkColors: [string, string];
}

const LOCAL_CONFIGS: Record<string, LocalConfig> = {
  'fruits-vegetables': { name: 'Fruits & Veg', image: require('../../assets/fruits_vegetables_category.webp'), colors: ['#f0fdf4', '#dcfce7'], darkColors: ['#064e3b', '#022c22'] },
  'dairy-breakfast': { name: 'Milk & Dairy', image: require('../../assets/dairy_breakfast_category.webp'), colors: ['#eff6ff', '#dbeafe'], darkColors: ['#1e3a8a', '#172554'] },
  'grocery-essential': { name: 'Staples', image: require('../../assets/atta_rice_dal_category.webp'), colors: ['#fefce8', '#fef9c3'], darkColors: ['#713f12', '#451a03'] },
  'snacks-biscuits': { name: 'Snacks', image: require('../../assets/snacks_munchies_category.webp'), colors: ['#fff7ed', '#ffedd5'], darkColors: ['#7c2d12', '#431407'] },
  'beverages': { name: 'Beverages', image: require('../../assets/beverages_category.webp'), colors: ['#f0f9ff', '#e0f2fe'], darkColors: ['#0c4a6e', '#082f49'] },
  'bakery': { name: 'Bakery', image: require('../../assets/bakery_biscuits_category.webp'), colors: ['#fafaf9', '#f5f5f4'], darkColors: ['#44403c', '#292524'] },
  'ice-cream': { name: 'Ice Cream', image: require('../../assets/ice_cream_category.webp'), colors: ['#f0fdfa', '#ccfbf1'], darkColors: ['#115e59', '#134e4a'] },
  'personal-care': { name: 'Personal Care', image: require('../../assets/personal_care_category.webp'), colors: ['#fdf2f8', '#fce7f3'], darkColors: ['#831843', '#500724'] },
  'household': { name: 'Home Care', image: require('../../assets/household_category.webp'), colors: ['#ecfeff', '#cffafe'], darkColors: ['#164e63', '#083344'] },
};

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
            backgroundColor: isDarkMode ? '#1e1e24' : '#ffffff',
            borderRadius: 16,
            borderWidth: 1,
            borderColor: isDarkMode ? '#2d2d34' : '#f1f5f9',
            paddingVertical: 12,
            paddingHorizontal: 4,
            alignItems: 'center',
            justifyContent: 'center',
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDarkMode ? 0.35 : 0.04,
                shadowRadius: 4,
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
              width: 58,
              height: 58,
              borderRadius: 29,
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
              fontSize: 10,
              fontWeight: '900',
              marginTop: 10,
              letterSpacing: -0.2,
              lineHeight: 12,
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
    queryKey: ['categories-list'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error('API failed');
      return res.json();
    },
    initialData: [],
    staleTime: 1000 * 60 * 15, // 15 mins cache validity
  });

  const displayCategories = useMemo(() => {
    if (serverCategories && serverCategories.length > 0) {
      const serverSlugs = new Set(serverCategories.map(c => c.slug));
      
      const list = serverCategories.map(serverCat => {
        const local = LOCAL_CONFIGS[serverCat.slug] || {
          name: serverCat.name.split(' & ')[0].split(' and ')[0].slice(0, 12),
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

        const rawName = serverCat.name || local.name;
        const isCafe = serverCat.slug.toLowerCase().includes('cafe') || 
                       serverCat.slug.toLowerCase().includes('café') ||
                       rawName.toLowerCase().includes('cafe') || 
                       rawName.toLowerCase().includes('café');

        return {
          name: isCafe ? 'Food' : rawName,
          slug: serverCat.slug,
          colors: isCafe ? ['#fff7ed', '#ffedd5'] as [string, string] : local.colors,
          darkColors: isCafe ? ['#7c2d12', '#431407'] as [string, string] : local.darkColors,
          source: isCafe ? null : (emoji ? null : source),
          emoji: isCafe ? '🍔' : emoji
        };
      });

      // Append local configs not in server list
      Object.keys(LOCAL_CONFIGS).forEach(slug => {
        if (!serverSlugs.has(slug)) {
          const local = LOCAL_CONFIGS[slug];
          list.push({
            name: local.name,
            slug: slug,
            colors: local.colors,
            darkColors: local.darkColors,
            source: local.image,
            emoji: null
          });
        }
      });

      return list;
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

  // Exclude cafe from scroll strip since it has the prominent cover banner below it
  const scrollCategories = useMemo(() => {
    // Keep Cafe/Food category as requested by the user, do not filter it out
    return displayCategories;
  }, [displayCategories]);

  // Show top 8 categories in a grid (2 rows x 4 columns)
  const gridCategories = useMemo(() => {
    return scrollCategories.slice(0, 8);
  }, [scrollCategories]);

  return (
    <View style={{ 
      flexDirection: 'row', 
      flexWrap: 'wrap', 
      justifyContent: 'space-between', 
      paddingHorizontal: THEME.SPACING.lg, 
      rowGap: 16, 
      marginBottom: THEME.SPACING.lg 
    }}>
      {gridCategories.map((category, index) => (
        <CategoryGridItem 
          key={category.slug}
          category={category}
          index={index}
          isDarkMode={isDarkMode}
          itemWidth="23%"
        />
      ))}
    </View>
  );
}

