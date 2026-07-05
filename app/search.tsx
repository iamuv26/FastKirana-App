import { View, Text, TextInput,  FlatList, Pressable, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowLeft, X, ShoppingBag, Mic } from 'lucide-react-native';
import { router } from 'expo-router';
import ProductCard, { Product } from '../components/product/ProductCard';
import FloatingCartBar from '../components/shared/FloatingCartBar';
import { formatPrice } from '../lib/utils';
import { useCart } from '../hooks/use-cart';
import { toast } from '../lib/toast';
import { API_BASE_URL } from '../lib/constants';
import { useTheme } from './context/ThemeContext';
import { triggerHaptic } from '../lib/haptic';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, cancelAnimation } from 'react-native-reanimated';

const SUGGESTION_PLACEHOLDERS = [
  'Search "Atta, Rice, Dal"...',
  'Search fresh mangoes 🥭',
  'Search warm Cafe sandwiches 🥪',
  'Search "Milk & Breakfast" 🥛',
  'Search snacks & munchies 🍿',
  'Search cold beverages 🥤',
];

// Local offline fallback searching database
const ALL_SEARCHABLE_PRODUCTS: Product[] = [];

export default function SearchScreen() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [searchQueryVal, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderOpacity = useSharedValue(1);

  const placeholderStyle = useAnimatedStyle(() => {
    const translateY = placeholderOpacity.value === 1 ? 0 : 4;
    return {
      opacity: placeholderOpacity.value,
      transform: [{ translateY }],
    };
  });

  useEffect(() => {
    if (searchQueryVal.length > 0) return;

    const interval = setInterval(() => {
      placeholderOpacity.value = withTiming(0, { duration: 250 }, (isFinished) => {
        if (isFinished) {
          setPlaceholderIndex((prev) => (prev + 1) % SUGGESTION_PLACEHOLDERS.length);
          placeholderOpacity.value = withTiming(1, { duration: 250 });
        }
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [searchQueryVal]);

  // Fetch all products from API for matching
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['all-search-products-list'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?limit=500`);
      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
  });
  
  // Voice Search Simulation States
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Listening...');
  const pulseScale = useSharedValue(1);

  const handleStartVoiceSearch = () => {
    triggerHaptic('medium');
    setVoiceStatus('Listening...');
    setIsVoiceModalVisible(true);
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );

    // Simulate speech recognition after 2 seconds
    setTimeout(() => {
      const speechSuggestions = ['milk', 'fresh tomatoes', 'cold coffee', 'lays chips'];
      const randomQuery = speechSuggestions[Math.floor(Math.random() * speechSuggestions.length)];
      setSearchQuery(randomQuery);
      setVoiceStatus(`Searching for "${randomQuery}"...`);
      triggerHaptic('success');
      
      setTimeout(() => {
        setIsVoiceModalVisible(false);
      }, 1000);
    }, 2500);
  };

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: withTiming(voiceStatus === 'Listening...' ? 1 : 0.4),
  }));
  
  const { getTotalItems, getSubtotal, addItem, updateQuantity, getItemQuantity } = useCart();
  const [isListParserVisible, setIsListParserVisible] = useState(false);
  const [listInputText, setListInputText] = useState('');
  const [parsedResults, setParsedResults] = useState<Product[]>([]);

  const handleParseList = () => {
    if (!listInputText.trim()) {
      setParsedResults([]);
      return;
    }
    const phrases = listInputText
      .split(/[\n,;]+/)
      .map(it => it.trim().toLowerCase())
      .filter(it => it.length > 0);
      
    const matches: Product[] = [];
    const sourceProducts = allProducts.length > 0 ? allProducts : ALL_SEARCHABLE_PRODUCTS;
    for (const query of phrases) {
      const bestMatch = sourceProducts.find(p => 
        p.name.toLowerCase().includes(query) || 
        p.slug.toLowerCase().includes(query)
      );
      if (bestMatch && !matches.find(m => m.id === bestMatch.id)) {
        matches.push(bestMatch);
      }
    }
    setParsedResults(matches);
  };

  const handleAddAllParsed = () => {
    parsedResults.forEach(p => {
      const qty = getItemQuantity(p.id);
      if (qty === 0) {
        addItem(p);
      }
    });
    toast.success(`Added ${parsedResults.length} items to cart!`);
    setIsListParserVisible(false);
    setListInputText('');
    setParsedResults([]);
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQueryVal);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQueryVal]);

  // Query search endpoint
  const { data: serverResults = [], isLoading } = useQuery<Product[]>({
    queryKey: ['search-products', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      const response = await fetch(`${API_BASE_URL}/products?search=${debouncedQuery}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    enabled: debouncedQuery.trim().length > 0,
  });

  // Local fallback searching logic
  const getSearchResults = () => {
    if (!searchQueryVal.trim()) return [];
    const activeServer = serverResults.filter(p => p.isAvailable !== false);
    if (activeServer.length > 0) return activeServer;
    const lowerQuery = searchQueryVal.toLowerCase();
    const sourceProducts = allProducts.length > 0 ? allProducts : ALL_SEARCHABLE_PRODUCTS;
    return sourceProducts.filter((p) => 
      p.isAvailable !== false &&
      (p.name.toLowerCase().includes(lowerQuery) || 
       p.slug.toLowerCase().includes(lowerQuery))
    );
  };

  const resultsList = getSearchResults();
  const cartItemCount = getTotalItems();
  const cartSubtotal = getSubtotal();

  const trendingTags = ['Mangoes', 'Amul', 'Chai', 'Milk', 'Maggi', 'Chocolate'];

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      {/* Search Header */}
      <View className="px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex-row items-center gap-3 bg-white dark:bg-zinc-900">

        <View className="flex-1 bg-slate-100 dark:bg-zinc-800 flex-row items-center px-3 py-2.5 rounded-xl border border-slate-200 dark:border-zinc-700">
          <Search size={18} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
          <View style={{ flex: 1, position: 'relative', justifyContent: 'center' }}>
            <TextInput
              placeholder=""
              autoFocus
              value={searchQueryVal}
              onChangeText={setSearchQuery}
              className="w-full ml-2 text-slate-800 dark:text-zinc-100 text-sm font-semibold p-0 z-10"
            />
            {searchQueryVal.length === 0 && (
              <Animated.Text
                style={[{
                  position: 'absolute',
                  left: 8,
                  fontSize: 13,
                  color: isDarkMode ? '#71717a' : '#94a3b8',
                  fontWeight: '500',
                  pointerEvents: 'none',
                }, placeholderStyle]}
              >
                {SUGGESTION_PLACEHOLDERS[placeholderIndex]}
              </Animated.Text>
            )}
          </View>
          {searchQueryVal.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
            </Pressable>
          ) : (
            <View className="flex-row items-center gap-2">
              <Pressable onPress={handleStartVoiceSearch} className="p-1 active:scale-90 transition-transform">
                <Mic size={18} color="#e20a22" />
              </Pressable>
              <Pressable onPress={() => setIsListParserVisible(true)} className="p-1 active:scale-90 transition-transform">
                <Text className="text-base">📋</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Content Area */}
      <View className="flex-1 bg-slate-50 dark:bg-zinc-950">
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#e20a22" />
          </View>
        ) : searchQueryVal.length === 0 ? (
          // Suggestions screen
          <View className="p-4 bg-white dark:bg-zinc-900 flex-1">
            <Text className="text-slate-700 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider mb-3">Trending Searches</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {trendingTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => setSearchQuery(tag)}
                  className="bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 px-3.5 py-2 rounded-xl flex-row items-center gap-1 active:bg-primary-light active:border-primary/20"
                >
                  <Search size={12} color="#e20a22" />
                  <Text className="text-slate-600 dark:text-zinc-300 text-xs font-bold">{tag}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          // Search Results Grid
          <FlatList
            data={resultsList}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={{ justifyContent: 'space-between' }}
            contentContainerStyle={{ padding: 14, paddingBottom: 110 }}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }) => <ProductCard product={item} index={index} />}
            ListEmptyComponent={
              <View className="flex-1 justify-center items-center py-20 px-8">
                <Text className="text-4xl">🔍</Text>
                <Text className="text-slate-800 dark:text-zinc-200 font-black text-base mt-4">No results for "{searchQueryVal}"</Text>
                <Text className="text-slate-400 dark:text-zinc-500 text-xs mt-1 text-center leading-4">
                  Check for typos, or browse categories for matching products.
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={8} />

      {/* Quick List Parser Modal */}
      <Modal
        visible={isListParserVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setIsListParserVisible(false);
          setListInputText('');
          setParsedResults([]);
        }}
      >
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-white dark:bg-zinc-900 rounded-t-3xl p-6 min-h-[50%] max-h-[85%] border-t border-slate-100 dark:border-zinc-800 shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-slate-900 dark:text-zinc-100 font-extrabold text-lg">
                📋 Quick List Parser
              </Text>
              <Pressable
                onPress={() => {
                  setIsListParserVisible(false);
                  setListInputText('');
                  setParsedResults([]);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 items-center justify-center"
              >
                <X size={16} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <Text className="text-slate-500 dark:text-zinc-400 text-xs leading-relaxed mb-4">
                Paste your grocery list separated by lines or commas (e.g. "milk, Atta, mangoes"). We will automatically search and match them to our catalog.
              </Text>

              <TextInput
                multiline
                numberOfLines={4}
                value={listInputText}
                onChangeText={setListInputText}
                placeholder={`Milk\nAashirvaad Atta\nLays Classic`}
                placeholderTextColor={isDarkMode ? '#71717a' : '#94a3b8'}
                className="w-full bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl p-3 text-slate-800 dark:text-zinc-100 text-sm font-semibold mb-4 text-start min-h-[100px]"
                style={{ textAlignVertical: 'top' }}
              />

              <Pressable
                onPress={handleParseList}
                className="w-full bg-slate-900 dark:bg-zinc-800 py-3 rounded-xl items-center mb-6 active:bg-slate-800 dark:active:bg-zinc-705 border border-transparent dark:border-zinc-700"
              >
                <Text className="text-white font-extrabold text-sm">Find Matches</Text>
              </Pressable>

              {parsedResults.length > 0 ? (
                <View className="mb-6">
                  <Text className="text-slate-700 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider mb-3">
                    Matched Products ({parsedResults.length})
                  </Text>
                  <View className="bg-slate-50 dark:bg-zinc-800 rounded-2xl border border-slate-200 dark:border-zinc-700 p-2 gap-2">
                    {parsedResults.map((item) => (
                      <View key={item.id} className="flex-row justify-between items-center p-2 border-b border-slate-100 dark:border-zinc-800 last:border-b-0">
                        <View className="flex-1 pr-3">
                          <Text className="text-slate-800 dark:text-zinc-200 font-bold text-xs" numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text className="text-slate-400 dark:text-zinc-400 text-[10px] mt-0.5">
                            {item.unit} • {formatPrice(item.price)}
                          </Text>
                        </View>
                        <Text className="text-emerald-600 dark:text-emerald-400 text-xs font-black">Matched ✓</Text>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    onPress={handleAddAllParsed}
                    className="w-full bg-emerald-600 py-3.5 rounded-xl items-center mt-4 active:bg-emerald-700 shadow-md border border-emerald-500"
                  >
                    <Text className="text-white font-black text-sm uppercase tracking-wider">
                      Add All ({parsedResults.length}) to Cart
                    </Text>
                  </Pressable>
                </View>
              ) : listInputText.trim().length > 0 ? (
                <View className="items-center py-6">
                  <Text className="text-slate-400 dark:text-zinc-500 text-xs font-semibold">Tap "Find Matches" to parse your list</Text>
                </View>
              ) : null}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Voice Search Modal */}
      <Modal
        visible={isVoiceModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVoiceModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-6">
          <View className="bg-white dark:bg-zinc-900 rounded-3xl p-6 w-full max-w-sm items-center shadow-2xl border border-slate-100 dark:border-zinc-800">
            <Text className="text-slate-800 dark:text-zinc-100 font-black text-sm uppercase tracking-widest mb-4">Voice Search</Text>
            
            <View className="my-8 justify-center items-center relative">
              {/* Pulsing glow background */}
              <Animated.View 
                style={animatedPulseStyle}
                className="w-20 h-20 rounded-full bg-rose-500/20 absolute"
              />
              {/* Red mic button */}
              <View className="w-16 h-16 rounded-full bg-rose-600 items-center justify-center shadow-lg z-10">
                <Mic size={28} color="#ffffff" />
              </View>
            </View>

            <Text className="text-slate-800 dark:text-zinc-100 font-black text-lg text-center mt-2 h-8">
              {voiceStatus}
            </Text>
            
            <Text className="text-slate-400 dark:text-zinc-400 text-xs text-center mt-4 leading-5 px-4">
              Try saying <Text className="font-extrabold text-rose-600 dark:text-rose-400">"cold coffee"</Text> or <Text className="font-extrabold text-rose-600 dark:text-rose-400">"crispy momos"</Text>
            </Text>

            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setIsVoiceModalVisible(false);
              }}
              className="mt-8 px-6 py-2.5 bg-slate-100 dark:bg-zinc-800 rounded-xl active:bg-slate-200"
            >
              <Text className="text-slate-650 dark:text-zinc-350 font-bold text-xs uppercase">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
