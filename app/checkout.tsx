import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Linking, PanResponder, Animated, TouchableOpacity, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { router, usePathname, Stack, useFocusEffect } from 'expo-router';
import { Home, MapPin, CreditCard, ChevronRight, Check, Plus, ArrowRight, Briefcase, ArrowLeft } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useCart } from '../hooks/use-cart';
import { formatPrice, isCafeProduct } from '../lib/utils';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';
import { API_BASE_URL, FREE_DELIVERY_THRESHOLD, GROCERY_FREE_DELIVERY_THRESHOLD, CAFE_FREE_DELIVERY_THRESHOLD, COMBINED_FREE_DELIVERY_THRESHOLD, DELIVERY_FEE, TAX_RATE } from '../lib/constants';
import { api } from '../lib/api-client';
import { getDeliveryRules } from '../lib/distance';
import { toast } from '../lib/toast';
import { triggerHaptic } from '../lib/haptic';
import { playSuccessChime } from '../lib/audio';
import { useTheme } from './context/ThemeContext';

interface Address {
  id: string;
  label: string;
  houseNo: string;
  street: string;
  area: string;
  city: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

export default function CheckoutScreen() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { items, getSubtotal, clearCart, updateQuantity, updateCartProduct } = useCart();
  const { isLoggedIn, user } = useAuthStore();
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'UPI' | 'CARD'>('COD');
  const [deliveryMethod, setDeliveryMethod] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddressesLoading, setIsAddressesLoading] = useState(true);

  // Delivery distance validation states
  const storeLat = useUIStore((s) => s.storeLat);
  const storeLng = useUIStore((s) => s.storeLng);
  const deliveryRadius = useUIStore((s) => s.deliveryRadius);
  const assignedStoreId = useUIStore((s) => s.assignedStoreId);
  
  const [deliveryDistance, setDeliveryDistance] = useState<number | null>(null);
  const [isDistanceValidating, setIsDistanceValidating] = useState(false);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of earth in km
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
        duration: 1500,
        useNativeDriver: true,
      }).start();

      const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#14b8a6'];
      const newParticles = Array.from({ length: 45 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * 160 + 60;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance - 30,
          color: colors[Math.floor(Math.random() * colors.length)],
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
  const tax = Math.round(subtotal * TAX_RATE);

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
    const baseFee = deliveryRules?.isServiceable ? deliveryRules.deliveryFee : DELIVERY_FEE;
    const feeToCharge = Math.round(baseFee * surgeMultiplier);
    const targetThreshold = deliveryRules?.isServiceable ? deliveryRules.freeDeliveryThreshold : 200;
    deliveryFee = subtotal >= targetThreshold ? 0 : feeToCharge;
  }

  const total = subtotal + tax + deliveryFee;
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
    if (!isLoggedIn || !user) {
      setIsAddressesLoading(false);
      return;
    }
    setIsAddressesLoading(true);
    let localList: Address[] = [];
    try {
      const { mmkvStorage } = require('../lib/storage');
      const localData = mmkvStorage.getItem(`local_addresses_${user?.id || 'guest'}`);
      if (localData) {
        const parsed = JSON.parse(localData);
        if (Array.isArray(parsed)) {
          localList = parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load local addresses:', e);
    }

    if (user?.id?.startsWith('mock-')) {
      setAddresses(localList);
      if (localList.length > 0) {
        const def = localList.find((a: any) => a.isDefault);
        setSelectedAddressId(def ? def.id : localList[0].id);
      }
      setIsAddressesLoading(false);
      return;
    }

    try {
      const backendList = await api.get('/addresses');
      const mergedMap = new Map<string, Address>();
      
      // Load local ones first, then overwrite/append backend ones
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
      setAddresses(mergedList);
      if (mergedList.length > 0) {
        const exists = mergedList.some((a) => a.id === selectedAddressId);
        if (!exists) {
          const def = mergedList.find((a) => a.isDefault);
          setSelectedAddressId(def ? def.id : mergedList[0].id);
        }
      } else {
        setSelectedAddressId('');
      }
    } catch (err: any) {
      console.warn('Error loading addresses on checkout, using local storage:', err);
      setAddresses(localList);
      if (localList.length > 0) {
        const exists = localList.some((a) => a.id === selectedAddressId);
        if (!exists) {
          const def = localList.find((a) => a.isDefault);
          setSelectedAddressId(def ? def.id : localList[0].id);
        }
      } else {
        setSelectedAddressId('');
      }
    } finally {
      setIsAddressesLoading(false);
    }
  };

  // Reload addresses every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (isLoggedIn) {
        loadAddresses();
      }
    }, [isLoggedIn, user])
  );

  const handlePlaceOrder = async () => {
    if (!isLoggedIn) {
      Alert.alert(
        'Authentication Required',
        'Please log in or sign up to complete your order.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }



    if (deliveryMethod === 'DELIVERY' && !selectedAddressId) {
      Alert.alert('Delivery Address Required', 'Please select or add a delivery address.');
      return;
    }

    if (deliveryMethod === 'DELIVERY' && isOutsideDeliveryZone) {
      Alert.alert(
        'Outside Delivery Zone 🛑',
        `The selected address is ${deliveryDistance?.toFixed(1)} km away, which exceeds our standard delivery radius of ${deliveryRadius} km. Please choose Self-Pickup or select another address.`
      );
      return;
    }

    setIsPlacingOrder(true);
    triggerHaptic('light');

    try {
      // 1. Validate cart against live database stock & prices
      try {
        const validateData = await api.post('/products/validate-cart', { items });
        if (validateData.hasChanges && validateData.updates?.length > 0) {
          triggerHaptic('warning');
          // Apply updates to client cart
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
            'Cart Updated 🛒',
            'Some items in your cart had stock or price changes. We have adjusted your cart. Please review and try again.',
            [{ text: 'Review Cart' }]
          );
          setIsPlacingOrder(false);
          return;
        }
      } catch (validationErr) {
        console.warn('Cart validation failed, skipping directly to order placement:', validationErr);
      }

      // 2. Resolve target address (or store pickup marker)
      const addressId = deliveryMethod === 'PICKUP' ? 'STORE_PICKUP' : selectedAddressId;

      // 3. Resolve order data
      const isMockUser = user?.id?.startsWith('mock-');
      let orderData: any;

      if (isMockUser) {
        orderData = {
          id: `mock-order-${Date.now()}`,
          status: 'PENDING',
          items,
          subtotal,
          deliveryFee,
          taxes: tax,
          total,
          paymentMethod,
          deliveryMethod,
          createdAt: new Date().toISOString(),
          deliveryInstructions: deliveryInstructions.trim() || undefined,
          deliverySlot: deliverySlot,
          address: deliveryMethod === 'PICKUP' ? null : {
            label: 'Home',
            houseNo: '-',
            street: '-',
            area: 'Demo Address',
            city: 'Kanpur',
            pincode: '209206'
          }
        };

        // Save mock order locally in MMKV
        const { mmkvStorage } = require('../lib/storage');
        const localKey = `local_orders_${user?.id || 'guest'}`;
        const localData = mmkvStorage.getItem(localKey);
        const list = localData ? JSON.parse(localData) : [];
        list.unshift(orderData);
        mmkvStorage.setItem(localKey, JSON.stringify(list));
      } else {
        // Place real order via API
        orderData = await api.post('/orders', {
          addressId,
          paymentMethod,
          deliveryMethod,
          items,
          subtotal,
          discount: 0,
          deliveryFee,
          taxes: tax,
          total,
          storeId: assignedStoreId,
          deliveryInstructions: deliveryInstructions.trim() || undefined,
          deliverySlot: deliverySlot
        });
      }

      // Success
      triggerHaptic('success');
      playSuccessChime();
      clearCart();
      
      if (paymentMethod === 'UPI') {
        const upiUrl = `upi://pay?pa=iamuv26@ptyes&pn=FastKirana&am=${total}&cu=INR&tn=Order_${orderData.id.slice(-6).toUpperCase()}`;
        const canOpen = await Linking.canOpenURL(upiUrl);
        if (canOpen) {
          await Linking.openURL(upiUrl);
          router.replace(`/order/${orderData.id}?celebrate=true`);
          return;
        } else {
          Alert.alert(
            'UPI Apps Not Found 📱',
            'No UPI payment apps (Google Pay, PhonePe, Paytm) were found on this device. Please pay the delivery rider via QR code upon receipt.',
            [{ text: 'Track Order', onPress: () => router.replace(`/order/${orderData.id}?celebrate=true`) }]
          );
          return;
        }
      }
      
      // Trigger success overlay screen
      setShowSuccessOverlay(true);
      setTimeout(() => {
        router.replace(`/order/${orderData.id}?celebrate=true`);
      }, 2800);
    } catch (err: any) {
      triggerHaptic('warning');
      Alert.alert('Order Placement Failed', err.message || 'Something went wrong while placing your order.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Sticky Custom Premium Header with Back Button */}
      <View 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
          backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
        }}
      >
        <Pressable 
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }} 
          style={{ marginRight: 12, padding: 4 }}
        >
          <ArrowLeft size={20} color={isDarkMode ? '#fafafa' : '#0f172a'} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: '900', color: isDarkMode ? '#ffffff' : '#0f172a', letterSpacing: -0.5 }}>
          Checkout
        </Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Fulfillment Option */}
        <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 mb-4 shadow-xs">
          <Text className="text-slate-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider mb-3">Fulfillment Options</Text>
          <View className="flex-row gap-3">
            <Pressable 
              onPress={() => setDeliveryMethod('DELIVERY')}
              className={`flex-1 p-3 rounded-xl border flex-row items-center justify-center gap-1.5 ${
                deliveryMethod === 'DELIVERY' 
                  ? 'bg-primary-light dark:bg-rose-950/20 border-primary/20 dark:border-rose-900/30' 
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700'
              }`}
            >
              <Home size={16} color={deliveryMethod === 'DELIVERY' ? '#e20a22' : (isDarkMode ? '#a1a1aa' : '#64748b')} />
              <Text className={`font-black text-xs ${deliveryMethod === 'DELIVERY' ? 'text-primary' : 'text-slate-500 dark:text-zinc-400'}`}>
                Home Delivery
              </Text>
            </Pressable>
 
            <Pressable 
              onPress={() => setDeliveryMethod('PICKUP')}
              className={`flex-1 p-3 rounded-xl border flex-row items-center justify-center gap-1.5 ${
                deliveryMethod === 'PICKUP' 
                  ? 'bg-primary-light dark:bg-rose-950/20 border-primary/20 dark:border-rose-900/30' 
                  : 'bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-700'
              }`}
            >
              <MapPin size={16} color={deliveryMethod === 'PICKUP' ? '#e20a22' : (isDarkMode ? '#a1a1aa' : '#64748b')} />
              <Text className={`font-black text-xs ${deliveryMethod === 'PICKUP' ? 'text-primary' : 'text-slate-500 dark:text-zinc-400'}`}>
                Self-Pickup
              </Text>
            </Pressable>
          </View>
        </View>
 
        {/* Shipping Address list selection */}
        {deliveryMethod === 'DELIVERY' && (
          <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 mb-4 shadow-xs">
            <View className="flex-row justify-between items-center mb-3 pb-2 border-b border-slate-50 dark:border-zinc-800">
              <Text className="text-slate-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider">Select Delivery Address</Text>
              <Pressable 
                onPress={() => router.push('/addresses')}
                className="bg-rose-50 dark:bg-rose-950/35 border border-rose-100 dark:border-rose-900/40 px-3 py-1.5 rounded-lg active:bg-rose-100 flex-row items-center gap-1"
              >
                <Plus size={10} color="#e20a22" strokeWidth={3} />
                <Text className="text-primary font-black text-[9px] uppercase tracking-wider">Add New</Text>
              </Pressable>
            </View>

            {isAddressesLoading ? (
               <ActivityIndicator size="small" color="#e20a22" className="py-4" />
            ) : addresses.length === 0 ? (
               <View className="items-center py-4">
                 <Text className="text-slate-400 dark:text-zinc-500 text-xs font-semibold">No saved addresses found</Text>

                 <Pressable onPress={() => router.push('/addresses')} className="mt-3">
                   <Text className="text-rose-600 font-extrabold text-xs underline">Manage Addresses</Text>
                </Pressable>
              </View>
            ) : (
              <View className="gap-2.5">
                {addresses.filter(addr => addr && addr.id).map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  const labelLower = (addr.label || '').toLowerCase();
                  
                  let AddressIcon = MapPin;
                  let iconBg = isDarkMode ? 'rgba(113, 113, 122, 0.15)' : 'rgba(113, 113, 122, 0.08)';
                  let iconColor = isDarkMode ? '#a1a1aa' : '#71717a';
                  
                  if (labelLower.includes('home')) {
                    AddressIcon = Home;
                    iconBg = isDarkMode ? 'rgba(226, 10, 34, 0.15)' : 'rgba(226, 10, 34, 0.08)';
                    iconColor = '#e20a22';
                  } else if (labelLower.includes('work') || labelLower.includes('office')) {
                    AddressIcon = Briefcase;
                    iconBg = isDarkMode ? 'rgba(37, 99, 235, 0.15)' : 'rgba(37, 99, 235, 0.08)';
                    iconColor = '#2563eb';
                  }

                  return (
                    <Pressable
                      key={addr.id}
                      onPress={() => setSelectedAddressId(addr.id)}
                      className={`p-3.5 rounded-xl border flex-row justify-between items-center ${
                        isSelected 
                          ? 'bg-rose-50/20 dark:bg-rose-950/10 border-rose-200 dark:border-rose-900/30' 
                          : 'bg-slate-50/40 dark:bg-zinc-800/40 border-slate-100 dark:border-zinc-800'
                      }`}
                    >
                      <View className="flex-row items-center flex-1 pr-3">
                        <View 
                          className="w-9 h-9 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: iconBg }}
                        >
                          <AddressIcon size={16} color={iconColor} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-slate-800 dark:text-zinc-200 font-extrabold text-xs mb-0.5">{addr.label}</Text>
                          <Text className="text-slate-500 dark:text-zinc-400 text-[10px] leading-relaxed font-semibold">
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
                      <View className={`w-4 h-4 rounded-full border items-center justify-center ${
                        isSelected ? 'border-rose-600 bg-rose-600' : 'border-slate-350 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                      }`}>
                        {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Distance Validation Warning Banner */}
            {deliveryMethod === 'DELIVERY' && selectedAddressId && (
              <View className="mt-3">
                {isDistanceValidating ? (
                  <View className="flex-row items-center gap-2 py-1">
                    <ActivityIndicator size="small" color="#6366f1" />
                    <Text className="text-indigo-600 dark:text-indigo-400 font-bold text-[10px] uppercase">Validating delivery distance...</Text>
                  </View>
                ) : deliveryDistance !== null ? (
                  isOutsideDeliveryZone ? (
                    <View className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/50 p-3 rounded-xl flex-row items-start gap-2.5">
                      <Text className="text-base">🛑</Text>
                      <View className="flex-1">
                        <Text className="text-rose-700 dark:text-rose-300 font-black text-[11px]">Outside Delivery Zone</Text>
                        <Text className="text-rose-600 dark:text-rose-400 text-[9px] font-bold mt-0.5 leading-4">
                          This address is {deliveryDistance.toFixed(1)} km away, which exceeds our maximum delivery radius of {deliveryRadius} km. Please select Self-Pickup or use another address.
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View className="bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-100 dark:border-emerald-900/50 p-3 rounded-xl flex-row items-start gap-2.5">
                      <Text className="text-base">✅</Text>
                      <View className="flex-1">
                        <Text className="text-emerald-700 dark:text-emerald-300 font-black text-[11px]">Inside Delivery Zone</Text>
                        <Text className="text-emerald-600 dark:text-emerald-400 text-[9px] font-bold mt-0.5 leading-4">
                          Your address is {deliveryDistance.toFixed(1)} km away from the dark store.
                        </Text>
                      </View>
                    </View>
                  )
                ) : (
                  <View className="bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/50 p-3 rounded-xl flex-row items-start gap-2.5">
                    <Text className="text-base">⚠️</Text>
                    <View className="flex-1">
                      <Text className="text-amber-700 dark:text-amber-300 font-black text-[11px]">Unable to Verify Distance</Text>
                      <Text className="text-amber-600 dark:text-amber-450 text-[9px] font-bold mt-0.5 leading-4">
                        We could not verify the exact coordinates for this address. Please make sure your pincode is correct.
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Delivery Time Slots & Instructions Options */}
        {deliveryMethod === 'DELIVERY' && (
          <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 mb-4 shadow-xs">
            {/* Delivery Time Slots */}
            <View className="mb-4">
              <Text className="text-slate-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider mb-2">Preferred Delivery Time</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
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
                      className={`px-4 py-2 rounded-xl border flex-row items-center gap-1.5 ${
                        isSelected
                          ? 'bg-rose-50/20 dark:bg-rose-950/15 border-rose-500'
                          : 'bg-slate-50 dark:bg-zinc-800/40 border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      <Text style={{ fontSize: 11 }} className={isSelected ? 'text-primary font-black' : 'text-slate-500 dark:text-zinc-400 font-bold'}>
                        {slot === 'Instant' ? '⚡ Instant' : slot}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View className="h-px bg-slate-100 dark:bg-zinc-800/80 mb-4" />

            {/* Delivery Instructions */}
            <View>
              <Text className="text-slate-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider mb-2">Delivery Instructions</Text>
              
              <TextInput
                value={deliveryInstructions}
                onChangeText={setDeliveryInstructions}
                placeholder="Ring bell, leave package at door, call on arrival, etc..."
                placeholderTextColor="#71717a"
                maxLength={100}
                className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-xl px-3.5 py-3 text-slate-850 dark:text-zinc-200 font-semibold text-xs min-h-[60px]"
                style={{ textAlignVertical: 'top' }}
                multiline
              />
              
              {/* Quick Select instruction chips */}
              <View className="flex-row flex-wrap gap-2 mt-2.5">
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
                        const cleanVal = chip.substring(2); // Strip emoji
                        if (prev.includes(cleanVal)) return prev;
                        return prev ? `${prev}, ${cleanVal}` : cleanVal;
                      });
                    }}
                    className="bg-slate-100 dark:bg-zinc-850 border border-slate-200/60 dark:border-zinc-800 px-3 py-1.5 rounded-lg active:opacity-70"
                  >
                    <Text className="text-slate-600 dark:text-zinc-400 font-bold text-[9px] uppercase tracking-wide">{chip}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        )}
 
        {/* Payment Methods */}
        <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 mb-4 shadow-xs">
          <Text className="text-slate-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider mb-3">Payment Methods</Text>
          
          <View className="gap-3">
            {[
              { id: 'COD', label: 'Cash on Delivery (COD)', desc: 'Pay with cash upon package receipt' },
              { id: 'UPI', label: 'UPI (GPay / PhonePe / Paytm)', desc: 'Scan and pay online instantly' },
              { id: 'CARD', label: 'Credit or Debit Card', desc: 'Secure payment with online cards' }
            ].map((method) => (
              <Pressable
                key={method.id}
                onPress={() => {
                  setPaymentMethod(method.id as any);
                  triggerHaptic('light');
                }}
                className={`p-3.5 rounded-xl border flex-row justify-between items-center ${
                  paymentMethod === method.id 
                    ? 'bg-primary-light/50 dark:bg-rose-950/20 border-primary/20 dark:border-rose-900/30 shadow-xs' 
                    : 'bg-white dark:bg-zinc-900 border-slate-100 dark:border-zinc-800'
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <CreditCard size={20} color={paymentMethod === method.id ? '#e20a22' : (isDarkMode ? '#a1a1aa' : '#64748b')} />
                  <View>
                    <Text className={`font-extrabold text-xs ${paymentMethod === method.id ? 'text-primary' : 'text-slate-700 dark:text-zinc-300'}`}>
                      {method.label}
                    </Text>
                    <Text className="text-slate-400 dark:text-zinc-500 text-[9px] mt-0.5">{method.desc}</Text>
                  </View>
                </View>
                <View className={`w-5 h-5 rounded-full border items-center justify-center ${
                  paymentMethod === method.id ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800'
                }`}>
                  {paymentMethod === method.id && (
                    <Check size={11} color="#fff" strokeWidth={3} />
                  )}
                </View>
              </Pressable>
            ))}
          {isLessThanMinOrder && (
            <View className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3.5 rounded-2xl flex-row items-start gap-2.5 mt-4">
              <Text style={{ fontSize: 16 }}>⚠️</Text>
              <View className="flex-1">
                <Text className="text-amber-800 dark:text-amber-400 font-extrabold text-xs">Minimum Order Amount Required</Text>
                <Text className="text-amber-600 dark:text-amber-500/80 text-[10px] font-semibold mt-0.5 leading-relaxed">
                  Minimum order value is {formatPrice(minOrderValue)}. Add items worth {formatPrice(minOrderValue - subtotal)} more to place order.
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
 
      {/* Place Order Sticky bottom */}
      <View className="bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 px-4 py-3.5 flex-row justify-between items-center shadow-lg">
        <View style={{ flex: 1, marginRight: 16 }}>
          <Text className="text-slate-400 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Total To Pay</Text>
          <Text className="text-slate-800 dark:text-zinc-100 font-black text-lg">{formatPrice(total)}</Text>
        </View>
        
        <TouchableOpacity
          onPress={handlePlaceOrder}
          disabled={isPlacingOrder || isCheckoutBlocked}
          activeOpacity={0.85}
          style={{
            flex: 2,
            borderRadius: 99,
            overflow: 'hidden',
            shadowColor: '#e20a22',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isCheckoutBlocked ? 0 : 0.2,
            shadowRadius: 8,
            elevation: 3,
            opacity: isCheckoutBlocked ? 0.6 : 1
          }}
        >
          <LinearGradient
            colors={isCheckoutBlocked ? ['#94a3b8', '#cbd5e1'] : ['#e20a22', '#ff4d62']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
          >
            {isPlacingOrder ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
                Place Order
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Success Overlay Sheet */}
      {showSuccessOverlay && (
        <View className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 z-50 items-center justify-center px-6">
          <View className="items-center">
            {/* Animated Checkmark Circle with Glow */}
            <View style={{ 
              width: 120, height: 120, borderRadius: 60, 
              backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.08)' : '#ecfdf5',
              alignItems: 'center', justifyContent: 'center',
              shadowColor: '#10b981', shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.4, shadowRadius: 30, elevation: 10,
              marginBottom: 28,
            }}>
              {/* Inner glow ring */}
              <View style={{ 
                width: 96, height: 96, borderRadius: 48,
                borderWidth: 4, borderColor: '#10b981',
                backgroundColor: isDarkMode ? 'rgba(16, 185, 129, 0.15)' : '#d1fae5',
                alignItems: 'center', justifyContent: 'center',
              }}>
                <Check size={48} color="#10b981" strokeWidth={4} />
              </View>
              
              {/* Confetti Particle Burst overlay */}
              <View className="absolute inset-0 items-center justify-center pointer-events-none" style={{ overflow: 'visible' }}>
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
            <Text style={{ 
              color: isDarkMode ? '#f4f4f5' : '#0f172a',
              fontWeight: '900', fontSize: 26, textAlign: 'center',
              letterSpacing: -0.5,
            }}>Order Confirmed! 🎉</Text>

            {/* Subtitle */}
            <Text style={{ 
              color: isDarkMode ? '#71717a' : '#64748b',
              fontWeight: '600', fontSize: 12.5, textAlign: 'center',
              marginTop: 8, paddingHorizontal: 32, lineHeight: 18,
            }}>
              Your delicious items are being prepared with care. Sit tight — they're on their way!
            </Text>
            


            {/* Pulsing delivery path line */}
            <View style={{ 
              width: 200, height: 4, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0',
              borderRadius: 2, marginTop: 32, position: 'relative', overflow: 'hidden',
            }}>
              <View style={{ 
                position: 'absolute', left: 0, top: 0, bottom: 0, 
                backgroundColor: '#10b981', width: '66%', borderRadius: 2,
              }} />
              {/* Pulsing dot at progress end */}
              <View style={{ 
                position: 'absolute', left: '63%', top: -3.5,
                width: 11, height: 11, borderRadius: 5.5,
                backgroundColor: '#10b981', borderWidth: 2, borderColor: '#fff',
              }} />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
