import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import Svg, { Rect, Circle, Path, Defs, LinearGradient, Stop, G, Ellipse, ClipPath } from 'react-native-svg';
import { router } from 'expo-router';
import { ChevronRight, Clock } from 'lucide-react-native';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import ProductCard, { Product } from '../product/ProductCard';
import { useTheme } from '../../app/context/ThemeContext';
import { triggerHaptic } from '../../lib/haptic';

// ==========================================
// --- PREMIUM INLINE VECTOR SVG COMPONENT DESIGN ---
// ==========================================

function PremiumEssentialsIcon({ width = 50, height = 50 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
      <Circle cx="50" cy="50" r="46" fill="#F0FDF4" />
      {/* Basket Woven Base */}
      <Path d="M22 45H78L70 78H30L22 45Z" fill="#A76632" />
      <Path d="M30 45V78M38 45V78M46 45V78M54 45V78M62 45V78M70 45V78" stroke="#78350F" strokeWidth="1" opacity="0.3" />
      {/* Basket Rim */}
      <Rect x="20" y="42" width="60" height="6.5" rx="3.25" fill="#E29A5B" />
      <Path d="M30 42C30 30 70 30 70 42" stroke="#E29A5B" strokeWidth="3" fill="none" />
      {/* Apple */}
      <Circle cx="34" cy="48" r="8" fill="#FF5D5D" />
      {/* Lettuce Leaves */}
      <Path d="M42 35C45 28 55 28 58 35" stroke="#15803D" strokeWidth="3" fill="none" />
    </Svg>
  );
}

function PremiumLightningDealsIcon({ width = 50, height = 50 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
      <Circle cx="50" cy="50" r="46" fill="#FEF2F2" />
      {/* Red Tag Body */}
      <Path d="M32 32C30 30 26 31 24 33L21 38C20 40 21 43 23 45L45 78C47 81 51 81 54 79L73 66C76 64 76 60 74 58L40 25C38 23 34 24 32 26Z" fill="#FF4B4B" />
      <Circle cx="34" cy="36" r="3" fill="#FEF2F2" />
      {/* Lightning Bolt */}
      <Path d="M46 38L32 54H42L38 72L56 50H46L49 38Z" fill="#FFE600" stroke="#FFFFFF" strokeWidth="1.2" />
    </Svg>
  );
}

function PremiumTrendingIcon({ width = 50, height = 50 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
      <Circle cx="50" cy="50" r="46" fill="#FFFDF2" />
      {/* Marble Pedestal Base */}
      <Path d="M26 76C26 73 34 71 50 71C66 71 74 73 74 76C74 79 66 81 50 81C34 81 26 79 26 76Z" fill="#D1D5DB" />
      {/* Stem of Trophy */}
      <Rect x="46" y="54" width="8" height="14" fill="#F1C40F" />
      {/* Trophy Handles */}
      <Path d="M34 32C28 32 26 42 34 46C38 48 38 42 38 42" stroke="#F1C40F" strokeWidth="3" fill="none" />
      <Path d="M66 32C72 32 74 42 66 46C62 48 62 42 62 42" stroke="#F1C40F" strokeWidth="3" fill="none" />
      {/* Trophy Cup Body */}
      <Path d="M34 26H66V40C66 48 58 54 50 54C42 54 34 48 34 40V26Z" fill="#F1C40F" />
      <Path d="M50 28L53 34.5L60 35L55 40L57 47L50 43.5L43 47L45 40L40 35L47 34.5L50 28Z" fill="#FFFFFF" />
    </Svg>
  );
}

function PremiumTrendingFlameIcon({ width = 50, height = 50 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
      <Circle cx="50" cy="50" r="46" fill="#FFF7ED" />
      {/* Outer flame */}
      <Path d="M50 16C50 16 34 32 34 52C34 64 42 72 50 72C58 72 66 64 66 52C66 32 50 16 50 16Z" fill="#EA580C" />
      {/* Inner glowing flame */}
      <Path d="M50 30C50 30 40 42 40 56C40 64 44 68 50 68C56 68 60 64 60 56C60 42 50 30 50 30Z" fill="#FDE047" />
    </Svg>
  );
}

function PremiumBreakfastIcon({ width = 50, height = 50 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
      <Circle cx="50" cy="50" r="46" fill="#FFFBEB" />
      {/* Coffee Cup */}
      <Rect x="46" y="36" width="22" height="20" rx="3" fill="#FF8A00" />
      <Path d="M68 40C72 40 75 42 75 45C75 48 72 50 68 50" stroke="#FF8A00" strokeWidth="3" fill="none" />
      {/* Frying Pan & Egg */}
      <Circle cx="32" cy="54" r="14" fill="#374151" />
      <Path d="M22 64L12 74" stroke="#111827" strokeWidth="4" />
      <Circle cx="32" cy="54" r="5" fill="#FBBF24" />
    </Svg>
  );
}

// Custom simple fallback lunch icon
function PremiumLunchIcon({ width = 50, height = 50 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
      <Circle cx="50" cy="50" r="46" fill="#ECFDF5" />
      {/* Steel Plate */}
      <Circle cx="50" cy="50" r="28" fill="#F3F4F6" stroke="#9CA3AF" strokeWidth="1.5" />
      <Circle cx="50" cy="50" r="24" fill="#E5E7EB" />
      {/* Bowls */}
      <Circle cx="40" cy="38" r="6" fill="#F59E0B" />
      <Circle cx="56" cy="36" r="6" fill="#EF4444" />
      {/* Rotis */}
      <Circle cx="42" cy="56" r="8" fill="#FDE047" opacity="0.9" />
      <Circle cx="52" cy="54" r="8" fill="#FDE047" opacity="0.9" />
    </Svg>
  );
}

function PremiumSnacksIcon({ width = 50, height = 50 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
      <Circle cx="50" cy="50" r="46" fill="#FFF1F2" />
      {/* Indian Samosa */}
      <Path d="M24 60L42 28L60 60Z" fill="#FBBF24" stroke="#D97706" strokeWidth="1.5" />
      {/* Cutting Chai */}
      <Path d="M58 35H72L68 62H62L58 35Z" fill="#EA580C" stroke="#C2410C" strokeWidth="1" />
    </Svg>
  );
}

function PremiumLateNightIcon({ width = 50, height = 50 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 100 100" fill="none">
      <Circle cx="50" cy="50" r="46" fill="#F5F3FF" />
      {/* Night Sky Dome */}
      <Path d="M50 8C26.8 8 8 26.8 8 50C8 73.2 26.8 92 50 92C73.2 92 92 73.2 92 50C92 26.8 73.2 8 50 8Z" fill="#0F172A" />
      {/* Crescent Moon */}
      <Path d="M50 24C41 24 34 31 34 40C34 49 41 56 50 56C53 56 55.8 55 58 53.5C52.4 57.5 44 56.5 39.5 51.5C35 46.5 34.5 39 38 34" fill="#FCD34D" />
      {/* Stars */}
      <Circle cx="30" cy="25" r="1" fill="#FFFFFF" />
      <Circle cx="68" cy="22" r="0.8" fill="#FFFFFF" />
      <Circle cx="72" cy="38" r="1.1" fill="#FFFFFF" />
    </Svg>
  );
}

// ==========================================

interface DealsCurationHubProps {
  products: Product[];
}

export default function DealsCurationHub({ products }: DealsCurationHubProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [activeCuration, setActiveCuration] = useState<'all' | 'flash-deals' | 'best-sellers' | 'trending' | 'dynamic-craving'>('all');
  
  // Live Countdown Timer for Flash Deals (starts at 2h 14m 45s and ticks down)
  const [timeLeft, setTimeLeft] = useState({ hours: 2, minutes: 14, seconds: 45 });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 2, minutes: 59, seconds: 59 }; // reset
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const currentHour = new Date().getHours();

  // Helper to identify if a product is a Cafe product
  const isCafeProduct = (product: Product) => {
    return (
      product.category?.slug === 'cafe' || 
      product.tags?.includes('cafe') || 
      /^c\d+$/.test(product.id)
    );
  };

  // Filter Sub-lists
  const flashDeals = useMemo(() => {
    return products.filter((p) => p.isAvailable !== false && (p.isFlashDeal || p.discount > 0) && !isCafeProduct(p));
  }, [products]);

  const bestSellers = useMemo(() => {
    const dbBestsellers = products.filter(p => p.isAvailable && !isCafeProduct(p) && (p.isBestSeller || p.tags?.includes('popular') || p.tags?.includes('essential')));
    if (dbBestsellers.length > 0) return dbBestsellers;
    // Fallback to static selection
    return products.filter(p => p.id === 'db1' || p.id === 'sm2' || p.id === 'fv1' || p.id === 'def2' || p.id === 'db3' || p.id === 'bv2');
  }, [products]);

  const topPicks = useMemo(() => {
    const dbTopPicks = products.filter(p => p.isAvailable && !isCafeProduct(p) && (p.isTopPick || p.tags?.includes('trending')));
    if (dbTopPicks.length > 0) return dbTopPicks;
    return products.filter(p => p.isAvailable && !isCafeProduct(p) && (p.category?.slug === 'fruits-vegetables' || p.category?.slug === 'dairy-breakfast' || p.id === 'fv3' || p.id === 'db4' || p.id === 'db3'));
  }, [products]);

  // Dynamic Suggestion lists based on hour
  const dynamicCravingConfig = useMemo(() => {
    // 6 AM - 11 AM: Breakfast
    if (currentHour >= 6 && currentHour < 11) {
      const filtered = products.filter(p => !isCafeProduct(p) && (p.category?.slug === 'dairy-breakfast' || p.category?.slug === 'bakery' || p.id.startsWith('db') || p.id.startsWith('bb') || p.tags?.includes('breakfast')));
      return {
        id: 'dynamic-craving' as const,
        title: 'Breakfast',
        icon: PremiumBreakfastIcon,
        activeBorderColor: '#F59E0B',
        products: filtered,
      };
    }
    // 11 AM - 4 PM: Lunch
    else if (currentHour >= 11 && currentHour < 16) {
      const filtered = products.filter(p => !isCafeProduct(p) && (p.category?.slug === 'atta-rice-dal' || p.category?.slug === 'fruits-vegetables' || p.id.startsWith('de') || p.id.startsWith('fv') || p.tags?.includes('lunch') || p.tags?.includes('staples')));
      return {
        id: 'dynamic-craving' as const,
        title: 'Lunch',
        icon: PremiumLunchIcon,
        activeBorderColor: '#10B981',
        products: filtered,
      };
    }
    // 4 PM - 8 PM: Snacks
    else if (currentHour >= 16 && currentHour < 20) {
      const filtered = products.filter(p => !isCafeProduct(p) && (p.category?.slug === 'snacks-munchies' || p.id.startsWith('sm') || p.tags?.includes('snacks')));
      return {
        id: 'dynamic-craving' as const,
        title: 'Snacks',
        icon: PremiumSnacksIcon,
        activeBorderColor: '#F43F5E',
        products: filtered,
      };
    }
    // 8 PM - 5 AM: Late Night
    else {
      const filtered = products.filter(p => !isCafeProduct(p) && (p.category?.slug === 'beverages' || p.category?.slug === 'snacks-munchies' || p.category?.slug === 'ice-cream' || p.id.startsWith('bv') || p.id.startsWith('sm') || p.tags?.includes('late-night') || p.tags?.includes('midnight')));
      return {
        id: 'dynamic-craving' as const,
        title: 'Late Night',
        icon: PremiumLateNightIcon,
        activeBorderColor: '#8B5CF6',
        products: filtered,
      };
    }
  }, [currentHour, products]);

  // Combine products for "All" curation dynamically (load all grocery products)
  const allProducts = useMemo(() => {
    return products.filter((p) => !isCafeProduct(p) && p.isAvailable !== false);
  }, [products]);

  const curations = useMemo(() => [
    {
      id: 'all' as const,
      title: 'All',
      icon: PremiumEssentialsIcon,
      activeBorderColor: '#6366F1',
      products: allProducts,
    },
    {
      id: 'flash-deals' as const,
      title: 'Flash Deals',
      icon: PremiumLightningDealsIcon,
      activeBorderColor: '#EF4444',
      products: flashDeals,
    },
    {
      id: 'best-sellers' as const,
      title: 'Best Sellers',
      icon: PremiumTrendingIcon,
      activeBorderColor: '#3B82F6',
      products: bestSellers,
    },
    {
      id: 'trending' as const,
      title: 'Trending',
      icon: PremiumTrendingFlameIcon,
      activeBorderColor: '#F97316',
      products: topPicks,
    },
    {
      ...dynamicCravingConfig
    }
  ], [allProducts, flashDeals, bestSellers, topPicks, dynamicCravingConfig]);

  const currentCuration = useMemo(() => {
    return curations.find((c) => c.id === activeCuration) || curations[0];
  }, [activeCuration, curations]);

  // Group products of active curation by category and sort them by category sortOrder
  const groupedProducts = useMemo(() => {
    const groups: Record<string, { categoryName: string; categorySlug: string; sortOrder: number; products: Product[] }> = {};
    currentCuration.products.forEach((product) => {
      const categoryName = product.category?.name || 'Other Essentials';
      const categorySlug = product.category?.slug || '';
      const sortOrder = product.category?.sortOrder ?? 999;
      if (!groups[categoryName]) {
        groups[categoryName] = {
          categoryName,
          categorySlug,
          sortOrder,
          products: [],
        };
      }
      groups[categoryName].products.push(product);
    });
    return Object.values(groups).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [currentCuration]);

  if (products.length === 0) return null;

  return (
    <View className="my-5 mx-4">
      {/* Title & Subtitle */}
      <View className="mb-4">
        <Text className="text-slate-800 dark:text-zinc-100 text-lg font-black tracking-tight">
          Curated For You
        </Text>
        <Text className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold mt-0.5">
          Handpicked collections for every mood
        </Text>
      </View>

      {/* Tabs list scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 20, paddingBottom: 12, paddingTop: 4 }}
        decelerationRate="fast"
      >
        {curations.map((c) => {
          const isActive = activeCuration === c.id;
          const IconComponent = c.icon;
          return (
            <Pressable
              key={c.id}
              onPress={() => {
                triggerHaptic('light');
                setActiveCuration(c.id);
              }}
              className="items-center"
              style={({ pressed }) => [{
                transform: [{ scale: pressed ? 0.95 : 1 }]
              }]}
            >
              {/* Circular Icon container */}
              <View
                className="w-14 h-14 rounded-full bg-white dark:bg-zinc-900 border flex items-center justify-center shadow-xs"
                style={{
                  borderColor: isActive ? c.activeBorderColor : (isDarkMode ? '#27272a' : '#e2e8f0'),
                  borderWidth: isActive ? 2 : 1,
                }}
              >
                <IconComponent width={44} height={44} />
              </View>

              {/* Title Text */}
              <Text
                className="text-[10px] font-black mt-2 text-center"
                style={{
                  color: isActive ? (isDarkMode ? '#fff' : '#0f172a') : (isDarkMode ? '#a1a1aa' : '#64748b'),
                }}
              >
                {c.title}
              </Text>

              {/* Bottom active underline indicator */}
              <View
                className="h-[3px] w-6 rounded-full mt-1.5"
                style={{
                  backgroundColor: isActive ? c.activeBorderColor : 'transparent',
                }}
              />
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Flash Deals Live Timer Banner */}
      {activeCuration === 'flash-deals' && (
        <ExpoLinearGradient
          colors={isDarkMode ? ['#311016', '#1a0508'] : ['#fee2e2', '#fef2f2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderRadius: 16,
            marginTop: 4,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: isDarkMode ? '#881337' : '#fca5a5',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 16 }}>⚡</Text>
            <View>
              <Text style={{ fontSize: 11, fontWeight: '900', color: isDarkMode ? '#fda4af' : '#e11d48', letterSpacing: 0.5 }}>
                FLASH SALE ACTIVE
              </Text>
              <Text style={{ fontSize: 9.5, fontWeight: '600', color: isDarkMode ? '#cbd5e1' : '#475569', marginTop: 1 }}>
                Grab top deals before they run out!
              </Text>
            </View>
          </View>
          
          {/* Timer capsule */}
          <View 
            style={{
              backgroundColor: '#e11d48',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 5,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 3.5,
            }}
          >
            <Clock size={10} color="#fff" />
            <Text style={{ fontSize: 10.5, fontWeight: '900', color: '#fff', fontVariant: ['tabular-nums'] }}>
              {String(timeLeft.hours).padStart(2, '0')}h : {String(timeLeft.minutes).padStart(2, '0')}m : {String(timeLeft.seconds).padStart(2, '0')}s
            </Text>
          </View>
        </ExpoLinearGradient>
      )}

      {/* Grouped Product List */}
      <View className="mt-4">
        {groupedProducts.length === 0 ? (
          <View className="py-12 items-center justify-center border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
            <Text className="text-slate-400 dark:text-zinc-500 text-xs font-bold">No deals available</Text>
          </View>
        ) : (
          groupedProducts.map((group) => (
            <View key={group.categoryName} className="mb-6">
              {/* Category subheader row */}
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-slate-800 dark:text-zinc-100 text-base font-black">
                    {group.categoryName}
                  </Text>
                  <View className="bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full">
                    <Text className="text-rose-600 dark:text-rose-400 text-[10px] font-bold">
                      {group.products.length} {group.products.length === 1 ? 'item' : 'items'}
                    </Text>
                  </View>
                </View>

                {/* See All link */}
                <Pressable
                  onPress={() => {
                    triggerHaptic('light');
                    if (group.categorySlug === 'cafe') {
                      router.push('/cafe');
                    } else if (group.categorySlug) {
                      router.push(`/category/${group.categorySlug}`);
                    } else {
                      router.push('/(tabs)/categories');
                    }
                  }}
                  className="flex-row items-center"
                >
                  <Text className="text-rose-600 dark:text-rose-400 text-xs font-bold">See All</Text>
                  <ChevronRight size={14} color="#e11d48" />
                </Pressable>
              </View>

              {/* Horizontal scroll track of products in category */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
                decelerationRate="fast"
              >
                {group.products.slice(0, 10).map((product, idx) => (
                  <View key={product.id} className="w-[155px]" style={{ height: 290 }}>
                    <ProductCard product={product} index={idx} className="w-full" />
                  </View>
                ))}
              </ScrollView>
            </View>
          ))
        )}
      </View>
    </View>
  );
}
