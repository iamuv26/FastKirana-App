import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ShoppingBag, Clock, Mic, Sparkles, ChevronRight, ChevronDown, Sun, Moon } from 'lucide-react-native';
import { router } from 'expo-router';
import { useUIStore } from '../../stores/ui-store';
import Logo from '../../components/shared/Logo';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import ProductCard, { Product } from '../../components/product/ProductCard';
import ProductCardSkeleton from '../../components/product/ProductCardSkeleton';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import { formatPrice } from '../../lib/utils';
import { useCart } from '../../hooks/use-cart';
import { API_BASE_URL } from '../../lib/constants';
import { useTheme } from '../context/ThemeContext';
import { triggerHaptic } from '../../lib/haptic';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  cancelAnimation,
} from 'react-native-reanimated';

const TypedFlashList = FlashList as any;

const CATEGORY_IMAGES: Record<string, any> = {
  'fruits-vegetables': require('../../assets/fruits_vegetables_category.png'),
  'dairy-breakfast': require('../../assets/dairy_breakfast_category.png'),
  'snacks-munchies': require('../../assets/snacks_munchies_category.png'),
  'beverages': require('../../assets/beverages_category.png'),
  'personal-care': require('../../assets/personal_care_category.png'),
  'cafe': require('../../assets/cafe_category.png'),
};



interface CategoryItem {
  name: string;
  slug: string;
  emoji: string;
}

const GROCERY_CATEGORIES: CategoryItem[] = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', emoji: '🥬' },
  { name: 'Dairy & Breakfast', slug: 'dairy-breakfast', emoji: '🥛' },
  { name: 'Snacks & Munchies', slug: 'snacks-munchies', emoji: '🍿' },
  { name: 'Beverages', slug: 'beverages', emoji: '🥤' },
  { name: 'Ice Cream', slug: 'ice-cream', emoji: '🍦' },
  { name: 'Personal Care', slug: 'personal-care', emoji: '🧴' },
  { name: 'Household', slug: 'household', emoji: '🏠' },
  { name: 'Bakery & Biscuits', slug: 'bakery', emoji: '🍞' },
  { name: 'Atta, Rice & Dal', slug: 'atta-rice-dal', emoji: '🌾' },
];

let storage: any;
try {
  const { createMMKV } = require('react-native-mmkv');
  storage = createMMKV();
} catch (e) {
  console.warn('[Search] MMKV is not available in this environment. Falling back to in-memory storage.');
  const memoryMap = new Map<string, string>();
  storage = {
    getString: (key: string) => memoryMap.get(key) || undefined,
    set: (key: string, value: string) => { memoryMap.set(key, value); },
    remove: (key: string) => { memoryMap.delete(key); return true; },
  };
}
const HISTORY_KEY = 'search_history';

function VoicePulse() {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.6, { duration: 1200 }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1200 }),
      -1,
      false
    );
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View 
      style={[
        {
          position: 'absolute',
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: 'rgba(226,10,34,0.4)',
        },
        animatedStyle
      ]} 
    />
  );
}

export default function SearchScreen() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const selectedLocation = useUIStore((s) => s.selectedLocation);
  const assignedStoreId = useUIStore((s) => s.assignedStoreId);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const { getTotalItems, getSubtotal } = useCart();

  // Voice Search States
  const [isListening, setIsListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Listening...');

  useEffect(() => {
    try {
      const raw = storage.getString(HISTORY_KEY);
      if (raw) {
        setRecentSearches(JSON.parse(raw));
      }
    } catch (e) {
      console.warn('Failed to load search history:', e);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Fetch all products from API for matching
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['all-search-products-list-tab', assignedStoreId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?limit=500${assignedStoreId ? `&storeId=${assignedStoreId}` : ''}`);
      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
  });

  // Query search endpoint with 5s Live Stock Poll Interval
  const { data: serverResults = [], isLoading } = useQuery<Product[]>({
    queryKey: ['search-products-tab', debouncedQuery, assignedStoreId],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const response = await fetch(`${API_BASE_URL}/products?search=${debouncedQuery}${assignedStoreId ? `&storeId=${assignedStoreId}` : ''}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    enabled: debouncedQuery.trim().length > 0,
    refetchInterval: 5000, // Real-time stock counts polling
  });

  const saveToHistory = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    try {
      const raw = storage.getString(HISTORY_KEY);
      let history: string[] = raw ? JSON.parse(raw) : [];
      history = history.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      history.unshift(trimmed);
      history = history.slice(0, 5);
      storage.set(HISTORY_KEY, JSON.stringify(history));
      setRecentSearches(history);
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  };

  const clearHistory = () => {
    try {
      storage.remove(HISTORY_KEY);
      setRecentSearches([]);
    } catch (error) {
      console.error('Failed to clear search history:', error);
    }
  };

  const handleStartVoiceSearch = () => {
    setIsListening(true);
    setVoiceStatus('Listening...');
    triggerHaptic('light');

    // Speech translation simulation
    setTimeout(() => {
      setVoiceStatus('Processing speech...');
      triggerHaptic('medium');
    }, 1500);

    setTimeout(() => {
      const sampleSearches = ['milk', 'fresh paneer', 'crispy momos', 'lays', 'coca-cola', 'alphonso mangoes'];
      const matchedText = sampleSearches[Math.floor(Math.random() * sampleSearches.length)];
      setVoiceStatus(`Recognized: "${matchedText}"`);
      triggerHaptic('success');
      
      setTimeout(() => {
        setSearchQuery(matchedText);
        saveToHistory(matchedText);
        setIsListening(false);
      }, 800);
    }, 2600);
  };

  // Only query results from server database
  const getSearchResults = () => {
    if (!searchQuery.trim()) return [];
    
    const lowerQuery = searchQuery.toLowerCase();
    // Try local matching first so we get instant results
    const localMatched = allProducts.filter((p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.slug.toLowerCase().includes(lowerQuery) ||
      (p.category?.name && p.category.name.toLowerCase().includes(lowerQuery)) ||
      (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(lowerQuery)))
    );

    // Combine local results and server results, keeping unique IDs
    const combined = [...localMatched];
    serverResults.forEach((serverProd) => {
      if (!combined.some((p) => p.id === serverProd.id)) {
        combined.push(serverProd);
      }
    });

    return combined;
  };

  const resultsList = getSearchResults();
  const cartItemCount = getTotalItems();
  const cartSubtotal = getSubtotal();

  const matchingCategories = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    
    const allCats = [
      ...GROCERY_CATEGORIES.map((c: CategoryItem) => ({ name: c.name, slug: c.slug, emoji: c.emoji, isCafe: false })),
      { name: 'Cafe Brews', slug: 'hot-beverage', emoji: '☕', isCafe: true },
      { name: 'Cafe Snacks', slug: 'hot-bite', emoji: '🥟', isCafe: true },
      { name: 'Cafe Sandwiches', slug: 'sandwiches', emoji: '🥪', isCafe: true },
      { name: 'Cafe Rolls', slug: 'frankie-rolls', emoji: '🌯', isCafe: true },
      { name: 'Cafe Chinese', slug: 'chinese', emoji: '🥡', isCafe: true },
      { name: 'Cafe Pasta', slug: 'italian-pasta', emoji: '🍝', isCafe: true },
    ];
    
    return allCats.filter((c: any) => 
      c.name.toLowerCase().includes(query) || 
      c.slug.toLowerCase().includes(query)
    ).slice(0, 3);
  }, [searchQuery]);

  const trendingTags = ['Mangoes', 'Amul', 'Chai', 'Milk', 'Maggi', 'Chocolate'];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      {/* Premium Header */}
      <View 
        style={{
          width: '100%',
          backgroundColor: isDark ? '#09090b' : '#ffffff',
          zIndex: 50,
          borderBottomWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
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
                    <ChevronDown size={12} color={isDark ? '#e4e4e7' : '#1e293b'} style={{ marginLeft: 2 }} />
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
                backgroundColor: isDark ? '#27272a' : '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: isDark ? '#3f3f46' : '#e2e8f0',
              }]}
            >
              {isDark ? (
                <Sun size={16} color="#fbbf24" />
              ) : (
                <Moon size={16} color="#3b82f6" />
              )}
            </Pressable>
          </View>

          {/* Bottom Row: Search Box Input */}
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
              placeholder="Search for vegetables, dairy, snacks..."
              placeholderTextColor={isDark ? '#52525b' : '#94a3b8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => saveToHistory(searchQuery)}
              returnKeyType="search"
              style={{
                flex: 1,
                color: isDark ? '#ffffff' : '#0f172a',
                fontSize: 13,
                fontWeight: '600',
                padding: 0
              }}
            />
            {searchQuery.length > 0 ? (
              <Pressable onPress={() => setSearchQuery('')} className="p-1">
                <X size={16} color={isDark ? '#a1a1aa' : '#64748b'} />
              </Pressable>
            ) : (
              <Pressable onPress={handleStartVoiceSearch} className="p-1 active:scale-90">
                <Mic size={16} color="#94a3b8" />
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Content Area */}
      <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
        {/* Predictive Category Shortcuts Overlay */}
        {searchQuery.length > 0 && matchingCategories.length > 0 && (
          <View className="bg-rose-50/50 dark:bg-rose-950/5 border-b border-rose-100/40 dark:border-rose-900/20 px-4 py-2.5 flex-row items-center gap-2 flex-wrap">
            <Sparkles size={11} color="#e20a22" />
            <Text className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider mr-1">Categories:</Text>
            {matchingCategories.map(cat => (
              <Pressable
                key={cat.slug}
                onPress={() => {
                  triggerHaptic('light');
                  if (cat.isCafe) {
                    router.push(`/cafe?section=${cat.slug}`);
                  } else {
                    router.push(`/category/${cat.slug}`);
                  }
                }}
                style={({ pressed }) => [{
                  transform: [{ scale: pressed ? 0.95 : 1 }],
                  backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                }]}
                className="px-2.5 py-1 rounded-full border border-slate-200 dark:border-zinc-700 flex-row items-center gap-1 shadow-2xs"
              >
                <Text style={{ fontSize: 11 }}>{cat.emoji}</Text>
                <Text className="text-slate-700 dark:text-zinc-300 text-[10px] font-black">{cat.name}</Text>
                <ChevronRight size={9} color={isDark ? '#a1a1aa' : '#64748b'} />
              </Pressable>
            ))}
          </View>
        )}
        {isLoading ? (
          <ScrollView contentContainerStyle={{ padding: 8 }}>
            <View className="flex-row flex-wrap justify-between">
              {[1, 2, 3, 4].map((i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </View>
          </ScrollView>
        ) : searchQuery.length === 0 ? (
          // Suggestions screen
          <View className="p-4 bg-white dark:bg-zinc-900 flex-1">
            {recentSearches.length > 0 && (
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-slate-700 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider">Recent Searches</Text>
                  <Pressable onPress={clearHistory}>
                    <Text className="text-rose-600 dark:text-rose-400 font-bold text-xs">Clear All</Text>
                  </Pressable>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {recentSearches.map((tag) => (
                    <Pressable
                      key={tag}
                      onPress={() => {
                        setSearchQuery(tag);
                        saveToHistory(tag);
                      }}
                      className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3.5 py-2 rounded-xl flex-row items-center gap-1 active:bg-rose-50 dark:active:bg-rose-950/20"
                    >
                      <Clock size={12} color={isDark ? '#a1a1aa' : '#64748b'} />
                      <Text className="text-slate-600 dark:text-zinc-300 text-xs font-bold">{tag}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <Text className="text-slate-700 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider mb-3">🔥 Trending Now</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {trendingTags.map((tag, idx) => (
                <Pressable
                  key={tag}
                  onPress={() => {
                    setSearchQuery(tag);
                    saveToHistory(tag);
                    triggerHaptic('light');
                  }}
                  style={({ pressed }) => [{
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    opacity: pressed ? 0.85 : 1,
                    overflow: 'hidden',
                    borderRadius: 16,
                  }]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 8,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: isDark ? '#27272a' : '#f1f5f9',
                      backgroundColor: isDark ? '#1c1c1e' : '#f8fafc',
                      borderRadius: 16,
                    }}
                  >
                    <View style={{ 
                      width: 18, height: 18, borderRadius: 9, 
                      backgroundColor: idx < 3 ? '#e20a22' : (isDark ? '#27272a' : '#e2e8f0'), 
                      alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <Text style={{ 
                        color: idx < 3 ? '#fff' : (isDark ? '#a1a1aa' : '#64748b'), 
                        fontSize: 9, fontWeight: '900' 
                      }}>{idx + 1}</Text>
                    </View>
                    <Text className="text-slate-850 dark:text-zinc-200 text-xs font-bold">{tag}</Text>
                    {idx < 2 && <Text style={{ fontSize: 10 }}>🔥</Text>}
                  </View>
                </Pressable>
              ))}
            </View>

            {/* Quick Category Access */}
            <Text className="text-slate-700 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider mb-3">Browse Categories</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {[
                { label: 'Fruits & Veggies', slug: 'fruits-vegetables' },
                { label: 'Dairy', slug: 'dairy-breakfast' },
                { label: 'Snacks', slug: 'snacks-munchies' },
                { label: 'Beverages', slug: 'beverages' },
                { label: 'Cafe', slug: 'cafe', isCafe: true },
                { label: 'Personal Care', slug: 'personal-care' },
              ].map((cat) => {
                const img = CATEGORY_IMAGES[cat.slug];
                return (
                  <Pressable
                    key={cat.label}
                    onPress={() => {
                      triggerHaptic('light');
                      if (cat.isCafe) {
                        router.push('/cafe');
                      } else {
                        router.push(`/category/${cat.slug}`);
                      }
                    }}
                    style={({ pressed }) => [
                      { transform: [{ scale: pressed ? 0.93 : 1 }] },
                      { width: '31%' }
                    ]}
                    className="bg-white dark:bg-zinc-800/80 border border-slate-100 dark:border-zinc-700 px-3.5 py-3 rounded-2xl items-center gap-1.5"
                  >
                    {img ? (
                      <ExpoImage
                        source={img}
                        style={{ width: 44, height: 44 }}
                        contentFit="contain"
                      />
                    ) : (
                      <Text style={{ fontSize: 22 }}>📦</Text>
                    )}
                    <Text className="text-slate-600 dark:text-zinc-300 text-[10px] font-extrabold text-center" numberOfLines={1}>{cat.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : (
          // Search Results Grid
          <TypedFlashList
            data={resultsList}
            keyExtractor={(item: Product) => item.id}
            numColumns={2}
            estimatedItemSize={210}
            contentContainerStyle={{ padding: 8, paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }: { item: Product; index: number }) => (
              <View style={{ flex: 1, paddingHorizontal: 6 }}>
                <ProductCard product={item} className="w-full" index={index} />
              </View>
            )}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-20 px-8">
                {/* Decorative background ring */}
                <View style={{ 
                  width: 100, height: 100, borderRadius: 50, 
                  backgroundColor: isDark ? 'rgba(63,63,70,0.3)' : '#f8fafc',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: isDark ? 'rgba(63,63,70,0.5)' : '#e2e8f0',
                }}>
                  <Text style={{ fontSize: 40 }}>🔍</Text>
                </View>
                <Text className="text-slate-800 dark:text-zinc-200 font-black text-base mt-5">No results for "{searchQuery}"</Text>
                <Text className="text-slate-400 dark:text-zinc-500 text-xs mt-1.5 text-center leading-5 max-w-[260px]">
                  We couldn't find what you're looking for. Try a different search or browse our categories.
                </Text>
                <Pressable 
                  onPress={() => {
                    setSearchQuery('');
                    triggerHaptic('light');
                  }}
                  style={({ pressed }) => [{
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                    marginTop: 16,
                    backgroundColor: '#e20a22',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 12,
                  }]}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Browse Categories</Text>
                </Pressable>
              </View>
            }
          />
        )}
      </View>

      {/* Voice Search Pulse overlay modal */}
      {isListening && (
        <View className="absolute inset-0 bg-zinc-950/90 z-50 items-center justify-center px-6">
          <View className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl items-center w-80 shadow-2xl">
            <View className="w-20 h-20 rounded-full bg-rose-600/10 border-2 border-rose-500 items-center justify-center mb-6 relative">
              <VoicePulse />
              <Mic size={32} color="#f43f5e" />
            </View>
            
            <Text className="text-white font-black text-lg text-center mb-1">
              Voice Search
            </Text>
            <Text className="text-zinc-400 text-xs font-bold text-center mb-6">
              {voiceStatus}
            </Text>

            <Pressable
              onPress={() => setIsListening(false)}
              className="bg-zinc-800 border border-zinc-700 px-6 py-2.5 rounded-xl active:bg-zinc-700"
            >
              <Text className="text-zinc-300 font-black text-xs uppercase">Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={88} />
    </SafeAreaView>
  );
}
