import { View, Text, Pressable, ScrollView, ActivityIndicator, Platform, Image as RNImage, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, ShieldCheck, ChevronRight, Search, Star, Mic, Clock, Minus, Plus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCart } from '../../hooks/use-cart';
import { formatPrice, getAppImageSource, isCafeProduct, isRestaurantProduct } from '../../lib/utils';
import ProductCard, { Product } from '../../components/product/ProductCard';
import { triggerHaptic } from '../../lib/haptic';
import { playCartPop } from '../../lib/audio';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import AlertModal from '../../components/shared/AlertModal';
import { API_BASE_URL } from '../../lib/constants';
import { useTheme } from '../context/ThemeContext';
import { useUIStore } from '../../stores/ui-store';
import { ScalePressable } from '../../components/shared/ScalePressable';
import BrandedTopHeader from '../../components/shared/BrandedTopHeader';
import { THEME } from '../../lib/theme';

const CATEGORY_IMAGES: Record<string, any> = {
  'fruits-vegetables': require('../../assets/fruits_vegetables_category.webp'),
  'dairy-breakfast': require('../../assets/dairy_breakfast_category.webp'),
  'snacks-biscuits': require('../../assets/snacks_munchies_category.webp'),
  'beverages': require('../../assets/beverages_category.webp'),
  'personal-care': require('../../assets/personal_care_category.webp'),
  'household': require('../../assets/household_category.webp'),
  'bakery': require('../../assets/bakery_biscuits_category.webp'),
  'grocery-essential': require('../../assets/atta_rice_dal_category.webp'),
  'cafe': require('../../assets/cafe_category.webp'),
};

const DEFAULT_MOCK_DETAIL = {
  id: '',
  name: 'Loading product...',
  slug: '',
  mrp: 0,
  price: 0,
  discount: 0,
  unit: '',
  stock: 0,
  description: '',
  brand: '',
  origin: '',
  expiry: '',
  fssai: '',
  variants: [] as any[],
};

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { getItemQuantity, addItem, updateQuantity, getTotalItems, getSubtotal } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState('default');
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

  const [notified, setNotified] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const groceryMartOpen = useUIStore((s) => s.groceryMartOpen);
  const cafeOpen = useUIStore((s) => s.cafeOpen);
  const selectedLocation = useUIStore((s) => s.selectedLocation);

  // Accordion collapsible states
  const [descOpen, setDescOpen] = useState(true);
  const [storageOpen, setStorageOpen] = useState(false);
  const [sellerOpen, setSellerOpen] = useState(false);

  const assignedStoreId = useUIStore((s) => s.assignedStoreId);
  const validStoreId = (assignedStoreId && !assignedStoreId.startsWith('default-')) ? assignedStoreId : null;

  // Fetch product detail from API
  const { data: product = DEFAULT_MOCK_DETAIL, isLoading } = useQuery<any>({
    queryKey: ['product-details', slug, validStoreId],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products/${slug}${validStoreId ? `?storeId=${validStoreId}` : ''}`);
      if (!response.ok) throw new Error('API failed');
      return await response.json();
    },
  });

  // Fetch related products dynamically by category
  const categorySlug = product.category?.slug;
  const { data: relatedProductsData } = useQuery<any>({
    queryKey: ['related-products', categorySlug, validStoreId],
    queryFn: async () => {
      if (!categorySlug) return [];
      const res = await fetch(`${API_BASE_URL}/products?category=${categorySlug}&limit=10${validStoreId ? `&storeId=${validStoreId}` : ''}`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.products || [];
    },
    enabled: !!categorySlug,
  });

  const relatedProducts = useMemo(() => {
    if (!relatedProductsData) return [];
    return relatedProductsData.filter((p: any) => p.id !== product.id && p.isAvailable !== false);
  }, [relatedProductsData, product.id]);

  // Generate variants list (uses JSON from DB if available, else auto-generates bulk options)
  const variantsList = useMemo(() => {
    if (product && Array.isArray(product.variants) && product.variants.length > 0) {
      return product.variants.map((v: any, idx: number) => ({
        id: v.id || `v-${idx}`,
        unit: v.unit || v.name || product.unit,
        price: v.price || product.price,
        mrp: v.mrp || product.mrp || v.price || product.price,
      }));
    }

    if (!product || !product.id || product.id === '') return [];

    const baseUnit = product.unit || '1 unit';
    const basePrice = product.price || 0;
    const baseMrp = product.mrp || basePrice;

    return [
      {
        id: 'default',
        unit: baseUnit,
        price: basePrice,
        mrp: baseMrp,
      },
    ];
  }, [product?.id, product?.variants, product?.price, product?.mrp, product?.unit]);

  useEffect(() => {
    if (variantsList.length > 0) {
      setSelectedVariantId(variantsList[0].id);
    } else {
      setSelectedVariantId('default');
    }
  }, [product?.id, variantsList]);

  const handleNotify = () => {
    triggerHaptic('success');
    setNotified(true);
    setIsAlertVisible(true);
  };

  const activeVariant = variantsList.find((v: any) => v.id === selectedVariantId) || {
    price: product.price,
    mrp: product.mrp,
    unit: product.unit,
  };

  const isOutOfStock = useMemo(() => {
    if (product.isAvailable === false) return true;
    const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;
    if (hasVariants) {
      const hasAvailableVariant = product.variants.some((v: any) =>
        v.isAvailable !== false && (v.stock === undefined || v.stock === null || v.stock > 0)
      );
      return !hasAvailableVariant;
    }
    return product.stock !== undefined && product.stock !== null && product.stock <= 0;
  }, [product.isAvailable, product.stock, product.variants]);

  // Build temporary object representing selected variant for Cart Actions
  const cartProduct: Product = {
    id: `${product.id}-${selectedVariantId}`,
    name: `${product.name} (${activeVariant.unit})`,
    slug: product.slug,
    imageUrl: product.imageUrl,
    mrp: activeVariant.mrp,
    price: activeVariant.price,
    discount: (activeVariant.mrp ?? 0) - (activeVariant.price ?? 0),
    unit: activeVariant.unit,
    stock: product.stock,
    isAvailable: product.isAvailable ?? true,
  };

  const quantity = getItemQuantity(cartProduct.id);
  const discountPercent = activeVariant.mrp > 0
    ? Math.round(((activeVariant.mrp - activeVariant.price) / activeVariant.mrp) * 100)
    : 0;

  const isCafe = isCafeProduct(product) || isRestaurantProduct(product) || /^c\d+$/.test(product.id || '');
  const isStoreClosed = isCafe ? !cafeOpen : !groceryMartOpen;

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
    const prefix = product.id?.slice(0, 2) || '';
    let categoryKey = '';
    if (prefix === 'fv') categoryKey = 'fruits-vegetables';
    else if (prefix === 'db') categoryKey = 'dairy-breakfast';
    else if (prefix === 'sm') categoryKey = 'snacks-biscuits';
    else if (prefix === 'bv') categoryKey = 'beverages';
    else if (prefix === 'pc') categoryKey = 'personal-care';
    else if (prefix === 'hh') categoryKey = 'household';
    else if (prefix === 'bb') categoryKey = 'bakery';
    else if (prefix === 'de' || prefix === 'oi') categoryKey = 'grocery-essential';

    return CATEGORY_IMAGES[categoryKey] || null;
  };

  const imageSource = getProductImage();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {/* ── Web-Parity Header Redesign ── */}
      <View style={[styles.headerContainer, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {/* Standardized Branded Header & Location */}
        <BrandedTopHeader showBack={true} title={product?.name || 'Product Details'} subtitle={product?.category?.name || 'FastKirana'} style={{ paddingHorizontal: 0, paddingVertical: 0, borderBottomWidth: 0, marginBottom: 8 }} />

        <ScalePressable
          onPress={() => {
            router.push('/search');
          }}
          scaleValue={0.99}
          style={Platform.OS === 'ios' ? {
            marginTop: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
            width: '100%',
          } : Platform.OS === 'android' ? {
            marginTop: 10,
            elevation: 2,
            width: '100%',
          } : { marginTop: 10, width: '100%' }}
        >
          <View style={styles.searchBar}>
            <Search size={16} color={THEME.COLORS.brand.primary} style={{ marginRight: THEME.SPACING.sm }} />
            <Text style={styles.searchText}>
              Search for vegetables, dairy, snacks...
            </Text>

            {/* Vertical Divider */}
            <View style={styles.searchDivider} />

            <Mic size={16} color={THEME.COLORS.brand.primary} />
          </View>
        </ScalePressable>

        {/* Row 3: Breadcrumbs Capsule */}
        <View style={[styles.breadcrumbCapsule, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <ScalePressable
            onPress={() => {
              router.replace('/(tabs)');
            }}
            scaleValue={0.96}
            style={{}}
          >
            <Text style={styles.breadcrumbHome}>HOME</Text>
          </ScalePressable>
          <ChevronRight size={8} color={colors.textSecondary} style={styles.breadcrumbChevron} />
          <ScalePressable
            onPress={() => {
              if (product.category?.slug) {
                router.push(`/category/${product.category.slug}`);
              }
            }}
            scaleValue={0.96}
            style={{ flexShrink: 0 }}
            disabled={!product.category?.slug}
          >
            <Text style={styles.breadcrumbCategory}>
              {product.category?.name || 'MART'}
            </Text>
          </ScalePressable>
          <ChevronRight size={8} color={colors.textSecondary} style={styles.breadcrumbChevron} />
          <Text style={[styles.breadcrumbCurrent, { color: colors.textMuted }]} numberOfLines={1}>
            {product.name}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={THEME.COLORS.brand.primary} />
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Main Product Card Container ── */}
          <View style={[styles.productCard, {
            backgroundColor: colors.surface,
            borderColor: isDarkMode ? `${colors.border}cc` : `${THEME.COLORS.light.border}80`,
          }]}>
            {/* Image Box Container with Inner Border */}
            <View
              style={[
                styles.imageBox,
                {
                  backgroundColor: isDarkMode ? `${colors.surface}66` : colors.background,
                  borderColor: isDarkMode ? '#3f3f4680' : `${colors.borderLight}80`,
                },
              ]}
            >

              {/* Product Image */}
              <Animated.View
                style={{ width: '90%', height: '90%' }}
                sharedTransitionTag={`product-image-${product.id}`}
              >
                {Platform.OS === 'web' ? (
                  <RNImage
                    source={imageSource}
                    resizeMode="contain"
                    style={{ width: '90%', height: '90%' }}
                  />
                ) : (
                  <ExpoImage
                    source={imageSource}
                    contentFit="contain"
                    style={{ width: '90%', height: '90%' }}
                    transition={250}
                    cachePolicy="memory-disk"
                    placeholder={isDarkMode ? `${colors.surfaceElevated}66` : `${colors.borderLight}99`}
                  />
                )}
              </Animated.View>

              {/* Discount flat tag top-left */}
              {discountPercent > 0 && (
                <View style={styles.discountTag}>
                  <Text style={styles.discountTagText}>{discountPercent}% OFF</Text>
                </View>
              )}
            </View>

            {/* Category Pill Tag */}
            {product.category?.name && (
              <View style={[styles.categoryPill, {
                backgroundColor: isDarkMode ? `${THEME.COLORS.brand.primaryDark}33` : `${THEME.COLORS.brand.primaryLight}80`,
                borderColor: isDarkMode ? `${THEME.COLORS.brand.primaryDark}33` : `${THEME.COLORS.brand.primary}26`,
              }]}>
                <Text style={[styles.categoryPillText, { color: THEME.COLORS.brand.primary }]}>
                  {product.category.name}
                </Text>
              </View>
            )}

            {/* Title & Underline */}
            <Text style={[styles.productTitle, { color: colors.textPrimary }]}>
              {product.name}
            </Text>
            <View style={[styles.titleUnderline, { backgroundColor: THEME.COLORS.brand.primary }]} />

            {/* Select Size / Option Row (Styled like Blinkit/Zepto) */}
            {variantsList.length > 1 && (
              <View style={styles.variantSelector}>
                <Text style={[styles.variantLabel, { color: colors.textPrimary }]}>
                  Select Size
                </Text>
                <View style={styles.variantGrid}>
                  {variantsList.map((v: any) => {
                    const isSelected = selectedVariantId === v.id;
                    return (
                      <View key={v.id} style={{ width: 112, height: 60 }}>
                        <ScalePressable
                          onPress={() => {
                            setSelectedVariantId(v.id);
                          }}
                          scaleValue={0.96}
                          style={{ width: '100%', height: '100%' }}
                        >
                          <View style={[
                            styles.variantCard,
                            isSelected ? styles.variantCardSelected : styles.variantCardUnselected,
                            {
                              borderColor: isSelected ? THEME.COLORS.brand.success : colors.border,
                              backgroundColor: isSelected
                                ? `${THEME.COLORS.brand.success}33`
                                : colors.surface,
                            },
                          ]}>
                            {/* Variant Unit */}
                            <Text style={[
                              styles.variantUnit,
                              { color: isSelected ? THEME.COLORS.brand.successDark : colors.textPrimary },
                            ]}>
                              {v.unit}
                            </Text>
                            {/* Variant Price */}
                            <Text style={[
                              styles.variantPrice,
                              { color: isSelected ? THEME.COLORS.brand.success : colors.textSecondary },
                            ]}>
                              {formatPrice(v.price)}
                            </Text>
                          </View>
                        </ScalePressable>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Price section with green percentage capsule */}
            <View style={styles.priceRow}>
              <Text style={[styles.priceText, { color: colors.textPrimary }]}>
                {formatPrice(activeVariant.price)}
              </Text>
              {activeVariant.mrp > activeVariant.price && (
                <>
                  <Text style={[styles.mrpText, { color: colors.textMuted }]}>
                    {formatPrice(activeVariant.mrp)}
                  </Text>
                  <View style={[styles.discountBadge, { backgroundColor: `${THEME.COLORS.brand.success}1A` }]}>
                    <Text style={[styles.discountBadgeText, { color: THEME.COLORS.brand.success }]}>
                      {discountPercent}% OFF
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Add to Cart Actions */}
            {isStoreClosed ? (
              <View style={[styles.storeClosed, { backgroundColor: colors.borderLight, borderColor: colors.border }]}>
                <Text style={[styles.storeClosedText, { color: colors.textMuted }]}>STORE CLOSED</Text>
              </View>
            ) : isOutOfStock ? (
              <ScalePressable
                onPress={() => {
                  if (!notified) handleNotify();
                }}
                scaleValue={0.96}
                style={{ width: '100%' }}
              >
                <View style={[
                  styles.notifyCard,
                  notified
                    ? { backgroundColor: `${THEME.COLORS.brand.success}26`, borderColor: THEME.COLORS.brand.success }
                    : { backgroundColor: `${THEME.COLORS.brand.warning}26`, borderColor: THEME.COLORS.brand.warning },
                ]}>
                  <Text style={[
                    styles.notifyText,
                    { color: notified ? THEME.COLORS.brand.success : THEME.COLORS.brand.warning },
                  ]}>
                    {notified ? '✓ Alerted' : '🔔 Notify Me'}
                  </Text>
                </View>
              </ScalePressable>
            ) : quantity === 0 ? (
              <View style={{ width: '100%', marginBottom: THEME.SPACING.xxl }}>
                <ScalePressable
                  onPress={() => {
                    playCartPop();
                    addItem(cartProduct);
                  }}
                  scaleValue={0.96}
                  haptic="success"
                  style={{ width: '100%' }}
                >
                  <View style={styles.addToCartOuter}>
                    <LinearGradient
                      colors={THEME.COLORS.gradients.success}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.addToCartGradient}
                    >
                      <ShoppingBag size={20} color="#ffffff" strokeWidth={2.8} />
                      <Text style={styles.addToCartText}>ADD TO CART</Text>
                    </LinearGradient>
                  </View>
                </ScalePressable>
              </View>
            ) : (
              <View style={{ width: '100%', marginBottom: THEME.SPACING.xxl }}>
                <View style={[
                  styles.quantityContainer,
                  {
                    backgroundColor: isDarkMode ? THEME.COLORS.brand.successDark : THEME.COLORS.brand.successLight,
                    borderColor: THEME.COLORS.brand.success,
                  },
                ]}>
                  <Pressable
                    onPress={() => {
                      playCartPop();
                      updateQuantity(cartProduct.id, cartProduct.name, quantity - 1);
                    }}
                    style={({ pressed }) => ({
                      width: 48,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: pressed ? `${THEME.COLORS.brand.success}4D` : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Minus size={22} color={isDarkMode ? THEME.COLORS.brand.success : THEME.COLORS.brand.successDark} strokeWidth={3} />
                  </Pressable>

                  <View style={styles.quantityCount}>
                    <Text style={[styles.quantityCountNumber, { color: isDarkMode ? THEME.COLORS.brand.success : THEME.COLORS.brand.successDark }]}>
                      {quantity}
                    </Text>
                    <Text style={[styles.quantityLabel, { color: colors.textSecondary }]}>
                      in cart
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => {
                      playCartPop();
                      updateQuantity(cartProduct.id, cartProduct.name, quantity + 1);
                    }}
                    style={({ pressed }) => ({
                      width: 48,
                      height: 42,
                      borderRadius: 12,
                      backgroundColor: pressed ? `${THEME.COLORS.brand.success}4D` : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    })}
                  >
                    <Plus size={22} color={isDarkMode ? THEME.COLORS.brand.success : THEME.COLORS.brand.successDark} strokeWidth={3} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Delivery Info Capsule */}
            <View style={[styles.deliveryCapsule, {
              backgroundColor: isDarkMode ? `${colors.surface}4D` : `${colors.background}80`,
              borderColor: colors.borderLight,
            }]}>
              <Text style={{ fontSize: 13 }}>⚡</Text>
              <Text style={[styles.deliveryText, { color: colors.textSecondary }]}>
                Lightning-fast doorstep delivery from our nearest darkstore
              </Text>
            </View>

            {/* Fresh Verified Card */}
            <View style={[styles.freshVerified, {
              backgroundColor: isDarkMode ? `${THEME.COLORS.brand.successDark}0D` : `${THEME.COLORS.brand.successLight}33`,
              borderColor: isDarkMode ? `${THEME.COLORS.brand.success}33` : `${THEME.COLORS.brand.success}80`,
            }]}>
              <View style={styles.freshVerifiedRow}>
                <ShieldCheck size={14} color={THEME.COLORS.brand.success} />
                <Text style={[styles.freshVerifiedTitle, { color: isDarkMode ? THEME.COLORS.brand.success : THEME.COLORS.brand.successDark }]}>
                  FastKirana DarkStore Fresh Verified
                </Text>
              </View>
              <Text style={[styles.freshVerifiedDesc, { color: isDarkMode ? `${THEME.COLORS.brand.success}CC` : `${THEME.COLORS.brand.success}E6` }]}>
                Sourced directly, sorted in hygienic, controlled environment, and packed under strict guidelines. Freshness guaranteed with zero small shelf-store.
              </Text>
            </View>

            {/* Delivery in 15-20 min text */}
            <View style={styles.deliveryTimeRow}>
              <Clock size={14} color={THEME.COLORS.brand.success} />
              <Text style={[styles.deliveryTimeText, { color: THEME.COLORS.brand.success }]}>
                Delivery in 15-20 min
              </Text>
            </View>

            {/* Collapsible Accordions Details lists */}
            <View style={[styles.accordionContainer, { borderTopColor: colors.borderLight }]}>
              {/* Accordion 1: Product Description */}
              <Pressable
                onPress={() => setDescOpen(!descOpen)}
                style={styles.accordionItem}
              >
                <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>Product Description</Text>
                <Text style={[styles.accordionToggle, { color: colors.textMuted }]}>{descOpen ? '▴' : '▾'}</Text>
              </Pressable>
              {descOpen && (
                <View style={styles.accordionContent}>
                  <Text style={[styles.accordionBodyText, { color: colors.textSecondary }]}>
                    {product.description || 'No description available for this product.'}
                  </Text>
                </View>
              )}

              {/* Accordion 2: Storage & Care */}
              <Pressable
                onPress={() => setStorageOpen(!storageOpen)}
                style={styles.accordionItem}
              >
                <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>Storage & Care</Text>
                <Text style={[styles.accordionToggle, { color: colors.textMuted }]}>{storageOpen ? '▴' : '▾'}</Text>
              </Pressable>
              {storageOpen && (
                <View style={styles.accordionContent}>
                  <Text style={[styles.accordionBodyText, { color: colors.textSecondary }]}>
                    Store in a cool and dry place. Keep away from direct sunlight. {product.origin ? `Country of Origin: ${product.origin}.` : ''}
                  </Text>
                </View>
              )}

              {/* Accordion 3: Seller Information */}
              <Pressable
                onPress={() => setSellerOpen(!sellerOpen)}
                style={styles.accordionItem}
              >
                <Text style={[styles.accordionTitle, { color: colors.textPrimary }]}>Seller Information</Text>
                <Text style={[styles.accordionToggle, { color: colors.textMuted }]}>{sellerOpen ? '▴' : '▾'}</Text>
              </Pressable>
              {sellerOpen && (
                <View style={styles.accordionContent}>
                  <Text style={[styles.accordionBodyText, { color: colors.textSecondary }]}>
                    Sold by FastKirana Retail DarkStore.
                  </Text>
                  {product.fssai && (
                    <Text style={[styles.accordionSubText, { color: colors.textMuted }]}>
                      FSSAI License No: {product.fssai}
                    </Text>
                  )}
                </View>
              )}
            </View>

          </View>

          {/* ── Related Products scroller section ── */}
          {relatedProducts.length > 0 && (
            <View style={styles.relatedSection}>
              <Text style={[styles.relatedTitle, { color: colors.textPrimary }]}>Related Products</Text>
              <Text style={[styles.relatedSubtitle, { color: colors.textMuted }]}>
                Customers buy this in this category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: THEME.SPACING.md, paddingTop: THEME.SPACING.md, paddingBottom: THEME.SPACING.xs }}
                decelerationRate="fast"
              >
                {relatedProducts.map((p: any, idx: number) => (
                  <View key={p.id} style={{ width: 144 }}>
                    <ProductCard product={p} index={idx} className="w-full" isCafeStyle={isCafe} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Customer Reviews Section Card ── */}
          <View style={[styles.reviewsCard, {
            backgroundColor: colors.surface,
            borderColor: isDarkMode ? `${colors.border}cc` : `${THEME.COLORS.light.border}80`,
          }]}>
            <Text style={[styles.reviewsTitle, { color: colors.textPrimary }]}>Customer Reviews</Text>
            <View style={styles.reviewsEmpty}>
              <Star size={36} color={colors.textMuted} strokeWidth={1.5} />
              <Text style={[styles.reviewsEmptyText, { color: colors.textMuted }]}>
                No reviews yet for this product.
              </Text>
              <Text style={[styles.reviewsEmptySubtext, { color: colors.textMuted }]}>
                Be the first to order and review this item!
              </Text>
            </View>
          </View>

        </ScrollView>
      )}

      {/* Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={8} />

      {/* Premium Success Modal */}
      <AlertModal
        visible={isAlertVisible}
        onClose={() => setIsAlertVisible(false)}
        title="Stock Alert Set 🔔"
        message={`We will notify you as soon as ${product.name} is back in stock!`}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ── Header ──
  headerContainer: {
    paddingHorizontal: THEME.SPACING.lg,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1,
    zIndex: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.COLORS.light.surface,
    borderWidth: 1,
    borderColor: THEME.COLORS.light.border,
    borderRadius: THEME.RADIUS.pill,
    paddingHorizontal: THEME.SPACING.lg,
    height: 44,
    width: '100%',
  },
  searchText: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    color: THEME.COLORS.light.textMuted,
    fontWeight: THEME.TYPOGRAPHY.weights.medium,
    flex: 1,
  },
  searchDivider: {
    width: 1,
    height: 16,
    backgroundColor: THEME.COLORS.light.border,
    marginRight: THEME.SPACING.lg,
  },
  breadcrumbCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: THEME.RADIUS.pill,
    paddingHorizontal: THEME.SPACING.lg,
    paddingVertical: 5,
    marginTop: THEME.SPACING.md,
    marginBottom: 2,
    maxWidth: '100%',
  },
  breadcrumbHome: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    color: THEME.COLORS.brand.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  breadcrumbChevron: {
    marginHorizontal: 6,
    flexShrink: 0,
  },
  breadcrumbCategory: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    color: THEME.COLORS.brand.primary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  breadcrumbCurrent: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    flexShrink: 1,
  },

  // ── Product Card ──
  productCard: {
    marginHorizontal: THEME.SPACING.lg,
    marginTop: THEME.SPACING.lg,
    borderWidth: 1,
    padding: THEME.SPACING.xl,
    borderRadius: THEME.RADIUS.xl,
    ...THEME.SHADOWS.sm,
  },
  imageBox: {
    width: '100%',
    aspectRatio: 1.1,
    maxHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    overflow: 'hidden',
    borderRadius: 16,
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: THEME.SPACING.lg,
  },
  discountTag: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#FF6B00',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderBottomRightRadius: THEME.RADIUS.lg,
    borderTopLeftRadius: THEME.RADIUS.xl,
  },
  discountTagText: {
    color: '#ffffff',
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  categoryPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: THEME.SPACING.xs,
    borderWidth: 1,
    borderRadius: THEME.RADIUS.pill,
    marginBottom: THEME.SPACING.sm,
  },
  categoryPillText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productTitle: {
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    fontSize: THEME.TYPOGRAPHY.sizes.heroSm,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  titleUnderline: {
    width: 48,
    height: THEME.SPACING.xs,
    borderRadius: THEME.RADIUS.pill,
    marginTop: 10,
    marginBottom: THEME.SPACING.md,
  },

  // ── Variants ──
  variantSelector: {
    marginBottom: THEME.SPACING.xxl,
  },
  variantLabel: {
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    marginBottom: THEME.SPACING.md,
  },
  variantGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.SPACING.md,
  },
  variantCard: {
    width: '100%',
    height: '100%',
    borderRadius: THEME.RADIUS.lg,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantCardSelected: {
    // backgroundColor set conditionally
  },
  variantCardUnselected: {
    // backgroundColor set conditionally
  },
  variantUnit: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    textAlign: 'center',
  },
  variantPrice: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
    textAlign: 'center',
    marginTop: 4,
  },

  // ── Price ──
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: THEME.SPACING.md,
    marginBottom: THEME.SPACING.xl,
  },
  priceText: {
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    fontSize: THEME.TYPOGRAPHY.sizes.heroSm,
  },
  mrpText: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: 2,
    borderRadius: THEME.RADIUS.sm,
  },
  discountBadgeText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },

  // ── Cart Actions ──
  storeClosed: {
    borderWidth: 1,
    paddingVertical: THEME.SPACING.lg,
    borderRadius: THEME.RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.SPACING.xxl,
    width: '100%',
  },
  storeClosedText: {
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  notifyCard: {
    paddingVertical: THEME.SPACING.lg,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: THEME.SPACING.xxl,
    width: '100%',
  },
  notifyText: {
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  addToCartOuter: {
    width: '100%',
    borderRadius: 16,
    backgroundColor: THEME.COLORS.brand.successDark,
    paddingBottom: 4,
    shadowColor: THEME.COLORS.brand.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  addToCartGradient: {
    width: '100%',
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.SPACING.lg,
    paddingHorizontal: THEME.SPACING.xl,
  },
  addToCartText: {
    color: '#ffffff',
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    fontSize: 15,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  quantityContainer: {
    height: 52,
    borderRadius: 16,
    borderWidth: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    width: '100%',
  },
  quantityCount: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: THEME.SPACING.md,
  },
  quantityCountNumber: {
    fontSize: 17,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },
  quantityLabel: {
    fontSize: 8.5,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    textTransform: 'uppercase',
    marginTop: -2,
  },

  // ── Info Sections ──
  deliveryCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.sm,
    borderWidth: 1,
    padding: THEME.SPACING.md,
    borderRadius: THEME.RADIUS.md,
    marginBottom: THEME.SPACING.sm,
  },
  deliveryText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },
  freshVerified: {
    borderWidth: 1,
    padding: THEME.SPACING.lg,
    borderRadius: THEME.RADIUS.md,
    marginBottom: THEME.SPACING.xxl,
  },
  freshVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.xs,
    marginBottom: THEME.SPACING.xs,
  },
  freshVerifiedTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },
  freshVerifiedDesc: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    lineHeight: 16,
    fontWeight: THEME.TYPOGRAPHY.weights.medium,
  },
  deliveryTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.xs,
    marginBottom: THEME.SPACING.xxl,
    marginLeft: 4,
  },
  deliveryTimeText: {
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
  },

  // ── Accordions ──
  accordionContainer: {
    borderTopWidth: 1,
    paddingTop: THEME.SPACING.md,
  },
  accordionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: THEME.SPACING.md,
    borderBottomWidth: 1,
  },
  accordionTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },
  accordionToggle: {
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
  },
  accordionContent: {
    paddingVertical: THEME.SPACING.sm,
    gap: THEME.SPACING.sm,
  },
  accordionBodyText: {
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    lineHeight: 20,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
  },
  accordionSubText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
  },

  // ── Related Products ──
  relatedSection: {
    paddingHorizontal: THEME.SPACING.lg,
    marginTop: THEME.SPACING.xxl,
  },
  relatedTitle: {
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    fontSize: THEME.TYPOGRAPHY.sizes.titleSm,
  },
  relatedSubtitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
    marginTop: 2,
  },

  // ── Reviews ──
  reviewsCard: {
    marginHorizontal: THEME.SPACING.lg,
    marginTop: THEME.SPACING.xxl,
    borderWidth: 1,
    padding: THEME.SPACING.xl,
    borderRadius: THEME.RADIUS.xl,
    marginBottom: THEME.SPACING.xxl,
    ...THEME.SHADOWS.sm,
  },
  reviewsTitle: {
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    fontSize: THEME.TYPOGRAPHY.sizes.titleSm,
    marginBottom: THEME.SPACING.md,
  },
  reviewsEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: THEME.SPACING.xxl,
  },
  reviewsEmptyText: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
    marginTop: THEME.SPACING.md,
    textAlign: 'center',
  },
  reviewsEmptySubtext: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
    marginTop: THEME.SPACING.xs,
    textAlign: 'center',
  },
});
