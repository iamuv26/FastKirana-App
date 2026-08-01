import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useCart } from '../../hooks/use-cart';
import { formatPrice } from '../../lib/utils';
import { useTheme } from '../../app/context/ThemeContext';
import { triggerHaptic } from '../../lib/haptic';
import { ScalePressable } from './ScalePressable';

interface CartQuickPreviewSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function CartQuickPreviewSheet({ visible, onClose }: CartQuickPreviewSheetProps) {
  const { items, getTotalItems, getSubtotal, updateQuantity, removeItem } = useCart();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(800);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 22, stiffness: 220, mass: 0.7 });
      backdropOpacity.value = withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) });
    } else {
      translateY.value = withTiming(800, { duration: 220, easing: Easing.in(Easing.cubic) });
      backdropOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const handleClose = () => {
    triggerHaptic('light');
    onClose();
  };

  const goToFullCart = () => {
    handleClose();
    setTimeout(() => router.push('/cart'), 220);
  };

  const goToCheckout = () => {
    handleClose();
    setTimeout(() => router.push('/checkout'), 220);
  };

  const itemCount = getTotalItems();
  const subtotal = getSubtotal();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              paddingBottom: insets.bottom + 16,
            },
            sheetStyle,
          ]}
        >
          {/* Drag handle */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(15,23,42,0.18)' },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.bagBubble,
                  { backgroundColor: isDark ? 'rgba(226,10,34,0.16)' : '#fee2e2' },
                ]}
              >
                <ShoppingBag size={18} color="#e20a22" strokeWidth={2.2} />
              </View>
              <View>
                <Text
                  style={[
                    styles.headerTitle,
                    { color: isDark ? '#fafafa' : '#0f172a' },
                  ]}
                >
                  Your Cart
                </Text>
                <Text
                  style={[
                    styles.headerSub,
                    { color: isDark ? '#a1a1aa' : '#64748b' },
                  ]}
                >
                  {itemCount} {itemCount === 1 ? 'item' : 'items'}
                </Text>
              </View>
            </View>
            <ScalePressable onPress={handleClose} haptic="light" style={styles.closeBtn}>
              <X size={20} color={isDark ? '#a1a1aa' : '#64748b'} strokeWidth={2.2} />
            </ScalePressable>
          </View>

          {/* Items */}
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          >
            {items.length === 0 ? (
              <View style={styles.emptyState}>
                <View
                  style={[
                    styles.emptyBag,
                    { backgroundColor: isDark ? 'rgba(244,63,94,0.08)' : '#fff1f2' },
                  ]}
                >
                  <ShoppingBag size={32} color={isDark ? '#71717a' : '#cbd5e1'} strokeWidth={1.5} />
                </View>
                <Text
                  style={[
                    styles.emptyTitle,
                    { color: isDark ? '#fafafa' : '#0f172a' },
                  ]}
                >
                  Cart is empty
                </Text>
                <Text
                  style={[
                    styles.emptySub,
                    { color: isDark ? '#a1a1aa' : '#64748b' },
                  ]}
                >
                  Add some items to get started
                </Text>
              </View>
            ) : (
              items.map((item) => (
                <View
                  key={item.product.id}
                  style={[
                    styles.itemRow,
                    {
                      borderBottomColor: isDark
                        ? 'rgba(255,255,255,0.06)'
                        : 'rgba(15,23,42,0.06)',
                    },
                  ]}
                >
                  <View style={styles.itemMain}>
                    <View style={{ flex: 1 }}>
                      <Text
                        numberOfLines={2}
                        style={[
                          styles.itemName,
                          { color: isDark ? '#fafafa' : '#0f172a' },
                        ]}
                      >
                        {item.product.name}
                      </Text>
                      <Text
                        style={[
                          styles.itemPrice,
                          { color: isDark ? '#a1a1aa' : '#64748b' },
                        ]}
                      >
                        {formatPrice(item.product.price)} · {item.product.unit}
                      </Text>
                    </View>

                    {/* Qty stepper */}
                    <View
                      style={[
                        styles.stepper,
                        {
                          backgroundColor: isDark
                            ? 'rgba(244,63,94,0.12)'
                            : 'rgba(226,10,34,0.08)',
                          borderColor: isDark
                            ? 'rgba(244,63,94,0.2)'
                            : 'rgba(226,10,34,0.18)',
                        },
                      ]}
                    >
                      <Pressable
                        hitSlop={6}
                        onPress={() => {
                          if (item.quantity <= 1) {
                            removeItem(item.product.id, item.product.name);
                          } else {
                            updateQuantity(item.product.id, item.product.name, item.quantity - 1);
                          }
                        }}
                        style={styles.stepperBtn}
                      >
                        {item.quantity <= 1 ? (
                          <Trash2 size={12} color="#e20a22" strokeWidth={2.5} />
                        ) : (
                          <Minus size={12} color="#e20a22" strokeWidth={2.5} />
                        )}
                      </Pressable>
                      <Text style={styles.stepperQty}>{item.quantity}</Text>
                      <Pressable
                        hitSlop={6}
                        onPress={() => {
                          updateQuantity(item.product.id, item.product.name, item.quantity + 1);
                        }}
                        style={styles.stepperBtn}
                      >
                        <Plus size={12} color="#e20a22" strokeWidth={2.5} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          {items.length > 0 && (
            <View
              style={[
                styles.footer,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(15,23,42,0.04)',
                  borderTopColor: isDark
                    ? 'rgba(255,255,255,0.06)'
                    : 'rgba(15,23,42,0.06)',
                },
              ]}
            >
              <View style={styles.subtotalRow}>
                <Text
                  style={[
                    styles.subtotalLabel,
                    { color: isDark ? '#a1a1aa' : '#64748b' },
                  ]}
                >
                  Subtotal
                </Text>
                <Text
                  style={[
                    styles.subtotalValue,
                    { color: isDark ? '#fafafa' : '#0f172a' },
                  ]}
                >
                  {formatPrice(subtotal)}
                </Text>
              </View>
              <View style={styles.actionRow}>
                <ScalePressable
                  onPress={goToFullCart}
                  haptic="light"
                  style={[
                    styles.secondaryBtn,
                    {
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.12)'
                        : 'rgba(15,23,42,0.12)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.secondaryBtnText,
                      { color: isDark ? '#fafafa' : '#0f172a' },
                    ]}
                  >
                    View cart
                  </Text>
                  <ChevronRight size={14} color={isDark ? '#fafafa' : '#0f172a'} strokeWidth={2.4} />
                </ScalePressable>
                <ScalePressable
                  onPress={goToCheckout}
                  haptic="medium"
                  style={styles.primaryBtn}
                >
                  <Text style={styles.primaryBtnText}>Checkout</Text>
                  <ChevronRight size={14} color="#ffffff" strokeWidth={2.4} />
                </ScalePressable>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    width: '100%',
    maxHeight: '80%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
      },
      android: {
        elevation: 16,
      },
    }),
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bagBubble: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyBag: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  emptySub: {
    fontSize: 12,
    fontWeight: '500',
  },
  itemRow: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemName: {
    fontSize: 13.5,
    fontWeight: '700',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 11,
    fontWeight: '600',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    height: 30,
    paddingHorizontal: 2,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperQty: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#e20a22',
    minWidth: 18,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  subtotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subtotalLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtotalValue: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryBtn: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  secondaryBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  primaryBtn: {
    flex: 1.2,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#e20a22',
    gap: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#e20a22',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  primaryBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
});