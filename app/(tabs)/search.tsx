import { View, Text, TextInput, Pressable, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, ShoppingBag, Clock, Mic, Sparkles, ChevronRight, ChevronDown, Sun, Moon, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import { useUIStore } from '../../stores/ui-store';
import Logo from '../../components/shared/Logo';
import { FlashList } from '@shopify/flash-list';
import { Image as ExpoImage } from 'expo-image';
import ProductCard, { Product } from '../../components/product/ProductCard';
import ProductCardSkeleton from '../../components/product/ProductCardSkeleton';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import { formatPrice, formatHeaderAddress } from '../../lib/utils';
import { useCart } from '../../hooks/use-cart';
import { API_BASE_URL } from '../../lib/constants';
import { useTheme } from '../context/ThemeContext';
import { ScalePressable } from '../../components/shared/ScalePressable';
import { THEME } from '../../lib/theme';

import { triggerHaptic } from '../../lib/haptic';
import { LinearGradient } from 'expo-linear-gradient';
let ExpoSpeechRecognitionModule: any = null;
let ExpoWebSpeechRecognition: any = null;
try {
  const speechModule = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
  ExpoWebSpeechRecognition = speechModule.ExpoWebSpeechRecognition;
} catch (e) {
  console.log('expo-speech-recognition module not loaded (running in Expo Go / Web)');
}
import { toast } from '../../lib/toast';
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
  'fruits-vegetables': require('../../assets/fruits_vegetables_category.webp'),
  'dairy-breakfast': require('../../assets/dairy_breakfast_category.webp'),
  'snacks-biscuits': require('../../assets/snacks_munchies_category.webp'),
  'beverages': require('../../assets/beverages_category.webp'),
  'personal-care': require('../../assets/personal_care_category.webp'),
  'cafe': require('../../assets/cafe_category.webp'),
};



interface CategoryItem {
  name: string;
  slug: string;
  emoji: string;
}

const GROCERY_CATEGORIES: CategoryItem[] = [
  { name: 'Fruits & Vegetables', slug: 'fruits-vegetables', emoji: '🥬' },
  { name: 'Dairy & Breakfast', slug: 'dairy-breakfast', emoji: '🥛' },
  { name: 'Snacks & Munchies', slug: 'snacks-biscuits', emoji: '🍿' },
  { name: 'Beverages', slug: 'beverages', emoji: '🥤' },
  { name: 'Ice Cream', slug: 'ice-cream', emoji: '🍦' },
  { name: 'Personal Care', slug: 'personal-care', emoji: '🧴' },
  { name: 'Household', slug: 'household', emoji: '🏠' },
  { name: 'Bakery & Biscuits', slug: 'bakery', emoji: '🍞' },
  { name: 'Atta, Rice & Dal', slug: 'grocery-essential', emoji: '🌾' },
];

const memoryMap = new Map<string, string>();
const storage = {
  getString: (key: string) => memoryMap.get(key) || undefined,
  set: (key: string, value: string) => { memoryMap.set(key, value); },
  remove: (key: string) => { memoryMap.delete(key); return true; },
};
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

  // Fetch live categories from database
  const { data: dbCategories = [] } = useQuery<any[]>({
    queryKey: ['categories-list-all'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error('API failed');
      return res.json();
    },
    staleTime: 1000 * 60 * 15, // 15 mins cache validity
  });

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
    queryKey: ['all-search-products-list-tab'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?limit=500`);
      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
  });

  // Query search endpoint with 5s Live Stock Poll Interval
  const { data: serverResults = [], isLoading } = useQuery<Product[]>({
    queryKey: ['search-products-tab', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || !debouncedQuery.trim()) return [];
      const response = await fetch(`${API_BASE_URL}/products?search=${debouncedQuery}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    enabled: !!debouncedQuery && debouncedQuery.trim().length > 0,
    refetchInterval: 5000, // Real-time stock counts polling
  });

  const saveToHistory = (query: string) => {
    const trimmed = (query || '').trim();
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

  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    let recognition: any = null;
    try {
      if (ExpoWebSpeechRecognition) {
        // Instantiate speech recognition
        recognition = new ExpoWebSpeechRecognition();
        recognition.lang = 'en-IN';
        
        recognition.onstart = () => {
          setIsListening(true);
          setVoiceStatus('Listening...');
        };
        
        recognition.onend = () => {
          setIsListening(false);
        };
        
        recognition.onresult = (event: any) => {
          if (event.results && event.results[0]) {
            const transcriptText = event.results[0].transcript || event.results[0][0]?.transcript || '';
            setVoiceStatus(`Recognized: "${transcriptText}"`);
            setSearchQuery(transcriptText);
            saveToHistory(transcriptText);
            setTimeout(() => {
              setIsListening(false);
            }, 1000);
          }
        };
        
        recognition.onerror = (error: any) => {
          console.warn('Speech recognition error:', error);
          setVoiceStatus('Recognition failed. Try again.');
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    } catch (e) {
      console.warn('Failed to initialize speech recognition:', e);
    }

    return () => {
      if (recognition) {
        try {
          recognition.abort();
        } catch (e) {}
      }
    };
  }, []);

  const handleStartVoiceSearch = async () => {
    triggerHaptic('medium');
    setIsListening(true);
    setVoiceStatus('Initializing mic...');
    
    const isNativeModuleAvailable = typeof ExpoSpeechRecognitionModule !== 'undefined' && ExpoSpeechRecognitionModule !== null;
    if (!isNativeModuleAvailable || !recognitionRef.current) {
      console.log('Using simulated voice search fallback (Expo Go / Web)');
      setVoiceStatus('Listening (Simulation)...');
      setTimeout(() => {
        const sampleSearches = ['milk', 'fresh paneer', 'crispy momos', 'lays', 'coca-cola', 'alphonso mangoes'];
        const matchedText = sampleSearches[Math.floor(Math.random() * sampleSearches.length)];
        setVoiceStatus(`Recognized: "${matchedText}"`);
        setSearchQuery(matchedText);
        saveToHistory(matchedText);
        setIsListening(false);
      }, 2500);
      return;
    }

    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission || !permission.granted) {
        setVoiceStatus('Microphone permission denied.');
        setIsListening(false);
        toast.error('Microphone permission is required.');
        return;
      }
      
      recognitionRef.current.start();
    } catch (e) {
      console.warn('Failed starting voice recognition:', e);
      // Simulation fallback if native code is missing (e.g. in Expo Go / Web)
      setVoiceStatus('Listening (Simulation)...');
      setTimeout(() => {
        const sampleSearches = ['milk', 'fresh paneer', 'crispy momos', 'lays', 'coca-cola', 'alphonso mangoes'];
        const matchedText = sampleSearches[Math.floor(Math.random() * sampleSearches.length)];
        setVoiceStatus(`Recognized: "${matchedText}"`);
        setSearchQuery(matchedText);
        saveToHistory(matchedText);
        setIsListening(false);
      }, 2500);
    }
  };

  const handleCancelVoiceSearch = () => {
    triggerHaptic('light');
    try {
      recognitionRef.current?.stop();
    } catch (e) {
      console.warn(e);
    }
    setIsListening(false);
  };

  // Only query results from server database
  const getSearchResults = () => {
    if (!searchQuery || !searchQuery.trim()) return [];
    
    const lowerQuery = searchQuery.toLowerCase();
    // Try local matching first so we get instant results
    const localMatched = allProducts.filter((p) =>
      p.name?.toLowerCase().includes(lowerQuery) ||
      p.slug?.toLowerCase().includes(lowerQuery) ||
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
    if (!searchQuery || !searchQuery.trim()) return [];
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
    <SafeAreaView style={{ flex: 1, backgroundColor: isDark ? THEME.COLORS.dark.background : THEME.COLORS.light.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* Premium Header */}
      <View 
        style={{
          width: '100%',
          backgroundColor: isDark ? THEME.COLORS.dark.background : '#ffffff',
          zIndex: 50,
          borderBottomWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <View style={{ paddingHorizontal: THEME.SPACING.lg, paddingTop: 12, paddingBottom: 12 }}>
          {/* Top Row: Location & Theme */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            {/* Left: Brand Logo & Text */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                backgroundColor: isDark ? '#18181b' : '#f1f5f9', 
                width: 32,
                height: 32,
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 8, 
                borderWidth: 1, 
                borderColor: isDark ? '#27272a' : '#e2e8f0',
                flexShrink: 0
              }}>
                <Logo size={22} />
              </View>
              <View style={{ marginLeft: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: -0.5, lineHeight: 18 }}>
                  <Text style={{ color: isDark ? '#fafafa' : '#0f172a' }}>Fast</Text>
                  <Text style={{ color: '#e20a22' }}>Kirana</Text>
                </Text>
                <Text style={{ fontSize: 7, fontWeight: '900', color: '#16a34a', letterSpacing: 0.3, marginTop: 0 }}>
                  DELIVERY APP
                </Text>
              </View>
            </View>

            {/* Right: Location Capsule Picker */}
            <ScalePressable 
              onPress={() => {
                router.push('/location-picker');
              }}
              scaleValue={0.96}
              style={{
                maxWidth: '60%'
              }}
            >
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: isDark ? 'rgba(226,10,34,0.1)' : '#fff5f5', 
                borderWidth: 1, 
                borderColor: isDark ? 'rgba(226,10,34,0.25)' : '#fecdd3', 
                borderRadius: THEME.RADIUS.pill, 
                paddingHorizontal: 8, 
                paddingVertical: 5,
                justifyContent: 'center',
              }}>
                <MapPin size={11} color={THEME.COLORS.brand.primary} style={{ flexShrink: 0, marginRight: 3 }} />
                <Text 
                  numberOfLines={1} 
                  style={{ 
                    fontSize: 10, 
                    fontWeight: '700', 
                    color: isDark ? '#fafafa' : '#0f172a',
                    flexShrink: 1,
                    marginRight: 3
                  }}
                >
                  {formatHeaderAddress(selectedLocation)}
                </Text>
                <ChevronDown size={8} color={isDark ? '#cbd5e1' : '#64748b'} style={{ flexShrink: 0 }} />
              </View>
            </ScalePressable>
          </View>

          {/* Bottom Row: Search Box Input */}
          <View 
            className="flex-row items-center bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-4 h-11 w-full"
            style={{
              borderRadius: THEME.RADIUS.pill,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.02,
                  shadowRadius: 4,
                },
                android: {
                  elevation: 1,
                }
              })
            }}
          >
            <Search size={16} color={THEME.COLORS.brand.primary} style={{ marginRight: 10 }} />
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
              <ScalePressable onPress={() => setSearchQuery('')} scaleValue={0.9} hitSlop={12} style={{ padding: 4 }}>
                <X size={16} color={isDark ? '#a1a1aa' : '#64748b'} />
              </ScalePressable>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 1, height: 16, backgroundColor: isDark ? '#27272a' : '#e2e8f0', marginRight: 10 }} />
                <ScalePressable onPress={handleStartVoiceSearch} scaleValue={0.9} hitSlop={12} style={{ padding: 4 }}>
                  <Mic size={16} color="#e20a22" />
                </ScalePressable>
              </View>
            )}
          </View>

          {/* Quick Search Autocomplete Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 2, gap: 8, paddingTop: 10 }}
            className="mt-1"
          >
            {[
              { label: '🥛 Milk', query: 'Milk' },
              { label: '🍞 Bread', query: 'Bread' },
              { label: '🍜 Maggi', query: 'Maggi' },
              { label: '☕ Tea', query: 'Chai' },
              { label: '🥔 Chips', query: 'Chips' },
              { label: '🧀 Paneer', query: 'Paneer' },
              { label: '🥤 Cold Drink', query: 'Cold Drink' },
            ].map((chip) => (
              <ScalePressable
                key={chip.label}
                onPress={() => {
                  setSearchQuery(chip.query);
                  saveToHistory(chip.query);
                }}
                scaleValue={0.96}
                style={{
                  backgroundColor: isDark ? '#27272a' : '#f8fafc',
                  borderWidth: 1,
                  borderColor: isDark ? '#3f3f46' : '#e2e8f0',
                  borderRadius: 9999,
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDark ? 0.2 : 0.03,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <Text className="text-slate-800 dark:text-zinc-200 text-[11px] font-black">{chip.label}</Text>
              </ScalePressable>
            ))}
          </ScrollView>
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
              <ScalePressable
                key={cat.slug}
                onPress={() => {
                  if (cat.isCafe) {
                    router.push(`/cafe?section=${cat.slug}`);
                  } else {
                    router.push(`/category/${cat.slug}`);
                  }
                }}
                scaleValue={0.95}
                style={{
                  backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 9999,
                  borderWidth: 1,
                  borderColor: isDark ? '#4c0519' : '#ffe4e6',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Text style={{ fontSize: 11 }}>{cat.emoji}</Text>
                <Text className="text-slate-700 dark:text-zinc-300 text-[10px] font-black">{cat.name}</Text>
                <ChevronRight size={9} color={isDark ? '#a1a1aa' : '#64748b'} />
              </ScalePressable>
            ))}
          </View>
        )}
        {isLoading ? (
          <ScrollView contentContainerStyle={{ padding: 8 }}>
            <View className="flex-row flex-wrap justify-between">
              {[1, 2, 3, 4].map((i) => (
                <ProductCardSkeleton key={i} style={{ width: '48%' }} />
              ))}
            </View>
          </ScrollView>
        ) : searchQuery.length === 0 ? (
          // Upgraded Premium Suggestions screen
          <ScrollView 
            className="bg-white dark:bg-zinc-900 flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {recentSearches.length > 0 && (
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-slate-800 dark:text-zinc-200 font-extrabold text-xs uppercase tracking-wider">Recent Searches</Text>
                  <ScalePressable onPress={clearHistory} scaleValue={0.97} haptic="medium">
                    <Text className="text-rose-600 dark:text-rose-400 font-black text-xs">Clear All</Text>
                  </ScalePressable>
                </View>
                <View className="flex-row flex-wrap gap-2">
                  {recentSearches.map((tag) => (
                    <ScalePressable
                      key={tag}
                      onPress={() => {
                        setSearchQuery(tag);
                        saveToHistory(tag);
                      }}
                      scaleValue={0.95}
                      style={{
                        backgroundColor: isDark ? 'rgba(39, 39, 42, 0.4)' : '#f8fafc',
                        borderWidth: 1,
                        borderColor: isDark ? '#27272a' : '#e2e8f0',
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Clock size={12} color={isDark ? '#a1a1aa' : '#64748b'} />
                      <Text className="text-slate-600 dark:text-zinc-350 text-xs font-bold">{tag}</Text>
                    </ScalePressable>
                  ))}
                </View>
              </View>
            )}

            <Text className="text-slate-800 dark:text-zinc-200 font-extrabold text-xs uppercase tracking-wider mb-3">🔥 Trending Now</Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {trendingTags.map((tag, idx) => {
                // Gamified gold/silver/bronze/neutral styling for ranks
                let badgeBg = isDark ? '#27272a' : '#f1f5f9';
                let badgeText = isDark ? '#a1a1aa' : '#64748b';
                let tagBg = isDark ? '#1c1c1e' : '#f8fafc';
                let borderCol = isDark ? '#27272a' : '#f1f5f9';

                if (idx === 0) {
                  badgeBg = '#f59e0b'; // Gold
                  badgeText = '#ffffff';
                  tagBg = isDark ? 'rgba(245,158,11,0.06)' : 'rgba(245,158,11,0.04)';
                  borderCol = 'rgba(245,158,11,0.2)';
                } else if (idx === 1) {
                  badgeBg = '#94a3b8'; // Silver
                  badgeText = '#ffffff';
                  tagBg = isDark ? 'rgba(148,163,184,0.06)' : 'rgba(148,163,184,0.04)';
                  borderCol = 'rgba(148,163,184,0.2)';
                } else if (idx === 2) {
                  badgeBg = '#b45309'; // Bronze
                  badgeText = '#ffffff';
                  tagBg = isDark ? 'rgba(180,83,9,0.06)' : 'rgba(180,83,9,0.04)';
                  borderCol = 'rgba(180,83,9,0.2)';
                }

                return (
                  <ScalePressable
                    key={tag}
                    onPress={() => {
                      setSearchQuery(tag);
                      saveToHistory(tag);
                    }}
                    scaleValue={0.95}
                    style={{
                      overflow: 'hidden',
                      borderRadius: 16,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 8,
                        paddingHorizontal: 14,
                        paddingVertical: 9,
                        borderWidth: 1,
                        borderColor: borderCol,
                        backgroundColor: tagBg,
                        borderRadius: 16,
                      }}
                    >
                      <View style={{ 
                        width: 18, height: 18, borderRadius: 9, 
                        backgroundColor: badgeBg, 
                        alignItems: 'center', justifyContent: 'center' 
                      }}>
                        <Text style={{ 
                          color: badgeText, 
                          fontSize: 9, fontWeight: '900' 
                        }}>{idx + 1}</Text>
                      </View>
                      <Text className="text-slate-850 dark:text-zinc-200 text-xs font-black">{tag}</Text>
                      {idx === 0 && <Text style={{ fontSize: 10 }}>👑</Text>}
                    </View>
                  </ScalePressable>
                );
              })}
            </View>

            {/* Upgraded Premium Category Access with Double-Border & Soft Shadow Depth */}
            <Text className="text-slate-800 dark:text-zinc-200 font-extrabold text-xs uppercase tracking-wider mb-4">Browse Categories</Text>
            <View className="flex-row flex-wrap justify-between gap-y-5 mb-10">
              {dbCategories && dbCategories.length > 0 ? (
                dbCategories.slice(0, 6).map((cat) => {
                  const img = CATEGORY_IMAGES[cat.slug];
                  const isCafe = cat.slug === 'cafe';
                  return (
                    <ScalePressable
                      key={cat.slug}
                      onPress={() => {
                        if (isCafe) {
                          router.push('/cafe');
                        } else {
                          router.push(`/category/${cat.slug}`);
                        }
                      }}
                      scaleValue={0.92}
                      style={{ width: '31%' }}
                    >
                      <View style={{ alignItems: 'center', width: '100%' }}>
                        <View style={{
                          width: 84,
                          height: 84,
                          borderRadius: 42,
                          overflow: 'hidden',
                          borderWidth: 2.5,
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isDark ? '#1c1c1e' : '#f8fafc',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: isDark ? 0.3 : 0.06,
                          shadowRadius: 10,
                          elevation: 3,
                          marginBottom: 8,
                        }}>
                          {img ? (
                            <ExpoImage
                              source={img}
                              style={{ width: '100%', height: '100%' }}
                              contentFit="cover"
                              transition={200}
                              cachePolicy="memory-disk"
                              placeholder={isDark ? "rgba(39,39,42,0.4)" : "rgba(241,245,249,0.6)"}
                            />
                          ) : (
                            <Text style={{ fontSize: 24 }}>📦</Text>
                          )}
                        </View>
                        <Text className="text-slate-700 dark:text-zinc-300 text-[10.5px] font-black text-center w-full" numberOfLines={1}>
                          {cat.name}
                        </Text>
                      </View>
                    </ScalePressable>
                  );
                })
              ) : (
                [
                  { name: 'Fruits & Veggies', slug: 'fruits-vegetables' },
                  { name: 'Dairy', slug: 'dairy-breakfast' },
                  { name: 'Snacks', slug: 'snacks-biscuits' },
                  { name: 'Beverages', slug: 'beverages' },
                  { name: 'Cafe', slug: 'cafe' },
                  { name: 'Personal Care', slug: 'personal-care' },
                ].map((cat) => {
                  const img = CATEGORY_IMAGES[cat.slug];
                  const isCafe = cat.slug === 'cafe';
                  return (
                    <ScalePressable
                      key={cat.slug}
                      onPress={() => {
                        if (isCafe) {
                          router.push('/cafe');
                        } else {
                          router.push(`/category/${cat.slug}`);
                        }
                      }}
                      scaleValue={0.92}
                      style={{ width: '31%' }}
                    >
                      <View style={{ alignItems: 'center', width: '100%' }}>
                        <View style={{
                          width: 84,
                          height: 84,
                          borderRadius: 42,
                          overflow: 'hidden',
                          borderWidth: 2.5,
                          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isDark ? '#1c1c1e' : '#f8fafc',
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: isDark ? 0.3 : 0.06,
                          shadowRadius: 10,
                          elevation: 3,
                          marginBottom: 8,
                        }}>
                          {img ? (
                            <ExpoImage
                              source={img}
                              style={{ width: '100%', height: '100%' }}
                              contentFit="cover"
                              transition={200}
                              cachePolicy="memory-disk"
                              placeholder={isDark ? "rgba(39,39,42,0.4)" : "rgba(241,245,249,0.6)"}
                            />
                          ) : (
                            <Text style={{ fontSize: 24 }}>📦</Text>
                          )}
                        </View>
                        <Text className="text-slate-700 dark:text-zinc-300 text-[10.5px] font-black text-center w-full" numberOfLines={1}>
                          {cat.name}
                        </Text>
                      </View>
                    </ScalePressable>
                  );
                })
              )}
            </View>
          </ScrollView>
        ) : (
          // Search Results Grid
          <TypedFlashList
            data={resultsList}
            keyExtractor={(item: Product) => item.id}
            numColumns={2}
            estimatedItemSize={270}
            contentContainerStyle={{ padding: 8, paddingBottom: 160 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item, index }: { item: Product; index: number }) => (
              <View style={{ 
                width: '100%', 
                paddingLeft: index % 2 === 0 ? 0 : 5, 
                paddingRight: index % 2 === 0 ? 5 : 0, 
                marginBottom: 12 
              }}>
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
                <ScalePressable 
                  onPress={() => {
                    setSearchQuery('');
                  }}
                  scaleValue={0.95}
                  style={{
                    marginTop: 16,
                    backgroundColor: '#e20a22',
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>Browse Categories</Text>
                </ScalePressable>
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

            <ScalePressable
              onPress={handleCancelVoiceSearch}
              scaleValue={0.96}
              style={{
                backgroundColor: '#27272a',
                borderWidth: 1,
                borderColor: '#3f3f46',
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: 12,
              }}
            >
              <Text className="text-zinc-300 font-black text-xs uppercase">Cancel</Text>
            </ScalePressable>
          </View>
        </View>
      )}

      {/* Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={88} />
    </SafeAreaView>
  );
}
