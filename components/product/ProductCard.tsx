import { memo, useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert, Dimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { ShoppingBag, Sparkles, AlertTriangle, ChevronDown, Plus, Minus } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useCartStore } from '../../stores/cart-store';
import { useCartActions } from '../../hooks/use-cart';
import { useUIStore } from '../../stores/ui-store';
import { useTheme } from '../../app/context/ThemeContext';
import { API_BASE_URL } from '../../lib/constants';
import { getOptimizedImageUrl, getAppImageSource } from '../../lib/utils';
import { triggerHaptic } from '../../lib/haptic';
import { playCartPop } from '../../lib/audio';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface Product {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  mrp: number;
  price: number;
  discount: number;
  unit: string;
  stock: number;
  isAvailable?: boolean;
  isFlashDeal?: boolean;
  isBestSeller?: boolean;
  isTopPick?: boolean;
  variants?: any[] | null;
  tags?: string[];
  minStock?: number;
  category?: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    parentId: string | null;
    sortOrder: number;
  };
}

interface ProductCardProps {
  product: Product;
  className?: string;
  index?: number;
  isCategoryGrid?: boolean;
  isFlashDeal?: boolean;
  isCafeStyle?: boolean;
}

export function VegIndicator({ isNonVeg, isDark = false }: { isNonVeg: boolean; isDark?: boolean }) {
  return (
    <View 
      style={{
        width: 12,
        height: 12,
        borderWidth: 1.2,
        borderColor: isNonVeg 
          ? (isDark ? '#ea580c' : '#c2410c') 
          : (isDark ? '#10b981' : '#15803d'),
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 2
      }}
    >
      <View 
        style={{
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: isNonVeg ? '#c2410c' : '#15803d'
        }}
      />
    </View>
  );
}

const CATEGORY_IMAGES: Record<string, any> = {
  'fruits-vegetables': require('../../assets/fruits_vegetables_category.png'),
  'dairy-breakfast': require('../../assets/dairy_breakfast_category.png'),
  'snacks-munchies': require('../../assets/snacks_munchies_category.png'),
  'beverages': require('../../assets/beverages_category.png'),
  'personal-care': require('../../assets/personal_care_category.png'),
  'household': require('../../assets/household_category.png'),
  'bakery-biscuits': require('../../assets/bakery_biscuits_category.png'),
  'atta-rice-dal': require('../../assets/atta_rice_dal_category.png'),
  'cafe': require('../../assets/cafe_category.png'),
};

const ProductCard = memo(function ProductCard({ product, className, index = 0, isCategoryGrid = false, isFlashDeal = false, isCafeStyle = false }: ProductCardProps) {
  const { addItem, updateQuantity } = useCartActions();
  const setActiveVariantProduct = useUIStore((s) => s.setActiveVariantProduct);
  const groceryMartOpen = useUIStore((s) => s.groceryMartOpen);
  const cafeOpen = useUIStore((s) => s.cafeOpen);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [cardWidth, setCardWidth] = useState(0);
  const cardScale = useSharedValue(1);
  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
  }));

  const addScale = useSharedValue(1);
  const animatedAddStyle = useAnimatedStyle(() => ({
    transform: [{ scale: addScale.value }],
  }));

  const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;
  const variantsList = hasVariants ? (product.variants as any[]) : [];

  // Calculate starting price for variant display
  const startingPrice = useMemo(() => {
    if (!hasVariants) return product.price;
    return Math.min(...variantsList.map((v) => v.price));
  }, [hasVariants, variantsList, product.price]);

  const startingMrp = useMemo(() => {
    if (!hasVariants) return product.mrp;
    const startVar = variantsList.find((v) => v.price === startingPrice);
    return startVar ? startVar.mrp : product.mrp;
  }, [hasVariants, variantsList, startingPrice, product.mrp]);

  const resolvedPrice = startingPrice;
  const resolvedMrp = startingMrp;

  // Calculate discount dynamically if price/mrp changed
  const resolvedDiscount = useMemo(() => {
    if (resolvedMrp <= resolvedPrice) return 0;
    return Math.max(0, Math.round(((resolvedMrp - resolvedPrice) / resolvedMrp) * 100));
  }, [resolvedMrp, resolvedPrice]);

  const resolvedStock = useMemo(() => {
    if (!hasVariants) return product.stock;
    return variantsList.reduce((sum, v) => sum + (v.stock || 0), 0);
  }, [hasVariants, variantsList, product.stock]);

  const resolvedIsAvailable = product.isAvailable ?? true;
  const isCafe = product.category?.slug === 'cafe' || product.tags?.includes('cafe');
  const isStoreClosed = isCafe ? !cafeOpen : !groceryMartOpen;
  const resolvedIsFlash = isFlashDeal || product.isFlashDeal || product.tags?.includes('flash');

  const resolvedWidth = useMemo(() => {
    if (!className) return '48%';
    if (className.includes('w-full')) return '100%';
    
    // Parse arbitrary width like w-[48%] or w-[50%]
    const match = className.match(/w-\[(\d+)%\]/);
    if (match) {
      return `${match[1]}%`;
    }
    
    // Check standard Tailwind percentage/fraction widths
    if (className.includes('w-1/2')) return '50%';
    if (className.includes('w-1/3')) return '33.333%';
    if (className.includes('w-2/3')) return '66.666%';
    if (className.includes('w-1/4')) return '25%';
    if (className.includes('w-3/4')) return '75%';
    
    return className.includes('w-') ? undefined : '48%';
  }, [className]);

  // Retrieve specific quantity of this product from cart state using a selector
  const quantity = useCartStore((state) => {
    if (!hasVariants) {
      const item = state.items.find((i) => i.product.id === product.id);
      return item?.quantity || 0;
    }
    return state.items
      .filter((item) => item.product.id === product.id || item.product.id.startsWith(`${product.id}_`))
      .reduce((sum, item) => sum + item.quantity, 0);
  });

  const getProductImage = () => {
    if (product.imageUrl) {
      return getAppImageSource(product.imageUrl);
    }
    
    // Fallback to Category slug matching
    const slug = product.category?.slug || '';
    if (slug && CATEGORY_IMAGES[slug]) {
      return CATEGORY_IMAGES[slug];
    }
    
    // Fallback to ID prefixes just in case
    const prefix = product.id.slice(0, 2);
    let categoryKey = '';
    if (prefix === 'fv') categoryKey = 'fruits-vegetables';
    else if (prefix === 'db') categoryKey = 'dairy-breakfast';
    else if (prefix === 'sm') categoryKey = 'snacks-munchies';
    else if (prefix === 'bv') categoryKey = 'beverages';
    else if (prefix === 'pc') categoryKey = 'personal-care';
    else if (prefix === 'hh') categoryKey = 'household';
    else if (prefix === 'bb') categoryKey = 'bakery-biscuits';
    else if (prefix === 'de' || prefix === 'oi') categoryKey = 'atta-rice-dal';
    else if (isCafe) categoryKey = 'cafe';
    
    return CATEGORY_IMAGES[categoryKey] || null;
  };

  const savings = resolvedMrp - resolvedPrice;
  const isBestseller = product.tags?.includes('popular') || product.tags?.includes('essential') || product.id === 'db1' || product.id === 'sm2' || product.id === 'fv1';
  const isLowStock = !isCafe && resolvedStock > 0 && resolvedStock <= (product.minStock ?? 10);
  const isNonVeg = useMemo(() => {
    const tagsLower = product.tags?.map((t: string) => t.toLowerCase()) || [];
    const nameLower = (product.name || product.slug || '').toLowerCase();
    return (
      tagsLower.includes('nonveg') || 
      tagsLower.includes('non-veg') || 
      tagsLower.includes('chicken') || 
      tagsLower.includes('egg') ||
      nameLower.includes('chicken') ||
      nameLower.includes('egg')
    );
  }, [product.tags, product.name, product.slug]);

  const [notified, setNotified] = useState(false);

  const handleNotify = () => {
    triggerHaptic('success');
    setNotified(true);
    Alert.alert("Stock Alert Set 🔔", `We will notify you as soon as ${product.name} is back in stock!`);
  };

  const handleAdd = () => {
    triggerHaptic('success');
    playCartPop();
    if (hasVariants) {
      setActiveVariantProduct(product);
    } else {
      addItem({
        ...product,
        imageUrl: product.imageUrl || null,
        category: product.category || null,
        isAvailable: resolvedIsAvailable
      });
    }
  };

  const handleIncrement = () => {
    triggerHaptic('light');
    playCartPop();
    if (hasVariants) {
      setActiveVariantProduct(product);
    } else {
      updateQuantity(product.id, product.name, quantity + 1);
    }
  };

  const handleDecrement = () => {
    triggerHaptic('light');
    playCartPop();
    if (hasVariants) {
      setActiveVariantProduct(product);
    } else {
      updateQuantity(product.id, product.name, quantity - 1);
    }
  };

  const imageSource = getProductImage();

  if (isCafeStyle) {
    const mockRating = ['4.4', '4.5', '4.6', '4.7'][(product.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 4];
    const isNonVeg = product.tags?.some((t: string) => t.toLowerCase() === 'non-veg') || false;

    return (
      <View 
        className={className}
        style={{ width: '48%', marginBottom: 16 }}
      >
        <Animated.View entering={undefined} style={{ width: '100%' }}>
          <Animated.View 
            style={[
              {
                width: '100%',
                height: 235,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
                backgroundColor: isDark ? '#121214' : '#ffffff',
                padding: 12,
                justifyContent: 'space-between',
                position: 'relative',
                ...Platform.select<any>({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isDark ? 0.2 : 0.02,
                    shadowRadius: 6,
                  },
                  android: {
                    elevation: 1,
                  },
                })
              },
              animatedCardStyle
            ]}
          >
            {/* Top row: Veg Indicator only (deleted rating stars) */}
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', width: '100%', zIndex: 10 }}>
              <VegIndicator isNonVeg={isNonVeg} isDark={isDark} />
            </View>

            {/* Middle: Product Image */}
            <Pressable 
              onPress={() => router.push(`/product/${product.slug}`)}
              style={{ 
                width: '100%', 
                height: 120, 
                borderRadius: 12, 
                overflow: 'hidden', 
                marginVertical: 8,
                backgroundColor: isDark ? '#1c1c1e' : '#f8fafc',
                position: 'relative'
              }}
            >
              {imageSource ? (
                <ExpoImage
                  source={imageSource}
                  contentFit="cover"
                  style={{ width: '100%', height: '100%' }}
                  transition={250}
                  cachePolicy="memory-disk"
                  placeholder={isDark ? "rgba(39,39,42,0.4)" : "rgba(241,245,249,0.6)"}
                />
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ fontSize: 28 }}>🥪</Text>
                </View>
              )}

              {/* Discount / Flash Badge Overlay */}
              {resolvedDiscount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: 6,
                  left: 6,
                  backgroundColor: resolvedIsFlash ? '#ea580c' : '#dc2626',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 1.5,
                  elevation: 2,
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 }}>
                    {resolvedIsFlash ? '⚡ FLASH ' : ''}{resolvedDiscount}% OFF
                  </Text>
                </View>
              )}

              {/* Bestseller Badge Overlay */}
              {isBestseller && (
                <View style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 6,
                  backgroundColor: '#f59e0b',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 4,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 1.5,
                  elevation: 2,
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 7, fontWeight: '900', letterSpacing: 0.5 }}>
                    ⭐ BESTSELLER
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Product Name (Full Width) */}
            <View style={{ width: '100%', paddingHorizontal: 2, marginBottom: 4 }}>
              <Text 
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color: isDark ? '#f4f4f5' : '#1e293b',
                  lineHeight: 14.5,
                  minHeight: 28,
                }}
                numberOfLines={2}
              >
                {product.name}
              </Text>
            </View>

            {/* Bottom Row: Price left, ADD button right */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <View style={{ flex: 1, paddingRight: 6 }}>
                {startingMrp > startingPrice && (
                  <Text style={{ fontSize: 9, textDecorationLine: 'line-through', color: '#94a3b8', fontWeight: '600', marginBottom: 1 }}>
                    ₹{startingMrp}
                  </Text>
                )}
                <Text style={{ fontSize: 13, fontWeight: '900', color: isDark ? '#f4f4f5' : '#1e293b' }}>
                  ₹{startingPrice}
                </Text>
              </View>

              {/* Orange Square ADD Button / Stepper */}
              <View style={{ width: 72, height: 28, justifyContent: 'center', alignItems: 'center' }}>
                {quantity === 0 ? (
                  <AnimatedPressable
                    onPress={handleAdd}
                    onPressIn={() => {
                      addScale.value = withSpring(0.9, { damping: 10, stiffness: 250 });
                    }}
                    onPressOut={() => {
                      addScale.value = withSpring(1, { damping: 10, stiffness: 250 });
                    }}
                    style={[
                      {
                        width: 72,
                        height: 28,
                        borderRadius: 8,
                        backgroundColor: '#ea580c',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 2,
                      },
                      animatedAddStyle
                    ]}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '900' }}>ADD</Text>
                    <Plus size={10} color="#ffffff" strokeWidth={4} />
                  </AnimatedPressable>
                ) : (
                  <Animated.View
                    entering={FadeIn.duration(120)}
                    exiting={FadeOut.duration(120)}
                    style={{
                      position: 'absolute',
                      right: 0,
                      bottom: 0,
                      width: 72,
                      height: 28,
                      borderRadius: 9999,
                      borderWidth: 1,
                      borderColor: '#ea580c',
                      backgroundColor: isDark ? '#27272a' : '#fff7ed',
                      flexDirection: 'row',
                      alignItems: 'center',
                      overflow: 'hidden',
                      zIndex: 20
                    }}
                  >
                    <Pressable 
                      onPress={handleDecrement} 
                      style={({ pressed }) => [{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 }]}
                    >
                      <Minus size={11} color="#ea580c" strokeWidth={3.5} />
                    </Pressable>
                    
                    <View style={{ width: 1, height: 14, backgroundColor: isDark ? '#3f3f46' : '#fed7aa' }} />

                    <View style={{ flex: 1.2, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: isDark ? '#fafafa' : '#1f2937', fontSize: 11, fontWeight: '950' }}>{quantity}</Text>
                    </View>

                    <View style={{ width: 1, height: 14, backgroundColor: isDark ? '#3f3f46' : '#fed7aa' }} />

                    <Pressable 
                      onPress={handleIncrement} 
                      disabled={quantity >= resolvedStock}
                      style={({ pressed }) => [
                        { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
                        quantity >= resolvedStock ? { opacity: 0.4 } : (pressed ? { opacity: 0.6 } : { opacity: 1 })
                      ]}
                    >
                      <Plus size={11} color="#ea580c" strokeWidth={3.5} />
                    </Pressable>
                  </Animated.View>
                )}
              </View>

            </View>
          </Animated.View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View 
      className={className}
      style={{ width: resolvedWidth as any, height: isCategoryGrid ? 250 : 255, marginBottom: 12 }}
    >
      <Animated.View entering={index < 4 ? FadeInDown.duration(180).delay(index * 20) : undefined} style={{ width: '100%', height: '100%' }}>
        <Animated.View 
          style={[
          { 
            width: '100%', 
            height: isCategoryGrid ? 250 : 255,
            borderWidth: 1,
            borderColor: resolvedIsFlash
              ? (isDark ? 'rgba(244,63,94,0.45)' : '#ffe4e6')
              : (isDark ? 'rgba(63,63,70,0.3)' : 'rgba(226,232,240,0.4)'),
            backgroundColor: resolvedIsFlash
              ? (isDark ? '#1c1917' : '#fffbfa')
              : (isDark ? '#18181b' : '#ffffff'),
            ...Platform.select({
              ios: {
                shadowColor: resolvedIsFlash ? '#f43f5e' : '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.2 : (resolvedIsFlash ? 0.08 : 0.03),
                shadowRadius: 10,
              },
              android: {
                elevation: isDark ? 1 : (resolvedIsFlash ? 3 : 2),
              },
            })
          },
          animatedCardStyle
        ]}
        className="flex-col overflow-hidden rounded-2xl relative"
      >
        <Pressable
          onPress={() => router.push(`/product/${product.slug}`)}
          onPressIn={() => {
            cardScale.value = withSpring(0.97, { damping: 15, stiffness: 150 });
          }}
          onPressOut={() => {
            cardScale.value = withSpring(1, { damping: 15, stiffness: 150 });
          }}
          className="w-full h-full flex-col justify-start"
        >
          {/* ── Image Area ── */}
          <View 
            style={{
              width: '100%',
              height: isCategoryGrid ? 110 : 125,
              backgroundColor: 'transparent',
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 10,
              overflow: 'visible',
            }}
          >
            {/* Discount Badge — top-left pill */}
            {resolvedDiscount > 0 && (
              resolvedIsFlash ? (
                <View className="absolute left-2 top-2 z-10 bg-orange-600 rounded-full px-1.5 py-0.5 shadow-sm">
                  <Text className="text-white text-[6.5px] font-black tracking-wider uppercase">⚡ FLASH {resolvedDiscount}% OFF</Text>
                </View>
              ) : resolvedDiscount > 20 ? (
                <View className="absolute left-2 top-2 z-10 bg-amber-500 rounded-full px-1.5 py-0.5 shadow-sm border border-amber-300/40">
                  <Text className="text-white text-[6.5px] font-black tracking-wider uppercase">🔥 SAVE {resolvedDiscount}%</Text>
                </View>
              ) : (
                <View className="absolute left-2 top-2 z-10 bg-rose-600 rounded-full px-1.5 py-0.5 shadow-sm">
                  <Text className="text-white text-[7px] font-black tracking-wider">{resolvedDiscount}% OFF</Text>
                </View>
              )
            )}

            {/* Low Stock Badge — bottom-right pill */}
            {isLowStock && (
              <View className="absolute right-2 bottom-2 z-10 bg-amber-500 rounded-full px-1.5 py-0.5 shadow-sm border border-amber-300/40">
                <Text className="text-white text-[7.5px] font-black">Only {resolvedStock} left</Text>
              </View>
            )}

            {/* Product Image */}
            {imageSource ? (
              <ExpoImage
                source={imageSource}
                contentFit="contain"
                style={styles.productImage as any}
                transition={250}
                cachePolicy="memory-disk"
                placeholder={isDark ? "rgba(39,39,42,0.4)" : "rgba(241,245,249,0.6)"}
              />
            ) : (
              <View className="w-full h-full items-center justify-center gap-1.5">
                <ShoppingBag size={28} color={isDark ? '#71717a' : '#cbd5e1'} strokeWidth={1.5} />
                <Text className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 tracking-wide uppercase">No Image</Text>
              </View>
            )}

            {/* Bestseller Badge — bottom-left overlay */}
            {isBestseller && (
              <View className="absolute bottom-2 left-2 z-10 flex-row items-center bg-amber-400 dark:bg-amber-500 px-2 py-0.5 rounded-md shadow-xs">
                <Text className="text-white text-[8px] font-extrabold tracking-wide uppercase">⭐ Bestseller</Text>
              </View>
            )}


          </View>

          {/* ── Product Info ── */}
          <View className="px-2.5 pt-1.5 flex-1 justify-start">
            {/* Product Name & Veg/Non-Veg Dot */}
            <View className="flex-row items-start gap-1.5">
              {isCafe && (
                <View 
                  style={{
                    width: 10,
                    height: 10,
                    borderWidth: 1,
                    borderColor: isNonVeg ? '#b45309' : '#16a34a',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 2,
                    padding: 1.2,
                  }}
                >
                  <View 
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: 2.5,
                      backgroundColor: isNonVeg ? '#b45309' : '#16a34a',
                    }}
                  />
                </View>
              )}
              <Text 
                className="text-xs font-bold text-slate-800 dark:text-zinc-100 leading-tight flex-1"
                numberOfLines={2}
              >
                {product.name}
              </Text>
            </View>

            {/* Unit or Customisable Badge */}
            {hasVariants ? (
              <View className="flex-row items-center bg-emerald-50/70 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/30 mt-1.5 self-start">
                <Text className="text-emerald-800 dark:text-emerald-400 text-[10px] font-bold">
                  {variantsList.length} Option{variantsList.length > 1 ? 's' : ''}
                </Text>
                <ChevronDown size={10} color={isDark ? '#34d399' : '#15803d'} className="ml-1" />
              </View>
            ) : (
              <Text className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500 mt-0.5">{product.unit}</Text>
            )}
          </View>

          {/* ── Bottom: Price Row + ADD Button ── */}
          <View 
            onLayout={(e) => {
              const { width } = e.nativeEvent.layout;
              setCardWidth(width);
            }}
            style={{
              flexDirection: isCategoryGrid || (cardWidth > 0 && cardWidth < 160) ? 'column' : 'row',
              alignItems: isCategoryGrid || (cardWidth > 0 && cardWidth < 160) ? 'stretch' : 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 10,
              paddingBottom: 8,
              paddingTop: 4,
              marginTop: 'auto',
              gap: isCategoryGrid || (cardWidth > 0 && cardWidth < 160) ? 6 : 4,
            }}
          >
            {/* Pricing Column */}
            <View style={{ flex: isCategoryGrid || (cardWidth > 0 && cardWidth < 160) ? 0 : 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
                <Text style={{ fontSize: 14.5, fontWeight: '900', color: isDark ? '#f8fafc' : '#1e293b', lineHeight: 16 }}>
                  ₹{resolvedPrice}
                </Text>
                {resolvedMrp > resolvedPrice && (
                  <Text style={{ fontSize: 10.5, textDecorationLine: 'line-through', color: '#94a3b8', fontWeight: '600', lineHeight: 12 }}>
                    ₹{resolvedMrp}
                  </Text>
                )}
              </View>
              {savings > 0 && (
                <View style={{
                  alignSelf: 'flex-start',
                  backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5',
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 4,
                  borderWidth: 0.5,
                  borderColor: isDark ? 'rgba(16,185,129,0.25)' : '#a7f3d0',
                  marginTop: 2,
                }}>
                  <Text 
                    numberOfLines={1} 
                    style={{ 
                      fontSize: 8, 
                      fontWeight: '900', 
                      color: isDark ? '#34d399' : '#059669',
                      ...Platform.select({
                        web: { whiteSpace: 'nowrap' as any },
                        default: {},
                      }),
                    }}
                  >
                    {`SAVE\u00A0₹${savings}`}
                  </Text>
                </View>
              )}
            </View>

            {/* Action Button */}
            <Animated.View 
              layout={LinearTransition}
              style={{ width: isCategoryGrid || (cardWidth > 0 && cardWidth < 160) ? '100%' : 78, height: 32, overflow: 'hidden' }}
            >
              {isStoreClosed ? (
                <Animated.View entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={styles.closedBtn}>
                  <Text style={styles.closedBtnText}>Closed</Text>
                </Animated.View>
              ) : (resolvedStock <= 0 || !resolvedIsAvailable) ? (
                <AnimatedPressable
                  entering={FadeIn.duration(150)}
                  exiting={FadeOut.duration(150)}
                  onPress={() => { if (!notified) handleNotify(); }}
                  style={styles.notifyBtn}
                >
                  <Text style={styles.notifyBtnText}>
                    {notified ? '✓ Alerted' : '🔔 Notify'}
                  </Text>
                </AnimatedPressable>
              ) : quantity === 0 ? (
                <AnimatedPressable 
                  entering={FadeIn.duration(150)}
                  exiting={FadeOut.duration(150)}
                  onPress={handleAdd} 
                  onPressIn={() => {
                    addScale.value = withSpring(0.92, { damping: 10, stiffness: 200 });
                  }}
                  onPressOut={() => {
                    addScale.value = withSpring(1, { damping: 10, stiffness: 200 });
                  }}
                  style={[
                    styles.addBtn, 
                    resolvedIsFlash && { borderColor: '#e11d48' },
                    animatedAddStyle
                  ]}
                >
                  <Text style={[styles.addBtnText, resolvedIsFlash && { color: '#e11d48' }]}>ADD</Text>
                  <Text style={[styles.addBtnPlusText, resolvedIsFlash && { color: '#e11d48' }]}>+</Text>
                </AnimatedPressable>
              ) : (
                <Animated.View 
                  entering={FadeIn.duration(120)}
                  exiting={FadeOut.duration(120)}
                  style={{
                    width: 76,
                    height: 28,
                    borderRadius: 9999,
                    borderWidth: 1,
                    borderColor: '#e11d48',
                    backgroundColor: isDark ? '#27272a' : '#fff5f5',
                    flexDirection: 'row',
                    alignItems: 'center',
                    overflow: 'hidden',
                    alignSelf: 'center',
                  }}
                >
                  <Pressable 
                    onPress={handleDecrement} 
                    style={({ pressed }) => [{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', opacity: pressed ? 0.6 : 1 }]}
                  >
                    <Minus size={13} color="#e11d48" strokeWidth={3.5} />
                  </Pressable>
                  
                  <View style={{ width: 1, height: 14, backgroundColor: isDark ? '#3f3f46' : '#fbcfe8' }} />

                  <View style={{ flex: 1.2, height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: isDark ? '#fafafa' : '#1f2937', fontSize: 13, fontWeight: '950' }}>{quantity}</Text>
                  </View>

                  <View style={{ width: 1, height: 14, backgroundColor: isDark ? '#3f3f46' : '#fbcfe8' }} />

                  <Pressable
                    onPress={handleIncrement}
                    disabled={quantity >= resolvedStock}
                    style={({ pressed }) => [
                      { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center' },
                      quantity >= resolvedStock ? { opacity: 0.4 } : (pressed ? { opacity: 0.6 } : { opacity: 1 })
                    ]}
                  >
                    <Plus size={13} color="#e11d48" strokeWidth={3.5} />
                  </Pressable>
                </Animated.View>
              )}
            </Animated.View>
          </View>
        </Pressable>
      </Animated.View>
     </Animated.View>
    </View>
  );
});

const styles = StyleSheet.create({
  // ── Card ──
  card: {
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    height: 290,
    width: '100%',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
      web: {
        // @ts-ignore web-only
        boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
        // @ts-ignore
        transition: 'box-shadow 0.15s ease, transform 0.15s ease',
      },
    }),
  },
  cardDark: {
    backgroundColor: '#18181b',
    borderColor: 'rgba(63,63,70,0.5)',
  },

  // ── Left Accent Border ──
  leftAccent: {
    position: 'absolute',
    left: 0,
    top: 12,
    bottom: 12,
    width: 3,
    borderRadius: 2,
    backgroundColor: '#22c55e',
    zIndex: 5,
  },

  // ── Image Area ──
  imageArea: {
    width: '100%',
    height: 125,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingHorizontal: 12,
    paddingTop: 8,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  fallbackImageContainer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  fallbackText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#cbd5e1',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },

  // ── Discount Badge ──
  discountBadge: {
    position: 'absolute',
    left: 6,
    top: 6,
    zIndex: 10,
    backgroundColor: '#ff2e55',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#ff2e55',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  discountText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // ── Low Stock Badge ──
  lowStockBadge: {
    position: 'absolute',
    right: 6,
    top: 6,
    zIndex: 10,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lowStockText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ── Bestseller Badge ──
  bestsellerBadge: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.92)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bestsellerText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  // ── Info Area ──
  infoArea: {
    paddingHorizontal: 10,
    paddingTop: 6,
    flex: 1,
    justifyContent: 'flex-start',
    minHeight: 0,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1e293b',
    lineHeight: 17,
    letterSpacing: -0.1,
  },
  unitText: {
    fontSize: 10.5,
    fontWeight: '500',
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 14,
  },
  customisableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 4,
  },
  customisableText: {
    color: '#16a34a',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  // ── Bottom Area ──
  bottomArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 7,
    paddingBottom: 10,
    paddingTop: 4,
    gap: 6,
    marginTop: 'auto' as any,
  },

  // ── Pricing ──
  priceCol: {
    flex: 1,
    minWidth: 0,
  },
  price: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 18,
  },
  mrpSavingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 1,
  },
  mrp: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    lineHeight: 13,
  },
  savingsLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#16a34a',
    lineHeight: 13,
    marginTop: 1,
  },

  // ── Action Slot ──
  actionSlot: {
    width: 76,
    height: 32,
    overflow: 'hidden',
    flexShrink: 0,
  },

  // ── ADD Button (single Pressable, no wrapper nesting) ──
  addBtn: {
    width: '100%',
    height: '100%',
    borderWidth: 1.5,
    borderColor: '#e11d48',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addBtnText: {
    color: '#e11d48',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  addBtnPlusText: {
    color: '#e11d48',
    fontSize: 15,
    fontWeight: '600',
    marginTop: -1,
  },

  // ── Stepper (dark forest green, 3 equal segments) ──
  stepperWrap: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e11d48',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  stepperBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyText: {
    color: '#e11d48',
    fontSize: 14,
    fontWeight: '800',
  },

  // ── Closed Button ──
  closedBtn: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  closedBtnText: {
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.3,
    color: '#94a3b8',
  },

  // ── Notify Button ──
  notifyBtn: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.04)',
  },
  notifyBtnDone: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34,197,94,0.04)',
  },
  notifyBtnText: {
    fontWeight: '800',
    fontSize: 9.5,
    letterSpacing: 0.3,
    color: '#d97706',
  },
  notifyBtnTextDone: {
    color: '#22c55e',
  },
});

export default ProductCard;
