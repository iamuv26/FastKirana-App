import { View, Text, Pressable, ScrollView, Platform, Image as RNImage } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { triggerHaptic } from '../../lib/haptic';

const CAFE_CATEGORIES = [
  {
    name: 'All Menu',
    tag: '',
    source: { uri: 'https://www.fastkirana.in/cafe_category.png' },
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

function CafeCategoryItem({ category, onPress }: { category: typeof CAFE_CATEGORIES[0]; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="w-[70px] items-center active:scale-95 transition-transform"
    >
      {/* Circular Image Container */}
      <View className="w-[66px] h-[66px] rounded-full overflow-hidden border border-slate-100/50 dark:border-zinc-800 shadow-sm flex items-center justify-center relative bg-white dark:bg-zinc-900">
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
        className="text-zinc-700 dark:text-zinc-300 text-[10px] font-black text-center mt-2 tracking-tight leading-tight w-full"
      >
        {category.name}
      </Text>
    </Pressable>
  );
}

export default function CafeCategoriesStrip() {
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
    <View className="mb-6">
      {/* Title Header */}
      <View className="px-4 flex-row justify-between items-center mb-3">
        <Text className="text-zinc-800 dark:text-zinc-100 font-black text-xs tracking-wider uppercase">Cafe Categories</Text>
        <Pressable 
          onPress={() => handlePress('')}
          className="flex-row items-center active:opacity-70"
        >
          <Text className="text-rose-600 dark:text-rose-400 font-bold text-xs">See Menu</Text>
          <ChevronRight size={14} color="#e11d48" />
        </Pressable>
      </View>

      {/* Horizontal Category Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 14 }}
        decelerationRate="fast"
      >
        {CAFE_CATEGORIES.map((category) => (
          <CafeCategoryItem 
            key={category.name}
            category={category}
            onPress={() => handlePress(category.tag)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
