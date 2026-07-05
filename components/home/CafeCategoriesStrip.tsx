import { View, Text, Pressable, ScrollView, Platform, Image as RNImage } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { triggerHaptic } from '../../lib/haptic';
import { useState } from 'react';

const LOCAL_CAFE_FALLBACK = require('../../assets/cafe_category.png');

const CAFE_CATEGORIES = [
  {
    name: 'All Menu',
    tag: '',
    image: 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781204854/ovdfhpqpk9ln4x1upkvb.png', // Margherita Pizza
    emoji: '🍕',
    color: 'bg-rose-50/70 dark:bg-rose-950/20'
  },
  {
    name: 'Snacks',
    tag: 'hot-bite',
    image: 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781008426/qqndbejndns9kr7sl9nk.png', // Spring Roll
    emoji: '🍟',
    color: 'bg-amber-50/70 dark:bg-amber-950/20'
  },
  {
    name: 'Chinese',
    tag: 'chinese',
    image: 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781009115/hkhgalsbhqp0pqzsgft0.png', // Veg Fried Momos
    emoji: '🥟',
    color: 'bg-red-50/70 dark:bg-red-950/20'
  },
  {
    name: 'Rolls',
    tag: 'frankie-rolls',
    image: 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781033205/zpu9843cf5ehawocadv7.png', // Veg Frankie Roll
    emoji: '🌯',
    color: 'bg-orange-50/70 dark:bg-orange-950/20'
  },
  {
    name: 'Sandwiches',
    tag: 'sandwiches',
    image: 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781232401/xlimxbbx1blqidujuel9.png', // Veg Sandwich
    emoji: '🥪',
    color: 'bg-yellow-50/70 dark:bg-yellow-950/20'
  },
  {
    name: 'Pasta',
    tag: 'italian-pasta',
    image: 'https://res.cloudinary.com/dvcsjvpbg/image/upload/v1781121488/t9qmcgycpxtmgjtvx316.png', // Red Sauce Pasta
    emoji: '🍝',
    color: 'bg-emerald-50/70 dark:bg-emerald-950/20'
  }
];

function CafeCategoryItem({ category, onPress }: { category: typeof CAFE_CATEGORIES[0]; onPress: () => void }) {
  const [imageError, setImageError] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      className="w-[70px] items-center active:scale-95 transition-transform"
    >
      {/* Circular Image Container */}
      <View className={`w-[66px] h-[66px] rounded-full overflow-hidden ${category.color} border border-slate-100/50 dark:border-zinc-800 shadow-sm flex items-center justify-center relative p-1`}>
        {imageError ? (
          Platform.OS === 'web' ? (
            <RNImage 
              source={LOCAL_CAFE_FALLBACK}
              resizeMode="contain"
              style={{ width: '100%', height: '100%' }}
            />
          ) : (
            <ExpoImage 
              source={LOCAL_CAFE_FALLBACK}
              contentFit="contain"
              className="w-full h-full"
            />
          )
        ) : Platform.OS === 'web' ? (
          <RNImage 
            source={{ uri: category.image }}
            resizeMode="contain"
            style={{ width: '100%', height: '100%' }}
            onError={() => setImageError(true)}
          />
        ) : (
          <ExpoImage 
            source={{ uri: category.image }}
            contentFit="contain"
            className="w-full h-full"
            transition={200}
            onError={() => setImageError(true)}
          />
        )}
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
