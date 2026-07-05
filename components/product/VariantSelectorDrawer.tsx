import { View, Text, Pressable, ScrollView, Modal, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useUIStore } from '../../stores/ui-store';
import { useCart } from '../../hooks/use-cart';
import { X, Plus, Minus, ShieldCheck } from 'lucide-react-native';
import { useMemo } from 'react';
import { formatPrice, getOptimizedImageUrl } from '../../lib/utils';
import { API_BASE_URL } from '../../lib/constants';
import { useTheme } from '../../app/context/ThemeContext';
import { triggerHaptic } from '../../lib/haptic';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

interface VariantRowProps {
  variant: any;
  product: any;
  cafeOpen: boolean;
  groceryMartOpen: boolean;
}

function VariantRow({ variant, product, cafeOpen, groceryMartOpen }: VariantRowProps) {
  const { getItemQuantity, addItem, updateQuantity } = useCart();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const resolvedId = `${product.id}_${variant.name}`;
  const quantity = getItemQuantity(resolvedId);

  const resolvedStock = variant.stock;
  const resolvedPrice = variant.price;
  const resolvedMrp = variant.mrp;
  const resolvedIsAvailable = product.isAvailable ?? true;

  const discount = resolvedMrp > resolvedPrice
    ? Math.max(0, Math.round(((resolvedMrp - resolvedPrice) / resolvedMrp) * 100))
    : 0;

  const isCafe = product.category?.slug === 'cafe' || (product.tags && product.tags.includes('cafe'));
  const isStoreClosed = isCafe ? !cafeOpen : !groceryMartOpen;

  const cartProduct = useMemo(() => ({
    id: resolvedId,
    name: `${product.name} (${variant.name})`,
    slug: product.slug,
    imageUrl: product.imageUrl,
    mrp: resolvedMrp,
    price: resolvedPrice,
    discount: discount,
    unit: variant.name, // Display the variant name (e.g. 500g, 1L) as unit in cart
    stock: resolvedStock,
    isAvailable: resolvedIsAvailable,
    category: product.category,
  }), [product, variant, resolvedId, resolvedMrp, resolvedPrice, discount, resolvedStock, resolvedIsAvailable]);

  const handleAdd = () => {
    addItem(cartProduct);
  };

  const handleIncrement = () => {
    updateQuantity(resolvedId, cartProduct.name, quantity + 1);
  };

  const handleDecrement = () => {
    updateQuantity(resolvedId, cartProduct.name, quantity - 1);
  };

  const isSelected = quantity > 0;

  return (
    <View style={[
      styles.variantRowContainer,
      {
        borderColor: isSelected
          ? '#10b981'
          : isDarkMode ? '#27272a' : '#f1f5f9',
        backgroundColor: isSelected
          ? (isDarkMode ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.05)')
          : (isDarkMode ? 'rgba(39,39,42,0.4)' : '#ffffff')
      }
    ]}>
      <View style={styles.variantInfo}>
        <Text style={[styles.variantName, { color: isDarkMode ? '#e4e4e7' : '#1e293b' }]}>
          {variant.name}
        </Text>
        <View style={styles.variantPriceRow}>
          <Text style={[styles.variantPrice, { color: isDarkMode ? '#e4e4e7' : '#1e293b' }]}>
            {formatPrice(resolvedPrice)}
          </Text>
          {resolvedMrp > resolvedPrice && (
            <>
              <Text style={[styles.variantMrp, { color: isDarkMode ? '#71717a' : '#94a3b8' }]}>
                {formatPrice(resolvedMrp)}
              </Text>
              <View style={[styles.discountTag, { backgroundColor: isDarkMode ? 'rgba(244,63,94,0.15)' : '#fff1f2' }]}>
                <Text style={[styles.discountTagText, { color: isDarkMode ? '#fb7185' : '#e11d48' }]}>
                  {discount}% OFF
                </Text>
              </View>
            </>
          )}
        </View>
        {resolvedStock > 0 && resolvedStock <= 10 && (
          <Text style={styles.lowStockText}>
            Only {resolvedStock} left in stock!
          </Text>
        )}
      </View>

      {/* Cart Actions */}
      <View style={{ width: 80, height: 32 }}>
        {quantity === 0 ? (
          <View style={styles.variantAddBtn}>
            <Pressable
              onPress={handleAdd}
              disabled={resolvedStock <= 0 || isStoreClosed}
              style={styles.variantAddBtnPressable}
            >
              <Text style={styles.variantAddBtnText}>
                {resolvedStock <= 0 ? 'Out' : isStoreClosed ? 'Closed' : '+ ADD'}
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.variantStepperWrap}>
            <Pressable onPress={handleDecrement} style={styles.variantStepperBtn}>
              <Minus size={13} color="#ffffff" strokeWidth={3} />
            </Pressable>
            <View style={styles.variantStepperQty}>
              <Text style={styles.variantStepperQtyText}>
                {quantity}
              </Text>
            </View>
            <Pressable
              onPress={handleIncrement}
              disabled={quantity >= resolvedStock || isStoreClosed}
              style={[styles.variantStepperBtn, quantity >= resolvedStock && { opacity: 0.4 }]}
            >
              <Plus size={13} color="#ffffff" strokeWidth={3} />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

export default function VariantSelectorDrawer() {
  const activeProduct = useUIStore((s) => s.activeVariantProduct);
  const setActiveProduct = useUIStore((s) => s.setActiveVariantProduct);
  const cafeOpen = useUIStore((s) => s.cafeOpen);
  const groceryMartOpen = useUIStore((s) => s.groceryMartOpen);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const insets = useSafeAreaInsets();

  const isOpen = activeProduct !== null;

  const variantsList = useMemo(() => {
    if (!activeProduct || !activeProduct.variants || !Array.isArray(activeProduct.variants)) return [];
    return activeProduct.variants;
  }, [activeProduct]);

  const getProductImage = () => {
    if (!activeProduct) return null;
    if (activeProduct.imageUrl) {
      if (activeProduct.imageUrl.startsWith('/')) {
        const baseDomain = API_BASE_URL.replace('/api', '');
        return { uri: `${baseDomain}${activeProduct.imageUrl}` };
      }
      return { uri: getOptimizedImageUrl(activeProduct.imageUrl, 200) };
    }

    // Fallback to Category specific images
    const prefix = activeProduct.id.slice(0, 2);
    let categoryKey = '';
    if (prefix === 'fv') categoryKey = 'fruits-vegetables';
    else if (prefix === 'db') categoryKey = 'dairy-breakfast';
    else if (prefix === 'sm') categoryKey = 'snacks-munchies';
    else if (prefix === 'bv') categoryKey = 'beverages';
    else if (prefix === 'pc') categoryKey = 'personal-care';
    else if (prefix === 'hh') categoryKey = 'household';
    else if (prefix === 'bb') categoryKey = 'bakery-biscuits';
    else if (prefix === 'de' || prefix === 'oi') categoryKey = 'atta-rice-dal';

    return CATEGORY_IMAGES[categoryKey] || null;
  };

  const imageSource = getProductImage();

  return (
    <Modal
      transparent={true}
      visible={isOpen}
      animationType="slide"
      onRequestClose={() => setActiveProduct(null)}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop Pressable */}
        <Pressable 
          style={StyleSheet.absoluteFill} 
          onPress={() => setActiveProduct(null)} 
        />
        
        {/* Sliding Card Content */}
        <View 
          style={[
            styles.drawerContent, 
            { 
              backgroundColor: isDarkMode ? '#1e1e24' : '#ffffff',
              borderColor: isDarkMode ? '#2d2d34' : '#e2e8f0',
              paddingBottom: Math.max(insets.bottom, 16) + 84,
            }
          ]}
        >
          {/* Header Drag Handle indicator */}
          <View style={styles.dragHandle} />

          {activeProduct && (
            <View style={styles.contentContainer}>
              {/* Product Info Block */}
              <View style={[styles.productHeader, { borderColor: isDarkMode ? '#2d2d34' : '#f1f5f9' }]}>
                <View style={styles.productImageWrap}>
                  {imageSource ? (
                    <Image
                      source={imageSource}
                      contentFit="contain"
                      style={{ width: '100%', height: '100%' }}
                    />
                  ) : (
                    <Text style={{ fontSize: 24 }}>📦</Text>
                  )}
                </View>
                <View style={styles.productMeta}>
                  <Text style={[styles.productNameText, { color: isDarkMode ? '#ffffff' : '#1e293b' }]} numberOfLines={2}>
                    {activeProduct.name}
                  </Text>
                  <Text style={[styles.productUnitText, { color: isDarkMode ? '#a1a1aa' : '#94a3b8' }]}>
                    {activeProduct.unit}
                  </Text>
                </View>
                <Pressable
                  onPress={() => setActiveProduct(null)}
                  style={({ pressed }) => [
                    styles.closeBtn,
                    pressed && { opacity: 0.7 }
                  ]}
                >
                  <X size={16} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
                </Pressable>
              </View>

              {/* Title label */}
              <Text style={styles.sectionTitle}>
                Select Option / Quantity
              </Text>

              {/* Variants Scroll view */}
              <ScrollView 
                showsVerticalScrollIndicator={false}
                style={styles.variantsScroll}
              >
                {variantsList.map((v: any) => (
                  <VariantRow
                    key={v.name}
                    variant={v}
                    product={activeProduct}
                    cafeOpen={cafeOpen}
                    groceryMartOpen={groceryMartOpen}
                  />
                ))}
              </ScrollView>

              {/* Security Trust badge */}
              <View style={[
                styles.trustBadge,
                { 
                  borderColor: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.15)',
                  backgroundColor: isDarkMode ? 'rgba(16,185,129,0.03)' : 'rgba(16,185,129,0.05)'
                }
              ]}>
                <ShieldCheck size={18} color="#10b981" style={{ marginTop: 2 }} />
                <View style={styles.trustBadgeTextWrap}>
                  <Text style={styles.trustBadgeTitle}>
                    FastKirana DarkStore Guaranteed
                  </Text>
                  <Text style={[styles.trustBadgeDesc, { color: isDarkMode ? '#a1a1aa' : '#64748b' }]}>
                    Packed fresh, hygiene verified, and delivered directly to your doorstep.
                  </Text>
                </View>
              </View>

              {/* Continue Shopping Button */}
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setActiveProduct(null);
                }}
                style={({ pressed }) => [
                  styles.continueBtn,
                  { opacity: pressed ? 0.9 : 1 }
                ]}
              >
                <Text style={styles.continueBtnText}>CONTINUE SHOPPING  →</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  drawerContent: {
    width: '100%',
    height: Math.round(Dimensions.get('window').height * 0.72),
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
  },
  dragHandle: {
    width: 48,
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  productHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    paddingBottom: 16,
    marginBottom: 16,
  },
  productMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  productNameText: {
    fontWeight: '900',
    fontSize: 15,
    lineHeight: 18,
  },
  productUnitText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#94a3b8',
    marginBottom: 12,
  },
  variantsScroll: {
    maxHeight: 180,
    marginBottom: 16,
  },
  variantRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  variantInfo: {
    flex: 1,
    paddingRight: 12,
  },
  variantName: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  variantPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
    gap: 6,
    flexWrap: 'wrap',
  },
  variantPrice: {
    fontSize: 14,
    fontWeight: '900',
  },
  variantMrp: {
    fontSize: 10,
    textDecorationLine: 'line-through',
    fontWeight: '700',
  },
  discountTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountTagText: {
    fontWeight: '900',
    fontSize: 8,
    textTransform: 'uppercase',
  },
  lowStockText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ef4444',
    marginTop: 4,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  trustBadgeTextWrap: {
    flex: 1,
  },
  trustBadgeTitle: {
    color: '#047857',
    fontWeight: '900',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trustBadgeDesc: {
    fontSize: 9.5,
    fontWeight: '700',
    marginTop: 4,
    lineHeight: 13,
  },
  variantAddBtn: {
    width: '100%',
    height: '100%',
    borderWidth: 1.5,
    borderColor: '#0c831f',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  variantAddBtnPressable: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  variantAddBtnText: {
    color: '#0c831f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  variantStepperWrap: {
    flexDirection: 'row',
    height: 32,
    width: 80,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#2d5a27',
  },
  variantStepperBtn: {
    width: 26,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantStepperQty: {
    width: 28,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  variantStepperQtyText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f8fafc',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  continueBtn: {
    marginTop: 16,
    backgroundColor: '#0c831f',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  continueBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
