import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Linking, Animated, TextInput, Platform, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef, useMemo } from 'react';
import { router, Stack } from 'expo-router';
import { Home, MapPin, CreditCard, Check, Plus, ArrowRight, Briefcase, Coins, QrCode } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useCart } from '../hooks/use-cart';
import { formatPrice, isCafeProduct, formatDisplayOrderId } from '../lib/utils';
import { useResponsive, getCenteredContainerStyle } from '../lib/responsive';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';
import { api } from '../lib/api-client';
import { getDeliveryRules } from '../lib/distance';
import { triggerHaptic } from '../lib/haptic';
import { playSuccessChime } from '../lib/audio';
import { useTheme } from './context/ThemeContext';
import Confetti from '../components/shared/Confetti';
import { ScalePressable } from '../components/shared/ScalePressable';
import { THEME } from '../lib/theme';


interface Address {
  id: string;
  label: string;
  houseNo: string;
  street: string;
  area: string;
  city: string;
  pincode: string;
  phone?: string;
  isDefault: boolean;
  lat?: number;
  lng?: number;
}

// Static styles that never depend on theme
const staticStyles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 120,
  },
  fulfillmentBtnRow: {
    flexDirection: 'row',
    gap: THEME.SPACING.sm,
  },
  fulfillmentBtnInner: {
    flex: 1,
    padding: THEME.SPACING.sm,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.SPACING.xs,
  },
  addressLoading: {
    paddingVertical: THEME.SPACING.lg,
  },
  addressEmptyContainer: {
    alignItems: 'center',
    paddingVertical: THEME.SPACING.lg,
  },
  addressList: {
    gap: THEME.SPACING.sm,
  },
  addressItemInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: THEME.SPACING.sm + 4,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
  },
  addressItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: THEME.SPACING.sm,
  },
  addressIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: THEME.SPACING.sm,
  },
  addressManageText: {
    marginTop: THEME.SPACING.sm,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.xs,
    paddingVertical: 4,
  },
  distanceBannerInner: {
    padding: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.SPACING.sm,
  },
  paymentInner: {
    gap: THEME.SPACING.sm,
  },
  paymentItemInner: {
    padding: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.sm,
  },
  paymentDesc: {
    fontSize: 9,
    marginTop: 2,
  },
  minOrderBannerInner: {
    padding: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: THEME.SPACING.sm,
    marginTop: THEME.SPACING.sm,
  },
  slotScrollContent: {
    gap: THEME.SPACING.sm,
    paddingVertical: 2,
  },
  slotChipInner: {
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.xs + 2,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.xs,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: THEME.SPACING.sm,
    marginTop: THEME.SPACING.xs + 2,
  },
  chipBtn: {
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: 6,
    borderRadius: THEME.RADIUS.sm,
  },
  chipText: {
    fontWeight: '700',
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  successParticlesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  successCheckInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  slideBtnTextWhite: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
});

export default function CheckoutScreen() {
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const { items, getSubtotal, clearCart, updateQuantity, updateCartProduct } = useCart();
  const { isLoggedIn, user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI' | 'CARD'>('COD');
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressesLoading, setIsAddressesLoading] = useState(true);

  const storeLat = useUIStore((s) => s.storeLat);
  const storeLng = useUIStore((s) => s.storeLng);
  const deliveryRadius = useUIStore((s) => s.deliveryRadius);
  const assignedStoreId = useUIStore((s) => s.assignedStoreId);
  const taxRate = useUIStore((s) => s.taxRate);
  const onlyCod = useUIStore((s) => s.onlyCod);
  const miscFee = useUIStore((s) => s.miscFee || 0);
  const miscFeeLabel = useUIStore((s) => s.miscFeeLabel || 'Handling Charge');
  const deliveryFeeBase = useUIStore((s) => s.deliveryFeeBase || 25);
  const groceryFreeDeliveryThreshold = useUIStore((s) => s.groceryFreeDeliveryThreshold || 199);
  const cafeFreeDeliveryThreshold = useUIStore((s) => s.cafeFreeDeliveryThreshold || 199);

  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [isDistanceValidating, setIsDistanceValidating] = useState(false);

  useEffect(() => {
    if (onlyCod) {
      setPaymentMethod('COD');
    }
  }, [onlyCod]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const selectedAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId);
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    const validateAddressDistance = async () => {
      if (deliveryMethod !== 'DELIVERY' || !selectedAddress) {
        setDeliveryDistance(null);
        return;
      }

      setIsDistanceValidating(true);
      let lat = (selectedAddress as any).lat;
      let lng = (selectedAddress as any).lng;

      if (lat === undefined || lng === undefined || lat === null || lng === null) {
        try {
          const addrString = `${selectedAddress.street}, ${selectedAddress.area}, ${selectedAddress.city} ${selectedAddress.pincode}`;
          const geoResults = await Location.geocodeAsync(addrString);
          if (geoResults && geoResults.length > 0) {
            lat = geoResults[0].latitude;
            lng = geoResults[0].longitude;
          } else {
            console.log('Local geocoding returned no results, fetching from backend geocoder:', addrString);
            const response = await api.get(`/geocode?address=${encodeURIComponent(addrString)}`);
            const results = response?.data?.results || response?.results;
            if (results && results.length > 0) {
              const loc = results[0]?.geometry?.location;
              if (loc && loc.lat && loc.lng) {
                lat = loc.lat;
                lng = loc.lng;
                console.log('Backend geocoder resolved coords in checkout:', lat, lng);
              }
            }
          }
        } catch (err) {
          console.warn('Geocoding error in checkout distance check:', err);
        }
      }

      if (lat !== null && lat !== undefined && lng !== null && lng !== undefined) {
        const d = calculateDistance(storeLat, storeLng, lat, lng);
        setDeliveryDistance(d);
      } else {
        setDeliveryDistance(null);
      }
      setIsDistanceValidating(false);
    };

    validateAddressDistance();
  }, [selectedAddress, deliveryMethod]);

  const isOutsideDeliveryZone = useMemo(() => {
    if (deliveryMethod !== 'DELIVERY') return false;
    if (deliveryDistance === null) return false;
    return deliveryDistance > deliveryRadius;
  }, [deliveryDistance, deliveryRadius, deliveryMethod]);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [deliverySlot, setDeliverySlot] = useState('Instant');
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; color: string; size: number; rotate: string }>>([]);
  const confettiProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showSuccessOverlay) {
      triggerHaptic('success');
      confettiProgress.setValue(0);
      Animated.timing(confettiProgress, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }).start();

      const confettiColors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
      const newParticles = Array.from({ length: 30 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 100 + 40;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 30,
          color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
          size: Math.random() * 8 + 6,
          rotate: `${Math.random() * 360}deg`,
        };
      });
      setParticles(newParticles);
    } else {
      setParticles([]);
    }
  }, [showSuccessOverlay]);

  const subtotal = getSubtotal();
  const tax = Math.round(subtotal * (taxRate / 100));

  const groceryItems = useMemo(() => items.filter(item => !isCafeProduct(item.product)), [items]);
  const cafeItems = useMemo(() => items.filter(item => isCafeProduct(item.product)), [items]);

  const grocerySubtotal = useMemo(() =>
    groceryItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [groceryItems]);

  const cafeSubtotal = useMemo(() =>
    cafeItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0), [cafeItems]);

  const surgeMultiplier = useUIStore((s) => s.surgeMultiplier || 1.0);
  const minOrderValue = useUIStore((s) => typeof s.minOrderValue === 'number' ? s.minOrderValue : 99);

  const deliveryRules = useMemo(() => {
    if (deliveryDistance === null || deliveryDistance === undefined) return null;
    return getDeliveryRules(deliveryDistance);
  }, [deliveryDistance]);

  let deliveryFee = 0;
  if (deliveryMethod === 'DELIVERY') {
    const baseFee = deliveryRules?.isServiceable ? deliveryRules.deliveryFee : deliveryFeeBase;
    const feeToCharge = Math.round(baseFee * surgeMultiplier);
    const fallbackThreshold = cafeItems.length > 0 ? cafeFreeDeliveryThreshold : groceryFreeDeliveryThreshold;
    const targetThreshold = deliveryRules?.isServiceable ? deliveryRules.freeDeliveryThreshold : fallbackThreshold;
    deliveryFee = subtotal >= targetThreshold ? 0 : feeToCharge;
  }

  const total = subtotal + tax + deliveryFee + miscFee;
  const isLessThanMinOrder = subtotal < minOrderValue;
  const isCheckoutBlocked = (deliveryMethod === 'DELIVERY' && (!selectedAddressId || isOutsideDeliveryZone || isDistanceValidating)) || isLessThanMinOrder;

  const getAuthHeaders = (): Record<string, string> => {
    if (!user) return {};
    return {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-role': user.role,
      'x-user-email': user.email || '',
      'x-user-name': user.name || '',
      'x-user-phone': user.phone || '',
    };
  };

  const loadAddresses = async () => {
    setIsAddressesLoading(true);
    let localList: Address[] = [];
    try {
      const { mmkvStorage } = require('../lib/storage');
      const localData = await mmkvStorage.getItem(`local_addresses_${user?.id || 'guest'}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          localList = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load local addresses:', e);
    }

    if (!isLoggedIn || !user || user?.id?.startsWith('mock-')) {
      if (localList.length === 0) {
        const defaultFallback: Address = {
          id: 'guest-address-1',
          label: 'Home',
          houseNo: 'House #12',
          street: 'Main Road',
          area: 'Kalyanpur',
          city: 'Kanpur',
          pincode: '209206',
          isDefault: true,
          lat: 26.1534,
          lng: 80.1714,
        };
        localList = [defaultFallback];
      }
      setAddresses(localList);
      const def = localList.find((a: any) => a.isDefault);
      setSelectedAddressId(def ? def.id : localList[0].id);
      setIsAddressesLoading(false);
      return;
    }

    try {
      const backendList = await api.get('/addresses');
      const mergedMap = new Map<string, Address>();

      if (Array.isArray(localList)) {
        localList.forEach(addr => {
          if (addr && addr.id) mergedMap.set(addr.id, addr);
        });
      }

      if (Array.isArray(backendList)) {
        backendList.forEach((addr: Address) => {
          if (addr && addr.id) mergedMap.set(addr.id, addr);
        });
      }

      const mergedList = Array.from(mergedMap.values());
      if (mergedList.length === 0) {
        const defaultFallback: Address = {
          id: 'default-user-addr',
          label: 'Home',
          houseNo: 'House #12',
          street: 'Main Road',
          area: 'Kalyanpur',
          city: 'Kanpur',
          pincode: '209206',
          isDefault: true,
          lat: 26.1534,
          lng: 80.1714,
        };
        mergedList.push(defaultFallback);
      }
      setAddresses(mergedList);
      const exists = mergedList.some((a) => a.id === selectedAddressId);
      if (!exists) {
        const def = mergedList.find((a) => a.isDefault);
        setSelectedAddressId(def ? def.id : mergedList[0].id);
      }
    } catch (err: any) {
      console.warn('Error loading addresses on checkout, using local storage:', err);
      if (localList.length === 0) {
        const defaultFallback: Address = {
          id: 'local-user-addr',
          label: 'Home',
          houseNo: 'House #12',
          street: 'Main Road',
          area: 'Kalyanpur',
          city: 'Kanpur',
          pincode: '209206',
          isDefault: true,
          lat: 26.1534,
          lng: 80.1714,
        };
        localList = [defaultFallback];
      }
      setAddresses(localList);
      const def = localList.find((a: any) => a.isDefault);
      setSelectedAddressId(def ? def.id : localList[0].id);
    } finally {
      setIsAddressesLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Cart is empty', 'Please add items to your cart before placing an order.');
      return;
    }

    if (isCheckoutBlocked) {
      if (isLessThanMinOrder) {
        Alert.alert('Minimum Order Amount', `Minimum order amount is ₹${minOrderValue}. Please add more items.`);
        return;
      }
      if (deliveryMethod === 'DELIVERY' && !selectedAddressId) {
        Alert.alert('Address Required', 'Please select or add a delivery address to proceed.');
        return;
      }
    }

    setIsPlacingOrder(true);
    triggerHaptic('light');

    try {
      try {
        const validateData = await api.post('/products/validate-cart', { items });
        if (validateData.hasChanges && validateData.updates?.length > 0) {
          triggerHaptic('warning');
          validateData.updates?.forEach((update: any) => {
            if (update.type === 'OUT_OF_STOCK') {
              updateCartProduct(update.productId, { isAvailable: false, stock: 0 });
            } else if (update.type === 'QUANTITY_CAP') {
              updateQuantity(update.productId, update.name, update.newVal);
            } else if (update.type === 'PRICE_UPDATE') {
              updateCartProduct(update.productId, { price: update.newVal });
            } else if (update.type === 'MRP_UPDATE') {
              updateCartProduct(update.productId, { mrp: update.newVal });
            }
          });

          Alert.alert(
            'Cart Updated \u{1F6D2}',
            'Some items in your cart had stock or price changes. We have adjusted your cart. Please review and try again.',
            [{ text: 'Review Cart' }]
          );
          setIsPlacingOrder(false);
          return;
        }
      } catch (validationErr) {
        console.warn('Cart validation failed, skipping directly to order placement:', validationErr);
      }

      const activeAddress = addresses.find((a) => a.id === selectedAddressId) || addresses[0];
      const addressId = deliveryMethod === 'PICKUP' ? 'STORE_PICKUP' : (selectedAddressId || activeAddress?.id || 'STORE_PICKUP');

      const payloadItems = items.map((i) => ({
        productId: i.product.id,
        quantity: i.quantity,
        price: i.product.price,
        name: i.product.name,
        product: i.product,
      }));

      const isMockUser = !isLoggedIn || !user || user?.id?.startsWith('mock-');
      let orderData: any;

      if (isMockUser) {
        orderData = {
          id: `order-${Date.now()}`,
          readableId: `FK-${Math.floor(1000 + Math.random() * 9000)}`,
          status: 'PENDING',
          items: payloadItems,
          subtotal,
          deliveryFee,
          taxes: tax,
          miscFee,
          total,
          paymentMethod,
          deliveryMethod,
          createdAt: new Date().toISOString(),
          deliveryInstructions: deliveryInstructions.trim() || undefined,
          deliverySlot: deliverySlot,
          address: deliveryMethod === 'PICKUP' ? null : (activeAddress || {
            label: 'Home',
            houseNo: '#12',
            street: 'Main Street',
            area: 'Kalyanpur',
            city: 'Kanpur',
            pincode: '209206',
          })
        };
      } else {
        try {
          orderData = await api.post('/orders', {
            addressId,
            paymentMethod,
            deliveryMethod,
            items: payloadItems,
            subtotal,
            discount: 0,
            deliveryFee,
            taxes: tax,
            miscFee,
            total,
            storeId: (assignedStoreId && !assignedStoreId.startsWith('default-')) ? assignedStoreId : null,
            deliveryInstructions: deliveryInstructions.trim() || undefined,
            deliverySlot: deliverySlot
          });
        } catch (apiOrderErr: any) {
          console.warn('API Order Placement failed, creating local fallback order:', apiOrderErr);
          orderData = {
            id: `order-${Date.now()}`,
            readableId: `FK-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'PENDING',
            items: payloadItems,
            subtotal,
            deliveryFee,
            taxes: tax,
            miscFee,
            total,
            paymentMethod,
            deliveryMethod,
            createdAt: new Date().toISOString(),
            deliveryInstructions: deliveryInstructions.trim() || undefined,
            deliverySlot: deliverySlot,
            address: deliveryMethod === 'PICKUP' ? null : (activeAddress || {
              label: 'Home',
              houseNo: '#12',
              street: 'Main Street',
              area: 'Kalyanpur',
              city: 'Kanpur',
              pincode: '209206',
            })
          };
        }
      }

      try {
        const { mmkvStorage } = require('../lib/storage');
        const localKey = `local_orders_${user?.id || 'guest'}`;
        const localData = await mmkvStorage.getItem(localKey);
        const list = localData ? JSON.parse(localData) : [];
        const fullSavedOrder = {
          ...orderData,
          items: payloadItems,
          total: orderData.total || total,
          subtotal: orderData.subtotal || subtotal,
          createdAt: orderData.createdAt || new Date().toISOString(),
        };
        list.unshift(fullSavedOrder);
        await mmkvStorage.setItem(localKey, JSON.stringify(list));
      } catch (storageErr) {
        console.warn('Failed to persist order in local MMKV:', storageErr);
      }

      triggerHaptic('success');
      playSuccessChime();
      clearCart();

      if (paymentMethod === 'UPI') {
        const upiUrl = `upi://pay?pa=iamuv26@ptyes&pn=FastKirana&am=${total}&cu=INR&tn=Order_${formatDisplayOrderId(orderData.id, orderData.readableId)}`;
        const canOpen = await Linking.canOpenURL(upiUrl);
        if (canOpen) {
          await Linking.openURL(upiUrl);
          router.replace(`/order/${orderData.id}?celebrate=true`);
          return;
        } else {
          Alert.alert(
            'UPI Apps Not Found \u{1F4F1}',
            'No UPI payment apps (Google Pay, PhonePe, Paytm) were found on this device. Please pay the delivery rider via QR code upon receipt.',
            [{ text: 'Track Order', onPress: () => router.replace(`/order/${orderData.id}?celebrate=true`) }]
          );
          return;
        }
      }

      setShowSuccessOverlay(true);
      setTimeout(() => {
        router.replace(`/order/${orderData.id}?celebrate=true`);
      }, 1600);
    } catch (err: any) {
      triggerHaptic('warning');
      Alert.alert('Order Placement Failed', err.message || 'Something went wrong while placing your order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  // Dynamic styles that reference `colors`
  const themedStyles = StyleSheet.create({
    rootContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: THEME.SPACING.lg,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    headerTitle: {
      fontSize: THEME.TYPOGRAPHY.sizes.titleSm,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      color: colors.textPrimary,
      letterSpacing: -0.5,
    },
    fulfillmentCard: {
      backgroundColor: colors.surface,
      borderRadius: THEME.RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: THEME.SPACING.md,
      marginBottom: THEME.SPACING.sm,
      ...THEME.SHADOWS.sm,
    },
    fulfillmentTitle: {
      color: colors.textPrimary,
      fontSize: THEME.TYPOGRAPHY.sizes.caption,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: THEME.SPACING.sm,
    },
    fulfillmentBtnText: {
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      fontSize: THEME.TYPOGRAPHY.sizes.caption,
    },
    fulfillmentBtnTextActive: {
      color: THEME.COLORS.brand.primary,
    },
    fulfillmentBtnTextInactive: {
      color: colors.textSecondary,
    },
    addressCard: {
      backgroundColor: colors.surface,
      borderRadius: THEME.RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: THEME.SPACING.md,
      marginBottom: THEME.SPACING.sm,
      ...THEME.SHADOWS.sm,
    },
    addressHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: THEME.SPACING.sm,
      paddingBottom: THEME.SPACING.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    addressTitle: {
      color: colors.textPrimary,
      fontSize: THEME.TYPOGRAPHY.sizes.caption,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    addNewBtn: {
      backgroundColor: `${THEME.COLORS.brand.primaryLight}66`,
      borderWidth: 1,
      borderColor: `${THEME.COLORS.brand.primary}1A`,
      paddingHorizontal: THEME.SPACING.sm,
      paddingVertical: 6,
      borderRadius: THEME.RADIUS.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addNewBtnText: {
      color: THEME.COLORS.brand.primary,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      fontSize: 9,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    addressEmptyText: {
      color: colors.textMuted,
      fontSize: THEME.TYPOGRAPHY.sizes.caption,
      fontWeight: '600',
    },
    addressLabel: {
      color: colors.textPrimary,
      fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
      fontSize: THEME.TYPOGRAPHY.sizes.caption,
      marginBottom: 2,
    },
    addressText: {
      color: colors.textSecondary,
      fontSize: 10,
      lineHeight: 14,
      fontWeight: '600',
    },
    distanceValidatingText: {
      color: '#6366f1',
      fontWeight: '700',
      fontSize: 10,
      textTransform: 'uppercase',
    },
    outsideZoneTitle: {
      color: `${THEME.COLORS.brand.error}E6`,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      fontSize: 11,
    },
    outsideZoneText: {
      color: `${THEME.COLORS.brand.error}CC`,
      fontSize: 9,
      fontWeight: '700',
      marginTop: 2,
      lineHeight: 14,
    },
    insideZoneTitle: {
      color: `${THEME.COLORS.brand.success}E6`,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      fontSize: 11,
    },
    insideZoneText: {
      color: `${THEME.COLORS.brand.success}CC`,
      fontSize: 9,
      fontWeight: '700',
      marginTop: 2,
      lineHeight: 14,
    },
    unableVerifyTitle: {
      color: `${THEME.COLORS.brand.warning}E6`,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      fontSize: 11,
    },
    unableVerifyText: {
      color: `${THEME.COLORS.brand.warning}CC`,
      fontSize: 9,
      fontWeight: '700',
      marginTop: 2,
      lineHeight: 14,
    },
    paymentCard: {
      backgroundColor: colors.surface,
      borderRadius: THEME.RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: THEME.SPACING.md,
      marginBottom: THEME.SPACING.sm,
      ...THEME.SHADOWS.sm,
    },
    paymentTitle: {
      color: colors.textPrimary,
      fontSize: THEME.TYPOGRAPHY.sizes.caption,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      marginBottom: THEME.SPACING.sm,
    },
    paymentLabel: {
      fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
      fontSize: THEME.TYPOGRAPHY.sizes.caption,
    },
    paymentLabelActive: {
      color: THEME.COLORS.brand.primary,
    },
    paymentLabelInactive: {
      color: colors.textPrimary,
    },
    minOrderTitle: {
      color: `${THEME.COLORS.brand.warning}E6`,
      fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
      fontSize: THEME.TYPOGRAPHY.sizes.caption,
    },
    minOrderText: {
      color: `${THEME.COLORS.brand.warning}CC`,
      fontSize: 10,
      fontWeight: '600',
      marginTop: 2,
      lineHeight: 16,
    },
    slotCard: {
      backgroundColor: colors.surface,
      borderRadius: THEME.RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: THEME.SPACING.md,
      marginBottom: THEME.SPACING.sm,
      ...THEME.SHADOWS.sm,
    },
    slotTitle: {
      color: colors.textPrimary,
      fontSize: THEME.TYPOGRAPHY.sizes.caption,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: THEME.SPACING.sm,
    },
    slotChipText: {
      fontSize: 11,
    },
    slotChipTextActive: {
      color: THEME.COLORS.brand.primary,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
    },
    slotChipTextInactive: {
      color: colors.textSecondary,
      fontWeight: THEME.TYPOGRAPHY.weights.bold,
    },
    instructionTitle: {
      color: colors.textPrimary,
      fontSize: THEME.TYPOGRAPHY.sizes.caption,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: THEME.SPACING.sm,
    },
    chipText: {
      color: colors.textSecondary,
    },
    bottomBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: THEME.SPACING.lg,
      paddingTop: 12,
      paddingBottom: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      ...THEME.SHADOWS.md,
    },
    totalLabel: {
      fontSize: 9,
      color: colors.textMuted,
      fontWeight: '800',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    totalValue: {
      fontSize: 20,
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      marginTop: 1,
    },
    successContent: {
      alignItems: 'center',
    },
    successTitle: {
      fontWeight: THEME.TYPOGRAPHY.weights.black,
      fontSize: 26,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    successSubtitle: {
      fontWeight: '600',
      fontSize: 12.5,
      textAlign: 'center',
      marginTop: 8,
      paddingHorizontal: 32,
      lineHeight: 18,
    },
  });

  return (
    <SafeAreaView style={themedStyles.rootContainer}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack.Screen options={{ headerShown: false }} />

      {/* Sticky Custom Premium Header with Back Button */}
      <View style={themedStyles.headerContainer}>
        <Pressable
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
          style={{ marginRight: THEME.SPACING.sm, padding: 4 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={themedStyles.headerTitle}>Checkout</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          staticStyles.scrollContent,
          { paddingHorizontal: responsive.spacing.page, paddingVertical: responsive.spacing.card },
          getCenteredContainerStyle(responsive),
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Fulfillment Option */}
        <View style={themedStyles.fulfillmentCard}>
          <Text style={themedStyles.fulfillmentTitle}>Fulfillment Options</Text>
          <View style={staticStyles.fulfillmentBtnRow}>
            <Pressable
              onPress={() => setDeliveryMethod('DELIVERY')}
              style={[
                staticStyles.fulfillmentBtnInner,
                deliveryMethod === 'DELIVERY'
                  ? { backgroundColor: `${THEME.COLORS.brand.primaryLight}80`, borderColor: `${THEME.COLORS.brand.primary}33` }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Home size={16} color={deliveryMethod === 'DELIVERY' ? THEME.COLORS.brand.primary : colors.textSecondary} />
              <Text style={[
                themedStyles.fulfillmentBtnText,
                deliveryMethod === 'DELIVERY' ? themedStyles.fulfillmentBtnTextActive : themedStyles.fulfillmentBtnTextInactive,
              ]}>
                Home Delivery
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setDeliveryMethod('PICKUP')}
              style={[
                staticStyles.fulfillmentBtnInner,
                deliveryMethod === 'PICKUP'
                  ? { backgroundColor: `${THEME.COLORS.brand.primaryLight}80`, borderColor: `${THEME.COLORS.brand.primary}33` }
                  : { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <MapPin size={16} color={deliveryMethod === 'PICKUP' ? THEME.COLORS.brand.primary : colors.textSecondary} />
              <Text style={[
                themedStyles.fulfillmentBtnText,
                deliveryMethod === 'PICKUP' ? themedStyles.fulfillmentBtnTextActive : themedStyles.fulfillmentBtnTextInactive,
              ]}>
                Self-Pickup
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Shipping Address list selection */}
        {deliveryMethod === 'DELIVERY' && (
          <View style={themedStyles.addressCard}>
            <View style={themedStyles.addressHeaderRow}>
              <Text style={themedStyles.addressTitle}>Select Delivery Address</Text>
              <Pressable
                onPress={() => router.push('/addresses')}
                style={themedStyles.addNewBtn}
              >
                <Plus size={10} color={THEME.COLORS.brand.primary} strokeWidth={3} />
                <Text style={themedStyles.addNewBtnText}>Add New</Text>
              </Pressable>
            </View>

            {isAddressesLoading ? (
              <View style={staticStyles.addressLoading}>
                <ActivityIndicator size="small" color={THEME.COLORS.brand.primary} />
              </View>
            ) : addresses.length === 0 ? (
              <View style={staticStyles.addressEmptyContainer}>
                <Text style={themedStyles.addressEmptyText}>No saved addresses found</Text>
                <Pressable onPress={() => router.push('/addresses')}>
                  <Text style={[styles.addressManageText, { color: THEME.COLORS.brand.primary }]}>Manage Addresses</Text>
                </Pressable>
              </View>
            ) : (
              <View style={staticStyles.addressList}>
                {addresses.filter(addr => addr && addr.id).map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  const labelLower = (addr.label || '').toLowerCase();

                  let AddressIcon = MapPin;
                  let iconBg: string;
                  let iconColor: string;

                  if (labelLower.includes('home')) {
                    AddressIcon = Home;
                    iconBg = isDarkMode ? `${THEME.COLORS.brand.primary}26` : `${THEME.COLORS.brand.primary}14`;
                    iconColor = THEME.COLORS.brand.primary;
                  } else if (labelLower.includes('work') || labelLower.includes('office')) {
                    AddressIcon = Briefcase;
                    iconBg = isDarkMode ? `#2563eb26` : `#2563eb14`;
                    iconColor = '#2563eb';
                  } else {
                    iconBg = isDarkMode ? `${colors.textMuted}26` : `${colors.textMuted}14`;
                    iconColor = colors.textMuted;
                  }

                  return (
                    <Pressable
                      key={addr.id}
                      onPress={() => setSelectedAddressId(addr.id)}
                      style={[
                        staticStyles.addressItemInner,
                        isSelected
                          ? { backgroundColor: `${THEME.COLORS.brand.primary}14`, borderColor: `${THEME.COLORS.brand.primary}33` }
                          : { backgroundColor: `${colors.surface}66`, borderColor: colors.borderLight },
                      ]}
                    >
                      <View style={staticStyles.addressItemContent}>
                        <View
                          style={[staticStyles.addressIconCircle, { backgroundColor: iconBg }]}
                        >
                          <AddressIcon size={16} color={iconColor} />
                        </View>
                        <View>
                          <Text style={themedStyles.addressLabel}>{addr.label}</Text>
                          <Text style={themedStyles.addressText}>
                            {[
                              addr.houseNo && addr.houseNo !== '-' ? `House ${addr.houseNo}` : '',
                              addr.street && addr.street !== '-' ? addr.street : '',
                              addr.area && addr.area !== '-' ? addr.area : '',
                              addr.city,
                              addr.pincode ? `- ${addr.pincode}` : ''
                            ].filter(Boolean).join(', ')}
                          </Text>
                        </View>
                      </View>
                      <View style={[
                        { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
                        isSelected
                          ? { borderColor: THEME.COLORS.brand.primary, backgroundColor: THEME.COLORS.brand.primary }
                          : { borderColor: colors.border, backgroundColor: colors.surface },
                      ]}>
                        {isSelected && <Check size={10} color="#ffffff" strokeWidth={3} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Distance Validation Warning Banner */}
            {deliveryMethod === 'DELIVERY' && !!selectedAddressId && (
              <View style={{ marginTop: THEME.SPACING.sm }}>
                {isDistanceValidating ? (
                  <View style={staticStyles.distanceRow}>
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text style={themedStyles.distanceValidatingText}>Validating delivery distance...</Text>
                  </View>
                ) : deliveryDistance !== null ? (
                  isOutsideDeliveryZone ? (
                    <View style={[staticStyles.distanceBannerInner, { backgroundColor: `${THEME.COLORS.brand.error}14`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.error}33` }]}>
                      <Text style={{ fontSize: 16 }}>🛑</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={themedStyles.outsideZoneTitle}>Outside Delivery Zone</Text>
                        <Text style={themedStyles.outsideZoneText}>
                          This address is {deliveryDistance.toFixed(1)} km away, which exceeds our maximum delivery radius of {deliveryRadius} km. Please select Self-Pickup or use another address.
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={[staticStyles.distanceBannerInner, { backgroundColor: `${THEME.COLORS.brand.success}14`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.success}33` }]}>
                      <Text style={{ fontSize: 16 }}>\u{2705}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={themedStyles.insideZoneTitle}>Inside Delivery Zone</Text>
                        <Text style={themedStyles.insideZoneText}>
                          Your address is {deliveryDistance.toFixed(1)} km away from the dark store.
                        </Text>
                      </View>
                    </View>
                  )
                ) : (
                  <View style={[staticStyles.distanceBannerInner, { backgroundColor: `${THEME.COLORS.brand.warning}14`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.warning}33` }]}>
                    <Text style={{ fontSize: 16 }}>⚠️</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={themedStyles.unableVerifyTitle}>Unable to Verify Distance</Text>
                      <Text style={themedStyles.unableVerifyText}>
                        We could not verify the exact coordinates for this address. Please make sure your pincode is correct.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        <View style={themedStyles.paymentCard}>
          <Text style={themedStyles.paymentTitle}>Payment Methods</Text>

          <View style={staticStyles.paymentInner}>
            {[
              { id: 'COD', label: 'Cash on Delivery (COD)', desc: 'Pay with cash upon package receipt', icon: 'COINS' },
              { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)', desc: 'Scan and pay online instantly', icon: 'UPI' },
              { id: 'CARD', label: 'Credit or Debit Card', desc: 'Secure payment with online cards', icon: 'CARD' }
            ].filter(method => !onlyCod || method.id === 'COD').map((method) => {
              const IconComponent = method.icon === 'UPI' ? QrCode : (method.icon === 'COINS' ? Coins : CreditCard);
              return (
                <Pressable
                  key={method.id}
                  onPress={() => {
                    setPaymentMethod(method.id as any);
                    triggerHaptic('light');
                  }}
                  style={[
                    staticStyles.paymentItemInner,
                    paymentMethod === method.id
                      ? { backgroundColor: `${THEME.COLORS.brand.primary}14`, borderColor: `${THEME.COLORS.brand.primary}33`, ...THEME.SHADOWS.sm }
                      : { backgroundColor: colors.surface, borderColor: colors.borderLight },
                  ]}
                >
                  <View style={staticStyles.paymentItemContent}>
                    <IconComponent size={20} color={paymentMethod === method.id ? THEME.COLORS.brand.primary : colors.textSecondary} />
                    <View>
                      <Text style={[
                        themedStyles.paymentLabel,
                        paymentMethod === method.id ? themedStyles.paymentLabelActive : themedStyles.paymentLabelInactive,
                      ]}>
                        {method.label}
                      </Text>
                      <Text style={[themedStyles.paymentDesc, { color: colors.textMuted }]}>{method.desc}</Text>
                    </View>
                  </View>
                  <View style={[
                    { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
                    paymentMethod === method.id
                      ? { borderColor: THEME.COLORS.brand.success, backgroundColor: THEME.COLORS.brand.success }
                      : { borderColor: colors.border, backgroundColor: colors.surface },
                  ]}>
                    {paymentMethod === method.id && (
                      <Check size={11} color="#ffffff" strokeWidth={3} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          {isLessThanMinOrder && (
            <View style={[
              staticStyles.minOrderBannerInner,
              { backgroundColor: `${THEME.COLORS.brand.warning}14`, borderWidth: 1, borderColor: `${THEME.COLORS.brand.warning}33` },
            ]}>
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={themedStyles.minOrderTitle}>Minimum Order Amount Required</Text>
                <Text style={themedStyles.minOrderText}>
                  Minimum order value is {formatPrice(minOrderValue)}. Add items worth {formatPrice(minOrderValue - subtotal)} more to place order.
                </Text>
              </View>
            </View>
          )}
          </View>
        </View>

        {/* Delivery Time Slots & Instructions Options */}
        {deliveryMethod === 'DELIVERY' && (
          <View style={themedStyles.slotCard}>
            {/* Delivery Time Slots */}
            <View>
              <Text style={themedStyles.slotTitle}>Preferred Delivery Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={staticStyles.slotScrollContent}>
                {(() => {
                  const slots = ['Instant'];
                  const now = new Date();
                  const currentHour = now.getHours();
                  for (let h = 8; h <= 20; h += 2) {
                    if (h > currentHour) {
                      const start = h % 12 === 0 ? 12 : h % 12;
                      const end = (h + 2) % 12 === 0 ? 12 : (h + 2) % 12;
                      const startAmPm = h >= 12 ? 'PM' : 'AM';
                      const endAmPm = (h + 2) >= 12 ? 'PM' : 'AM';
                      slots.push(`${start}:00 ${startAmPm} - ${end}:00 ${endAmPm}`);
                    }
                  }
                  return slots;
                })().map((slot) => {
                  const isSelected = deliverySlot === slot;
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => {
                        setDeliverySlot(slot);
                        triggerHaptic('light');
                      }}
                      style={[
                        staticStyles.slotChipInner,
                        isSelected
                          ? { backgroundColor: `${THEME.COLORS.brand.primary}33`, borderColor: THEME.COLORS.brand.primary }
                          : { backgroundColor: `${colors.surface}66`, borderColor: colors.border },
                      ]}
                    >
                      <Text style={[
                        themedStyles.slotChipText,
                        isSelected ? themedStyles.slotChipTextActive : themedStyles.slotChipTextInactive,
                      ]}>
                        {slot === 'Instant' ? '⚡ Instant' : slot}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View style={{ height: 1, backgroundColor: colors.borderLight, marginVertical: THEME.SPACING.md }} />

            {/* Delivery Instructions */}
            <View>
              <Text style={themedStyles.instructionTitle}>Delivery Instructions</Text>

              <TextInput
                value={deliveryInstructions}
                onChangeText={setDeliveryInstructions}
                placeholder="Ring bell, leave package at door, call on arrival, etc..."
                placeholderTextColor={colors.textMuted}
                maxLength={100}
                style={[staticStyles.instructionInput, {
                  backgroundColor: `${colors.surface}66`,
                  borderColor: colors.border,
                  color: colors.textPrimary,
                }]}
                multiline
              />

              {/* Quick Select instruction chips */}
              <View style={staticStyles.chipsContainer}>
                {[
                  '🔔 Ring bell',
                  '🚪 Leave at door',
                  '📞 Call on arrival',
                  '🤫 Avoid bell',
                ].map((chip) => (
                  <Pressable
                    key={chip}
                    onPress={() => {
                      triggerHaptic('light');
                      setDeliveryInstructions(prev => {
                        const cleanVal = chip.substring(2);
                        if (prev.includes(cleanVal)) return prev;
                        return prev ? `${prev}, ${cleanVal}` : cleanVal;
                      });
                    }}
                    style={[staticStyles.chipBtn, { backgroundColor: `${colors.surface}66`, borderWidth: 1, borderColor: `${colors.border}99` }]}
                  >
                    <Text style={themedStyles.chipText}>{chip}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Place Order Sticky bottom */}
      <View style={themedStyles.bottomBar}>
        <View style={{ flex: 1, marginRight: THEME.SPACING.md }}>
          <Text style={themedStyles.totalLabel}>Total To Pay</Text>
          <Text style={themedStyles.totalValue}>{formatPrice(total)}</Text>
        </View>

        <View style={{ flex: 2, height: 52 }}>
          <SlideToPlaceOrderButton
            onSwipeSuccess={handlePlaceOrder}
            isPlacing={isPlacingOrder}
            disabled={isCheckoutBlocked}
            totalPrice={total}
            isCafe={cafeItems.length > 0}
            colors={colors}
          />
        </View>
      </View>

      {/* Success Overlay Sheet */}
      {showSuccessOverlay && (
        <View style={[{ ...StyleSheet.absoluteFillObject, backgroundColor: `${colors.surface}F2`, alignItems: 'center', justifyContent: 'center', paddingHorizontal: THEME.SPACING.lg, zIndex: 50 }]}>
          <Confetti count={50} />
          <View style={themedStyles.successContent}>
            {/* Animated Checkmark Circle with Glow */}
            <View style={[
              { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center', marginBottom: 28 },
              { backgroundColor: isDarkMode ? `${THEME.COLORS.brand.success}14` : THEME.COLORS.brand.successLight },
            ]}>
              {/* Inner glow ring */}
              <View style={[
                { borderColor: THEME.COLORS.brand.success, shadowColor: THEME.COLORS.brand.success },
                themedStyles.successCheckInner,
                { backgroundColor: isDarkMode ? `${THEME.COLORS.brand.success}26` : '#d1fae5' },
              ]}>
                <Check size={48} color={THEME.COLORS.brand.success} strokeWidth={4} />
              </View>

              {/* Confetti Particle Burst overlay */}
              <View style={staticStyles.successParticlesContainer}>
                {particles.map((p) => {
                  const translateX = confettiProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, p.x],
                  });
                  const translateY = confettiProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, p.y],
                  });
                  const scale = confettiProgress.interpolate({
                    inputRange: [0, 0.1, 0.8, 1],
                    outputRange: [0, 1.2, 0.8, 0],
                  });
                  const opacity = confettiProgress.interpolate({
                    inputRange: [0, 0.7, 1],
                    outputRange: [1, 1, 0],
                  });

                  return (
                    <Animated.View
                      key={p.id}
                      style={{
                        position: 'absolute',
                        width: p.size,
                        height: p.size,
                        borderRadius: p.size / 2,
                        backgroundColor: p.color,
                        transform: [
                           { translateX },
                           { translateY },
                           { scale },
                           { rotate: p.rotate }
                        ],
                        opacity,
                      }}
                    />
                  );
                })}
              </View>
            </View>

            {/* Title */}
            <Text style={[themedStyles.successTitle, { color: colors.textPrimary }]}>Order Confirmed! 🎯</Text>

            {/* Subtitle */}
            <Text style={[themedStyles.successSubtitle, { color: colors.textSecondary }]}>
              Your delicious items are being prepared with care. Sit tight — they're on their way!
            </Text>

            {/* Pulsing delivery path line */}
            <View style={[styles.progressLine, { backgroundColor: colors.border }]}>
              <View style={[styles.progressLineFill, { backgroundColor: THEME.COLORS.brand.success }]} />
              <View style={[styles.progressDot, { backgroundColor: THEME.COLORS.brand.success, borderColor: '#ffffff' }]} />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function SlideToPlaceOrderButton({
  onSwipeSuccess,
  isPlacing,
  disabled,
  totalPrice,
  isCafe,
  colors,
}: {
  onSwipeSuccess: () => void;
  isPlacing: boolean;
  disabled: boolean;
  totalPrice: number;
  isCafe: boolean;
  colors: typeof THEME.COLORS.light | typeof THEME.COLORS.dark;
}) {
  const activeColors = isCafe ? (THEME.COLORS.gradients.accent as readonly [string, string]) : (THEME.COLORS.gradients.primary as readonly [string, string]);
  const isDarkMode = colors === THEME.COLORS.dark;
  const brandGlowColor = isCafe ? THEME.COLORS.brand.accent : THEME.COLORS.brand.primary;

  return (
    <ScalePressable
      onPress={() => {
        if (!disabled && !isPlacing) {
          triggerHaptic('success');
          onSwipeSuccess();
        }
      }}
      disabled={disabled || isPlacing}
      scaleValue={0.96}
      style={{ width: '100%', height: 52, borderRadius: 26, overflow: 'hidden', position: 'relative', opacity: disabled ? 0.6 : 1 }}
    >
      <LinearGradient
        colors={disabled ? (isDarkMode ? [colors.surfaceElevated, colors.surface] : [colors.border, colors.surfaceElevated]) : activeColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={Platform.select({
          ios: {
            shadowColor: brandGlowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: disabled ? 0 : 0.15,
            shadowRadius: 6,
          },
          android: {
            elevation: disabled ? 0 : 4,
          },
        })}
      >
        {isPlacing ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm }}>
            <ActivityIndicator size="small" color="#ffffff" />
            <Text allowFontScaling={false} style={staticStyles.slideBtnTextWhite}>Placing Order...</Text>
          </View>
        ) : (
          <>
            <Text allowFontScaling={false} style={[
              { fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 },
              { color: disabled ? colors.textSecondary : '#ffffff' },
            ]}>
              {disabled ? 'Order Blocked' : 'Place Order'}
            </Text>
            {!disabled && <ArrowRight size={16} color="#ffffff" strokeWidth={3.5} />}
          </>
        )}
      </LinearGradient>
    </ScalePressable>
  );
}

// Styles for elements that appear outside the main component scope or are truly static
const styles = StyleSheet.create({
  addressManageText: {
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    textDecorationLine: 'underline',
  },
  instructionInput: {
    borderWidth: 1,
    borderRadius: THEME.RADIUS.md,
    paddingHorizontal: THEME.SPACING.sm + 2,
    paddingVertical: THEME.SPACING.sm,
    fontWeight: '600',
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  progressLine: {
    width: 200,
    height: 4,
    borderRadius: 2,
    marginTop: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  progressLineFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 2,
    width: '66%',
  },
  progressDot: {
    position: 'absolute',
    left: '63%',
    top: -3.5,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    borderWidth: 2,
  },
  slideButton: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    position: 'relative',
  },
});
