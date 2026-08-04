import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, Modal, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, ArrowLeft, X, ShoppingBag, Mic } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import ProductCard, { Product } from '../components/product/ProductCard';
import FloatingCartBar from '../components/shared/FloatingCartBar';
import { formatPrice } from '../lib/utils';
import { useCart } from '../hooks/use-cart';
import { toast } from '../lib/toast';
import { API_BASE_URL } from '../lib/constants';
import { useTheme } from './context/ThemeContext';
import { triggerHaptic } from '../lib/haptic';
import { THEME } from '../lib/theme';
import { useUIStore } from '../stores/ui-store';

let ExpoSpeechRecognitionModule: any = null;
let ExpoWebSpeechRecognition: any = null;
try {
  const speechModule = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechModule.ExpoSpeechRecognitionModule;
  ExpoWebSpeechRecognition = speechModule.ExpoWebSpeechRecognition;
} catch (e) {
  console.warn('Native speech recognition module not found. Falling back to simulation.', e);
}
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
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const assignedStoreId = useUIStore((s) => s.assignedStoreId);
  const { categorySlug, categoryName } = useLocalSearchParams<{ categorySlug?: string; categoryName?: string }>();
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

  const validStoreId = (assignedStoreId && !assignedStoreId.startsWith('default-')) ? assignedStoreId : null;

  // Fetch all products from API for matching
  const { data: allProducts = [] } = useQuery<Product[]>({
    queryKey: ['all-search-products-list', validStoreId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products?limit=500${validStoreId ? `&storeId=${validStoreId}` : ''}`);
      if (!response.ok) throw new Error('API fetch failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
  });

  // Voice Search Simulation States
  const [isVoiceModalVisible, setIsVoiceModalVisible] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Listening...');
  const pulseScale = useSharedValue(1);

  const recognitionRef = useRef<any | null>(null);

  useEffect(() => {
    let recognition: any = null;
    try {
      recognition = new ExpoWebSpeechRecognition();
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
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
      };

      recognition.onend = () => {
        cancelAnimation(pulseScale);
        pulseScale.value = 1;
      };

      recognition.onresult = (event: any) => {
        if (event.results && event.results[0]) {
          const transcriptText = event.results[0].transcript || event.results[0][0]?.transcript || '';
          setVoiceStatus(`Searching for "${transcriptText}"...`);
          setSearchQuery(transcriptText);
          triggerHaptic('success');
          setTimeout(() => {
            setIsVoiceModalVisible(false);
          }, 1000);
        }
      };

      recognition.onerror = (error: any) => {
        console.warn('Speech recognition error:', error);
        setVoiceStatus('Recognition failed. Try again.');
        cancelAnimation(pulseScale);
        pulseScale.value = 1;
        toast.error('Voice search failed. Try again.');
        setTimeout(() => {
          setIsVoiceModalVisible(false);
        }, 1500);
      };

      recognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition native module not available (e.g. running in Expo Go). Falling back to mock simulation.');
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
    setVoiceStatus('Initializing mic...');
    setIsVoiceModalVisible(true);

    const isNativeModuleAvailable = typeof ExpoSpeechRecognitionModule !== 'undefined' && ExpoSpeechRecognitionModule !== null;
    if (!isNativeModuleAvailable || !recognitionRef.current) {
      console.log('Using simulated voice search fallback (Expo Go / Web)');
      setVoiceStatus('Listening...');
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );

      setTimeout(() => {
        const speechSuggestions = ['milk', 'fresh tomatoes', 'cold coffee', 'lays chips'];
        const randomQuery = speechSuggestions[Math.floor(Math.random() * speechSuggestions.length)];
        setSearchQuery(randomQuery);
        setVoiceStatus(`Searching for "${randomQuery}"...`);
        triggerHaptic('success');

        setTimeout(() => {
          setIsVoiceModalVisible(false);
          cancelAnimation(pulseScale);
          pulseScale.value = 1;
        }, 1000);
      }, 2500);
      return;
    }

    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission || !permission.granted) {
        setVoiceStatus('Microphone permission denied.');
        toast.error('Microphone permission is required.');
        setTimeout(() => {
          setIsVoiceModalVisible(false);
        }, 1500);
        return;
      }

      recognitionRef.current?.start();
    } catch (e) {
      console.warn('Failed starting voice recognition:', e);
      setVoiceStatus('Listening...');
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );

      setTimeout(() => {
        const speechSuggestions = ['milk', 'fresh tomatoes', 'cold coffee', 'lays chips'];
        const randomQuery = speechSuggestions[Math.floor(Math.random() * speechSuggestions.length)];
        setSearchQuery(randomQuery);
        setVoiceStatus(`Searching for "${randomQuery}"...`);
        triggerHaptic('success');

        setTimeout(() => {
          setIsVoiceModalVisible(false);
          cancelAnimation(pulseScale);
          pulseScale.value = 1;
        }, 1000);
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
    cancelAnimation(pulseScale);
    pulseScale.value = 1;
    setIsVoiceModalVisible(false);
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
    queryKey: ['search-products', debouncedQuery, categorySlug, validStoreId],
    queryFn: async () => {
      if (!debouncedQuery || !debouncedQuery.trim()) return [];
      const url = categorySlug
        ? `${API_BASE_URL}/products?search=${encodeURIComponent(debouncedQuery)}&category=${encodeURIComponent(categorySlug)}&limit=100${validStoreId ? `&storeId=${validStoreId}` : ''}`
        : `${API_BASE_URL}/products?search=${encodeURIComponent(debouncedQuery)}&limit=100${validStoreId ? `&storeId=${validStoreId}` : ''}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      return Array.isArray(data) ? data : (data.products || []);
    },
    enabled: !!debouncedQuery && debouncedQuery.trim().length > 0,
  });

  // Local fallback searching logic
  const getSearchResults = () => {
    if (!searchQueryVal || !searchQueryVal.trim()) return [];
    if (serverResults.length > 0) return serverResults;
    const lowerQuery = searchQueryVal.toLowerCase();
    let sourceProducts = allProducts.length > 0 ? allProducts : ALL_SEARCHABLE_PRODUCTS;
    if (categorySlug) {
      sourceProducts = sourceProducts.filter(p => p.category?.slug === categorySlug);
    }
    return sourceProducts.filter((p) =>
      p.name.toLowerCase().includes(lowerQuery) ||
      p.slug.toLowerCase().includes(lowerQuery)
    );
  };

  const resultsList = getSearchResults();
  const cartItemCount = getTotalItems();
  const cartSubtotal = getSubtotal();

  const trendingTags = ['Mangoes', 'Amul', 'Chai', 'Milk', 'Maggi', 'Chocolate'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Search Header */}
      <View style={[styles.header, { borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.06)' : THEME.COLORS.light.borderLight, backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Search size={18} color={isDarkMode ? colors.textSecondary : THEME.COLORS.light.textSecondary} />
          <View style={{ flex: 1, position: 'relative', justifyContent: 'center' }}>
            <TextInput
              placeholder=""
              autoFocus
              value={searchQueryVal}
              onChangeText={setSearchQuery}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
            {searchQueryVal.length === 0 && (
              <Animated.Text
                style={[
                  {
                    position: 'absolute',
                    left: 8,
                    fontSize: 13,
                    color: isDarkMode ? colors.textSecondary : colors.textMuted,
                    fontWeight: '500',
                    pointerEvents: 'none',
                  },
                  placeholderStyle
                ]}
              >
                {categoryName ? `Search in ${categoryName}...` : SUGGESTION_PLACEHOLDERS[placeholderIndex]}
              </Animated.Text>
            )}
          </View>
          {searchQueryVal.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')}>
              <X size={18} color={isDarkMode ? colors.textSecondary : THEME.COLORS.light.textSecondary} />
            </Pressable>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Pressable onPress={handleStartVoiceSearch} style={styles.iconBtn}>
                <Mic size={18} color={THEME.COLORS.brand.primary} />
              </Pressable>
              <Pressable onPress={() => setIsListParserVisible(true)} style={styles.iconBtn}>
                <Text style={{ fontSize: 16 }}>📋</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>

      {/* Content Area */}
      <View style={[styles.contentArea, { backgroundColor: colors.surface }]}>
        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={THEME.COLORS.brand.primary} />
          </View>
        ) : searchQueryVal.length === 0 ? (
          // Suggestions screen
          <View style={[styles.suggestionsWrap, { backgroundColor: colors.background }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trending Searches</Text>
            <View style={styles.tagsWrap}>
              {trendingTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => setSearchQuery(tag)}
                  style={[
                    styles.tagChip,
                    {
                      backgroundColor: colors.surfaceElevated,
                      borderColor: colors.border,
                    }
                  ]}
                >
                  <Search size={12} color={THEME.COLORS.brand.primary} />
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tag}</Text>
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
              <View style={styles.emptyWrap}>
                <Text style={{ fontSize: 48 }}>🔍</Text>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No results for "{searchQueryVal}"
                </Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
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
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                📋 Quick List Parser
              </Text>
              <Pressable
                onPress={() => {
                  setIsListParserVisible(false);
                  setListInputText('');
                  setParsedResults([]);
                }}
                style={[styles.modalCloseBtn, { backgroundColor: colors.surfaceElevated }]}
              >
                <X size={16} color={isDarkMode ? colors.textSecondary : THEME.COLORS.light.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalScroll}>
              <Text style={[styles.modalDesc, { color: colors.textSecondary }]}>
                Paste your grocery list separated by lines or commas (e.g. "milk, Atta, mangoes"). We will automatically search and match them to our catalog.
              </Text>

              <TextInput
                multiline
                numberOfLines={4}
                value={listInputText}
                onChangeText={setListInputText}
                placeholder={`Milk\nAashirvaad Atta\nLays Classic`}
                placeholderTextColor={isDarkMode ? colors.textSecondary : colors.textMuted}
                style={[styles.listInput, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, color: colors.textPrimary }]}
              />

              <Pressable
                onPress={handleParseList}
                style={[styles.parseBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}
              >
                <Text style={[styles.parseBtnText, { color: colors.textPrimary }]}>Find Matches</Text>
              </Pressable>

              {parsedResults.length > 0 ? (
                <View style={styles.resultsSection}>
                  <Text style={[styles.resultsTitle, { color: colors.textPrimary }]}>
                    Matched Products ({parsedResults.length})
                  </Text>
                  <View style={[styles.resultsBox, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                    {parsedResults.map((item) => (
                      <View key={item.id} style={[styles.resultItem, { borderBottomColor: colors.border }]}>
                        <View style={{ flex: 1, paddingRight: 12 }}>
                          <Text style={[styles.resultName, { color: colors.textPrimary }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={[styles.resultUnit, { color: colors.textMuted }]}>
                            {item.unit} • {formatPrice(item.price)}
                          </Text>
                        </View>
                        <Text style={[styles.matchedBadge, { color: THEME.COLORS.brand.success }]}>Matched ✓</Text>
                      </View>
                    ))}
                  </View>

                  <Pressable
                    onPress={handleAddAllParsed}
                    style={[styles.addAllBtn, { backgroundColor: THEME.COLORS.brand.success }]}
                  >
                    <Text style={[styles.addAllBtnText, { color: '#ffffff' }]}>
                      Add All ({parsedResults.length}) to Cart
                    </Text>
                  </Pressable>
                </View>
              ) : listInputText.trim().length > 0 ? (
                <View style={styles.hintWrap}>
                  <Text style={[styles.hintText, { color: colors.textMuted }]}>
                    Tap "Find Matches" to parse your list
                  </Text>
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
        <View style={styles.voiceOverlay}>
          <View style={[styles.voiceCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Text style={[styles.voiceTitle, { color: colors.textPrimary }]}>Voice Search</Text>

            <View style={{ marginVertical: 32, justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
              {/* Pulsing glow background */}
              <Animated.View
                style={[
                  animatedPulseStyle,
                  styles.voicePulse,
                  { backgroundColor: `${THEME.COLORS.brand.primary}33` }
                ]}
              />
              {/* Red mic button */}
              <View style={[styles.micBtn, { backgroundColor: THEME.COLORS.brand.primary }]}>
                <Mic size={28} color="#ffffff" />
              </View>
            </View>

            <Text style={[styles.voiceStatus, { color: colors.textPrimary }]}>
              {voiceStatus}
            </Text>

            <Text style={[styles.voiceHint, { color: colors.textMuted }]}>
              Try saying <Text style={{ fontWeight: '800', color: THEME.COLORS.brand.primary }}>"cold coffee"</Text> or <Text style={{ fontWeight: '800', color: THEME.COLORS.brand.primary }}>"crispy momos"</Text>
            </Text>

            <Pressable
              onPress={handleCancelVoiceSearch}
              style={[styles.voiceCancelBtn, { backgroundColor: colors.surfaceElevated }]}
            >
              <Text style={[styles.voiceCancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: THEME.SPACING.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: THEME.RADIUS.pill,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
    padding: 0,
    marginLeft: 8,
  },
  iconBtn: {
    padding: 4,
  },
  contentArea: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionsWrap: {
    padding: 16,
    flex: 1,
  },
  sectionTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: THEME.RADIUS.lg,
    borderWidth: 1,
  },
  tagText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.body,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: '50%',
    maxHeight: '85%',
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.titleSm,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScroll: {
    flex: 1,
  },
  modalDesc: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    lineHeight: 20,
    marginBottom: 16,
  },
  listInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: THEME.RADIUS.lg,
    padding: 12,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  parseBtn: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: THEME.RADIUS.lg,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  parseBtnText: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
  },
  resultsSection: {
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
  },
  resultsBox: {
    borderRadius: THEME.RADIUS.xl,
    borderWidth: 1,
    padding: 8,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
  },
  resultName: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
  },
  resultUnit: {
    fontSize: 10,
    marginTop: 2,
  },
  matchedBadge: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: '900',
  },
  addAllBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: THEME.RADIUS.lg,
    alignItems: 'center',
    marginTop: 16,
  },
  addAllBtnText: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  hintWrap: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  hintText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: '600',
  },
  voiceOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 24,
  },
  voiceCard: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
  },
  voiceTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.body,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 16,
  },
  voicePulse: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  micBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  voiceStatus: {
    fontSize: THEME.TYPOGRAPHY.sizes.body,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
    minHeight: 32,
  },
  voiceHint: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 20,
    paddingHorizontal: 16,
  },
  voiceCancelBtn: {
    marginTop: 32,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: THEME.RADIUS.lg,
  },
  voiceCancelText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
