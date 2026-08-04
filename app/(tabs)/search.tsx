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
import { useScrollTabBar } from '../../hooks/use-scroll-tab-bar';
import BrandedTopHeader from '../../components/shared/BrandedTopHeader';
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
  FadeIn,
  FadeOut,
  ZoomIn,
  ZoomOut,
  FadeInDown,
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
          backgroundColor: `${THEME.COLORS.brand.primary}66`,
        },
        animatedStyle
      ]}
    />
  );
}

export default function SearchScreen() {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const { onScroll: onTabBarScroll, onTouchStart: onTabBarTouchStart } = useScrollTabBar();
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

  const validStoreId = (assignedStoreId && !assignedStoreId.startsWith('default-')) ? assignedStoreId : null;

  // Fetch all products from API for matching
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['all-search-products-list-tab', validStoreId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?limit=500${validStoreId ? `&storeId=${validStoreId}` : ''}`);
      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
  });

  // Query search endpoint with 30s Cache (No aggressive polling to prevent typing and scroll lag)
  const { data: serverResults = [], isLoading } = useQuery<Product[]>({
    queryKey: ['search-products-tab', debouncedQuery, validStoreId],
    queryFn: async () => {
      if (!debouncedQuery || !debouncedQuery.trim()) return [];
      const response = await fetch(`${API_BASE_URL}/products?search=${debouncedQuery}&limit=100${validStoreId ? `&storeId=${validStoreId}` : ''}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    enabled: !!debouncedQuery && debouncedQuery.trim().length > 0,
    staleTime: 30000, // 30s cache
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

  const resultsList = useMemo(() => {
    return getSearchResults();
  }, [searchQuery, allProducts, serverResults]);
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

  const textInputStyle = {
    color: isDarkMode ? '#ffffff' : '#0f172a',
    fontSize: 13,
    fontWeight: '600' as const,
    padding: 0
  };

  const placeholderColor = isDarkMode ? colors.textMuted : '#94a3b8';
  const dividerColor = isDarkMode ? colors.borderLight : colors.border;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {/* Premium Header */}
      <View
        style={{
          width: '100%',
          backgroundColor: colors.surface,
          zIndex: 50,
          borderBottomWidth: 1,
          borderColor: colors.borderLight,
        }}
      >
        <View style={{ paddingHorizontal: THEME.SPACING.lg, paddingTop: 12, paddingBottom: 12 }}>
          {/* Top Row: Standardized Branded Header & Location */}
          <BrandedTopHeader style={{ paddingHorizontal: 0, paddingVertical: 0, borderBottomWidth: 0, marginBottom: 10 }} />

          {/* Bottom Row: Search Box Input */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceElevated,
              borderWidth: 1,
              borderColor: colors.border,
              paddingHorizontal: THEME.SPACING.lg,
              height: 44,
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
              placeholderTextColor={placeholderColor}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => saveToHistory(searchQuery)}
              returnKeyType="search"
              style={{
                flex: 1,
                ...textInputStyle
              }}
            />
            {searchQuery.length > 0 ? (
              <ScalePressable onPress={() => setSearchQuery('')} scaleValue={0.9} hitSlop={12} style={{ padding: 4 }}>
                <X size={16} color={isDarkMode ? colors.textMuted : '#64748b'} />
              </ScalePressable>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 1, height: 16, backgroundColor: dividerColor, marginRight: 10 }} />
                <ScalePressable onPress={handleStartVoiceSearch} scaleValue={0.9} hitSlop={12} style={{ padding: 4 }}>
                  <Mic size={16} color={THEME.COLORS.brand.primary} />
                </ScalePressable>
              </View>
            )}
          </View>

          {/* Quick Search Autocomplete Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 2, gap: 8, paddingTop: 10 }}
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
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceElevated,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: THEME.RADIUS.pill,
                  paddingHorizontal: THEME.SPACING.md,
                  paddingVertical: THEME.SPACING.sm,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: isDarkMode ? 0.2 : 0.03,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary }}>{chip.label}</Text>
              </ScalePressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Content Area */}
      <View style={{ flex: 1, backgroundColor: colors.surfaceElevated }}>
        {/* Predictive Category Shortcuts Overlay */}
        {searchQuery.length > 0 && matchingCategories.length > 0 && (
          <View style={{ backgroundColor: isDarkMode ? `${THEME.COLORS.brand.primary}0A` : `${THEME.COLORS.brand.primary}08`, borderBottomWidth: 1, borderColor: isDarkMode ? `${THEME.COLORS.brand.primary}20` : THEME.COLORS.brand.primaryLight, paddingHorizontal: THEME.SPACING.md, paddingVertical: THEME.SPACING.sm, flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.xs, flexWrap: 'wrap' }}>
            <Sparkles size={11} color={THEME.COLORS.brand.primary} />
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, color: THEME.COLORS.brand.primary, textTransform: 'uppercase', letterSpacing: 0.5, marginRight: 6 }}>Categories:</Text>
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
                  backgroundColor: colors.surface,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: THEME.RADIUS.pill,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary }}>{cat.name}</Text>
                  <ChevronDown size={14} color={colors.textMuted} />
                </View>
              </ScalePressable>
            ))}
          </View>
        )}
        {isLoading ? (
          <ScrollView contentContainerStyle={{ padding: 8 }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              {[1, 2, 3, 4].map((i) => (
                <ProductCardSkeleton key={i} style={{ width: '48%' }} />
              ))}
            </View>
          </ScrollView>
        ) : searchQuery.length === 0 ? (
          // Upgraded Premium Suggestions screen
          <ScrollView
            style={{ flex: 1, backgroundColor: colors.surface }}
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
            onScroll={onTabBarScroll}
            onTouchStart={onTabBarTouchStart}
            scrollEventThrottle={16}
          >
            {recentSearches.length > 0 && (
              <View style={{ marginBottom: THEME.SPACING.lg }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.SPACING.sm }}>
                  <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.8 }}>Recent Searches</Text>
                  <ScalePressable onPress={clearHistory} scaleValue={0.97} haptic="medium">
                    <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, color: THEME.COLORS.brand.error }}>Clear All</Text>
                  </ScalePressable>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: THEME.SPACING.sm }}>
                  {recentSearches.map((tag) => (
                    <ScalePressable
                      key={tag}
                      onPress={() => {
                        setSearchQuery(tag);
                        saveToHistory(tag);
                      }}
                      scaleValue={0.95}
                      style={{
                        backgroundColor: colors.surfaceElevated,
                        borderWidth: 1,
                        borderColor: colors.border,
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: THEME.RADIUS.md,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Clock size={12} color={isDarkMode ? colors.textMuted : '#64748b'} />
                      <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: colors.textSecondary }}>{tag}</Text>
                    </ScalePressable>
                  ))}
                </View>
              </View>
            )}

            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: THEME.SPACING.md }}>🔥 Trending Now</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: THEME.SPACING.sm, marginBottom: THEME.SPACING.lg }}>
              {trendingTags.map((tag, idx) => {
                // Gamified gold/silver/bronze/neutral styling for ranks
                let badgeBg = THEME.COLORS.brand.warning;
                let badgeText = '#ffffff';
                let tagBg = isDarkMode ? `${THEME.COLORS.brand.warning}10` : `${THEME.COLORS.brand.warning}08`;
                let borderCol = isDarkMode ? `${THEME.COLORS.brand.warning}30` : `${THEME.COLORS.brand.warning}20`;

                if (idx === 1) {
                  badgeBg = '#94a3b8'; // Silver
                  badgeText = '#ffffff';
                  tagBg = isDarkMode ? 'rgba(148,163,184,0.08)' : 'rgba(148,163,184,0.06)';
                  borderCol = isDarkMode ? 'rgba(148,163,184,0.25)' : 'rgba(148,163,184,0.18)';
                } else if (idx === 2) {
                  badgeBg = '#b45309'; // Bronze
                  badgeText = '#ffffff';
                  tagBg = isDarkMode ? `${THEME.COLORS.brand.accent}10` : `${THEME.COLORS.brand.accent}06`;
                  borderCol = isDarkMode ? `${THEME.COLORS.brand.accent}25` : `${THEME.COLORS.brand.accent}18`;
                } else if (idx > 2) {
                  badgeBg = isDarkMode ? colors.surfaceElevated : colors.surfaceElevated;
                  badgeText = isDarkMode ? colors.textSecondary : colors.textSecondary;
                  tagBg = colors.surfaceElevated;
                  borderCol = colors.border;
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
                      borderRadius: THEME.RADIUS.md,
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
                        borderRadius: THEME.RADIUS.md,
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
                      <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary }}>{tag}</Text>
                      {idx === 0 && <Text style={{ fontSize: 10 }}>👑</Text>}
                    </View>
                  </ScalePressable>
                );
              })}
            </View>

            {/* Upgraded Premium Category Access with Double-Border & Soft Shadow Depth */}
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: THEME.SPACING.md }}>Browse Categories</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 0, marginBottom: 40 }}>
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
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.surfaceElevated,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: isDarkMode ? 0.3 : 0.06,
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
                              placeholder={isDarkMode ? colors.surfaceElevated : colors.surfaceElevated}
                            />
                          ) : (
                            <Text style={{ fontSize: 24 }}>📦</Text>
                          )}
                        </View>
                        <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary, textAlign: 'center', width: '100%' }} numberOfLines={2}>
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
                          borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: colors.surfaceElevated,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: isDarkMode ? 0.3 : 0.06,
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
                              placeholder={isDarkMode ? colors.surfaceElevated : colors.surfaceElevated}
                            />
                          ) : (
                            <Text style={{ fontSize: 24 }}>📦</Text>
                          )}
                        </View>
                        <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary, textAlign: 'center', width: '100%' }} numberOfLines={2}>
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
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 80, paddingHorizontal: 32 }}>
                {/* Decorative background ring */}
                <View style={{
                  width: 100, height: 100, borderRadius: 50,
                  backgroundColor: isDarkMode ? colors.surfaceElevated : colors.surfaceElevated,
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 2, borderColor: colors.border,
                }}>
                  <Text style={{ fontSize: 40 }}>🔍</Text>
                </View>
                <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.body, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary, marginTop: 20, textAlign: 'center' }}>
                  No results for "{searchQuery}"
                </Text>
                <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, color: colors.textSecondary, marginTop: 8, textAlign: 'center', lineHeight: 20, maxWidth: 260 }}>
                  We couldn't find what you're looking for. Try a different search or browse our categories.
                </Text>
                <ScalePressable
                  onPress={() => {
                    setSearchQuery('');
                  }}
                  scaleValue={0.95}
                  style={{
                    marginTop: 20,
                    backgroundColor: THEME.COLORS.brand.primary,
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: THEME.RADIUS.md,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, textTransform: 'uppercase', letterSpacing: 0.5 }}>Browse Categories</Text>
                </ScalePressable>
              </View>
            }
          />
        )}
      </View>

      {/* Voice Search Pulse overlay modal */}
      {isListening && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          style={{
            position: 'absolute', inset: 0,
            backgroundColor: `${THEME.COLORS.dark.background}E6`,
            zIndex: 50,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 24
          }}
        >
          <Animated.View
            entering={ZoomIn.duration(250).springify().damping(15)}
            exiting={ZoomOut.duration(200)}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              padding: 32,
              borderRadius: THEME.RADIUS.xxl,
              alignItems: 'center',
              width: 320,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 12 },
              shadowOpacity: 0.25,
              shadowRadius: 24,
              elevation: 8,
            }}
          >
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: `${THEME.COLORS.brand.error}1A`,
              borderWidth: 2, borderColor: THEME.COLORS.brand.error,
              alignItems: 'center', justifyContent: 'center',
              marginBottom: 24,
            }}>
              <VoicePulse />
              <Mic size={32} color={THEME.COLORS.brand.error} />
            </View>

            <Text style={{ color: '#ffffff', fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.titleSm, textAlign: 'center', marginBottom: 6 }}>
              Voice Search
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.bold, textAlign: 'center', marginBottom: 24 }}>
              {voiceStatus}
            </Text>

            <ScalePressable
              onPress={handleCancelVoiceSearch}
              scaleValue={0.96}
              style={{
                backgroundColor: colors.surfaceElevated,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 24,
                paddingVertical: 10,
                borderRadius: THEME.RADIUS.md,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, textTransform: 'uppercase', letterSpacing: 0.5 }}>Cancel</Text>
            </ScalePressable>
          </Animated.View>
        </Animated.View>
      )}

      {/* Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={88} />
    </SafeAreaView>
  );
}
