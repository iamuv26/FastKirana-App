import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  Pressable, 
  StyleSheet, 
  LayoutAnimation, 
  Platform 
} from 'react-native';
import { ChevronRight, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeOut, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { categories as defaultCategories, products as defaultProducts, MonsoonCategory, MonsoonProduct } from '../data/products';
import { useCartStore } from '../../stores/cart-store';
import { useCartActions } from '../../hooks/use-cart';
import { useTheme } from '../../app/context/ThemeContext';
import { ScalePressable } from '../shared/ScalePressable';
import { triggerHaptic } from '../../lib/haptic';
import { useUIStore } from '../../stores/ui-store';
import { isCafeProduct } from '../../lib/utils';

interface MonsoonCategoryCardProps {
  categories?: MonsoonCategory[];
  products?: MonsoonProduct[];
  onAddToCart?: (productId: string) => void;
  onRemoveFromCart?: (productId: string) => void;
  cart?: Record<string, number>;
  wishlist?: Set<string>;
  onToggleWishlist?: (productId: string) => void;
  onSeeAll?: () => void;
}

export default function MonsoonCategoryCard({
  categories = defaultCategories,
  products = defaultProducts,
  onAddToCart,
  onRemoveFromCart,
  cart,
  wishlist,
  onToggleWishlist,
  onSeeAll,
}: MonsoonCategoryCardProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const [activeCategory, setActiveCategory] = useState<string>('hangers');
  const [transitionState, setTransitionState] = useState<'leaving' | 'entering' | ''>('');
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  // Local Wishlist Fallback
  const [localWishlist, setLocalWishlist] = useState<Set<string>>(new Set());

  // Store Timing state
  const groceryMartOpen = useUIStore((s) => s.groceryMartOpen);
  const cafeOpen = useUIStore((s) => s.cafeOpen);

  // Global Cart Store integration fallback
  const cartStoreItems = useCartStore((state) => state.items);
  const { addItem, updateQuantity, removeItem } = useCartActions();

  const catStripRef = useRef<ScrollView>(null);

  const changeCategory = (catId: string) => {
    if (catId === activeCategory) return;
    triggerHaptic('light');
    setPendingCategory(catId);
    setTransitionState('leaving');
  };

  useEffect(() => {
    if (transitionState === 'leaving' && pendingCategory !== null) {
      const timer = setTimeout(() => {
        setActiveCategory(pendingCategory);
        setTransitionState('entering');
        setPendingCategory(null);
      }, 150);
      return () => clearTimeout(timer);
    }
    if (transitionState === 'entering') {
      const timer = setTimeout(() => {
        setTransitionState('');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [transitionState, pendingCategory]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => (activeCategory === 'all' ? true : p.category === activeCategory));
  }, [products, activeCategory]);

  // Handle Wishlist Toggle
  const handleToggleWishlist = (productId: string) => {
    triggerHaptic('light');
    if (onToggleWishlist) {
      onToggleWishlist(productId);
    } else {
      setLocalWishlist((prev) => {
        const next = new Set(prev);
        if (next.has(productId)) {
          next.delete(productId);
        } else {
          next.add(productId);
        }
        return next;
      });
    }
  };

  // Helper to get quantity for a product
  const getProductQty = (product: MonsoonProduct): number => {
    if (cart && typeof cart[product.id] === 'number') {
      return cart[product.id];
    }
    const item = cartStoreItems.find((i) => i.product.id === product.id);
    return item?.quantity || 0;
  };

  // Helper to handle Add
  const handleAdd = (product: MonsoonProduct) => {
    if (onAddToCart) {
      onAddToCart(product.id);
    } else {
      // Map MonsoonProduct to CartProduct structure
      addItem({
        id: product.id,
        name: product.name,
        slug: product.slug,
        imageUrl: product.imageUrl,
        mrp: product.mrp,
        price: product.price,
        discount: product.discount,
        unit: product.unit,
        stock: product.stock,
        isAvailable: product.isAvailable,
        category: {
          id: product.category,
          name: product.category,
          slug: product.category,
          imageUrl: null,
          parentId: null,
          sortOrder: 1,
        },
      });
    }
  };

  // Helper to handle Remove / Decrease
  const handleRemove = (product: MonsoonProduct) => {
    if (onRemoveFromCart) {
      onRemoveFromCart(product.id);
    } else {
      const currentQty = getProductQty(product);
      if (currentQty <= 1) {
        removeItem(product.id, product.name);
      } else {
        updateQuantity(product.id, product.name, currentQty - 1);
      }
    }
  };

  const isWishlisted = (productId: string): boolean => {
    if (wishlist && typeof wishlist.has === 'function') {
      return wishlist.has(productId);
    }
    return localWishlist.has(productId);
  };

  return (
    <View
      style={[
        styles.mainCard,
        {
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
          borderColor: isDarkMode ? '#334155' : '#e2e8f0',
        },
      ]}
    >
      {/* Sky-Blue Header Zone */}
      <LinearGradient
        colors={isDarkMode ? ['#0369a1', '#075985'] : ['#e0f2fe', '#bae6fd']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroBlue}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <Text style={[styles.bannerEyebrow, { color: isDarkMode ? '#bae6fd' : '#0369a1' }]}>
              Everything you need for
            </Text>
            <Text style={[styles.bannerHeading, { color: isDarkMode ? '#ffffff' : '#0c4a6e' }]}>
              Monsoon
            </Text>
          </View>
          <View style={styles.bannerRight}>
            <Text style={styles.bannerArt}>🐸</Text>
            <Text style={styles.bannerArt}>☔</Text>
            <Text style={styles.bannerArt}>🧒</Text>
            <Text style={styles.bannerArt}>🦆</Text>
          </View>
        </View>

        {/* Category Horizontal Slider */}
        <ScrollView
          ref={catStripRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catStripContainer}
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <ScalePressable
                key={cat.id}
                onPress={() => changeCategory(cat.id)}
                scaleValue={0.95}
                style={StyleSheet.flatten([
                  styles.catPill,
                  {
                    backgroundColor: isActive
                      ? isDarkMode ? '#f8fafc' : '#0284c7'
                      : isDarkMode ? 'rgba(15, 23, 42, 0.4)' : '#ffffff',
                    borderColor: isActive
                      ? isDarkMode ? '#ffffff' : '#0284c7'
                      : isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.8)',
                  },
                ])}
              >
                <View
                  style={[
                    styles.catCircle,
                    {
                      backgroundColor: isActive
                        ? isDarkMode ? '#e2e8f0' : '#ffffff'
                        : isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f1f5f9',
                    },
                  ]}
                >
                  <Text style={styles.catEmoji}>{cat.emoji}</Text>
                </View>
                <Text
                  style={[
                    styles.catName,
                    {
                      color: isActive
                        ? isDarkMode ? '#0f172a' : '#ffffff'
                        : isDarkMode ? '#f1f5f9' : '#1e293b',
                      fontWeight: isActive ? '900' : '700',
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </ScalePressable>
            );
          })}
        </ScrollView>
      </LinearGradient>

      {/* Products Section */}
      <View style={styles.prodSection}>
        <Animated.View
          style={{
            opacity: transitionState === 'leaving' ? 0.3 : 1,
          }}
        >
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={{ fontSize: 36, marginBottom: 8 }}>🔍</Text>
              <Text style={[styles.emptyTitle, { color: isDarkMode ? '#f1f5f9' : '#1e293b' }]}>
                No products found
              </Text>
              <Text style={[styles.emptySub, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                Try changing categories
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.prodScrollContainer}
            >
              {filteredProducts.map((p) => {
                const qty = getProductQty(p);
                const liked = isWishlisted(p.id);
                const discountVal = p.originalPrice - p.price;
                const hasDiscount = p.originalPrice > p.price;

                return (
                  <View
                    key={p.id}
                    style={[
                      styles.pcard,
                      {
                        backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
                        borderColor: isDarkMode ? '#334155' : '#f1f5f9',
                      },
                    ]}
                  >
                    {/* Image Area */}
                    <View style={[styles.pcardImg, { backgroundColor: p.bgColor }]}>
                      <Text style={styles.pcardEmoji}>{p.emoji}</Text>

                      {/* Wishlist Heart */}
                      <ScalePressable
                        onPress={() => handleToggleWishlist(p.id)}
                        scaleValue={0.88}
                        style={styles.pcardHeart}
                      >
                        <Heart
                          size={14}
                          color={liked ? '#ef4444' : '#64748b'}
                          fill={liked ? '#ef4444' : 'none'}
                        />
                      </ScalePressable>

                      {/* Dots */}
                      <View style={styles.pcardDots}>
                        <View style={[styles.pdot, styles.pdotOn]} />
                        <View style={styles.pdot} />
                        <View style={styles.pdot} />
                      </View>
                    </View>

                    {/* Pack Size + ADD Button Row */}
                    <View style={styles.pcardAction}>
                      <Text
                        numberOfLines={1}
                        style={[styles.pcardSize, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}
                      >
                        {p.packSize}
                      </Text>

                      <View style={styles.pcardAddWrap}>
                        {(() => {
                          const isCafeItem = isCafeProduct(p);
                          const isClosed = isCafeItem ? !cafeOpen : !groceryMartOpen;
                          if (isClosed) {
                            return (
                              <View style={[styles.pcardAddBtn, { backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9', borderColor: isDarkMode ? '#3f3f46' : '#cbd5e1' }]}>
                                <Text style={[styles.pcardAddTxt, { color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 9.5 }]}>CLOSED</Text>
                              </View>
                            );
                          }
                          if (qty === 0) {
                            return (
                              <ScalePressable
                                onPress={() => handleAdd(p)}
                                scaleValue={0.92}
                                style={styles.pcardAddBtn}
                              >
                                <Text style={styles.pcardAddTxt}>ADD</Text>
                              </ScalePressable>
                            );
                          }
                          return (
                            <View style={styles.pcardQtyBox}>
                              <Pressable
                                onPress={() => handleRemove(p)}
                                style={styles.pcardQtyBtn}
                              >
                                <Text style={styles.pcardQtyBtnTxt}>−</Text>
                              </Pressable>
                              <Text style={styles.pcardQtyNum}>{qty}</Text>
                              <Pressable
                                onPress={() => handleAdd(p)}
                                style={styles.pcardQtyBtn}
                              >
                                <Text style={styles.pcardQtyBtnTxt}>+</Text>
                              </Pressable>
                            </View>
                          );
                        })()}
                      </View>
                    </View>

                    {/* Product Details Section */}
                    <View style={styles.pcardBody}>
                      <View style={styles.pcardPriceRow}>
                        <Text style={[styles.pcardPrice, { color: isDarkMode ? '#ffffff' : '#0f172a' }]}>
                          ₹{p.price.toLocaleString('en-IN')}
                        </Text>
                        {hasDiscount && (
                          <Text style={styles.pcardMrp}>
                            ₹{p.originalPrice.toLocaleString('en-IN')}
                          </Text>
                        )}
                      </View>

                      {hasDiscount ? (
                        <View style={styles.pcardOffTag}>
                          <Text style={styles.pcardOffTxt}>
                            ₹{discountVal.toLocaleString('en-IN')} OFF
                          </Text>
                        </View>
                      ) : (
                        <View style={[styles.pcardOffTag, { opacity: 0 }]}>
                          <Text style={styles.pcardOffTxt}>NO OFF</Text>
                        </View>
                      )}

                      <Text
                        numberOfLines={2}
                        style={[styles.pcardTitle, { color: isDarkMode ? '#f8fafc' : '#1e293b' }]}
                      >
                        {p.name}
                      </Text>

                      <View style={styles.pcardMeta}>
                        <Text style={[styles.pcardMetaTxt, { color: isDarkMode ? '#94a3b8' : '#64748b' }]}>
                          ⏱ {p.deliveryTime}
                        </Text>
                        {p.stockLeft <= 3 && (
                          <Text style={[styles.pcardMetaTxt, { color: '#e11d48' }]}>
                            📦 {p.stockLeft} left
                          </Text>
                        )}
                      </View>

                      <ScalePressable
                        onPress={() => changeCategory(p.category)}
                        scaleValue={0.96}
                        style={styles.pcardLink}
                      >
                        <Text style={styles.pcardLinkTxt}>{p.linkText}</Text>
                        <ChevronRight size={10} color="#0284c7" strokeWidth={3} />
                      </ScalePressable>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      </View>

      {/* See All Products Button */}
      <View style={styles.seeallWrap}>
        <ScalePressable
          onPress={() => {
            changeCategory('all');
            if (onSeeAll) onSeeAll();
          }}
          scaleValue={0.97}
          style={StyleSheet.flatten([
            styles.seeallBtn,
            {
              backgroundColor: isDarkMode ? 'rgba(2, 132, 199, 0.15)' : '#e0f2fe',
              borderColor: isDarkMode ? 'rgba(2, 132, 199, 0.3)' : '#bae6fd',
            },
          ])}
        >
          <Text style={[styles.seeallTxt, { color: isDarkMode ? '#38bdf8' : '#0369a1' }]}>
            🛍️ See all products
          </Text>
          <ChevronRight size={16} color={isDarkMode ? '#38bdf8' : '#0369a1'} strokeWidth={2.5} />
        </ScalePressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  heroBlue: {
    paddingTop: 18,
    paddingBottom: 16,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  bannerLeft: {
    flex: 1,
  },
  bannerEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  bannerHeading: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: -2,
  },
  bannerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bannerArt: {
    fontSize: 22,
  },
  catStripContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    gap: 7,
  },
  catCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catEmoji: {
    fontSize: 14,
  },
  catName: {
    fontSize: 12,
  },
  prodSection: {
    paddingVertical: 16,
  },
  emptyContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 12,
    marginTop: 2,
  },
  prodScrollContainer: {
    paddingHorizontal: 16,
    gap: 14,
  },
  pcard: {
    width: 165,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  pcardImg: {
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pcardEmoji: {
    fontSize: 48,
  },
  pcardHeart: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pcardDots: {
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    gap: 4,
  },
  pdot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  pdotOn: {
    width: 12,
    backgroundColor: '#0284c7',
  },
  pcardAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 8,
    height: 32,
  },
  pcardSize: {
    fontSize: 10,
    fontWeight: '700',
    flex: 1,
  },
  pcardAddWrap: {
    alignItems: 'flex-end',
  },
  pcardAddBtn: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pcardAddTxt: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  pcardQtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0284c7',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pcardQtyBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  pcardQtyBtnTxt: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  pcardQtyNum: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 4,
  },
  pcardBody: {
    padding: 10,
    paddingTop: 6,
  },
  pcardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  pcardPrice: {
    fontSize: 14,
    fontWeight: '900',
  },
  pcardMrp: {
    fontSize: 10,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  pcardOffTag: {
    backgroundColor: '#ffe4e6',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginVertical: 3,
  },
  pcardOffTxt: {
    color: '#e11d48',
    fontSize: 8.5,
    fontWeight: '900',
  },
  pcardTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    lineHeight: 15,
    height: 30,
    marginTop: 2,
  },
  pcardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 6,
  },
  pcardMetaTxt: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  pcardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    backgroundColor: '#f0f9ff',
    paddingVertical: 4,
    borderRadius: 6,
  },
  pcardLinkTxt: {
    color: '#0284c7',
    fontSize: 9.5,
    fontWeight: '800',
  },
  seeallWrap: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  seeallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  seeallTxt: {
    fontSize: 13,
    fontWeight: '800',
  },
});
