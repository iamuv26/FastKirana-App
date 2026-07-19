import { View, Text, Pressable, ScrollView, Platform, Image as RNImage } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { triggerHaptic } from '../../lib/haptic';
import { THEME } from '../../lib/theme';
import { useTheme } from '../../app/context/ThemeContext';


const CAFE_CATEGORIES = [
  {
    name: 'All Menu',
    tag: '',
    source: { uri: 'https://www.fastkirana.in/cafe_category.webp' },
  },
  {
    name: 'Snacks',
    tag: 'hot-bite',
    source: { uri: 'https://www.fastkirana.in/cafe_snacks_category.png' },
  },
  {
    name: 'Chinese',
    tag: 'chinese',
    source: { uri: 'https://www.fastkirana.in/cafe_chinese_category.png' },
  },
  {
    name: 'South Indian',
    tag: 'south-indian',
    source: { uri: 'https://www.fastkirana.in/cafe_south_indian_category.png' },
  },
  {
    name: 'Rolls',
    tag: 'frankie-rolls',
    source: { uri: 'https://www.fastkirana.in/cafe_rolls_category.png' },
  },
  {
    name: 'Sandwiches',
    tag: 'sandwiches',
    source: { uri: 'https://www.fastkirana.in/cafe_sandwiches_category.png' },
  },
  {
    name: 'Pasta',
    tag: 'italian-pasta',
    source: { uri: 'https://www.fastkirana.in/cafe_pasta_category.png' },
  }
];

function CafeCategoryItem({ category, onPress, isDarkMode }: { category: typeof CAFE_CATEGORIES[0]; onPress: () => void; isDarkMode: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ width: 78, alignItems: 'center' }}
      className="active:scale-95 transition-transform"
    >
      {/* Circular Image Container */}
      <View 
        style={{
          width: 68,
          height: 68,
          borderRadius: 34,
          overflow: 'hidden',
          borderColor: isDarkMode ? THEME.COLORS.dark.borderLight : 'rgba(0,0,0,0.05)',
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isDarkMode ? THEME.COLORS.dark.surface : '#ffffff',
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDarkMode ? 0.2 : 0.04,
              shadowRadius: 4,
            },
            android: {
              elevation: 1,
            }
          })
        }}
      >
        <ExpoImage 
          source={category.source}
          contentFit="cover"
          style={{ width: '100%', height: '100%' }}
          transition={200}
        />
      </View>
      
      {/* Label */}
      <Text 
        numberOfLines={1} 
        style={{
          color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary,
          fontSize: 11,
          fontWeight: '600',
          marginTop: 8,
          letterSpacing: -0.2,
          lineHeight: 14,
          textAlign: 'center',
          width: '100%',
        }}
      >
        {category.name}
      </Text>
    </Pressable>
  );
}

export default function CafeCategoriesStrip() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  return <CafeCategoriesStripContent isDarkMode={isDarkMode} />;
}

function CafeCategoriesStripContent({ isDarkMode }: { isDarkMode: boolean }) {
  const handlePress = (tag: string) => {
    triggerHaptic('light');
    if (tag) {
      router.push({
        pathname: '/cafe',
        params: { category: tag }
      });
    } else {
      router.push('/cafe');
    }
  };

  return (
    <View style={{ marginBottom: THEME.SPACING.lg }}>
      {/* Title Header */}
      <View style={{ paddingHorizontal: THEME.SPACING.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }} className="tracking-tight">Food Categories</Text>
        <Pressable 
          onPress={() => handlePress('')}
          className="flex-row items-center active:opacity-70"
        >
          <Text style={{ color: THEME.COLORS.brand.primary, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '700' }}>See Menu</Text>
          <ChevronRight size={13} color={THEME.COLORS.brand.primary} />
        </Pressable>
      </View>

      {/* Horizontal Category Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: THEME.SPACING.lg, gap: THEME.SPACING.md }}
        decelerationRate="fast"
      >
        {CAFE_CATEGORIES.map((category) => (
          <CafeCategoryItem 
            key={category.name}
            category={category}
            onPress={() => handlePress(category.tag)}
            isDarkMode={isDarkMode}
          />
        ))}
      </ScrollView>
    </View>
  );
}
