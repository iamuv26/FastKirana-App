import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Plus, Minus, UtensilsCrossed, Star } from 'lucide-react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTheme } from '../../app/context/ThemeContext';
import { triggerHaptic } from '../../lib/haptic';
import { playCartPop } from '../../lib/audio';
import { useCartStore } from '../../stores/cart-store';
import { getAppImageSource } from '../../lib/utils';

interface FoodSpecialCardProps {
  product: any;
  index?: number;
}

export function FoodSpecialCard({ product, index = 0 }: FoodSpecialCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);

  const quantity = useCartStore((state) => {
    const item = state.items.find((i) => i.product.id === product.id);
    return item?.quantity || 0;
  });

  const price = product.price || product.startingPrice || 0;
  const mrp = product.mrp || product.startingMrp || price;
  const discount = product.discount || (mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0);

  const imageSource = React.useMemo(() => {
    if (product.imageUrl) {
      return getAppImageSource(product.imageUrl);
    }
    return null;
  }, [product.imageUrl]);

  const isNonVeg = React.useMemo(() => {
    const tagsLower = (product.tags || []).map((t: string) => String(t).toLowerCase());
    const nameLower = (product.name || '').toLowerCase();
    return (
      tagsLower.includes('nonveg') ||
      tagsLower.includes('non-veg') ||
      tagsLower.includes('chicken') ||
      tagsLower.includes('egg') ||
      nameLower.includes('chicken') ||
      nameLower.includes('egg')
    );
  }, [product.tags, product.name]);

  const handleAdd = (e?: any) => {
    e?.stopPropagation?.();
    triggerHaptic('success');
    playCartPop();
    addItem({
      id: product.id,
      name: product.name,
      slug: product.slug,
      imageUrl: product.imageUrl,
      mrp,
      price,
      discount,
      unit: product.unit || '1 portion',
      stock: product.stock ?? 999,
      category: product.category,
      tags: product.tags || [],
    });
  };

  const handleIncrement = (e?: any) => {
    e?.stopPropagation?.();
    triggerHaptic('light');
    playCartPop();
    updateQuantity(product.id, quantity + 1);
  };

  const handleDecrement = (e?: any) => {
    e?.stopPropagation?.();
    triggerHaptic('light');
    playCartPop();
    updateQuantity(product.id, quantity - 1);
  };

  return (
    <Pressable
      onPress={() => router.push(`/product/${product.slug}`)}
      style={{
        width: 165,
        height: 254,
        borderRadius: 16,
        backgroundColor: isDark ? '#18181b' : '#ffffff',
        borderWidth: 1,
        borderColor: isDark ? 'rgba(234,88,12,0.25)' : '#ffedd5',
        overflow: 'hidden',
        ...Platform.select<any>({
          ios: {
            shadowColor: '#ea580c',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.2 : 0.08,
            shadowRadius: 8,
          },
          android: {
            elevation: 3,
          },
        }),
      }}
    >
      {/* ── Dish Cover Image Area ── */}
      <View style={{ width: '100%', height: 122, backgroundColor: isDark ? '#27272a' : '#fff7ed', position: 'relative' }}>
        {imageSource ? (
          <ExpoImage
            source={imageSource}
            contentFit="cover"
            style={{ width: '100%', height: '100%' }}
            transition={200}
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? '#27272a' : '#ffedd5' }}>
            <UtensilsCrossed size={32} color={isDark ? '#a1a1aa' : '#ea580c'} strokeWidth={1.5} />
          </View>
        )}

        {/* Discount Ribbon (Top-Left) */}
        {discount > 0 && (
          <View
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              backgroundColor: '#ea580c',
              paddingHorizontal: 6,
              paddingVertical: 2.5,
              borderRadius: 6,
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 8.5, fontWeight: '900', letterSpacing: 0.2 }}>
              {discount}% OFF
            </Text>
          </View>
        )}

        {/* Veg / Non-Veg Indicator (Top-Right) */}
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 16,
            height: 16,
            borderRadius: 4,
            borderWidth: 1.5,
            borderColor: isNonVeg ? '#dc2626' : '#16a34a',
            backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: isNonVeg ? '#dc2626' : '#16a34a',
            }}
          />
        </View>

        {/* Rating & Prep Time Badge Overlay (Bottom-Left) */}
        <View
          style={{
            position: 'absolute',
            bottom: 6,
            left: 6,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.82)',
            paddingHorizontal: 6,
            paddingVertical: 2.5,
            borderRadius: 6,
            gap: 3,
          }}
        >
          <Star size={9} color="#f59e0b" fill="#f59e0b" />
          <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '800' }}>4.4</Text>
          <Text style={{ color: '#94a3b8', fontSize: 8, fontWeight: '600' }}>• 15m</Text>
        </View>
      </View>

      {/* ── Dish Info & Stepper ── */}
      <View style={{ flex: 1, padding: 10, justifyContent: 'space-between' }}>
        <View>
          {/* Dish Name */}
          <Text
            numberOfLines={2}
            style={{
              fontSize: 12.5,
              fontWeight: '800',
              color: isDark ? '#fafafa' : '#0f172a',
              lineHeight: 16,
              marginBottom: 2,
            }}
          >
            {product.name}
          </Text>

          {/* Subtitle / Spot Tag */}
          <Text
            numberOfLines={1}
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: '#ea580c',
              letterSpacing: 0.1,
            }}
          >
            FastKirana Kitchen 🍲
          </Text>
        </View>

        {/* Price & Stepper Row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
          <View style={{ flex: 1, paddingRight: 4 }}>
            {mrp > price && (
              <Text style={{ fontSize: 10, textDecorationLine: 'line-through', color: '#94a3b8', fontWeight: '500' }}>
                ₹{mrp}
              </Text>
            )}
            <Text style={{ fontSize: 14, fontWeight: '900', color: isDark ? '#fafafa' : '#0f172a' }}>
              ₹{price}
            </Text>
          </View>

          {/* Stepper / ADD Button */}
          <Animated.View
            layout={LinearTransition.springify().damping(15).stiffness(150)}
            style={{ height: 30 }}
          >
            {quantity === 0 ? (
              <Pressable
                onPress={handleAdd}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={({ pressed }) => ({
                  height: 30,
                  paddingHorizontal: 12,
                  borderRadius: 8,
                  backgroundColor: isDark ? 'rgba(234,88,12,0.15)' : '#fff7ed',
                  borderWidth: 1.5,
                  borderColor: '#ea580c',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text style={{ color: '#ea580c', fontSize: 11, fontWeight: '900', letterSpacing: 0.2 }}>ADD</Text>
                <Plus size={11} color="#ea580c" strokeWidth={3.5} />
              </Pressable>
            ) : (
              <Animated.View
                entering={FadeIn.duration(100)}
                exiting={FadeOut.duration(100)}
                style={{
                  height: 30,
                  width: 82,
                  borderRadius: 8,
                  borderWidth: 1.5,
                  borderColor: '#ea580c',
                  backgroundColor: isDark ? '#27272a' : '#fff7ed',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 4,
                }}
              >
                <Pressable
                  onPress={handleDecrement}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 4 }}
                  style={({ pressed }) => ({
                    width: 22,
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.5 : 1,
                  })}
                >
                  <Minus size={12} color="#ea580c" strokeWidth={3.5} />
                </Pressable>

                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: isDark ? '#fafafa' : '#0f172a', fontSize: 12.5, fontWeight: '900' }}>
                    {quantity}
                  </Text>
                </View>

                <Pressable
                  onPress={handleIncrement}
                  hitSlop={{ top: 10, bottom: 10, left: 4, right: 10 }}
                  style={({ pressed }) => ({
                    width: 22,
                    height: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: pressed ? 0.5 : 1,
                  })}
                >
                  <Plus size={12} color="#ea580c" strokeWidth={3.5} />
                </Pressable>
              </Animated.View>
            )}
          </Animated.View>
        </View>
      </View>
    </Pressable>
  );
}

const MemoizedFoodSpecialCard = React.memo(FoodSpecialCard, (prevProps, nextProps) => {
  return (
    prevProps.product?.id === nextProps.product?.id &&
    prevProps.product?.price === nextProps.product?.price &&
    prevProps.product?.mrp === nextProps.product?.mrp &&
    prevProps.index === nextProps.index
  );
});

export default MemoizedFoodSpecialCard;
