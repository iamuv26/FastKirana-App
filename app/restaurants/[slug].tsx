import React, { useState, useMemo, useRef, useCallback, useEffect, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Image,
  TextInput,
  Dimensions,
  LayoutChangeEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Search,
  X,
  Heart,
  Plus,
  Minus,
} from 'lucide-react-native';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeOut,
  FadeInDown,
} from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-keys';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { ScalePressable } from '../../components/shared/ScalePressable';
import { triggerHaptic } from '../../lib/haptic';
import {
  API_BASE_URL,
  DEFAULT_CAFE_MENU_SECTIONS,
  DEFAULT_RESTAURANT_MENU_SECTIONS,
  CafeMenuSection,
} from '../../lib/constants';
import { useCartStore } from '../../stores/cart-store';
import { useCart } from '../../hooks/use-cart';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import { THEME } from '../../lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SIDEBAR_WIDTH = 72;

export interface RestaurantDetail {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  address?: string | null;
  city?: string | null;
  cuisineTags: string[];
  rating: number;
  reviewCount: number;
  deliveryTime?: string;
  distance?: string | null;
  isVeg?: boolean;
  isPureVeg?: boolean;
  isOpen?: boolean;
  openTime?: string | null;
  closeTime?: string | null;
  discountOffer?: string | null;
  discountBadge?: string | null;
  menuSections?: any;
  _count?: { products: number };
}

/* ── Fallback Category Images ── */
const CATEGORY_IMAGES: Record<string, string> = {
  'hot-beverage': 'https://www.fastkirana.in/cafe_brews_category.png',
  'hot-bite': 'https://www.fastkirana.in/cafe_snacks_category.png',
  'sandwiches': 'https://www.fastkirana.in/cafe_sandwiches_category.png',
  'frankie-rolls': 'https://www.fastkirana.in/cafe_rolls_category.png',
  'chinese': 'https://www.fastkirana.in/cafe_chinese_category.png',
  'italian-pasta': 'https://www.fastkirana.in/cafe_pasta_category.png',
  'bombay-bites': 'https://www.fastkirana.in/cafe_bombay_bites_category.png',
  'rice-dishes': 'https://www.fastkirana.in/cafe_rice_category.png',
  'shakes': 'https://www.fastkirana.in/cafe_shakes_category.png',
  'mocktails': 'https://www.fastkirana.in/cafe_mocktails_category.png',
  'cold-coffee': 'https://www.fastkirana.in/cafe_coffee_category.png',
  'south-indian': 'https://www.fastkirana.in/cafe_south_indian_category.png',
  'chilled': 'https://www.fastkirana.in/cafe_cold_drinks_category.png',
  'beverages': 'https://www.fastkirana.in/cafe_cold_drinks_category.png',
  'pizza': 'https://www.fastkirana.in/cafe_pizza_category.png',
  'burgers': 'https://www.fastkirana.in/cafe_burgers_category.png',
  'garlic-bread': 'https://www.fastkirana.in/cafe_garlic_bread_category.png',
  'desserts': 'https://www.fastkirana.in/ice_cream_category.png',
  'pav-bhaji': 'https://www.fastkirana.in/cafe_bombay_bites_category.png',
  'starter': 'https://www.fastkirana.in/cafe_snacks_category.png',
  'main-course': 'https://www.fastkirana.in/cafe_south_indian_category.png',
  'roti-naan-kulcha': 'https://www.fastkirana.in/cafe_rolls_category.png',
  'rice,-biryani': 'https://www.fastkirana.in/cafe_rice_category.png',
  'dal': 'https://www.fastkirana.in/cafe_south_indian_category.png',
  'tandoori-nawab-nawab': 'https://www.fastkirana.in/cafe_snacks_category.png',
  'shake': 'https://www.fastkirana.in/cafe_shakes_category.png',
  'soup': 'https://www.fastkirana.in/cafe_south_indian_category.png',
  'burger': 'https://www.fastkirana.in/cafe_burgers_category.png',
  'special-starters': 'https://www.fastkirana.in/cafe_snacks_category.png',
  'noodles,rice': 'https://www.fastkirana.in/cafe_chinese_category.png',
  'breakfast': 'https://www.fastkirana.in/cafe_sandwiches_category.png',
};

const imageUrl = (img?: string | null) => {
  if (!img) return null;
  if (img.startsWith('http')) return img;
  if (img.startsWith('/')) return `https://www.fastkirana.in${img}`;
  return img;
};

const normalizeTag = (str: string) => str.toLowerCase().trim().replace(/s$/, '');

/* ═══════════════════════════════════════════════════════════════════ */
/* Restaurant Detail Screen Component                                  */
/* ═══════════════════════════════════════════════════════════════════ */

export default function RestaurantDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const insets = useSafeAreaInsets();

  const [vegOnly, setVegOnly] = useState(false);
  const [searchLocal, setSearchLocal] = useState('');
  const [activeCat, setActiveCat] = useState<string>('');
  const [isFav, setIsFav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const contentScrollRef = useRef<ScrollView>(null);
  const sidebarScrollRef = useRef<ScrollView>(null);
  const sectionOffsets = useRef<Record<string, number>>({});
  const sidebarItemOffsets = useRef<Record<string, number>>({});

  // ── Fetch restaurant details ──
  const { data: restaurant, isLoading: restaurantLoading } = useQuery<RestaurantDetail>({
    queryKey: queryKeys.restaurants.detail(slug!),
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/restaurants/${encodeURIComponent(slug!)}`);
      if (!res.ok) throw new Error('not found');
      return res.json();
    },
    enabled: !!slug,
    staleTime: 60_000,
  });

  // ── Fetch settings for menu sections ──
  const { data: settingsMap = {} } = useQuery<Record<string, string>>({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/settings`);
      if (!response.ok) throw new Error('Failed to fetch settings');
      return await response.json();
    },
    staleTime: 60000,
  });

  // ── Determine if this spot is a Cafe vs Traditional Restaurant ──
  const isCafeSpot = useMemo(() => {
    if (!slug) return false;
    const s = slug.toLowerCase();
    const name = (restaurant?.name || '').toLowerCase();
    return (
      s.includes('cafe') ||
      s.includes('as-') ||
      name.includes('cafe') ||
      name.includes('a.s.') ||
      (restaurant?.cuisineTags || []).some((t: string) =>
        t.toLowerCase().includes('cafe') || t.toLowerCase().includes('fast food') || t.toLowerCase().includes('snacks')
      )
    );
  }, [slug, restaurant]);

  // ── Fetch Products ──
  const { data: products = [], isLoading: productsLoading, isFetching: productsFetching } = useQuery<any[]>({
    queryKey: queryKeys.menu.byRestaurant(slug!),
    queryFn: async () => {
      let list: any[] = [];

      // Strategy 1: Fetch by restaurantSlug
      try {
        const res = await fetch(`${API_BASE_URL}/products?restaurantSlug=${encodeURIComponent(slug!)}&limit=500`);
        if (res.ok) {
          const data = await res.json();
          list = Array.isArray(data) ? data : data.products || [];
        }
      } catch (e) {
        console.warn('Fetch by restaurantSlug failed:', e);
      }

      // Strategy 2: Fetch by category (fastkirana-cafe or restaurant)
      if (!list.length) {
        try {
          const cat = isCafeSpot ? 'fastkirana-cafe' : 'restaurant';
          const res = await fetch(`${API_BASE_URL}/products?category=${cat}&limit=500`);
          if (res.ok) {
            const data = await res.json();
            list = Array.isArray(data) ? data : data.products || [];
          }
        } catch (e) {
          console.warn('Fetch by category failed:', e);
        }
      }

      // Strategy 3: Fallback fetch all food products
      if (!list.length) {
        try {
          const res = await fetch(`${API_BASE_URL}/products?limit=500`);
          if (res.ok) {
            const data = await res.json();
            const all = Array.isArray(data) ? data : data.products || [];
            list = all.filter((p: any) => {
              const catSlug = (p.category?.slug || p.categorySlug || '').toLowerCase();
              const tags = (p.tags || []).map((t: string) => String(t).toLowerCase());
              return (
                catSlug.includes('restaurant') ||
                catSlug.includes('cafe') ||
                tags.includes('restaurant') ||
                tags.includes('cafe') ||
                tags.includes('wedson') ||
                tags.includes('food')
              );
            });
            if (!list.length) list = all;
          }
        } catch (e) {
          console.warn('Fallback fetch failed:', e);
        }
      }

      return list.filter((p: any) => p.isAvailable !== false);
    },
    enabled: !!slug,
    staleTime: 30_000,
  });

  const isClosed = restaurant?.isOpen === false;
  const cuisineDisplay = (restaurant?.cuisineTags || []).slice(0, 3).join(', ');

  // ── Filter products (veg + search) ──
  const filteredProducts = useMemo(() => {
    const vegFiltered = vegOnly
      ? products.filter((p: any) => {
          const catSlug = (p.category?.slug || p.categorySlug || '').toLowerCase();
          const tags = (p.tags || []).map((t: string) => String(t).toLowerCase());
          const name = (p.name || '').toLowerCase();
          const isNonVeg =
            catSlug.includes('non-veg') || catSlug.includes('nonveg') ||
            tags.includes('nonveg') || tags.includes('chicken') || tags.includes('egg') ||
            name.includes('chicken') || name.includes('egg');
          return !isNonVeg;
        })
      : products;

    if (!searchLocal.trim()) return vegFiltered;
    const q = searchLocal.toLowerCase();
    return vegFiltered.filter((p: any) =>
      p.name?.toLowerCase().includes(q) ||
      (p.category?.name || '').toLowerCase().includes(q) ||
      (p.tags || []).some((t: string) => String(t).toLowerCase().includes(q))
    );
  }, [products, vegOnly, searchLocal]);

  // ── Select Cafe vs Restaurant Menu Sections ──
  const menuCategories = useMemo((): CafeMenuSection[] => {
    const customSectionsStr = isCafeSpot
      ? (settingsMap.cafe_menu_sections || settingsMap.CAFE_MENU_SECTIONS)
      : (settingsMap.restaurant_menu_sections || settingsMap.RESTAURANT_MENU_SECTIONS);

    let parsedSections: CafeMenuSection[] | null = null;
    if (customSectionsStr) {
      try {
        const parsed = JSON.parse(customSectionsStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsedSections = parsed;
        }
      } catch (e) {
        console.warn('Failed to parse menu_sections:', e);
      }
    }

    const raw = parsedSections || (isCafeSpot ? DEFAULT_CAFE_MENU_SECTIONS : DEFAULT_RESTAURANT_MENU_SECTIONS);
    return raw.filter((cat: any) => !cat.disabled);
  }, [settingsMap, isCafeSpot]);

  // ── Group products into Menu Sections with priority matching ──
  const categorySections = useMemo(() => {
    if (!filteredProducts.length || !menuCategories.length) return { sections: [], moreItems: [] };

    const sectionsMap = new Map<string, any>();
    menuCategories.forEach((cat) => {
      sectionsMap.set(cat.tag, {
        tag: cat.tag,
        title: cat.title,
        emoji: cat.emoji || '🍽️',
        description: cat.description || '',
        imageUrl: cat.imageUrl || (cat as any).image || CATEGORY_IMAGES[cat.tag],
        products: [] as any[],
        matchedIds: new Set<string>(),
      });
    });

    const assignedIds = new Set<string>();

    // Step 1: Match products to predefined categories
    filteredProducts.forEach((product: any) => {
      const nameLower = (product.name || product.slug || '').toLowerCase();
      const catSlugLower = (product.category?.slug || product.categorySlug || '').toLowerCase();

      for (const cat of menuCategories) {
        const catTagNorm = normalizeTag(cat.tag || '');
        const catTitleLower = (cat.title || '').toLowerCase();

        // Check tags match
        const hasTagMatch = product.tags?.some((t: string) => {
          const normT = normalizeTag(t);
          return cat.matchTags?.some((mt: string) => {
            const normMT = normalizeTag(mt);
            return normT === normMT || t.toLowerCase() === mt.toLowerCase();
          }) || normT === catTagNorm;
        });

        // Keyword matches with PRIORITY (specific items first, generic main-course last)
        let hasKeywordMatch = false;

        if (cat.tag === 'burgers' || cat.tag.includes('burger')) {
          hasKeywordMatch = nameLower.includes('burger');
        } else if (cat.tag === 'pizza' || cat.tag.includes('pizza')) {
          hasKeywordMatch = nameLower.includes('pizza');
        } else if (cat.tag === 'sandwiches' || cat.tag.includes('sandwich')) {
          hasKeywordMatch = nameLower.includes('sandwich') || nameLower.includes('toast');
        } else if (cat.tag === 'frankie-rolls' || cat.tag.includes('roll') || cat.tag.includes('frankie')) {
          hasKeywordMatch = nameLower.includes('roll') || nameLower.includes('frankie') || nameLower.includes('wrap');
        } else if (cat.tag === 'pav-bhaji' || cat.tag.includes('pavbhaji') || cat.tag.includes('pav')) {
          hasKeywordMatch = nameLower.includes('pav bhaji') || nameLower.includes('pavbhaji') || nameLower.includes('pav');
        } else if (cat.tag === 'chinese' || cat.tag.includes('chinese') || cat.tag.includes('noodle')) {
          hasKeywordMatch = nameLower.includes('momo') || nameLower.includes('noodle') || nameLower.includes('chowmein') || nameLower.includes('manchurian') || nameLower.includes('spring roll') || nameLower.includes('fried rice');
        } else if (cat.tag.includes('pasta')) {
          hasKeywordMatch = nameLower.includes('pasta') || nameLower.includes('macaroni') || nameLower.includes('spaghetti');
        } else if (cat.tag.includes('shake')) {
          hasKeywordMatch = nameLower.includes('shake') || nameLower.includes('smoothie');
        } else if (cat.tag.includes('cold-coffee')) {
          hasKeywordMatch = nameLower.includes('cold coffee') || nameLower.includes('iced coffee') || nameLower.includes('frappe');
        } else if (cat.tag === 'hot-beverage') {
          hasKeywordMatch = (nameLower.includes('tea') || nameLower.includes('chai') || nameLower.includes('coffee')) && !nameLower.includes('cold') && !nameLower.includes('iced');
        } else if (cat.tag === 'hot-bite' || cat.tag === 'starter') {
          hasKeywordMatch = nameLower.includes('samosa') || nameLower.includes('patty') || nameLower.includes('kachori') || nameLower.includes('nugget') || nameLower.includes('french fries') || nameLower.includes('fries');
        } else if (cat.tag.includes('dessert') || cat.tag.includes('ice-cream')) {
          hasKeywordMatch = nameLower.includes('ice cream') || nameLower.includes('kulfi') || nameLower.includes('gulab jamun') || catSlugLower === 'ice-cream';
        } else if (cat.tag.includes('south-indian')) {
          hasKeywordMatch = nameLower.includes('dosa') || nameLower.includes('idli') || nameLower.includes('vada') || nameLower.includes('uttapam');
        } else if (cat.tag.includes('roti') || cat.tag.includes('naan') || cat.tag.includes('kulcha')) {
          hasKeywordMatch = nameLower.includes('roti') || nameLower.includes('naan') || nameLower.includes('kulcha') || nameLower.includes('paratha');
        } else if (cat.tag.includes('biryani') || cat.tag.includes('rice')) {
          hasKeywordMatch = nameLower.includes('biryani') || nameLower.includes('pulav') || nameLower.includes('pulao') || (nameLower.includes('rice') && !nameLower.includes('noodle') && !nameLower.includes('fried'));
        } else if (cat.tag.includes('dal')) {
          hasKeywordMatch = nameLower.includes('dal');
        } else if (cat.tag.includes('main-course')) {
          const isFastFood = nameLower.includes('burger') || nameLower.includes('pizza') || nameLower.includes('roll') || nameLower.includes('sandwich') || nameLower.includes('pav') || nameLower.includes('momo') || nameLower.includes('noodle');
          if (!isFastFood) {
            hasKeywordMatch = nameLower.includes('curry') || nameLower.includes('sabzi') || nameLower.includes('gravy') || nameLower.includes('paneer butter') || nameLower.includes('kadhai paneer') || nameLower.includes('shahi paneer') || nameLower.includes('dal makhani') || nameLower.includes('kofta') || nameLower.includes('thali');
          }
        }

        if (!assignedIds.has(product.id) && (hasTagMatch || hasKeywordMatch)) {
          const sec = sectionsMap.get(cat.tag);
          if (sec && !sec.matchedIds.has(product.id)) {
            sec.products.push(product);
            sec.matchedIds.add(product.id);
            assignedIds.add(product.id);
          }
        }
      }
    });

    // Step 2: Compile sections with products
    const finalSections: any[] = [];
    menuCategories.forEach((cat) => {
      const sec = sectionsMap.get(cat.tag);
      if (sec && sec.products.length > 0) {
        finalSections.push({
          tag: sec.tag,
          title: sec.title,
          emoji: sec.emoji,
          description: sec.description,
          imageUrl: sec.imageUrl,
          products: sec.products,
        });
      }
    });

    // Step 3: Leftovers → "More Items"
    const allGroupedIds = new Set<string>();
    finalSections.forEach((sec) => sec.products.forEach((p: any) => allGroupedIds.add(p.id)));
    const moreItems = filteredProducts.filter((p: any) => !allGroupedIds.has(p.id));

    if (moreItems.length > 0) {
      finalSections.push({
        tag: 'more-items',
        title: 'More Specials',
        emoji: '🍽️',
        description: '',
        imageUrl: null,
        products: moreItems,
      });
    }

    return { sections: finalSections, moreItems: [] };
  }, [filteredProducts, menuCategories]);

  const { sections } = categorySections;

  // Set default active category
  useEffect(() => {
    if (sections.length > 0 && !activeCat) {
      setActiveCat(sections[0].tag);
    }
  }, [sections, activeCat]);

  // Scroll to category in content panel
  const scrollToCategory = useCallback((catTag: string) => {
    triggerHaptic('light');
    setActiveCat(catTag);

    const yOffset = sectionOffsets.current[catTag];
    if (yOffset !== undefined && contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ y: yOffset - 4, animated: true });
    }
  }, []);

  // Track scroll position to highlight sidebar category
  const handleContentScroll = useCallback((y: number) => {
    let currentSection = sections[0]?.tag || '';
    for (const sec of sections) {
      const offset = sectionOffsets.current[sec.tag];
      if (offset !== undefined && y >= offset - 60) {
        currentSection = sec.tag;
      }
    }
    if (currentSection && currentSection !== activeCat) {
      setActiveCat(currentSection);
      const sidebarOffset = sidebarItemOffsets.current[currentSection];
      if (sidebarOffset !== undefined && sidebarScrollRef.current) {
        sidebarScrollRef.current.scrollTo({ y: Math.max(0, sidebarOffset - 80), animated: true });
      }
    }
  }, [sections, activeCat]);

  const toggleSectionCollapse = useCallback((secId: string) => {
    triggerHaptic('light');
    setCollapsedSections((prev) => ({ ...prev, [secId]: !prev[secId] }));
  }, []);

  if (!slug) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Invalid restaurant</Text>
      </View>
    );
  }

  const isLoading = restaurantLoading || productsLoading || (products.length === 0 && productsFetching);
  const banner = imageUrl(restaurant?.bannerUrl);
  const logo = imageUrl(restaurant?.logoUrl);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? THEME.COLORS.dark.background : '#f8fafc' }]}>
      {/* ═══ STICKY TOP BAR ═══ */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top + 6,
            backgroundColor: scrollY > 120
              ? (isDarkMode ? 'rgba(9,9,11,0.96)' : 'rgba(255,255,255,0.96)')
              : 'transparent',
          },
        ]}
      >
        <ScalePressable
          onPress={() => { triggerHaptic('light'); router.back(); }}
          style={[styles.topIconBtn, {
            backgroundColor: scrollY > 120
              ? (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
              : 'rgba(255,255,255,0.22)',
          }]}
        >
          <ArrowLeft size={20} color={scrollY > 120 ? (isDarkMode ? '#fafafa' : '#0f172a') : '#ffffff'} strokeWidth={2.5} />
        </ScalePressable>

        {scrollY > 120 && (
          <Text
            numberOfLines={1}
            style={[styles.topBarTitle, { color: isDarkMode ? '#fafafa' : '#0f172a' }]}
          >
            {restaurant?.name || 'Restaurant'}
          </Text>
        )}

        <View style={styles.topBarRight}>
          <ScalePressable
            onPress={() => { triggerHaptic('light'); setSearchOpen((v) => !v); }}
            style={[styles.topIconBtn, {
              backgroundColor: scrollY > 120
                ? (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
                : 'rgba(255,255,255,0.22)',
            }]}
          >
            <Search size={18} color={scrollY > 120 ? (isDarkMode ? '#fafafa' : '#0f172a') : '#ffffff'} strokeWidth={2.3} />
          </ScalePressable>
          <ScalePressable
            onPress={() => { triggerHaptic('light'); setIsFav((v) => !v); }}
            style={[styles.topIconBtn, {
              backgroundColor: scrollY > 120
                ? (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')
                : 'rgba(255,255,255,0.22)',
            }]}
          >
            <Heart
              size={18}
              color={scrollY > 120 ? (isDarkMode ? '#fafafa' : '#0f172a') : '#ffffff'}
              strokeWidth={2.3}
              fill={isFav ? (isDarkMode ? '#fafafa' : '#0f172a') : 'transparent'}
            />
          </ScalePressable>
        </View>
      </View>

      {/* ═══ MAIN LAYOUT ═══ */}
      <View style={{ flex: 1 }}>
        {/* Hero Banner */}
        <View style={styles.heroWrap}>
          {banner ? (
            <ExpoImage source={{ uri: banner }} style={styles.heroImage} contentFit="cover" transition={250} />
          ) : (
            <LinearGradient
              colors={isDarkMode ? ['#27272a', '#18181b'] : ['#fde68a', '#fca5a5']}
              style={styles.heroImage}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.72)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Identity Card */}
          <View style={styles.heroIdentity}>
            <View style={styles.heroTitleRow}>
              {logo ? (
                <Image source={{ uri: logo }} style={styles.heroLogo} resizeMode="cover" />
              ) : (
                <View style={[styles.heroLogo, { backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 18 }}>🍽️</Text>
                </View>
              )}
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.heroName} numberOfLines={1}>
                  {restaurant?.name || 'Restaurant'}
                </Text>
                <Text style={styles.heroCuisine} numberOfLines={1}>
                  {cuisineDisplay || restaurant?.description || 'Delicious food, delivered fast'}
                </Text>
              </View>
              {isClosed && (
                <View style={styles.closedPillTop}>
                  <View style={styles.closedDot} />
                  <Text style={styles.closedPillText}>CLOSED</Text>
                </View>
              )}
            </View>

            {/* Stats Row */}
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <View style={styles.heroStatIcon}>
                  <Star size={11} color="#fff" strokeWidth={2.5} fill="#fff" />
                </View>
                <Text style={styles.heroStatValue}>
                  {restaurant?.rating ? restaurant.rating.toFixed(1) : '4.8'}
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <View style={styles.heroStatIcon}>
                  <Clock size={11} color="#fff" strokeWidth={2.5} />
                </View>
                <Text style={styles.heroStatValue}>
                  {restaurant?.deliveryTime || '15-25 min'}
                </Text>
              </View>
              <View style={styles.heroDivider} />
              <View style={styles.heroStat}>
                <View style={styles.heroStatIcon}>
                  <MapPin size={11} color="#fff" strokeWidth={2.5} />
                </View>
                <Text style={styles.heroStatValue} numberOfLines={1}>
                  {restaurant?.distance || '0.5 km'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Search Field */}
        {searchOpen && (
          <Animated.View
            entering={FadeIn.duration(150)}
            exiting={FadeOut.duration(120)}
            style={[styles.searchWrap, {
              backgroundColor: isDarkMode ? THEME.COLORS.dark.background : '#fff',
            }]}
          >
            <View
              style={[
                styles.searchInput,
                {
                  backgroundColor: isDarkMode ? THEME.COLORS.dark.surface : '#f1f5f9',
                  borderColor: isDarkMode ? THEME.COLORS.dark.border : '#e2e8f0',
                },
              ]}
            >
              <Search size={16} color={isDarkMode ? '#a1a1aa' : '#64748b'} strokeWidth={2.3} />
              <TextInput
                placeholder={`Search in ${restaurant?.name || 'menu'}…`}
                placeholderTextColor={isDarkMode ? '#71717a' : '#94a3b8'}
                value={searchLocal}
                onChangeText={setSearchLocal}
                style={[styles.searchField, { color: isDarkMode ? '#fafafa' : '#0f172a' }]}
                autoFocus
              />
              {searchLocal.length > 0 && (
                <Pressable hitSlop={10} onPress={() => setSearchLocal('')}>
                  <X size={16} color={isDarkMode ? '#a1a1aa' : '#64748b'} strokeWidth={2.3} />
                </Pressable>
              )}
            </View>
          </Animated.View>
        )}

        {/* Veg Filter Bar */}
        <View style={[styles.filterBar, {
          backgroundColor: isDarkMode ? THEME.COLORS.dark.background : '#ffffff',
          borderBottomColor: isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9',
        }]}>
          <Text style={[styles.itemsCount, { color: isDarkMode ? '#fafafa' : '#0f172a' }]}>
            {filteredProducts.length}{' '}
            <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontWeight: '600' }}>
              {filteredProducts.length === 1 ? 'item' : 'items'}
            </Text>
          </Text>
          <ScalePressable
            scaleValue={0.96}
            onPress={() => { triggerHaptic('light'); setVegOnly((v) => !v); }}
            style={[
              styles.vegToggle,
              {
                borderColor: vegOnly ? '#10b981' : (isDarkMode ? THEME.COLORS.dark.border : '#cbd5e1'),
                backgroundColor: vegOnly
                  ? (isDarkMode ? 'rgba(16,185,129,0.15)' : '#ecfdf5')
                  : (isDarkMode ? THEME.COLORS.dark.surface : '#ffffff'),
              },
            ]}
          >
            <View style={[styles.vegSquare, { borderColor: vegOnly ? '#10b981' : (isDarkMode ? '#a1a1aa' : '#94a3b8') }]}>
              <View style={[styles.vegSquareDot, { backgroundColor: vegOnly ? '#10b981' : (isDarkMode ? '#a1a1aa' : '#94a3b8') }]} />
            </View>
            <Text
              style={[
                styles.vegToggleLabel,
                { color: vegOnly ? '#10b981' : (isDarkMode ? THEME.COLORS.dark.textPrimary : '#0f172a') },
              ]}
            >
              Veg Only
            </Text>
          </ScalePressable>
        </View>

        {/* ═══ SIDEBAR + 2-COLUMN PRODUCT GRID ═══ */}
        {isLoading ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.skeletonLayout}>
            {/* Sidebar Skeleton */}
            <View style={[styles.sidebar, { backgroundColor: isDarkMode ? THEME.COLORS.dark.surface : '#ffffff' }]}>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <View key={i} style={styles.skeletonSidebarItem}>
                  <View style={[styles.skeletonCircle, { backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0' }]} />
                  <View style={[styles.skeletonLine, { backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', width: 36, marginTop: 4 }]} />
                </View>
              ))}
            </View>
            {/* Grid Skeleton */}
            <View style={[styles.contentArea, { padding: 8 }]}>
              <View style={[styles.skeletonLine, { backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', width: 140, height: 28, borderRadius: 8, marginBottom: 12 }]} />
              <View style={styles.productListGrid}>
                {[1, 2, 3, 4].map((i) => (
                  <View key={i} style={[styles.skeletonCard, { backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff', borderColor: isDarkMode ? '#27272a' : '#f1f5f9' }]}>
                    <View style={[styles.skeletonCardImg, { backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9' }]} />
                    <View style={{ padding: 6, gap: 4 }}>
                      <View style={[styles.skeletonLine, { backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', width: '85%', height: 12 }]} />
                      <View style={[styles.skeletonLine, { backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', width: '50%', height: 10 }]} />
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>
        ) : !restaurant ? (
          <View style={styles.centerWrap}>
            <Text style={{ fontSize: 40 }}>🍽️</Text>
            <Text style={[styles.statusTitle, { color: isDarkMode ? '#fafafa' : '#0f172a' }]}>
              Restaurant details unavailable
            </Text>
            <Pressable onPress={() => router.back()} style={styles.actionBtn}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Go back</Text>
            </Pressable>
          </View>
        ) : sections.length === 0 ? (
          <View style={styles.emptyMenu}>
            <Text style={{ fontSize: 48 }}>🔍</Text>
            <Text style={[styles.emptyMenuTitle, { color: isDarkMode ? '#fafafa' : '#0f172a' }]}>
              No menu items match
            </Text>
            <Text style={[styles.emptyMenuSub, { color: isDarkMode ? '#71717a' : '#94a3b8' }]}>
              Try disabling Veg Only or clearing your search.
            </Text>
          </View>
        ) : (
          <View style={styles.splitLayout}>
            {/* ── SLEEK COMPACT LEFT SIDEBAR (72px) ── */}
            <ScrollView
              ref={sidebarScrollRef}
              style={[styles.sidebar, {
                backgroundColor: isDarkMode ? THEME.COLORS.dark.surface : '#ffffff',
                borderRightColor: isDarkMode ? THEME.COLORS.dark.border : '#e2e8f0',
              }]}
              contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingTop: 4 }}
              showsVerticalScrollIndicator={false}
            >
              {sections.map((sec: any, idx: number) => {
                const isActive = activeCat === sec.tag;
                const catImage = sec.imageUrl || CATEGORY_IMAGES[sec.tag];
                return (
                  <Animated.View
                    key={sec.tag}
                    entering={FadeInDown.delay(Math.min(idx, 10) * 35).duration(300)}
                    onLayout={(e: LayoutChangeEvent) => {
                      sidebarItemOffsets.current[sec.tag] = e.nativeEvent.layout.y;
                    }}
                  >
                    <Pressable
                      onPress={() => scrollToCategory(sec.tag)}
                      style={[
                        styles.sidebarItem,
                        isActive && {
                          backgroundColor: isDarkMode ? 'rgba(234,88,12,0.12)' : '#fff7ed',
                          borderLeftColor: THEME.COLORS.brand.primary,
                          borderLeftWidth: 3,
                        },
                      ]}
                    >
                      <View style={[
                        styles.sidebarImageWrap,
                        isActive && { borderColor: THEME.COLORS.brand.primary, borderWidth: 2 },
                      ]}>
                        {catImage ? (
                          <ExpoImage
                            source={{ uri: catImage }}
                            style={styles.sidebarImage}
                            contentFit="cover"
                            transition={200}
                          />
                        ) : (
                          <Text style={{ fontSize: 18 }}>{sec.emoji}</Text>
                        )}
                      </View>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.sidebarLabel,
                          {
                            color: isActive
                              ? THEME.COLORS.brand.primary
                              : (isDarkMode ? THEME.COLORS.dark.textSecondary : '#334155'),
                            fontWeight: isActive ? '800' : '600',
                          },
                        ]}
                      >
                        {sec.title}
                      </Text>
                      <Text style={[styles.sidebarCount, {
                        color: isActive ? THEME.COLORS.brand.primary : (isDarkMode ? '#52525b' : '#94a3b8'),
                      }]}>
                        {sec.products.length}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>

            {/* ── RIGHT 2-COLUMN PRODUCT GRID ── */}
            <ScrollView
              ref={contentScrollRef}
              style={styles.contentArea}
              contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingTop: 6, paddingHorizontal: 6 }}
              showsVerticalScrollIndicator={false}
              onScroll={(e) => {
                const y = e.nativeEvent.contentOffset.y;
                setScrollY(y + 200);
                handleContentScroll(y);
              }}
              scrollEventThrottle={16}
            >
              {sections.map((section: any) => {
                const isCollapsed = !!collapsedSections[section.tag];
                return (
                  <View
                    key={section.tag}
                    onLayout={(e: LayoutChangeEvent) => {
                      sectionOffsets.current[section.tag] = e.nativeEvent.layout.y;
                    }}
                    style={styles.sectionBlock}
                  >
                    {/* Section Header */}
                    <Pressable
                      onPress={() => toggleSectionCollapse(section.tag)}
                      style={[
                        styles.sectionHeader,
                        {
                          backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                          borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                        },
                      ]}
                    >
                      <View style={styles.sectionHeaderLeft}>
                        <Text style={{ fontSize: 15 }}>{section.emoji}</Text>
                        <Text
                          style={[styles.sectionTitle, { color: isDarkMode ? '#fafafa' : '#0f172a' }]}
                        >
                          {section.title}
                        </Text>
                        <View style={[styles.sectionCountBadge, { backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9' }]}>
                          <Text style={[styles.sectionCountText, { color: isDarkMode ? '#a1a1aa' : '#64748b' }]}>
                            {section.products.length}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.collapseText, { color: THEME.COLORS.brand.primary }]}>
                        {isCollapsed ? 'Expand' : 'Collapse'}
                      </Text>
                    </Pressable>

                    {/* 2-Column Product Grid */}
                    {!isCollapsed && (
                      <View style={styles.productListGrid}>
                        {section.products.map((prod: any) => (
                          <View
                            key={prod.id}
                            style={{ width: '48.5%' }}
                          >
                            <Grid2ColCard
                              product={prod}
                              isClosed={isClosed}
                              isDarkMode={isDarkMode}
                            />
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}
      </View>

      {/* ═══ FLOATING CART BAR ═══ */}
      <FloatingCartBar bottomOffset={insets.bottom > 0 ? 12 : 14} />
    </View>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* 2-Column Grid Product Card (Side-by-Side)                          */
/* ═══════════════════════════════════════════════════════════════════ */

const Grid2ColCard = memo(function Grid2ColCard({
  product,
  isClosed,
  isDarkMode,
}: {
  product: any;
  isClosed: boolean;
  isDarkMode: boolean;
}) {
  const router = useRouter();
  const cartItems = useCartStore((s) => s.items);
  const { addItem, updateQuantity } = useCart();

  const cartItem = cartItems.find((i) => i.product.id === product.id);
  const quantity = cartItem?.quantity || 0;

  const img = imageUrl(product.images?.[0] || product.imageUrl || product.image);
  const discount = product.discountPercent || product.discount;
  const price = product.price || product.sellingPrice || 0;
  const originalPrice = product.originalPrice || product.mrp;

  const tags = (product.tags || []).map((t: string) => String(t).toLowerCase());
  const nameLower = (product.name || '').toLowerCase();
  const isNonVeg =
    tags.includes('nonveg') || tags.includes('chicken') || tags.includes('egg') ||
    nameLower.includes('chicken') || nameLower.includes('egg');
  const isVeg = !isNonVeg;

  const name = product.name || product.title || 'Item';
  const servingInfo = product.servingInfo || product.variant || product.unit || '';

  const handleAdd = () => {
    if (isClosed) return;
    triggerHaptic('success');
    addItem({
      id: product.id,
      name,
      slug: product.slug || product.id,
      imageUrl: img,
      mrp: originalPrice || price,
      price,
      discount: discount || 0,
      unit: servingInfo || '1 Portion',
      stock: product.stock ?? 99,
      category: product.category || { id: 'restaurant', name: 'Restaurant', slug: 'restaurant', imageUrl: null, parentId: null, sortOrder: 0 },
      tags: product.tags || [],
    });
  };

  const handleIncrement = () => {
    if (isClosed) return;
    triggerHaptic('light');
    updateQuantity(product.id, name, quantity + 1);
  };

  const handleDecrement = () => {
    if (isClosed) return;
    triggerHaptic('light');
    updateQuantity(product.id, name, quantity - 1);
  };

  return (
    <View
      style={[
        styles.gridCard2Col,
        {
          backgroundColor: isDarkMode ? THEME.COLORS.dark.surface : '#ffffff',
          borderColor: isDarkMode ? THEME.COLORS.dark.borderLight : '#f1f5f9',
        },
      ]}
    >
      {/* Clickable Image + Title Section */}
      <Pressable
        onPress={() => {
          triggerHaptic('light');
          router.push(`/product/${product.slug || product.id}`);
        }}
        style={{ flex: 1 }}
      >
        {/* Photo Section */}
        <View style={styles.gridImageWrap}>
          {img ? (
            <ExpoImage
              source={{ uri: img }}
              style={styles.gridImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.gridImage, {
              backgroundColor: isDarkMode ? '#27272a' : '#fff7ed',
              alignItems: 'center',
              justifyContent: 'center',
            }]}>
              <Text style={{ fontSize: 26 }}>🍽️</Text>
            </View>
          )}

          {/* Discount Ribbon */}
          {discount ? (
            <View style={styles.gridDiscountBadge}>
              <Text style={styles.gridDiscountText}>{discount}% OFF</Text>
            </View>
          ) : null}

          {/* Veg/Non-Veg Mark */}
          <View style={[styles.gridVegMark, { borderColor: isVeg ? '#10b981' : '#ef4444' }]}>
            <View style={[styles.gridVegDot, { backgroundColor: isVeg ? '#10b981' : '#ef4444' }]} />
          </View>

          {isClosed && (
            <View style={styles.closedOverlay}>
              <Text style={styles.closedOverlayText}>Closed</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.gridCardInfo}>
          <Text
            numberOfLines={2}
            style={[styles.gridCardTitle, { color: isDarkMode ? '#fafafa' : '#0f172a' }]}
          >
            {name}
          </Text>

          {servingInfo ? (
            <Text
              numberOfLines={1}
              style={[styles.gridCardServing, { color: isDarkMode ? '#a1a1aa' : '#64748b' }]}
            >
              {servingInfo}
            </Text>
          ) : null}
        </View>
      </Pressable>

      {/* Price & ADD Action Row (Standalone Sibling) */}
      <View style={[styles.gridCardFooter, { paddingHorizontal: 6, paddingBottom: 6 }]}>
        <View style={{ flex: 1, minWidth: 0, paddingRight: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, flexWrap: 'nowrap' }}>
            <Text style={[styles.gridCardPrice, { color: isDarkMode ? '#fafafa' : '#0f172a' }]}>
              ₹{price}
            </Text>
            {originalPrice && originalPrice > price ? (
              <Text numberOfLines={1} style={styles.gridCardMrp}>₹{originalPrice}</Text>
            ) : null}
          </View>
        </View>

        {/* Cart Action */}
        {!isClosed && (
          <View>
            {quantity > 0 ? (
              <View 
                style={[
                  styles.gridStepper,
                  {
                    backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
                    borderColor: THEME.COLORS.brand.primary,
                  }
                ]}
              >
                <Pressable
                  onPress={handleDecrement}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={({ pressed }) => [styles.gridStepperBtn, pressed && { opacity: 0.4 }]}
                >
                  <Minus size={11} color={THEME.COLORS.brand.primary} strokeWidth={3} />
                </Pressable>
                
                <View style={styles.gridStepperCount}>
                  <Text style={[styles.gridStepperCountText, { color: THEME.COLORS.brand.primary }]}>
                    {quantity}
                  </Text>
                </View>

                <Pressable
                  onPress={handleIncrement}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  style={({ pressed }) => [styles.gridStepperBtn, pressed && { opacity: 0.4 }]}
                >
                  <Plus size={11} color={THEME.COLORS.brand.primary} strokeWidth={3} />
                </Pressable>
              </View>
            ) : (
              <ScalePressable
                scaleValue={0.92}
                onPress={handleAdd}
                haptic="success"
                style={[
                  styles.gridAddBtn,
                  {
                    backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
                    borderColor: THEME.COLORS.brand.primary,
                  }
                ]}
              >
                <Text style={styles.gridAddText}>ADD</Text>
                <Plus size={10} color={THEME.COLORS.brand.primary} strokeWidth={3} />
              </ScalePressable>
            )}
          </View>
        )}
      </View>
    </View>
  );
});

/* ═══════════════════════════════════════════════════════════════════ */
/* Styles                                                              */
/* ═══════════════════════════════════════════════════════════════════ */

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* ── Top Bar ── */
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  topIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    marginHorizontal: 10,
    letterSpacing: -0.3,
  },
  topBarRight: {
    flexDirection: 'row',
    gap: 8,
  },

  /* ── Hero ── */
  heroWrap: {
    height: 175,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroIdentity: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  heroTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroLogo: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  heroName: {
    color: '#fff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  heroCuisine: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  closedPillTop: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  closedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  closedPillText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },

  /* ── Hero Stats ── */
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  heroStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  heroStatIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatValue: {
    color: '#fff',
    fontSize: 11.5,
    fontWeight: '800',
  },
  heroDivider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    marginHorizontal: 4,
  },

  /* ── Search ── */
  searchWrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  searchField: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },

  /* ── Veg Filter Bar ── */
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderBottomWidth: 1,
  },
  itemsCount: {
    fontSize: 13,
    fontWeight: '800',
  },
  vegToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 999,
    borderWidth: 1.5,
    gap: 5,
  },
  vegSquare: {
    width: 11,
    height: 11,
    borderRadius: 2,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegSquareDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  vegToggleLabel: {
    fontSize: 10.5,
    fontWeight: '800',
  },

  /* ── Split Layout ── */
  splitLayout: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },

  /* ── Sleek Compact Sidebar (72px) ── */
  sidebar: {
    width: 72,
    flexGrow: 0,
    flexShrink: 0,
    borderRightWidth: 1,
  },
  sidebarItem: {
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  sidebarImageWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  sidebarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  sidebarLabel: {
    fontSize: 9.5,
    textAlign: 'center',
    marginTop: 3,
    lineHeight: 12,
    letterSpacing: -0.1,
  },
  sidebarCount: {
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 1,
  },

  /* ── Content Area ── */
  contentArea: {
    flex: 1,
    flexGrow: 1,
    minWidth: 0,
  },

  /* ── Section Header ── */
  sectionBlock: {
    marginBottom: 14,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  sectionHeaderLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  sectionCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 999,
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: '800',
  },
  collapseText: {
    fontSize: 10.5,
    fontWeight: '800',
    marginLeft: 6,
  },

  /* ── 2-Column Product Grid ── */
  productListGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  /* ── 2-Column Card Styles ── */
  gridCard2Col: {
    width: '100%',
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  gridImageWrap: {
    width: '100%',
    aspectRatio: 1.1,
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridDiscountBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    backgroundColor: '#ea580c',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 3,
    zIndex: 5,
  },
  gridDiscountText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  gridVegMark: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1.5,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  gridVegDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  closedOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255,255,255,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closedOverlayText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
  },

  /* ── Card Info ── */
  gridCardInfo: {
    padding: 7,
    justifyContent: 'space-between',
    flex: 1,
  },
  gridCardTitle: {
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 15,
    letterSpacing: -0.1,
    minHeight: 30,
  },
  gridCardServing: {
    fontSize: 9.5,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: 4,
  },
  gridCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  gridCardPrice: {
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  gridCardMrp: {
    fontSize: 9,
    fontWeight: '500',
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  gridAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 62,
    height: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    gap: 2,
    shadowColor: THEME.COLORS.brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  gridAddText: {
    color: THEME.COLORS.brand.primary,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  gridStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: 66,
    height: 28,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.brand.primary,
    borderRadius: 6,
    paddingHorizontal: 3,
    overflow: 'hidden',
    shadowColor: THEME.COLORS.brand.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  gridStepperBtn: {
    width: 18,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridStepperCount: {
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridStepperCountText: {
    fontSize: 12,
    fontWeight: '900',
  },

  /* ── States ── */
  centerWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 80,
  },
  statusText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '700',
  },
  statusTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '900',
  },
  actionBtn: {
    marginTop: 18,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: THEME.COLORS.brand.primary,
  },
  emptyMenu: {
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyMenuTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyMenuSub: {
    marginTop: 4,
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },

  /* ── Skeleton Loading Styles ── */
  skeletonLayout: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  skeletonSidebarItem: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
  },
  skeletonCard: {
    width: '48.5%',
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  skeletonCardImg: {
    width: '100%',
    height: 100,
  },
});