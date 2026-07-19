import React from 'react';
import { Modal, View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { useUIStore } from '../../stores/ui-store';
import { useCartStore } from '../../stores/cart-store';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Trash2, AlertTriangle } from 'lucide-react-native';
import { ScalePressable } from '../shared/ScalePressable';
import { triggerHaptic } from '../../lib/haptic';
import { playCartPop } from '../../lib/audio';
import { toast } from '../../lib/toast';

export default function CartConflictDrawer() {
  const pendingProduct = useUIStore((s) => s.pendingConflictProduct);
  const setPendingProduct = useUIStore((s) => s.setPendingConflictProduct);
  
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const addItem = useCartStore((s) => s.addItem);

  if (!pendingProduct) return null;

  const isCafeProduct = (product: any) => {
    const categorySlug = product.category?.slug || product.categorySlug;
    return (
      categorySlug === 'cafe' || 
      product.tags?.includes('cafe')
    );
  };

  const isRestaurantProduct = (product: any) => {
    const categorySlug = product.category?.slug || product.categorySlug;
    return (
      categorySlug === 'restaurant' ||
      product.tags?.includes('restaurant')
    );
  };

  const getProductSegment = (product: any): 'Wedson Restaurant' | 'A.S Cafe' | 'Grocery' => {
    if (isRestaurantProduct(product)) return 'Wedson Restaurant';
    if (isCafeProduct(product)) return 'A.S Cafe';
    return 'Grocery';
  };

  const existingSegment = items.length > 0 ? getProductSegment(items[0].product) : 'Grocery';
  const newSegment = getProductSegment(pendingProduct);

  const activeColor = newSegment === 'A.S Cafe' ? '#ea580c' : '#e20a22';

  const handleCancel = () => {
    triggerHaptic('light');
    setPendingProduct(null);
  };

  const handleClearAndAdd = () => {
    triggerHaptic('medium');
    clearCart();
    
    // Slight timeout to let the store clear settle before adding
    setTimeout(() => {
      addItem(pendingProduct);
      setPendingProduct(null);
      playCartPop();
      triggerHaptic('light');
      toast.success(`${pendingProduct.name} added to cart`);
    }, 100);
  };

  return (
    <Modal
      visible={!!pendingProduct}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        {Platform.OS !== 'web' ? (
          <BlurView intensity={25} style={StyleSheet.absoluteFill} tint="dark" />
        ) : null}
        
        <View style={styles.alertContainer}>
          {/* Glowing Red Trash Icon Wrapper */}
          <View style={styles.iconWrapper}>
            <LinearGradient
              colors={['#fee2e2', '#fecaca']}
              style={styles.iconCircle}
            >
              <Trash2 size={26} color="#ef4444" strokeWidth={2.2} />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Replace Cart Items?
          </Text>
          
          {/* Subtitle / Descriptive alert message */}
          <Text style={styles.message}>
            Your cart already has items from <Text style={styles.boldText}>{existingSegment}</Text>. Adding this item will clear your current cart to proceed with your <Text style={styles.boldText}>{newSegment}</Text> order.
          </Text>

          {/* Warning Banner */}
          <View style={styles.warningBanner}>
            <AlertTriangle size={13} color="#b45309" strokeWidth={2.5} style={{ marginRight: 6 }} />
            <Text style={styles.warningText}>
              Grocery, Cafe, and Restaurant orders are packaged and delivered separately.
            </Text>
          </View>

          {/* Action buttons */}
          <View style={styles.buttonContainer}>
            <ScalePressable
              onPress={handleClearAndAdd}
              scaleValue={0.97}
              style={styles.confirmButton}
            >
              <LinearGradient
                colors={newSegment === 'A.S Cafe' ? ['#ea580c', '#f97316'] : ['#e20a22', '#ff4d64']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                <Text style={styles.confirmButtonText}>Clear & Proceed</Text>
              </LinearGradient>
            </ScalePressable>

            <ScalePressable
              onPress={handleCancel}
              scaleValue={0.97}
              style={styles.cancelButton}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </ScalePressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#ffe4e6',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  iconWrapper: {
    marginBottom: 16,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#0f172a',
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    color: '#475569',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  boldText: {
    color: '#0f172a',
    fontWeight: '800',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    color: '#92400e',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 14,
  },
  buttonContainer: {
    width: '100%',
    gap: 10,
  },
  confirmButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientButton: {
    width: '100%',
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cancelButton: {
    width: '100%',
    height: 46,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    color: '#64748b',
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
