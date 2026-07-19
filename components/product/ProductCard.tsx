import { memo, useState, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, Alert, Dimensions } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { router } from 'expo-router';
import { ShoppingBag, Sparkles, AlertTriangle, ChevronDown, Plus, Minus } from 'lucide-react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, FadeIn, FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useCartStore } from '../../stores/cart-store';
import { useCartActions } from '../../hooks/use-cart';
import { useUIStore } from '../../stores/ui-store';
import { useShallow } from 'zustand/react/shallow';
import { useTheme } from '../../app/context/ThemeContext';
import { API_BASE_URL } from '../../lib/constants';
import { getOptimizedImageUrl, getAppImageSource } from '../../lib/utils';
import { triggerHaptic } from '../../lib/haptic';
import { playCartPop } from '../../lib/audio';
import AlertModal from '../shared/AlertModal';
import { ScalePressable } from '../shared/ScalePressable';
import { SPRING, SCALE } from '../../lib/animation-config';
import { THEME } from '../../lib/theme';


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
  const activeColor = isNonVeg
    ? (isDark ? THEME.COLORS.brand.accent : THEME.COLORS.brand.accentDark)
    : (isDark ? THEME.COLORS.brand.success : THEME.COLORS.brand.successDark);
  return (
    <View 
      style={{
        width: 15,
        height: 15,
        borderWidth: 1.5,
        borderColor: activeColor,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: THEME.RADIUS.xs / 2,
        backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.8)'
      }}
    >
      <View 
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: activeColor
        }}
      />
    </View>
  );
}


const CATEGORY_IMAGES: Record<string, any> = {
  'fruits-vegetables': require('../../assets/fruits_vegetables_category.webp'),
  'dairy-breakfast': require('../../assets/dairy_breakfast_category.webp'),
  'snacks-biscuits': require('../../assets/snacks_munchies_category.webp'),
  'beverages': require('../../assets/beverages_category.webp'),
  'personal-care': require('../../assets/personal_care_category.webp'),
  'household': require('../../assets/household_category.webp'),
  'bakery-biscuits': require('../../assets/bakery_biscuits_category.webp'),
  'grocery-essential': require('../../assets/atta_rice_dal_category.webp'),
  'cafe': require('../../assets/cafe_category.webp'),
};

const ProductCard = memo(function ProductCard({ product, className, index = 0, isCategoryGrid = false, isFlashDeal = false, isCafeStyle = false }: ProductCardProps) {
  const { addItem, updateQuantity } = useCartActions();
  const { setActiveVariantProduct, groceryMartOpen, cafeOpen } = useUIStore(
    useShallow((s) => ({
      setActiveVariantProduct: s.setActiveVariantProduct,
      groceryMartOpen: s.groceryMartOpen,
      cafeOpen: s.cafeOpen,
    }))
  );
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const resolvedWidth = useMemo(() => {
    if (!className) return '47%';
    if (className.includes('w-full')) return '100%';
    
    // Parse arbitrary width like w-[48%] or w-[31.5%]
    const match = className.match(/w-\[(\d+(?:\.\d+)?)%\]/);
    if (match) {
      return `${match[1]}%`;
    }
    
    // Check standard Tailwind percentage/fraction widths
    if (className.includes('w-1/2')) return '50%';
    if (className.includes('w-1/3')) return '33.333%';
    if (className.includes('w-2/3')) return '66.666%';
    if (className.includes('w-1/4')) return '25%';
    if (className.includes('w-3/4')) return '75%';
    
    // Parse fixed Tailwind widths like w-36, w-40
    const fixedMatch = className.match(/\bw-(\d+)\b/);
    if (fixedMatch) {
      return parseInt(fixedMatch[1]) * 4; // 1 unit = 4px in Tailwind
    }

    // Parse fixed pixel widths like w-[140px]
    const pxMatch = className.match(/\bw-\[(\d+)px\]\b/);
    if (pxMatch) {
      return parseInt(pxMatch[1]);
    }

    return className.includes('w-') ? undefined : '47%';
  }, [className]);

  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const initialCardWidth = useMemo(() => {
    if (!resolvedWidth) return (SCREEN_WIDTH - 24) * 0.47;
    if (typeof resolvedWidth === 'number') {
      return resolvedWidth;
    }
    let widthVal = SCREEN_WIDTH;
    if (typeof resolvedWidth === 'string' && resolvedWidth.endsWith('%')) {
      const percent = parseFloat(resolvedWidth);
      widthVal = (SCREEN_WIDTH - 24) * (percent / 100);
    }
    if (widthVal >= 300 && Platform.OS !== 'web') {
      return 140; // Conservative initial default on mobile for w-full cards inside constrained containers
    }
    return Math.max(0, widthVal - 16);
  }, [resolvedWidth, SCREEN_WIDTH]);

  const [cardWidth, setCardWidth] = useState(initialCardWidth);
  const resolvedStyle = useMemo(() => {
    const styleObj: any = {
      width: resolvedWidth as any,
    };
    if (className) {
      if (className.includes('mb-4')) {
        styleObj.marginBottom = 16;
      } else if (className.includes('mb-2')) {
        styleObj.marginBottom = 8;
      } else {
        styleObj.marginBottom = THEME.SPACING.md;
      }
    } else {
      styleObj.marginBottom = THEME.SPACING.md;
    }
    return styleObj;
  }, [resolvedWidth, className]);

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

  const resolvedIsAvailable = (product.isAvailable ?? true) || resolvedStock > 0;
  const isCafe = product.category?.slug === 'cafe' || product.tags?.includes('cafe');
  const isStoreClosed = isCafe ? !cafeOpen : !groceryMartOpen;
  const resolvedIsFlash = isFlashDeal || product.isFlashDeal || product.tags?.includes('flash');

  // resolvedWidth moved to top to prevent TS2448 error

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

  const imageSource = useMemo(() => {
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
    else if (prefix === 'sm') categoryKey = 'snacks-biscuits';
    else if (prefix === 'bv') categoryKey = 'beverages';
    else if (prefix === 'pc') categoryKey = 'personal-care';
    else if (prefix === 'hh') categoryKey = 'household';
    else if (prefix === 'bb') categoryKey = 'bakery-biscuits';
    else if (prefix === 'de' || prefix === 'oi') categoryKey = 'grocery-essential';
    else if (isCafe) categoryKey = 'cafe';
    
    return CATEGORY_IMAGES[categoryKey] || null;
  }, [product.imageUrl, product.category?.slug, product.id, isCafe]);

  const savings = resolvedMrp - resolvedPrice;
  const isBestseller = useMemo(() => {
    return product.tags?.includes('popular') || product.tags?.includes('essential') || product.id === 'db1' || product.id === 'sm2' || product.id === 'fv1';
  }, [product.tags, product.id]);
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
  const [isAlertVisible, setIsAlertVisible] = useState(false);

  const handleNotify = () => {
    triggerHaptic('success');
    setNotified(true);
    setIsAlertVisible(true);
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



  if (isCafeStyle) {
    const mockRating = ['4.4', '4.5', '4.6', '4.7'][(product.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)) % 4];
    const isNonVeg = product.tags?.some((t: string) => t.toLowerCase() === 'non-veg') || false;
    const is3Column = !!className && (className.includes('31.5') || className.includes('31%') || className.includes('1/3'));

    return (
      <View 
        style={resolvedStyle}
      >
        <Animated.View entering={undefined} style={{ width: '100%' }}>
          <Animated.View 
            style={[
              {
                width: '100%',
                minHeight: is3Column ? 220 : 260,
                borderRadius: THEME.RADIUS.md,
                borderWidth: 1,
                borderColor: isDark ? THEME.COLORS.dark.border : THEME.COLORS.light.border,
                backgroundColor: isDark ? THEME.COLORS.dark.surface : THEME.COLORS.light.surface,
                padding: THEME.SPACING.sm,
                justifyContent: 'space-between',
                position: 'relative',
                ...Platform.select<any>({
                  ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.2 : 0.06,
                    shadowRadius: 8,
                  },
                  android: {
                    elevation: 3,
                  },
                })
              },
              animatedCardStyle
            ]}
          >
            {/* Top row: Veg Indicator & Rating */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', zIndex: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <VegIndicator isNonVeg={isNonVeg} isDark={isDark} />
                {!is3Column && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#fffbeb', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 }}>
                    <Text style={{ fontSize: 9.5, fontWeight: '700', color: '#b45309' }}>★ {mockRating}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Middle: Product Image */}
            <Pressable 
              onPress={() => router.push(`/product/${product.slug}`)}
              style={{ 
                width: '100%', 
                aspectRatio: is3Column ? 1.2 : 1,
                borderRadius: THEME.RADIUS.sm, 
                overflow: 'hidden', 
                marginVertical: THEME.SPACING.xs,
                backgroundColor: isDark ? THEME.COLORS.dark.surfaceElevated : THEME.COLORS.light.borderLight,
                position: 'relative',
                alignItems: 'center',
                justifyContent: 'center',
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
                  recyclingKey={product.id}
                />
              ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ShoppingBag size={24} color={isDark ? '#71717a' : '#cbd5e1'} strokeWidth={1.5} />
                </View>
              )}

              {/* Discount / Flash Badge Overlay */}
              {resolvedDiscount > 0 && (
                <View style={{
                  position: 'absolute',
                  top: THEME.SPACING.xs,
                  left: THEME.SPACING.xs,
                  backgroundColor: resolvedIsFlash ? THEME.COLORS.brand.accent : THEME.COLORS.brand.primary,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: THEME.RADIUS.xs,
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '800', letterSpacing: 0.2 }}>
                    {resolvedIsFlash ? '⚡ ' : ''}{resolvedDiscount}% OFF
                  </Text>
                </View>
              )}

              {/* Bestseller Badge Overlay */}
              {isBestseller && (
                <View style={{
                  position: 'absolute',
                  bottom: THEME.SPACING.xs,
                  left: THEME.SPACING.xs,
                  backgroundColor: THEME.COLORS.brand.warning,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: THEME.RADIUS.xs,
                }}>
                  <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '800', letterSpacing: 0.2 }}>
                    ★ BEST
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Product Name */}
            <View style={{ width: '100%', paddingHorizontal: 1, marginBottom: THEME.SPACING.xs }}>
              <Text 
                style={{
                  fontSize: THEME.TYPOGRAPHY.sizes.caption,
                  fontWeight: THEME.TYPOGRAPHY.weights.semibold as any,
                  color: isDark ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary,
                  lineHeight: 15,
                  minHeight: 30,
                }}
                numberOfLines={2}
              >
                {product.name}
              </Text>
            </View>

            {/* Bottom Row: Price left, ADD button right */}
            <View 
              onLayout={(e) => {
                const { width } = e.nativeEvent.layout;
                if (width !== cardWidth) {
                  setCardWidth(width);
                }
              }}
              style={{ 
                flexDirection: (cardWidth > 0 && cardWidth < 180) ? 'column' : 'row', 
                alignItems: (cardWidth > 0 && cardWidth < 180) ? 'stretch' : 'center', 
                justifyContent: 'space-between', 
                width: '100%',
                gap: (cardWidth > 0 && cardWidth < 180) ? 6 : 2,
              }}
            >
              <View style={{ 
                flexDirection: (cardWidth > 0 && cardWidth < 180) ? 'row' : 'column',
                alignItems: (cardWidth > 0 && cardWidth < 180) ? 'baseline' : 'flex-start',
                gap: (cardWidth > 0 && cardWidth < 180) ? 4 : 0,
                flex: (cardWidth > 0 && cardWidth < 180) ? 0 : 1, 
                paddingRight: (cardWidth > 0 && cardWidth < 180) ? 0 : 4,
                marginBottom: (cardWidth > 0 && cardWidth < 180) ? 4 : 0
              }}>
                {startingMrp > startingPrice && (
                  <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, textDecorationLine: 'line-through', color: THEME.COLORS.light.textMuted, fontWeight: '500', marginBottom: 1 }}>
                    ₹{startingMrp}
                  </Text>
                )}
                <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.bold as any, color: isDark ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }}>
                  ₹{startingPrice}
                </Text>
              </View>

              {/* Orange Square ADD Button / Stepper */}
              <View style={{ width: is3Column ? 68 : ((cardWidth > 0 && cardWidth < 180) ? '100%' : 78), height: 30, justifyContent: 'center', alignItems: 'center' }}>
                {isStoreClosed ? (
                  <View 
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: THEME.RADIUS.xs,
                      backgroundColor: isDark ? THEME.COLORS.dark.surfaceElevated : THEME.COLORS.light.borderLight,
                      borderWidth: 1,
                      borderColor: isDark ? THEME.COLORS.dark.border : THEME.COLORS.light.border,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: isDark ? THEME.COLORS.dark.textMuted : THEME.COLORS.light.textMuted, fontSize: 9.5, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.2 }}>Closed</Text>
                  </View>
                ) : quantity === 0 ? (
                  <AnimatedPressable
                    onPress={handleAdd}
                    onPressIn={() => {
                      addScale.value = withSpring(SCALE.addButton, SPRING.snappy);
                    }}
                    onPressOut={() => {
                      addScale.value = withSpring(1, SPRING.snappy);
                    }}
                    style={[
                      {
                        width: '100%',
                        height: '100%',
                        borderRadius: THEME.RADIUS.xs,
                        backgroundColor: THEME.COLORS.brand.accent,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'row',
                        gap: 4,
                        ...Platform.select<any>({
                          ios: THEME.SHADOWS.sm,
                          android: { elevation: 1 }
                        })
                      },
                      animatedAddStyle
                    ]}
                  >
                    <Text style={{ color: '#ffffff', fontSize: 11.5, fontWeight: '700' }}>ADD</Text>
                    <Plus size={10} color="#ffffff" strokeWidth={3} />
                  </AnimatedPressable>
                ) : (
                  <Animated.View
                    entering={FadeIn.duration(120)}
                    exiting={FadeOut.duration(120)}
                    style={{
                      position: 'absolute',
                      right: 0,
                      bottom: 0,
                      width: '100%',
                      height: '100%',
                      borderRadius: THEME.RADIUS.pill,
                      borderWidth: 1.5,
                      borderColor: THEME.COLORS.brand.accent,
                      backgroundColor: isDark ? THEME.COLORS.dark.surfaceElevated : THEME.COLORS.brand.accentLight,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-evenly',
                      overflow: 'hidden',
                      zIndex: 20
                    }}
                  >
                    {/* Decrement */}
                    <Pressable 
                      onPress={handleDecrement} 
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 5 }}
                      style={({ pressed }) => ({
                        paddingHorizontal: 6,
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: pressed ? 0.6 : 1
                      })}
                    >
                      <Minus size={11} color={THEME.COLORS.brand.accent} strokeWidth={4} />
                    </Pressable>

                    {/* Quantity */}
                    <Text style={{ color: isDark ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary, fontSize: 12.5, fontWeight: '700' }}>{quantity}</Text>

                    {/* Increment */}
                    <Pressable
                      onPress={handleIncrement}
                      disabled={quantity >= resolvedStock}
                      hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
                      style={({ pressed }) => ({
                        paddingHorizontal: 6,
                        height: '100%',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: quantity >= resolvedStock ? 0.4 : (pressed ? 0.6 : 1)
                      })}
                    >
                      <Plus size={11} color={THEME.COLORS.brand.accent} strokeWidth={4} />
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

  // ═══════════════════════════════════════════════════
  // ── GROCERY CARD — Swiggy / Blinkit Style ──────
  // ═══════════════════════════════════════════════════
  return (
    <View 
      style={resolvedStyle}
    >
      <Animated.View entering={undefined} style={{ width: '100%' }}>
        <Animated.View 
          style={[
          { 
            width: '100%', 
            borderWidth: 1,
            borderColor: resolvedIsFlash
              ? (isDark ? 'rgba(226,10,34,0.35)' : '#ffe4e6')
              : (isDark ? THEME.COLORS.dark.border : THEME.COLORS.light.border),
            backgroundColor: isDark ? THEME.COLORS.dark.surface : THEME.COLORS.light.surface,
            borderRadius: THEME.RADIUS.md,
            overflow: 'hidden',
            ...Platform.select({
              ios: {
                shadowColor: resolvedIsFlash ? '#e20a22' : '#000000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.2 : (resolvedIsFlash ? 0.1 : 0.05),
                shadowRadius: 8,
              },
              android: {
                elevation: isDark ? 2 : (resolvedIsFlash ? 3 : 2),
              },
            })
          },
          animatedCardStyle
        ]}
      >
        {/* ── Image Area with overlaid controls ── */}
        <Pressable
          onPress={() => router.push(`/product/${product.slug}`)}
          onPressIn={() => {
            cardScale.value = withSpring(SCALE.cardPress, SPRING.press);
          }}
          onPressOut={() => {
            cardScale.value = withSpring(1, SPRING.press);
          }}
          style={{
            width: '100%',
            aspectRatio: isCategoryGrid ? 1.2 : 1,
            backgroundColor: isDark ? THEME.COLORS.dark.surfaceElevated : '#f8f9fa',
            borderTopLeftRadius: THEME.RADIUS.md - 1,
            borderTopRightRadius: THEME.RADIUS.md - 1,
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center',
            padding: THEME.SPACING.sm,
          }}
        >
          {/* Product Image */}
          {imageSource ? (
            <ExpoImage
              source={imageSource}
              contentFit="contain"
              style={{ width: '100%', height: '100%' }}
              transition={250}
              cachePolicy="memory-disk"
              placeholder={isDark ? "rgba(39,39,42,0.4)" : "rgba(241,245,249,0.6)"}
              recyclingKey={product.id}
            />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 4 }}>
              <ShoppingBag size={24} color={isDark ? '#71717a' : '#cbd5e1'} strokeWidth={1.5} />
              <Text style={{ fontSize: 9, fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3 }}>No Image</Text>
            </View>
          )}

          {/* Discount Badge — top-left */}
          {resolvedDiscount > 0 && (
            <View style={{
              position: 'absolute',
              left: 6,
              top: 6,
              zIndex: 10,
              backgroundColor: resolvedIsFlash ? THEME.COLORS.brand.accent : (resolvedDiscount > 20 ? THEME.COLORS.brand.warningDark : THEME.COLORS.brand.primary),
              borderRadius: THEME.RADIUS.pill,
              paddingHorizontal: 7,
              paddingVertical: 2.5,
              ...Platform.select<any>({
                ios: THEME.SHADOWS.sm,
                android: { elevation: 1 }
              })
            }}>
              <Text style={{ color: '#ffffff', fontSize: 8.5, fontWeight: '800', letterSpacing: 0.2 }}>
                {resolvedIsFlash ? '⚡ ' : ''}{resolvedDiscount}% OFF
              </Text>
            </View>
          )}

          {/* Low Stock Badge — top-right */}
          {isLowStock && (
            <View style={{
              position: 'absolute',
              right: 6,
              top: 6,
              zIndex: 10,
              backgroundColor: THEME.COLORS.brand.warningDark,
              borderRadius: THEME.RADIUS.pill,
              paddingHorizontal: 7,
              paddingVertical: 2.5,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
            }}>
              <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '800' }}>
                Only {resolvedStock} left
              </Text>
            </View>
          )}

          {/* Bestseller Badge — bottom-left (above veg indicator) */}
          {isBestseller && (
            <View style={{
              position: 'absolute',
              left: 6,
              bottom: 34,
              zIndex: 10,
              backgroundColor: THEME.COLORS.brand.warning,
              borderRadius: THEME.RADIUS.xs,
              paddingHorizontal: 7,
              paddingVertical: 2.5,
            }}>
              <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '800', letterSpacing: 0.2 }}>⭐ Best</Text>
            </View>
          )}

          {/* Veg/Non-Veg indicator — bottom-left of image */}
          {isCafe && (
            <View style={{ position: 'absolute', left: 8, bottom: 8, zIndex: 10 }}>
              <VegIndicator isNonVeg={isNonVeg} isDark={isDark} />
            </View>
          )}

          {/* ── ADD / Stepper button overlaid at bottom-right of image ── */}
          <View style={{ position: 'absolute', right: 8, bottom: 8, zIndex: 20, width: isStoreClosed ? 56 : 36, height: isStoreClosed ? 25 : 36 }}>
            {isStoreClosed ? (
              <View 
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#f1f5f9',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#e2e8f0',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: isDark ? '#a1a1aa' : '#64748b', fontSize: 8.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.2 }}>Closed</Text>
              </View>
            ) : (resolvedStock <= 0 || !resolvedIsAvailable) ? (
              <Pressable
                onPress={() => { if (!notified) handleNotify(); }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 10,
                  backgroundColor: isDark ? THEME.COLORS.dark.surfaceElevated : '#fffbeb',
                  borderWidth: 1.5,
                  borderColor: THEME.COLORS.brand.warning,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontSize: 14 }}>{notified ? '✓' : '🔔'}</Text>
              </Pressable>
            ) : quantity === 0 ? (
              <AnimatedPressable
                onPress={handleAdd}
                onPressIn={() => {
                  addScale.value = withSpring(SCALE.addButton, SPRING.snappy);
                }}
                onPressOut={() => {
                  addScale.value = withSpring(1, SPRING.snappy);
                }}
                style={[
                  {
                    width: '100%',
                    height: '100%',
                    borderRadius: 10,
                    backgroundColor: isDark ? THEME.COLORS.dark.surface : '#ffffff',
                    borderWidth: 1.5,
                    borderColor: THEME.COLORS.brand.primary,
                    justifyContent: 'center',
                    alignItems: 'center',
                    ...Platform.select<any>({
                      ios: {
                        shadowColor: THEME.COLORS.brand.primary,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                      },
                      android: { elevation: 2 }
                    })
                  },
                  animatedAddStyle
                ]}
              >
                <Plus size={18} color={THEME.COLORS.brand.primary} strokeWidth={3} />
              </AnimatedPressable>
            ) : (
              /* Stepper overlay renders separately below */
              null
            )}
          </View>

          {/* Stepper overlay — wider, shows when quantity > 0 */}
          {quantity > 0 && !isStoreClosed && resolvedStock > 0 && resolvedIsAvailable && (
            <Animated.View
              entering={FadeIn.duration(120)}
              exiting={FadeOut.duration(120)}
              style={{
                position: 'absolute',
                right: 6,
                bottom: 6,
                zIndex: 25,
                width: 90,
                height: 34,
                borderRadius: 10,
                borderWidth: 1.5,
                borderColor: THEME.COLORS.brand.primary,
                backgroundColor: isDark ? THEME.COLORS.dark.surface : '#ffffff',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-evenly',
                overflow: 'hidden',
                ...Platform.select<any>({
                  ios: {
                    shadowColor: THEME.COLORS.brand.primary,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.12,
                    shadowRadius: 4,
                  },
                  android: { elevation: 3 }
                })
              }}
            >
              {/* Decrement */}
              <Pressable 
                onPress={handleDecrement} 
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 5 }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: pressed ? 0.5 : 1
                })}
              >
                <Minus size={14} color={THEME.COLORS.brand.primary} strokeWidth={3.5} />
              </Pressable>

              {/* Quantity */}
              <View style={{ paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: isDark ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary, fontSize: 14, fontWeight: '700' }}>{quantity}</Text>
              </View>

              {/* Increment */}
              <Pressable
                onPress={handleIncrement}
                disabled={quantity >= resolvedStock}
                hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
                style={({ pressed }) => ({
                  flex: 1,
                  height: '100%',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: quantity >= resolvedStock ? 0.3 : (pressed ? 0.5 : 1)
                })}
              >
                <Plus size={14} color={THEME.COLORS.brand.primary} strokeWidth={3.5} />
              </Pressable>
            </Animated.View>
          )}
        </Pressable>

        {/* ── Product Info below image ── */}
        <View style={{ paddingHorizontal: 10, paddingTop: 8, paddingBottom: 10 }}>
          {/* Product Name */}
          <Text 
            style={{ 
              fontSize: 12.5, 
              fontWeight: '600', 
              color: isDark ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary, 
              lineHeight: 16,
              minHeight: 32 
            }}
            numberOfLines={2}
          >
            {product.name}
          </Text>

          {/* Unit or Variant pill */}
          <View style={{ marginTop: 4 }}>
            {hasVariants ? (
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                alignSelf: 'flex-start',
                backgroundColor: isDark ? 'rgba(226,10,34,0.08)' : '#fff1f2', 
                paddingHorizontal: 8, 
                paddingVertical: 3, 
                borderRadius: 6, 
                borderWidth: 1, 
                borderColor: isDark ? 'rgba(226,10,34,0.2)' : '#fecdd3',
              }}>
                <Text style={{ color: THEME.COLORS.brand.primary, fontSize: 10, fontWeight: '700' }}>
                  {variantsList.length} Option{variantsList.length > 1 ? 's' : ''}
                </Text>
                <ChevronDown size={8} color={THEME.COLORS.brand.primary} style={{ marginLeft: 2 }} />
              </View>
            ) : (
              <View style={{ 
                alignSelf: 'flex-start',
                backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', 
                paddingHorizontal: 7, 
                paddingVertical: 2.5, 
                borderRadius: 5, 
                borderWidth: 1, 
                borderColor: isDark ? THEME.COLORS.dark.border : '#e2e8f0',
              }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: isDark ? THEME.COLORS.dark.textMuted : '#64748b' }}>{product.unit}</Text>
              </View>
            )}
          </View>

          {/* Price Row */}
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: isDark ? '#fafafa' : '#0f172a' }}>
              ₹{resolvedPrice}
            </Text>
            {resolvedMrp > resolvedPrice && (
              <Text style={{ fontSize: 11, textDecorationLine: 'line-through', color: '#94a3b8', fontWeight: '500' }}>
                ₹{resolvedMrp}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>
      <AlertModal
        visible={isAlertVisible}
        onClose={() => setIsAlertVisible(false)}
        title="Stock Alert Set 🔔"
        message={`We will notify you as soon as ${product.name} is back in stock!`}
      />
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
    width: 78,
    height: 32,
    overflow: 'hidden',
    flexShrink: 0,
  },

  // ── ADD Button ──
  addBtn: {
    width: '100%',
    height: '100%',
    borderWidth: 1.5,
    borderColor: THEME.COLORS.brand.primary,
    borderRadius: THEME.RADIUS.xs,
    backgroundColor: '#ffffff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  addBtnText: {
    color: THEME.COLORS.brand.primary,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  addBtnPlusText: {
    color: THEME.COLORS.brand.primary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: -1,
  },

  // ── Stepper ──
  stepperWrap: {
    width: '100%',
    height: '100%',
    borderRadius: THEME.RADIUS.xs,
    borderWidth: 1.5,
    borderColor: THEME.COLORS.brand.primary,
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
    color: THEME.COLORS.brand.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Closed Button ──
  closedBtn: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: THEME.COLORS.light.border,
    borderRadius: THEME.RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  closedBtnText: {
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.2,
    color: THEME.COLORS.light.textMuted,
  },

  // ── Notify Button ──
  notifyBtn: {
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderColor: THEME.COLORS.brand.warning,
    borderRadius: THEME.RADIUS.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.04)',
  },
  notifyBtnDone: {
    borderColor: THEME.COLORS.brand.success,
    backgroundColor: 'rgba(34,197,94,0.04)',
  },
  notifyBtnText: {
    fontWeight: '700',
    fontSize: 10,
    letterSpacing: 0.2,
    color: THEME.COLORS.brand.warningDark,
  },
  notifyBtnTextDone: {
    color: THEME.COLORS.brand.successDark,
  },
});

export default ProductCard;
