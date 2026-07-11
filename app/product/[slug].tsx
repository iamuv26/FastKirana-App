import { View, Text, Pressable, ScrollView, Dimensions, ActivityIndicator, Alert, Platform, Image as RNImage } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ShoppingBag, Share2, ShieldCheck, Heart, Truck, ChevronDown, ChevronRight, Search, Star, MapPin, Sun, Moon, Mic, Clock } from 'lucide-react-native';
import { useCart } from '../../hooks/use-cart';
import { formatPrice, getAppImageSource, formatHeaderAddress } from '../../lib/utils';
import ProductCard, { Product } from '../../components/product/ProductCard';
import { triggerHaptic } from '../../lib/haptic';
import { playCartPop } from '../../lib/audio';
import FloatingCartBar from '../../components/shared/FloatingCartBar';
import { API_BASE_URL } from '../../lib/constants';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';
import { useUIStore } from '../../stores/ui-store';
import Logo from '../../components/shared/Logo';

const CATEGORY_IMAGES: Record<string, any> = {
  'fruits-vegetables': require('../../assets/fruits_vegetables_category.png'),
  'dairy-breakfast': require('../../assets/dairy_breakfast_category.png'),
  'snacks-munchies': require('../../assets/snacks_munchies_category.png'),
  'beverages': require('../../assets/beverages_category.png'),
  'personal-care': require('../../assets/personal_care_category.png'),
  'household': require('../../assets/household_category.png'),
  'bakery': require('../../assets/bakery_biscuits_category.png'),
  'atta-rice-dal': require('../../assets/atta_rice_dal_category.png'),
  'cafe': require('../../assets/cafe_category.png'),
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
  variants: [] as any[]
};

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { getItemQuantity, addItem, updateQuantity, getTotalItems, getSubtotal } = useCart();
  const [selectedVariantId, setSelectedVariantId] = useState('default');
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const [notified, setNotified] = useState(false);
  const groceryMartOpen = useUIStore((s) => s.groceryMartOpen);
  const cafeOpen = useUIStore((s) => s.cafeOpen);
  const selectedLocation = useUIStore((s) => s.selectedLocation);

  // Accordion collapsible states
  const [descOpen, setDescOpen] = useState(true);
  const [storageOpen, setStorageOpen] = useState(false);
  const [sellerOpen, setSellerOpen] = useState(false);

  // Fetch product detail from API
  const { data: product = DEFAULT_MOCK_DETAIL, isLoading } = useQuery<any>({
    queryKey: ['product-details', slug],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/products/${slug}`);
      if (!response.ok) throw new Error('API failed');
      return await response.json();
    },
  });

  // Fetch related products dynamically by category
  const categorySlug = product.category?.slug;
  const { data: relatedProductsData } = useQuery<any>({
    queryKey: ['related-products', categorySlug],
    queryFn: async () => {
      if (!categorySlug) return [];
      const res = await fetch(`${API_BASE_URL}/products?category=${categorySlug}&limit=10`);
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
        mrp: v.mrp || product.mrp || v.price || product.price
      }));
    }
    
    if (!product || !product.id || product.id === '') return [];
    
    const baseUnit = product.unit || '1 unit';
    const basePrice = product.price || 0;
    const baseMrp = product.mrp || basePrice;
    
    // Parse unit number and label (e.g. "500 gms" -> 500, "gms")
    const unitMatch = baseUnit.match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
    if (unitMatch) {
      const val = parseFloat(unitMatch[1]);
      const unitLabel = unitMatch[2] || '';
      
      const doubleVal = val * 2;
      const doublePrice = basePrice * 2;
      const doubleMrp = baseMrp * 2;
      
      return [
        {
          id: 'default',
          unit: baseUnit,
          price: basePrice,
          mrp: baseMrp,
        },
        {
          id: 'double',
          unit: `${doubleVal} ${unitLabel}`.trim(),
          price: doublePrice,
          mrp: doubleMrp,
        }
      ];
    }
    
    return [
      {
        id: 'default',
        unit: baseUnit,
        price: basePrice,
        mrp: baseMrp,
      }
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
    Alert.alert("Stock Alert Set 🔔", `We will notify you as soon as ${product.name} is back in stock!`);
  };

  const activeVariant = variantsList.find((v: any) => v.id === selectedVariantId) || {
    price: product.price,
    mrp: product.mrp,
    unit: product.unit
  };

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
    stock: product.stock
  };

  const quantity = getItemQuantity(cartProduct.id);
  const discountPercent = activeVariant.mrp > 0 
    ? Math.round(((activeVariant.mrp - activeVariant.price) / activeVariant.mrp) * 100)
    : 0;

  const isCafe = product.category?.slug === 'cafe' || product.tags?.includes('cafe') || product.id?.startsWith('c');
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
    else if (prefix === 'sm') categoryKey = 'snacks-munchies';
    else if (prefix === 'bv') categoryKey = 'beverages';
    else if (prefix === 'pc') categoryKey = 'personal-care';
    else if (prefix === 'hh') categoryKey = 'household';
    else if (prefix === 'bb') categoryKey = 'bakery';
    else if (prefix === 'de' || prefix === 'oi') categoryKey = 'atta-rice-dal';
    
    return CATEGORY_IMAGES[categoryKey] || null;
  };

  const imageSource = getProductImage();

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {/* ── Web-Parity Header Redesign ── */}
      <View style={{
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
        backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
        zIndex: 20
      }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          {/* Left: Brand Logo & Text (Matched with Landing Page) */}
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              router.replace('/(tabs)');
            }} 
            style={({ pressed }) => [
              { opacity: pressed ? 0.85 : 1 }
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9', 
                padding: 4, 
                borderRadius: 8, 
                borderWidth: 1, 
                borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                flexShrink: 0
              }}>
                <Logo size={24} />
              </View>
              <View style={{ marginLeft: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: -0.5, lineHeight: 18 }}>
                  <Text style={{ color: isDarkMode ? '#fafafa' : '#0f172a' }}>Fast</Text>
                  <Text style={{ color: '#e20a22' }}>Kirana</Text>
                </Text>
                <Text style={{ fontSize: 7, fontWeight: '900', color: '#16a34a', letterSpacing: 0.3, marginTop: 0 }}>
                  DELIVERY APP
                </Text>
              </View>
            </View>
          </Pressable>
          
          {/* Right: Location Capsule Picker (Matched with Landing Page) */}
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              router.push('/location-picker');
            }} 
            style={({ pressed }) => [
              {
                opacity: pressed ? 0.85 : 1,
                maxWidth: '60%'
              }
            ]}
          >
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: isDarkMode ? 'rgba(226,10,34,0.1)' : '#fff5f5', 
              borderWidth: 1, 
              borderColor: isDarkMode ? 'rgba(226,10,34,0.25)' : '#fecdd3', 
              borderRadius: 20, 
              paddingHorizontal: 8, 
              paddingVertical: 5,
              justifyContent: 'center',
            }}>
              <MapPin size={11} color="#e20a22" style={{ flexShrink: 0, marginRight: 3 }} />
              <Text 
                numberOfLines={1} 
                style={{ 
                  fontSize: 10, 
                  fontWeight: 'bold', 
                  color: isDarkMode ? '#fafafa' : '#0f172a',
                  flexShrink: 1,
                  marginRight: 3
                }}
              >
                {formatHeaderAddress(selectedLocation)}
              </Text>
              <ChevronDown size={8} color={isDarkMode ? '#cbd5e1' : '#64748b'} style={{ flexShrink: 0 }} />
            </View>
          </Pressable>
        </View>

        {/* Row 2: Search input placeholder (Matched with Landing Page) */}
        <Pressable 
          onPress={() => {
            triggerHaptic('light');
            router.push('/search');
          }}
          className="flex-row items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-full px-4 h-11 w-full active:scale-[0.99]"
          style={Platform.OS === 'ios' ? {
            marginTop: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.04,
            shadowRadius: 6,
          } : Platform.OS === 'android' ? {
            marginTop: 10,
            elevation: 2,
          } : { marginTop: 10 }}
        >
          <Search size={16} color="#e20a22" style={{ marginRight: 10 }} />
          <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '500', flex: 1 }}>
            Search for vegetables, dairy, snacks...
          </Text>
          
          {/* Vertical Divider */}
          <View style={{ width: 1, height: 16, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', marginRight: 10 }} />
          
          <Mic size={16} color="#16a34a" />
        </Pressable>

        {/* Row 3: Breadcrumbs Capsule */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          alignSelf: 'flex-start',
          borderWidth: 1,
          borderColor: isDarkMode ? '#2c2c2e' : '#e2e8f0',
          borderRadius: 99,
          paddingHorizontal: 12,
          paddingVertical: 5,
          marginTop: 12,
          marginBottom: 2,
          backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff'
        }}>
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              router.replace('/(tabs)');
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#e20a22', letterSpacing: 0.5 }}>HOME</Text>
          </Pressable>
          <ChevronRight size={8} color="#64748b" style={{ marginHorizontal: 6 }} />
          <Pressable 
            onPress={() => {
              if (product.category?.slug) {
                triggerHaptic('light');
                router.push(`/category/${product.category.slug}`);
              }
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            disabled={!product.category?.slug}
          >
            <Text style={{ fontSize: 9.5, fontWeight: '800', color: '#e20a22', letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {product.category?.name || 'MART'}
            </Text>
          </Pressable>
          <ChevronRight size={8} color="#64748b" style={{ marginHorizontal: 6 }} />
          <Text style={{ fontSize: 9.5, fontWeight: '800', color: isDarkMode ? '#71717a' : '#94a3b8', letterSpacing: 0.5, textTransform: 'uppercase' }} numberOfLines={1}>
            {product.name}
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#e20a22" />
        </View>
      ) : (
        <ScrollView 
          className="flex-1" 
          contentContainerStyle={{ paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Main Product Card Container (Matches web screenshot layout) ── */}
          <View className="mx-4 mt-4 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 p-5 rounded-3xl shadow-sm">
            
            {/* Image Box Container with Inner Border */}
            <View className="w-full h-80 bg-slate-50 dark:bg-zinc-900/40 items-center justify-center relative border border-slate-100/50 dark:border-zinc-800/50 overflow-hidden rounded-2xl mx-auto mb-4">
              
              {/* Product Image */}
              {imageSource ? (
                Platform.OS === 'web' ? (
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
                  />
                )
              ) : (
                <Text className="text-8xl">📦</Text>
              )}

              {/* Discount flat tag top-left */}
              {discountPercent > 0 && (
                <View className="absolute top-0 left-0 bg-[#FF6B00] px-3.5 py-1.5 rounded-br-xl rounded-tl-2xl">
                  <Text className="text-white font-black text-[11px] uppercase tracking-wider">{discountPercent}% OFF</Text>
                </View>
              )}
            </View>

            {/* Category Pill Tag */}
            {product.category?.name && (
              <View className="self-start px-2.5 py-1 bg-pink-50/50 dark:bg-pink-950/20 border border-pink-100/30 dark:border-pink-900/30 rounded-full mb-2">
                <Text className="text-[9px] font-black text-rose-600 uppercase tracking-wider">
                  {product.category.name}
                </Text>
              </View>
            )}

            {/* Title & Underline */}
            <Text className="text-slate-855 dark:text-zinc-100 font-black text-2xl tracking-tight leading-8">
              {product.name}
            </Text>
            <View className="w-12 h-1 bg-[#e20a22] rounded-full mt-2.5 mb-4" />

            {/* Select Size / Option Row (Styled like Blinkit/Zepto) */}
            {variantsList.length > 0 && (
              <View className="mb-6">
                <Text className="text-slate-800 dark:text-zinc-200 font-extrabold text-sm mb-3">
                  Select Size
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {variantsList.map((v: any) => {
                    const isSelected = selectedVariantId === v.id;
                    return (
                      <Pressable
                        key={v.id}
                        onPress={() => {
                          triggerHaptic('light');
                          setSelectedVariantId(v.id);
                        }}
                        style={({ pressed }) => ({
                          transform: [{ scale: pressed ? 0.96 : 1 }]
                        })}
                        className={`w-28 py-3.5 rounded-2xl border-2 items-center justify-center ${
                          isSelected
                            ? 'bg-emerald-50/20 border-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-500'
                            : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                        }`}
                      >
                        {/* Variant Unit */}
                        <Text
                          className={`text-xs font-black text-center ${
                            isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-750 dark:text-zinc-300'
                          }`}
                        >
                          {v.unit}
                        </Text>
                        {/* Variant Price */}
                        <Text
                          className={`text-xs font-bold text-center mt-1 ${
                            isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-zinc-400'
                          }`}
                        >
                          {formatPrice(v.price)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Price section with green percentage capsule */}
            <View className="flex-row items-baseline gap-2.5 mb-5">
              <Text className="text-slate-800 dark:text-zinc-200 font-black text-2xl">
                {formatPrice(activeVariant.price)}
              </Text>
              {activeVariant.mrp > activeVariant.price && (
                <>
                  <Text className="text-slate-400 dark:text-zinc-500 line-through text-sm font-semibold">
                    {formatPrice(activeVariant.mrp)}
                  </Text>
                  <View className="bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                    <Text className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black">
                      {discountPercent}% OFF
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Add to Cart Actions */}
            {isStoreClosed ? (
              <View className="bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 py-3.5 rounded-xl items-center justify-center mb-6">
                <Text className="font-black text-xs tracking-wider text-slate-400 dark:text-zinc-500 uppercase">STORE CLOSED</Text>
              </View>
            ) : ((product.stock ?? 0) <= 0 || product.isAvailable === false) ? (
              <Pressable
                onPress={() => {
                  if (!notified) handleNotify();
                }}
                className={`py-3.5 rounded-xl border flex items-center justify-center active:scale-95 mb-6 ${
                  notified 
                    ? 'bg-emerald-950/15 border-emerald-600 dark:border-emerald-500'
                    : 'bg-amber-950/15 border-amber-500 dark:border-amber-400'
                }`}
              >
                <Text className={`font-black text-xs uppercase tracking-wider ${
                  notified ? 'text-emerald-500' : 'text-amber-550 dark:text-amber-500'
                }`}>
                  {notified ? '✓ Alerted' : '🔔 Notify Me'}
                </Text>
              </Pressable>
            ) : quantity === 0 ? (
              <Pressable
                onPress={() => {
                  triggerHaptic('success');
                  playCartPop();
                  addItem(cartProduct);
                }}
                style={({ pressed }) => ({
                  transform: [{ scale: pressed ? 0.96 : 1 }]
                })}
                className="bg-emerald-600 dark:bg-emerald-500 py-3.5 rounded-xl items-center justify-center flex-row gap-2 transition-transform mb-6"
              >
                <Text className="text-white font-black text-sm uppercase tracking-wider">Add to Cart</Text>
                <ShoppingBag size={15} color="#ffffff" strokeWidth={3} />
              </Pressable>
            ) : (
              <View className="flex-row items-center border border-emerald-650 dark:border-emerald-500 bg-emerald-50 dark:bg-zinc-950 rounded-xl p-0.5 mb-6">
                <Pressable
                  onPress={() => {
                    triggerHaptic('light');
                    playCartPop();
                    updateQuantity(cartProduct.id, cartProduct.name, quantity - 1);
                  }}
                  style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}
                  className="flex-1 py-3 items-center"
                >
                  <Text className="text-emerald-700 dark:text-emerald-400 font-black text-lg">-</Text>
                </Pressable>
                <Text className="px-6 text-emerald-805 dark:text-zinc-100 font-black text-sm">{quantity}</Text>
                <Pressable
                  onPress={() => {
                    triggerHaptic('light');
                    playCartPop();
                    updateQuantity(cartProduct.id, cartProduct.name, quantity + 1);
                  }}
                  style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}
                  className="flex-1 py-3 items-center"
                >
                  <Text className="text-emerald-700 dark:text-emerald-400 font-black text-lg">+</Text>
                </Pressable>
              </View>
            )}

            {/* Delivery Info Capsule */}
            <View className="flex-row items-center gap-2 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-100 dark:border-zinc-900 p-3 rounded-xl mb-3">
              <Text style={{ fontSize: 13 }}>⚡</Text>
              <Text className="text-[10.5px] font-black text-slate-700 dark:text-zinc-300">
                Lightning-fast doorstep delivery from our nearest darkstore
              </Text>
            </View>

            {/* Fresh Verified Card */}
            <View className="bg-emerald-50/20 dark:bg-emerald-950/5 border border-emerald-100/50 dark:border-emerald-900/20 p-3.5 rounded-xl mb-5">
              <View className="flex-row items-center gap-1.5 mb-1">
                <ShieldCheck size={14} color="#10b981" />
                <Text className="text-emerald-700 dark:text-emerald-400 text-[11px] font-black">
                  FastKirana DarkStore Fresh Verified
                </Text>
              </View>
              <Text className="text-[9.5px] text-emerald-600/90 dark:text-emerald-500/80 leading-4 font-medium">
                Sourced directly, sorted in hygienic, controlled environment, and packed under strict guidelines. Freshness guaranteed with zero small shelf-store.
              </Text>
            </View>

            {/* Delivery in 15-20 min text */}
            <View className="flex-row items-center gap-1.5 mb-6 ml-1">
              <Clock size={14} color="#16a34a" />
              <Text className="text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                Delivery in 15-20 min
              </Text>
            </View>

            {/* Collapsible Accordions Details lists */}
            <View className="border-t border-slate-100 dark:border-zinc-900 pt-3">
              {/* Accordion 1: Product Description */}
              <Pressable
                onPress={() => setDescOpen(!descOpen)}
                className="flex-row justify-between items-center py-3 border-b border-slate-100 dark:border-zinc-900"
              >
                <Text className="text-xs font-black text-slate-750 dark:text-zinc-350">Product Description</Text>
                <Text className="text-slate-400 font-extrabold text-sm">{descOpen ? '▴' : '▾'}</Text>
              </Pressable>
              {descOpen && (
                <View className="py-2.5">
                  <Text className="text-[12px] text-slate-550 dark:text-zinc-405 leading-5 font-semibold">
                    {product.description || 'No description available for this product.'}
                  </Text>
                </View>
              )}

              {/* Accordion 2: Storage & Care */}
              <Pressable
                onPress={() => setStorageOpen(!storageOpen)}
                className="flex-row justify-between items-center py-3 border-b border-slate-100 dark:border-zinc-900"
              >
                <Text className="text-xs font-black text-slate-750 dark:text-zinc-350">Storage & Care</Text>
                <Text className="text-slate-400 font-extrabold text-sm">{storageOpen ? '▴' : '▾'}</Text>
              </Pressable>
              {storageOpen && (
                <View className="py-2.5">
                  <Text className="text-[12px] text-slate-550 dark:text-zinc-405 leading-5 font-semibold">
                    Store in a cool and dry place. Keep away from direct sunlight. {product.origin ? `Country of Origin: ${product.origin}.` : ''}
                  </Text>
                </View>
              )}

              {/* Accordion 3: Seller Information */}
              <Pressable
                onPress={() => setSellerOpen(!sellerOpen)}
                className="flex-row justify-between items-center py-3 border-b border-slate-100 dark:border-zinc-900"
              >
                <Text className="text-xs font-black text-slate-750 dark:text-zinc-350">Seller Information</Text>
                <Text className="text-slate-400 font-extrabold text-sm">{sellerOpen ? '▴' : '▾'}</Text>
              </Pressable>
              {sellerOpen && (
                <View className="py-2.5 gap-2">
                  <Text className="text-[12px] text-slate-550 dark:text-zinc-405 leading-5 font-semibold">
                    Sold by FastKirana Retail DarkStore.
                  </Text>
                  {product.fssai && (
                    <Text className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold">
                      FSSAI License No: {product.fssai}
                    </Text>
                  )}
                </View>
              )}
            </View>

          </View>

          {/* ── Related Products scroller section ── */}
          {relatedProducts.length > 0 && (
            <View className="px-4 mt-6">
              <Text className="text-slate-800 dark:text-zinc-200 font-black text-lg">Related Products</Text>
              <Text className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold mt-0.5">
                Customers buy this in this category
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: 4 }}
                decelerationRate="fast"
              >
                {relatedProducts.map((p: any, idx: number) => (
                  <View key={p.id} className="w-36">
                    <ProductCard product={p} index={idx} className="w-full" />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Customer Reviews Section Card ── */}
          <View className="mx-4 mt-6 bg-white dark:bg-zinc-900 border border-slate-200/50 dark:border-zinc-800/80 p-5 rounded-3xl shadow-sm mb-6">
            <Text className="text-slate-800 dark:text-zinc-200 font-black text-lg mb-4">Customer Reviews</Text>
            <View className="items-center justify-center py-6">
              <Star size={36} color="#d1d5db" strokeWidth={1.5} />
              <Text className="text-slate-400 dark:text-zinc-500 text-xs font-bold mt-3 text-center">
                No reviews yet for this product.
              </Text>
              <Text className="text-slate-400 dark:text-zinc-500 text-[10px] font-semibold mt-1 text-center">
                Be the first to order and review this item!
              </Text>
            </View>
          </View>

        </ScrollView>
      )}

      {/* Sticky Bottom Cart Bar */}
      <FloatingCartBar bottomOffset={8} />
    </SafeAreaView>
  );
}
