import { View, Text, ScrollView, Pressable, TextInput, Image, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import { triggerHaptic } from '../../lib/haptic';
import { ArrowLeft, ChevronRight, ChevronDown, MapPin, Search, ShoppingBag, Moon, Sun, X } from 'lucide-react-native';
import { useUIStore } from '../../stores/ui-store';
import Logo from '../../components/shared/Logo';
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../lib/constants';

// Local assets mapping for styling and fallback
const LOCAL_CATEGORY_CONFIGS: Record<string, { name: string; image: any; description: string; color: string }> = {
  'fruits-vegetables': {
    name: 'Fruits & Vegetables',
    image: require('../../assets/fruits_vegetables_category.png'),
    description: '100% Farm-Fresh Organic',
    color: '#059669' // emerald-600
  },
  'dairy-breakfast': {
    name: 'Dairy & Breakfast',
    image: require('../../assets/dairy_breakfast_category.png'),
    description: 'Milk, Butter, Bread & Eggs',
    color: '#1d4ed8' // blue-700
  },
  'snacks-munchies': {
    name: 'Snacks & Munchies',
    image: require('../../assets/snacks_munchies_category.png'),
    description: 'Chips, Cookies & Popcorn',
    color: '#d97706' // amber-600
  },
  'beverages': {
    name: 'Beverages',
    image: require('../../assets/beverages_category.png'),
    description: 'Soft Drinks & Coolers',
    color: '#7c3aed' // violet-600
  },
  'ice-cream': {
    name: 'Ice Cream',
    image: require('../../assets/ice_cream_category.png'),
    description: 'Frozen Desserts & Tubs',
    color: '#0ea5e9' // sky-600
  },
  'cafe': {
    name: 'FastKirana Cafe',
    image: require('../../assets/cafe_category.png'),
    description: 'Hot Pizza, Rolls & Coffee',
    color: '#e20a22' // primary brand red
  },
  'personal-care': {
    name: 'Personal Care',
    image: require('../../assets/personal_care_category.png'),
    description: 'Soaps, Shampoos & Hygiene',
    color: '#db2777' // pink-600
  },
  'household': {
    name: 'Household',
    image: require('../../assets/household_category.png'),
    description: 'Detergents, Cleaners & Tools',
    color: '#4b5563' // grey-600
  },
  'bakery': {
    name: 'Bakery & Biscuits',
    image: require('../../assets/bakery_biscuits_category.png'),
    description: 'Fresh Bread, Buns & Cookies',
    color: '#c2410c' // orange-700
  },
  'atta-rice-dal': {
    name: 'Atta, Rice & Dal',
    image: require('../../assets/atta_rice_dal_category.png'),
    description: 'Grains, Flours & Lentils',
    color: '#854d0e' // yellow-800
  }
};

function CategoryCard({ category, isDarkMode, marginRight }: { category: any; isDarkMode: boolean; marginRight: any }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 180 }) }],
  }));

  // Create a light tinted color background using the category color
  const bubbleBg = category.color 
    ? (isDarkMode ? `${category.color}25` : `${category.color}08`) 
    : (isDarkMode ? '#27272a' : '#f1f5f9');
  
  const borderColor = category.color
    ? (isDarkMode ? `${category.color}40` : `${category.color}20`)
    : (isDarkMode ? '#3f3f46' : '#e2e8f0');

  return (
    <Animated.View style={[{ width: '31%', marginBottom: 18, marginRight: marginRight, alignItems: 'center' }, animatedStyle]}>
      <Pressable
        onPress={() => {
          triggerHaptic('light');
          if (category.slug === 'cafe') {
            router.push('/cafe');
          } else {
            router.push(`/category/${category.slug}`);
          }
        }}
        onPressIn={() => { scale.value = 0.94; }}
        onPressOut={() => { scale.value = 1.0; }}
        style={{
          alignItems: 'center',
          width: '100%',
        }}
      >
        {/* Circular Bubble Container */}
        <View 
          style={{
            width: 70,
            height: 70,
            borderRadius: 35,
            backgroundColor: bubbleBg,
            borderWidth: 1.5,
            borderColor: borderColor,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            shadowColor: category.color || '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDarkMode ? 0.15 : 0.04,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Image 
            source={category.serverImage ? { uri: category.serverImage } : category.image}
            style={{
              width: '75%',
              height: '75%',
              resizeMode: 'contain',
            }}
          />
        </View>

        {/* Text Details */}
        <View style={{ marginTop: 8, alignItems: 'center', width: '100%', paddingHorizontal: 2 }}>
          <Text 
            numberOfLines={2}
            style={{ 
              color: isDarkMode ? '#f4f4f5' : '#1e293b', 
              fontSize: 10.5, 
              fontWeight: '900',
              textAlign: 'center',
              lineHeight: 12,
              letterSpacing: -0.2
            }}
          >
            {category.name}
          </Text>
          <Text 
            numberOfLines={1}
            style={{ 
              color: isDarkMode ? '#71717a' : '#64748b', 
              fontSize: 8.5, 
              fontWeight: '800', 
              marginTop: 2,
              textAlign: 'center'
            }}
          >
            {category.itemCount} Items
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function CategoriesScreen() {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const selectedLocation = useUIStore((s) => s.selectedLocation);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch live categories from database
  const { data: serverCategories = [], isLoading } = useQuery<any[]>({
    queryKey: ['categories-list-all'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error('API failed');
      return res.json();
    },
    initialData: [],
  });

  // Fetch cafe products to get counts dynamically
  const { data: cafeProductsData } = useQuery<any>({
    queryKey: ['cafe-total-count-all'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?category=cafe&limit=1`);
      if (!response.ok) return { pagination: { total: 80 } };
      return response.json();
    }
  });
  const cafeCount = cafeProductsData?.pagination?.total ?? 80;

  // Build the list of display categories based on what exists on the server (just like the web app)
  const displayCategories = useMemo(() => {
    const list = serverCategories.map(cat => {
      const local = LOCAL_CATEGORY_CONFIGS[cat.slug] || {
        name: cat.name,
        image: null,
        description: 'Explore products',
        color: '#64748b'
      };
      
      // Use local high-quality images where possible, fallback to custom server images if set as remote URL
      const serverImage = cat.imageUrl && cat.imageUrl.startsWith('http') ? cat.imageUrl : null;

      return {
        name: local.name || cat.name,
        slug: cat.slug,
        image: local.image,
        serverImage: serverImage,
        itemCount: cat._count?.products ?? 0,
        description: local.description,
        color: local.color
      };
    });

    // Add FastKirana Cafe to the categories directory
    const cafeLocal = LOCAL_CATEGORY_CONFIGS['cafe'];
    const cafeItem = {
      name: cafeLocal.name,
      slug: 'cafe',
      image: cafeLocal.image,
      serverImage: null,
      itemCount: cafeCount,
      description: cafeLocal.description,
      color: cafeLocal.color
    };

    if (serverCategories.length > 0) {
      // Insert Cafe at index 4 (or near other main categories)
      const insertIdx = Math.min(4, list.length);
      list.splice(insertIdx, 0, cafeItem);
      return list;
    }

    // Fallback list of categories (for offline/loading state)
    const fallback = Object.keys(LOCAL_CATEGORY_CONFIGS).map(slug => {
      const local = LOCAL_CATEGORY_CONFIGS[slug];
      return {
        name: local.name,
        slug,
        image: local.image,
        serverImage: null,
        itemCount: slug === 'cafe' ? cafeCount : (slug === 'fruits-vegetables' ? 32 : 20),
        description: local.description,
        color: local.color
      };
    });
    return fallback;
  }, [serverCategories, cafeCount]);

  const filteredCategories = displayCategories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#09090b' : '#f8fafc' }}>
      {/* Premium Header */}
      <View 
        style={{
          width: '100%',
          backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
          zIndex: 50,
          borderBottomWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
          {/* Top Row: Location & Theme */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Pressable 
              onPress={() => {
                triggerHaptic('light');
                router.push('/location-picker');
              }}
              style={({ pressed }) => [{
                flex: 1,
                marginRight: 16,
                opacity: pressed ? 0.85 : 1,
              }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View className="bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-xl border border-slate-200/50 dark:border-zinc-800/50 shadow-xs">
                  <Logo size={24} />
                </View>
                
                <View style={{ flex: 1, justifyContent: 'center', marginLeft: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View className="bg-rose-600 dark:bg-rose-700 rounded-md px-1.5 py-0.5" style={{ alignSelf: 'center' }}>
                      <Text className="text-white text-[8px] font-black tracking-widest uppercase">INSTANT</Text>
                    </View>
                    <Text className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider" style={{ marginLeft: 6 }}>
                      Delivery to
                    </Text>
                  </View>
                  
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Text 
                      className="text-slate-800 dark:text-zinc-100 text-sm font-black tracking-tight"
                      numberOfLines={1}
                      style={{ maxWidth: '85%' }}
                    >
                      {selectedLocation && selectedLocation.startsWith('Lat:') ? 'Swaroop Nagar, Kanpur' : (selectedLocation || 'Select Location')}
                    </Text>
                    <ChevronDown size={12} color={isDarkMode ? '#e4e4e7' : '#1e293b'} style={{ marginLeft: 2 }} />
                  </View>
                </View>
              </View>
            </Pressable>

            {/* Right: Theme Toggle */}
            <Pressable 
              onPress={() => {
                toggleTheme();
                triggerHaptic('light');
              }}
              style={({ pressed }) => [{
                transform: [{ scale: pressed ? 0.92 : 1 }],
                width: 38,
                height: 38,
                borderRadius: 19,
                backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
              }]}
            >
              {isDarkMode ? (
                <Sun size={16} color="#fbbf24" />
              ) : (
                <Moon size={16} color="#3b82f6" />
              )}
            </Pressable>
          </View>

          {/* Bottom Row: Search Box */}
          <View 
            className="flex-row items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-full px-4 h-11 w-full"
            style={Platform.OS === 'ios' ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 4,
            } : Platform.OS === 'android' ? {
              elevation: 1,
            } : undefined}
          >
            <Search size={16} color="#e20a22" style={{ marginRight: 10 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search categories..."
              placeholderTextColor="#94a3b8"
              style={{
                flex: 1,
                color: isDarkMode ? '#ffffff' : '#0f172a',
                fontSize: 13,
                fontWeight: '600',
                padding: 0
              }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} className="p-1">
                <X size={14} color="#94a3b8" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >

        {/* Categories Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start', paddingHorizontal: 16 }}>
          {filteredCategories.map((category, index) => {
            const isThirdColumn = (index + 1) % 3 === 0;
            return (
              <CategoryCard 
                key={category.slug} 
                category={category} 
                isDarkMode={isDarkMode} 
                marginRight={isThirdColumn ? 0 : '3.5%'} 
              />
            );
          })}
          {filteredCategories.length === 0 && (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40, width: '100%' }}>
              <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '600' }}>
                No categories found matching "{searchQuery}"
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={88} />
    </SafeAreaView>
  );
}
