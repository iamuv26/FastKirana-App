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

interface LocalConfig {
  name: string;
  image: any;
  colors: [string, string];
  darkColors: [string, string];
}

const LOCAL_CONFIGS: Record<string, LocalConfig> = {
  'fruits-vegetables': { name: 'Fruits & Veg', image: require('../../assets/fruits_vegetables_category.png'), colors: ['#f0fdf4', '#dcfce7'], darkColors: ['#064e3b', '#022c22'] },
  'dairy-breakfast': { name: 'Milk & Dairy', image: require('../../assets/dairy_breakfast_category.png'), colors: ['#eff6ff', '#dbeafe'], darkColors: ['#1e3a8a', '#172554'] },
  'grocery-essential': { name: 'Staples', image: require('../../assets/atta_rice_dal_category.png'), colors: ['#fefce8', '#fef9c3'], darkColors: ['#713f12', '#451a03'] },
  'snacks-biscuits': { name: 'Snacks', image: require('../../assets/snacks_munchies_category.png'), colors: ['#fff7ed', '#ffedd5'], darkColors: ['#7c2d12', '#431407'] },
  'beverages': { name: 'Beverages', image: require('../../assets/beverages_category.png'), colors: ['#f0f9ff', '#e0f2fe'], darkColors: ['#0c4a6e', '#082f49'] },
  'bakery': { name: 'Bakery', image: require('../../assets/bakery_biscuits_category.png'), colors: ['#fafaf9', '#f5f5f4'], darkColors: ['#44403c', '#292524'] },
  'ice-cream': { name: 'Ice Cream', image: require('../../assets/ice_cream_category.png'), colors: ['#f0fdfa', '#ccfbf1'], darkColors: ['#115e59', '#134e4a'] },
  'personal-care': { name: 'Personal Care', image: require('../../assets/personal_care_category.png'), colors: ['#fdf2f8', '#fce7f3'], darkColors: ['#831843', '#500724'] },
  'household': { name: 'Home Care', image: require('../../assets/household_category.png'), colors: ['#ecfeff', '#cffafe'], darkColors: ['#164e63', '#083344'] },
};

function CategoryGridItem({ category, index, isDarkMode }: { category: any; index: number; isDarkMode: boolean }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View
      entering={FadeInDown.duration(250).delay(index * 20)}
      style={{ width: 72, alignItems: 'center' }}
    >
      <Animated.View style={[{ width: '100%', alignItems: 'center' }, animatedStyle]}>
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            router.push(`/category/${category.slug}`);
          }}
          onPressIn={() => {
            scale.value = withSpring(0.93, { damping: 12, stiffness: 180 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 12, stiffness: 180 });
          }}
          className="items-center w-full"
        >
          {/* Squircle Capsule Container */}
          <View 
            style={{
              width: 62,
              height: 62,
              borderRadius: 31,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
              alignItems: 'center',
              justifyContent: 'center',
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 1,
                },
                web: {
                  // @ts-ignore
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.01)',
                }
              })
            }}
          >
            {/* Visual Gradient Background */}
            <LinearGradient
              colors={isDarkMode ? category.darkColors : category.colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />

            <ExpoImage 
              source={category.source}
              contentFit="cover"
              style={{ width: '100%', height: '100%' }}
              transition={200}
              cachePolicy="memory-disk"
              placeholder={isDarkMode ? "rgba(39,39,42,0.4)" : "rgba(241,245,249,0.6)"}
            />
          </View>
          
          {/* Label */}
          <Text 
            numberOfLines={1} 
            className="text-zinc-800 dark:text-zinc-200 text-[10px] font-black text-center mt-2.5 tracking-tight leading-3 w-full"
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
    // Map local configurations and merge server properties if found to ensure they never disappear
    return Object.keys(LOCAL_CONFIGS).map(slug => {
      const local = LOCAL_CONFIGS[slug];
      const serverCat = serverCategories.find(c => c.slug === slug);
      
      const source = (serverCat && serverCat.imageUrl) 
        ? getAppImageSource(serverCat.imageUrl) 
        : local.image;

      return {
        name: local.name,
        slug: slug,
        colors: local.colors,
        darkColors: local.darkColors,
        source: source
      };
    });
  }, [serverCategories]);

  // Exclude cafe from scroll strip since it has the prominent cover banner below it
  const scrollCategories = useMemo(() => {
    return displayCategories.filter(c => c.slug !== 'cafe');
  }, [displayCategories]);

  return (
    <View className="mb-6">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 16, gap: 14, paddingBottom: 4 }}
        decelerationRate="fast"
      >
        {scrollCategories.map((category, index) => (
          <CategoryGridItem 
            key={category.slug}
            category={category}
            index={index}
            isDarkMode={isDarkMode}
          />
        ))}
      </ScrollView>
    </View>
  );
}

