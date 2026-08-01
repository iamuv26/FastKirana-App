import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert, Linking, Platform, RefreshControl, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { ArrowLeft, Check, Phone, ShieldCheck, MapPin, Truck, UserCheck, RefreshCw, ShoppingCart, Package, Copy, Star, Sparkles, X, Receipt, Clock } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { toast } from '../../lib/toast';
import { useAuthStore } from '../../stores/auth-store';
import { API_BASE_URL, ORDER_STATUS_LABELS } from '../../lib/constants';
import { api } from '../../lib/api-client';
import { formatPrice, formatDisplayOrderId } from '../../lib/utils';
import { triggerHaptic } from '../../lib/haptic';
import Confetti from '../../components/shared/Confetti';
import { useTheme } from '../context/ThemeContext';
import { ScalePressable } from '../../components/shared/ScalePressable';
import { useCart } from '../../hooks/use-cart';
import { Image } from 'expo-image';
import { playSuccessChime } from '../../lib/audio';
import { useOrderStream } from '../../hooks/use-order-stream';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  interpolate,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';

function OrderStatusSkeleton() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(opacity);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-zinc-950 px-4 pt-4">
      {/* Header Skeleton */}
      <View className="flex-row items-center gap-3 mb-6">
        <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-zinc-800" />
        <Animated.View style={[{ width: 120, height: 20, borderRadius: 4, backgroundColor: '#e2e8f0' }, animatedStyle]} className="dark:bg-zinc-800" />
      </View>

      {/* Map Skeleton */}
      <Animated.View 
        style={[{ width: '100%', height: 220, borderRadius: 24, backgroundColor: '#e2e8f0', marginBottom: 16 }, animatedStyle]} 
        className="dark:bg-zinc-800"
      />

      {/* Order Info Skeleton */}
      <Animated.View 
        style={[{ width: '100%', height: 70, borderRadius: 20, backgroundColor: '#e2e8f0', marginBottom: 16 }, animatedStyle]} 
        className="dark:bg-zinc-800"
      />

      {/* Status Timeline Skeleton */}
      <View className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-4 rounded-2xl gap-6">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className="flex-row items-center gap-4">
            <Animated.View style={[{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#e2e8f0' }, animatedStyle]} className="dark:bg-zinc-800" />
            <View className="flex-1 gap-2">
              <Animated.View style={[{ width: 100, height: 14, borderRadius: 4, backgroundColor: '#e2e8f0' }, animatedStyle]} className="dark:bg-zinc-800" />
              <Animated.View style={[{ width: 160, height: 10, borderRadius: 4, backgroundColor: '#e2e8f0' }, animatedStyle]} className="dark:bg-zinc-800" />
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

let MapView: any;
let Marker: any;
let Polyline: any;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
    Polyline = Maps.Polyline;
  } catch (e) {
    console.warn('Failed to load react-native-maps:', e);
  }
}

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  status: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  taxes: number;
  miscFee?: number;
  total: number;
  paymentMethod: string;
  deliveryMethod: string;
  createdAt: string;
  shopName: string | null;
  shopPhone: string | null;
  items: OrderItem[];
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  deliveryPhoto?: string | null;
  address: {
    label: string;
    houseNo: string;
    street: string;
    area: string;
    city: string;
    pincode: string;
    lat?: number | null;
    lng?: number | null;
  };
  deliveryUser?: {
    name: string | null;
    phone: string | null;
  } | null;
  deliveryInstructions?: string | null;
  deliverySlot?: string | null;
}

const MAP_LIGHT_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f5f5" }] },
  { "featureType": "administrative.land_parcel", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
  { "featureType": "road.arterial", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#dadada" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "transit.line", "elementType": "geometry", "stylers": [{ "color": "#e5e5e5" }] },
  { "featureType": "transit.station", "elementType": "geometry", "stylers": [{ "color": "#eeeeee" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#c2d7f2" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }
];

const MAP_DARK_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#18181b" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#a1a1aa" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#09090b" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#f43f5e" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#fbbf24" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#14532d" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#27272a" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#09090b" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#71717a" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3f3f46" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#09090b" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#27272a" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#0c4a6e" }] }
];



function TimelineDot({ completed, isActive, stepIndex, isCancelled }: { completed: boolean; isActive: boolean; stepIndex: number; isCancelled?: boolean }) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(withTiming(2.2, { duration: 1400 }), -1, false);
      opacity.value = withRepeat(withTiming(0, { duration: 1400 }), -1, false);
    }
  }, [isActive]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconSize = 14;
  const renderIcon = () => {
    if (isCancelled) {
      return <X size={iconSize} color="#ef4444" strokeWidth={3} />;
    }
    const iconColor = completed 
      ? '#ffffff' 
      : (isActive ? '#ffffff' : (isDarkMode ? '#52525b' : '#94a3b8'));

    switch (stepIndex) {
      case 0:
        return <ShoppingCart size={iconSize} color={iconColor} strokeWidth={2.8} />;
      case 1:
        return <ShieldCheck size={iconSize} color={iconColor} strokeWidth={2.8} />;
      case 2:
        return <Package size={iconSize} color={iconColor} strokeWidth={2.8} />;
      case 3:
        return <Truck size={iconSize} color={iconColor} strokeWidth={2.8} />;
      case 4:
        return <MapPin size={iconSize} color={iconColor} strokeWidth={2.8} />;
      default:
        return <Check size={iconSize} color={iconColor} strokeWidth={2.8} />;
    }
  };

  return (
    <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
      {isActive && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: isCancelled ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)',
            },
            pulseStyle,
          ]}
        />
      )}
      <View 
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          backgroundColor: isCancelled 
            ? (isDarkMode ? '#450a0a' : '#fef2f2')
            : completed 
            ? '#10b981' 
            : isActive 
            ? '#059669' 
            : (isDarkMode ? '#27272a' : '#f1f5f9'),
          borderWidth: 2,
          borderColor: isCancelled
            ? '#ef4444'
            : completed || isActive
            ? '#ffffff'
            : (isDarkMode ? '#3f3f46' : '#e2e8f0'),
          shadowColor: completed || isActive ? '#10b981' : '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: completed || isActive ? 0.25 : 0.05,
          shadowRadius: 4,
          elevation: completed || isActive ? 3 : 1,
        }}
      >
        {renderIcon()}
      </View>
    </View>
  );
}

function AnimatedDeliveryRouteMap({ isDarkMode, shopName, destinationLabel }: { isDarkMode: boolean; shopName?: string; destinationLabel?: string }) {
  const progress = useSharedValue(0.12);
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.8);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(0.88, { duration: 4500, easing: Easing.linear }),
      -1,
      false
    );

    pulseScale.value = withRepeat(
      withTiming(2.2, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    pulseOpacity.value = withRepeat(
      withTiming(0, { duration: 1200, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const riderAnimatedStyle = useAnimatedStyle(() => ({
    left: `${progress.value * 100}%`,
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <View style={{
      width: '100%',
      height: 190,
      borderRadius: 20,
      overflow: 'hidden',
      marginBottom: 16,
      backgroundColor: isDarkMode ? '#18181b' : '#f8fafc',
      borderWidth: 1,
      borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
      position: 'relative',
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
        },
        android: { elevation: 3 }
      })
    }}>
      {/* Map Street Grid Lines Background */}
      <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}>
        <View style={{ position: 'absolute', top: 45, left: 0, right: 0, height: 14, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', opacity: 0.7 }} />
        <View style={{ position: 'absolute', top: 125, left: 0, right: 0, height: 16, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', opacity: 0.7 }} />
        <View style={{ position: 'absolute', left: '32%', top: 0, bottom: 0, width: 14, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', opacity: 0.5 }} />
        <View style={{ position: 'absolute', left: '68%', top: 0, bottom: 0, width: 14, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', opacity: 0.5 }} />
      </View>

      {/* Main Delivery Route Track Line */}
      <View style={{
        position: 'absolute',
        top: 85,
        left: 45,
        right: 45,
        height: 6,
        borderRadius: 3,
        backgroundColor: isDarkMode ? '#3f3f46' : '#cbd5e1',
      }} />

      {/* Origin Store Pin (Left) */}
      <View style={{
        position: 'absolute',
        top: 60,
        left: 16,
        alignItems: 'center',
        zIndex: 10,
      }}>
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#10b981',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: '#ffffff',
          shadowColor: '#10b981',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 4,
        }}>
          <Text style={{ fontSize: 20 }}>🏬</Text>
        </View>
        <View style={{
          backgroundColor: isDarkMode ? 'rgba(39,39,42,0.95)' : '#ffffff',
          borderRadius: 8,
          paddingHorizontal: 7,
          paddingVertical: 2.5,
          marginTop: 4,
          borderWidth: 1,
          borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
        }}>
          <Text style={{ fontSize: 9.5, fontWeight: '800', color: isDarkMode ? '#e4e4e7' : '#1e293b' }}>
            {shopName || 'Dark Store'}
          </Text>
        </View>
      </View>

      {/* Destination Home Pin (Right) */}
      <View style={{
        position: 'absolute',
        top: 60,
        right: 16,
        alignItems: 'center',
        zIndex: 10,
      }}>
        <View style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#e20a22',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: '#ffffff',
          shadowColor: '#e20a22',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 6,
          elevation: 4,
        }}>
          <Text style={{ fontSize: 20 }}>🏠</Text>
        </View>
        <View style={{
          backgroundColor: isDarkMode ? 'rgba(39,39,42,0.95)' : '#ffffff',
          borderRadius: 8,
          paddingHorizontal: 7,
          paddingVertical: 2.5,
          marginTop: 4,
          borderWidth: 1,
          borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
        }}>
          <Text style={{ fontSize: 9.5, fontWeight: '800', color: isDarkMode ? '#e4e4e7' : '#1e293b' }}>
            {destinationLabel || 'Home'}
          </Text>
        </View>
      </View>

      {/* Moving Live Rider Marker */}
      <Animated.View style={[{
        position: 'absolute',
        top: 61,
        marginLeft: -22,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 20,
      }, riderAnimatedStyle]}>
        {/* Pulsing Outer Ring */}
        <Animated.View style={[{
          position: 'absolute',
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(16, 185, 129, 0.4)',
        }, pulseRingStyle]} />

        {/* Rider Badge */}
        <View style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          backgroundColor: '#059669',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 3,
          borderColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
          elevation: 5,
        }}>
          <Text style={{ fontSize: 20 }}>🛵</Text>
        </View>
      </Animated.View>

      {/* Top Left Live Status Pill */}
      <View style={{
        position: 'absolute',
        top: 10,
        left: 12,
        backgroundColor: isDarkMode ? 'rgba(24, 24, 27, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 4.5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
        zIndex: 30,
      }}>
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#10b981' }} />
        <Text style={{ fontSize: 10, fontWeight: '800', color: isDarkMode ? '#fafafa' : '#0f172a' }}>
          Live Rider Movement
        </Text>
      </View>
    </View>
  );
}

function RiderPulseMarker({ latitude, longitude }: { latitude: number; longitude: number }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(2.4, { duration: 1800 }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withTiming(0, { duration: 1800 }),
      -1,
      false
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!Marker) return null;

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      title="Rider Partner"
      description="Carrying your order"
    >
      <View style={{ alignItems: 'center', justifyContent: 'center', width: 60, height: 60 }}>
        <Animated.View 
          style={[
            {
              position: 'absolute',
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: 'rgba(226, 10, 34, 0.25)',
              borderWidth: 1.5,
              borderColor: '#e20a22',
            },
            pulseStyle
          ]}
        />
        <View style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: '#ffffff',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1.5,
          borderColor: '#e20a22',
          elevation: 4,
          shadowColor: '#e20a22',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
        }}>
          <Text style={{ fontSize: 18 }}>🛵</Text>
        </View>
      </View>
    </Marker>
  );
}

const getDeliveryPin = (orderId: string) => {
  let hash = 0;
  for (let i = 0; i < orderId.length; i++) {
    hash = orderId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const pin = Math.abs(hash % 9000) + 1000;
  return pin.toString();
};

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

export default function OrderTrackingScreen() {
  const { id, celebrate } = useLocalSearchParams<{ id: string; celebrate?: string }>();
  const { user } = useAuthStore();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [order, setOrder] = useState<Order | null>(null);
  const [companionOrder, setCompanionOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rating, setRating] = useState<number>(0);
  const [tip, setTip] = useState<number>(0);
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [reviewSubmitted, setReviewSubmitted] = useState<boolean>(false);

  const { addItem } = useCart();
  const [timeLeft, setTimeLeft] = useState('10:00');

  useEffect(() => {
    if (!order || order.status === 'DELIVERED' || order.status === 'CANCELLED') return;

    const calculateTimeLeft = () => {
      if (order.status === 'SHIPPED' && order.deliveryLat && order.deliveryLng && order.address?.lat && order.address?.lng) {
        const dist = calculateDistance(
          order.deliveryLat, 
          order.deliveryLng, 
          order.address.lat, 
          order.address.lng
        );
        const mins = Math.max(1, Math.ceil((dist / 25) * 60));
        setTimeLeft(`${mins} min (${dist.toFixed(1)} km)`);
        return;
      }

      const created = new Date(order.createdAt).getTime();
      const now = new Date().getTime();
      const elapsed = now - created;
      const totalTime = 10 * 60 * 1000; // 10 minutes
      const remaining = totalTime - elapsed;

      if (remaining <= 0) {
        setTimeLeft('Arriving soon');
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [order]);

  const handleCopyOrderId = async () => {
    if (!order) return;
    await Clipboard.setStringAsync(order.id);
    triggerHaptic('light');
    toast.success('Order ID copied to clipboard!');
  };

  const handleReorder = () => {
    if (!order || !order.items) return;
    triggerHaptic('success');
    order.items.forEach((item) => {
      addItem({
        id: item.id,
        name: item.name,
        slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        imageUrl: null,
        mrp: item.price,
        price: item.price,
        discount: 0,
        unit: '1 unit',
        stock: 100,
        isAvailable: true,
      });
    });
    toast.success("Reordered! 🛍️ All items from your previous order have been added to your cart.");
  };

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

  const handleSubmitReview = async () => {
    if (!order) return;
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select at least 1 star before submitting.');
      return;
    }
    setIsSubmittingReview(true);
    triggerHaptic('medium');
    try {
      await api.post(`/orders/${order.id}/review`, { rating, tip });
      setReviewSubmitted(true);
      toast.success('Thank you for rating your delivery! ⭐');
    } catch (err) {
      // Offline fallback success simulation
      setReviewSubmitted(true);
      toast.success('Thank you for rating your delivery! ⭐');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const fetchOrderDetails = async (showLoader = false) => {
    if (showLoader) setIsLoading(true);

    const isLocalOrderId = id?.startsWith('mock-') || id?.startsWith('local-fallback-');
    if (isLocalOrderId) {
      try {
        const { mmkvStorage } = require('../../lib/storage');
        const localKey = `local_orders_${user?.id || 'guest'}`;
        const localData = mmkvStorage.getItem(localKey);
        if (localData) {
          const list = JSON.parse(localData);
          const found = list.find((o: any) => o.id === id);
          if (found) {
            setOrder((prev) => ({
              ...prev,
              ...found,
              address: {
                label: found.address?.label || 'Pickup Location',
                houseNo: found.address?.houseNo || '',
                street: found.address?.street || '',
                area: found.address?.area || 'Hub Store',
                city: found.address?.city || 'Kanpur',
                pincode: found.address?.pincode || '209206',
                lat: found.address?.lat || 26.1534185,
                lng: found.address?.lng || 80.1714024,
              }
            }));
            setFetchError(null);
            if (showLoader) setIsLoading(false);
            setIsRefreshing(false);
            return;
          }
        }
      } catch (err) {
        console.warn('Error fetching local fallback order:', err);
      }
    }

    try {
      const data = await api.get(`/orders/${id}`);
      setOrder((prev) => ({
        ...prev,
        ...data,
        address: {
          label: data.address?.label || 'Pickup Location',
          houseNo: data.address?.houseNo || '',
          street: data.address?.street || '',
          area: data.address?.area || 'Hub Store',
          city: data.address?.city || 'Kanpur',
          pincode: data.address?.pincode || '209206',
          lat: data.address?.lat || 26.1534185,
          lng: data.address?.lng || 80.1714024,
        }
      }));
      setFetchError(null);

      // Check for companion split orders (placed within 5s)
      try {
        const allOrders = await api.get('/orders');
        if (Array.isArray(allOrders)) {
          const orderCreatedAt = new Date(data.createdAt).getTime();
          const companion = allOrders.find((o: any) =>
            o.id !== data.id &&
            Math.abs(new Date(o.createdAt).getTime() - orderCreatedAt) <= 5000
          );
          if (companion) {
            setCompanionOrder(companion);
          }
        }
      } catch (compErr) {
        // Ignore non-critical companion order error
      }
    } catch (err: any) {
      console.warn('Error loading order tracking:', err);
      // Fallback search in local storage on network error or API error
      try {
        const { mmkvStorage } = require('../../lib/storage');
        const localKey = `local_orders_${user?.id || 'guest'}`;
        const localData = mmkvStorage.getItem(localKey);
        if (localData) {
          const list = JSON.parse(localData);
          const found = list.find((o: any) => o.id === id);
          if (found) {
            setOrder((prev) => ({
              ...prev,
              ...found,
              address: {
                label: found.address?.label || 'Pickup Location',
                houseNo: found.address?.houseNo || '',
                street: found.address?.street || '',
                area: found.address?.area || 'Hub Store',
                city: found.address?.city || 'Kanpur',
                pincode: found.address?.pincode || '209206',
                lat: found.address?.lat || 26.1534185,
                lng: found.address?.lng || 80.1714024,
              }
            }));
            setFetchError(null);
            return;
          }
        }
      } catch (localErr) {
        console.warn('Local fallback search failed:', localErr);
      }

      if (showLoader) {
        setFetchError(err.message || 'Network error loading order');
      }
    } finally {
      if (showLoader) setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchOrderDetails(false);
  };

  useOrderStream({
    orderId: id as string,
    onEvent: (event, data) => {
      if (event === 'poll:update' || event === 'order:status') {
        setOrder((prev) => {
          if (prev && prev.status !== data.status) {
            triggerHaptic('success');
            if (data.status === 'DELIVERED') {
              playSuccessChime();
            }
          }
          return {
            ...prev,
            ...data,
            address: {
              label: data.address?.label || prev?.address?.label || 'Pickup Location',
              houseNo: data.address?.houseNo || prev?.address?.houseNo || '',
              street: data.address?.street || prev?.address?.street || '',
              area: data.address?.area || prev?.address?.area || 'Hub Store',
              city: data.address?.city || prev?.address?.city || 'Kanpur',
              pincode: data.address?.pincode || prev?.address?.pincode || '209206',
              lat: data.address?.lat || prev?.address?.lat || 26.1534185,
              lng: data.address?.lng || prev?.address?.lng || 80.1714024,
            }
          };
        });
      } else if (event === 'order:location') {
        setOrder((prev) => prev ? {
          ...prev,
          deliveryLat: data.lat,
          deliveryLng: data.lng,
        } : null);
      }
    }
  });

  useEffect(() => {
    fetchOrderDetails(true);
  }, [id]);

  if (isLoading) {
    return <OrderStatusSkeleton />;
  }

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950 justify-center items-center px-6">
        <Text className="text-5xl">📦</Text>
        <Text className="text-slate-800 dark:text-zinc-100 font-black text-base mt-4">
          {fetchError ? 'Unable to Load Order' : 'Order Not Found'}
        </Text>
        <Text className="text-slate-400 dark:text-zinc-400 text-xs mt-1 text-center leading-4">
          {fetchError || `We could not resolve tracking details for order ID #${id?.slice(-6).toUpperCase()}.`}
        </Text>
        <View className="flex-row gap-3 mt-6">
          <Pressable 
            onPress={() => fetchOrderDetails(true)}
            className="bg-emerald-600 px-5 py-3 rounded-xl flex-row items-center gap-1.5"
          >
            <RefreshCw size={14} color="#ffffff" />
            <Text className="text-white font-extrabold text-xs">Try Again</Text>
          </Pressable>
          <Pressable 
            onPress={() => router.replace('/(tabs)')}
            className="bg-slate-200 dark:bg-zinc-800 px-5 py-3 rounded-xl"
          >
            <Text className="text-slate-800 dark:text-zinc-200 font-extrabold text-xs">Back to Home</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Define tracking checkpoints progress based on DB status
  const currentStatus = order.status;

  const getActiveStepIndex = () => {
    if (currentStatus === 'CANCELLED') return 1;
    if (currentStatus === 'DELIVERED') return -1;
    switch (currentStatus) {
      case 'PENDING': return 0;
      case 'CONFIRMED': return 1;
      case 'PACKED': return 2;
      case 'SHIPPED': return 3;
      default: return -1;
    }
  };
  const activeStepIndex = getActiveStepIndex();

  const statusSteps = currentStatus === 'CANCELLED' ? [
    { 
      label: 'Order Placed', 
      desc: 'We received your order', 
      completed: true 
    },
    { 
      label: 'Order Cancelled', 
      desc: 'This order has been cancelled', 
      completed: false,
      isCancelled: true 
    }
  ] : [
    { 
      label: 'Order Placed', 
      desc: 'We have received your order', 
      completed: ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(currentStatus) 
    },
    { 
      label: 'Confirmed', 
      desc: 'Store has accepted your order', 
      completed: ['CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED'].includes(currentStatus) 
    },
    { 
      label: 'Packed', 
      desc: 'Items are packed and ready to ship', 
      completed: ['PACKED', 'SHIPPED', 'DELIVERED'].includes(currentStatus) 
    },
    { 
      label: 'On the Way', 
      desc: 'Rider is carrying your groceries', 
      completed: ['SHIPPED', 'DELIVERED'].includes(currentStatus) 
    },
    { 
      label: 'Delivered', 
      desc: 'Package dropped at your address', 
      completed: ['DELIVERED'].includes(currentStatus) 
    }
  ];

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-zinc-950">
      {celebrate === 'true' && (
        <Confetti count={80} />
      )}
      {/* Header */}
      <View className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex-row justify-between items-center shadow-xs">
        <ScalePressable
          onPress={() => {
            triggerHaptic('light');
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)');
            }
          }}
          scaleValue={0.9}
          haptic="light"
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
          }}
        >
          <ArrowLeft size={18} color={isDarkMode ? '#fafafa' : '#0f172a'} strokeWidth={2.5} />
        </ScalePressable>

        <Text className="text-slate-800 dark:text-zinc-100 font-extrabold text-base">Track Order</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView 
        className="flex-1 px-4 py-4" 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#e11d48" />
        }
      >
        {/* Companion Order Split Alert Banner */}
        {companionOrder && (
          <View className="bg-gradient-to-r from-rose-500 via-pink-500 to-orange-500 p-4 rounded-2xl mb-4 shadow-md flex-row justify-between items-center">
            <View className="flex-1 pr-3">
              <Text className="text-white text-[9px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full self-start mb-1">
                {companionOrder.shopName === 'FastKirana Cafe Kitchen' ? '☕ Cafe Order Split' : '📦 Grocery Order Split'}
              </Text>
              <Text className="text-white font-black text-xs">Your Order Has Been Split!</Text>
              <Text className="text-rose-100 text-[10px] font-semibold mt-0.5 leading-3">
                {order.shopName === 'FastKirana Cafe Kitchen'
                  ? 'We created a separate order for your grocery items. Track it here.'
                  : 'We created a separate Cafe order for hot brews & snacks. Track it here.'}
              </Text>
            </View>
            <Pressable
              onPress={() => router.replace(`/order/${companionOrder.id}`)}
              className="bg-white px-3 py-2 rounded-xl"
            >
              <Text className="text-rose-600 font-extrabold text-[10px]">
                {companionOrder.shopName === 'FastKirana Cafe Kitchen' ? 'Track Cafe →' : 'Track Grocery →'}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Estimated delivery banner */}
        <LinearGradient
           colors={
             order.status === 'CANCELLED'
               ? ['#ef4444', '#b91c1c']
               : order.status === 'DELIVERED'
               ? ['#10b981', '#059669']
               : order.status === 'SHIPPED'
               ? ['#f97316', '#e11d48']
               : ['#ec4899', '#f43f5e']
           }
           start={{ x: 0, y: 0 }}
           end={{ x: 1, y: 1 }}
           style={{ borderRadius: 16, padding: 14, marginBottom: 12, overflow: 'hidden' }}
         >
           <View style={{ position: 'absolute', right: -30, top: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.08)' }} />
           
           <View className="flex-row items-center justify-between">
             <Text className="text-white text-[9px] font-black tracking-widest uppercase bg-black/20 px-2.5 py-1 rounded-full">
               {order.status === 'DELIVERED' ? 'Completed' : order.status === 'CANCELLED' ? 'Cancelled' : 'Delivery in Progress'}
             </Text>
           </View>
           
           <Text className="text-white font-black text-lg mt-2 tracking-tight">
             {order.status === 'CANCELLED'
               ? 'Order Cancelled'
               : order.status === 'DELIVERED' 
               ? 'Order Delivered!' 
               : order.status === 'SHIPPED' 
               ? 'On the way' 
               : 'Preparing your order...'}
           </Text>
           
           <Text className="text-white/80 text-[10px] font-semibold mt-0.5 leading-4">
             {order.status === 'CANCELLED'
               ? 'This order has been cancelled and will not be processed further.'
               : order.status === 'DELIVERED' 
               ? 'Your package has been safely received. Thank you for shopping with us!' 
               : order.status === 'SHIPPED'
               ? 'Our delivery partner is moving fast to reach your delivery location.'
               : 'Our team is picking and packing your fresh items at the dark store.'}
           </Text>
          </LinearGradient>



        {/* Live Tracking / Pickup Location Animated Route Map */}
        {!['DELIVERED', 'CANCELLED'].includes(order.status) && (
          <AnimatedDeliveryRouteMap
            isDarkMode={isDarkMode}
            shopName={order.shopName || undefined}
            destinationLabel={order.address?.label || 'Home'}
          />
        )}

        {/* Order Details Header */}
         <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 mb-4 shadow-xs">
           <View className="flex-row justify-between items-center mb-2">
             <View>
               <Text className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold uppercase tracking-wider">Order ID</Text>
               <Text 
                 style={{ 
                   fontFamily: Platform.OS === 'ios' ? 'Courier-Bold' : 'monospace', 
                   fontSize: 14, 
                   fontWeight: '800', 
                   color: isDarkMode ? '#e4e4e7' : '#1e293b',
                   marginTop: 2
                 }}
               >
                 #{formatDisplayOrderId(order.id, (order as any).readableId)}
               </Text>
             </View>
             
             <ScalePressable 
                onPress={handleCopyOrderId}
                scaleValue={0.95}
                haptic="light"
                style={{
                  backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <Copy size={11} color={isDarkMode ? '#a1a1aa' : '#475569'} />
                <Text style={{ fontSize: 9.5, fontWeight: '800', color: isDarkMode ? '#a1a1aa' : '#475569' }}>Copy ID</Text>
              </ScalePressable>
           </View>
           
           <View style={{ height: 1, backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9', marginVertical: 8 }} />
           
           <Text className="text-slate-400 dark:text-zinc-500 text-[10px] font-bold">
             Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
           </Text>
         </View>

        {/* Live Status Timeline Tracker */}
        <View style={{
          backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
          padding: 16,
          marginBottom: 16,
          ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.04, shadowRadius: 6 },
            android: { elevation: 2 }
          })
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#27272a' : '#f1f5f9', paddingBottom: 10, marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color={isDarkMode ? '#34d399' : '#059669'} strokeWidth={2.5} />
              <Text style={{ fontSize: 13.5, fontWeight: '900', color: isDarkMode ? '#fafafa' : '#0f172a', letterSpacing: -0.2 }}>
                Live Status Timeline
              </Text>
            </View>
            <View style={{ backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? 'rgba(16,185,129,0.3)' : '#d1fae5' }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#10b981', textTransform: 'uppercase' }}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </Text>
            </View>
          </View>

          <View style={{ paddingLeft: 4 }}>
            {statusSteps.map((status, index) => {
              const isCurrent = index === activeStepIndex;
              const isLast = index === statusSteps.length - 1;

              return (
                <View key={index} style={{ flexDirection: 'row', position: 'relative', marginBottom: isLast ? 0 : 16 }}>
                  {/* Vertical Connector Line */}
                  {!isLast && (
                    <View 
                      style={{
                        position: 'absolute',
                        left: 15,
                        top: 32,
                        bottom: -16,
                        width: 2.5,
                        borderRadius: 1.25,
                        backgroundColor: status.completed && statusSteps[index + 1].isCancelled 
                          ? '#ef4444' 
                          : (status.completed && statusSteps[index + 1].completed ? '#10b981' : (isDarkMode ? '#27272a' : '#e2e8f0')),
                        zIndex: 1,
                      }}
                    />
                  )}

                  {/* Status Dot */}
                  <TimelineDot completed={status.completed} isActive={isCurrent} stepIndex={index} isCancelled={status.isCancelled} />

                  {/* Details Card */}
                  <View style={{
                    marginLeft: 14,
                    flex: 1,
                    backgroundColor: isCurrent 
                      ? (isDarkMode ? 'rgba(16,185,129,0.12)' : '#f0fdf4') 
                      : 'transparent',
                    borderRadius: 12,
                    paddingHorizontal: isCurrent ? 12 : 0,
                    paddingVertical: isCurrent ? 8 : 2,
                    borderWidth: isCurrent ? 1 : 0,
                    borderColor: isCurrent ? (isDarkMode ? 'rgba(16,185,129,0.3)' : '#bbf7d0') : 'transparent',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={{
                        fontSize: 13,
                        fontWeight: '900',
                        color: isCurrent 
                          ? (isDarkMode ? '#34d399' : '#059669') 
                          : status.completed 
                          ? (isDarkMode ? '#f4f4f5' : '#0f172a') 
                          : (isDarkMode ? '#52525b' : '#94a3b8'),
                      }}>
                        {status.label}
                      </Text>
                      {isCurrent && (
                        <View style={{ backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 6 }}>
                          <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '900', textTransform: 'uppercase' }}>
                            LIVE
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={{
                      fontSize: 10.5,
                      fontWeight: '600',
                      color: isCurrent 
                        ? (isDarkMode ? '#a7f3d0' : '#166534') 
                        : (isDarkMode ? '#71717a' : '#64748b'),
                      marginTop: 2,
                      lineHeight: 15,
                    }}>
                      {status.desc}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Rider Partner card */}
        {['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'ARRIVED'].includes(order.status) && (
          <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-3.5 mb-4 flex-row justify-between items-center shadow-xs">
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/20 items-center justify-center border border-emerald-100 dark:border-emerald-900/30">
                <Truck size={20} color="#10b981" />
              </View>
              <View className="flex-1 pr-1">
                <Text className="text-slate-400 dark:text-zinc-500 font-extrabold text-[8px] uppercase tracking-wider">Delivery Executive</Text>
                <Text numberOfLines={1} className="text-slate-800 dark:text-zinc-100 font-black text-sm mt-0.5">
                  {(order as any).deliveryUser?.name || (order as any).deliveryExecutive?.name || (order as any).rider?.name || (order as any).assignedRider?.name || (order as any).riderName || (order as any).driverName || 'FastKirana Delivery Executive'}
                </Text>
                <Text numberOfLines={1} className="text-slate-400 dark:text-zinc-400 text-[10px] font-semibold mt-0.5">
                  {(order as any).deliveryUser?.phone || (order as any).deliveryExecutive?.phone || (order as any).rider?.phone || (order as any).assignedRider?.phone || (order as any).riderPhone || (order as any).driverPhone || (order as any).deliveryPhone || '+91 81128 49854'}
                </Text>
              </View>
            </View>
            
            <View style={{ width: 40, height: 40 }}>
              <ScalePressable 
                onPress={() => {
                  const phoneToCall = (order as any).deliveryUser?.phone 
                    || (order as any).deliveryExecutive?.phone 
                    || (order as any).rider?.phone 
                    || (order as any).assignedRider?.phone 
                    || (order as any).riderPhone 
                    || (order as any).driverPhone 
                    || (order as any).deliveryPhone 
                    || order.shopPhone 
                    || '+918112849854';
                  Linking.openURL(`tel:${phoneToCall}`);
                }}
                scaleValue={0.9}
                haptic="light"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
                }}
              >
                <Phone size={16} color={isDarkMode ? '#e4e4e7' : '#475569'} />
              </ScalePressable>
            </View>
          </View>
        )}

        {/* Delivery Partner detail */}
        {order.shopPhone && (
          <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-3.5 mb-4 flex-row justify-between items-center shadow-xs">
            <View className="flex-row items-center gap-3 flex-1 pr-2">
              <View className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/20 items-center justify-center border border-rose-100 dark:border-rose-900/30">
                <ShieldCheck size={22} color="#e11d48" />
              </View>
              <View className="flex-1 pr-1">
                <Text className="text-slate-800 dark:text-zinc-100 font-extrabold text-xs">Fulfillment Store</Text>
                <Text numberOfLines={1} className="text-slate-400 dark:text-zinc-450 text-[10px] mt-0.5">{order.shopName || 'FastKirana Dark Store'}</Text>
              </View>
            </View>
            
            <View style={{ width: 40, height: 40 }}>
              <ScalePressable 
                onPress={() => Linking.openURL(`tel:${order.shopPhone}`)}
                scaleValue={0.9}
                haptic="light"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
                }}
              >
                <Phone size={16} color={isDarkMode ? '#e4e4e7' : '#475569'} />
              </ScalePressable>
            </View>
          </View>
        )}

        {/* Delivery Proof Photo display */}
        {order.status === 'DELIVERED' && order.deliveryPhoto && (
          <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 mb-4 shadow-xs">
            <View className="flex-row items-center gap-2 mb-3">
              <UserCheck size={18} color="#10b981" />
              <Text className="text-slate-800 dark:text-zinc-100 font-black text-sm uppercase tracking-wider">Proof of Delivery</Text>
            </View>
            <View className="w-full h-48 bg-slate-50 dark:bg-zinc-800 rounded-xl overflow-hidden border border-slate-100 dark:border-zinc-800">
              <Image 
                source={{ 
                  uri: order.deliveryPhoto.startsWith('/') && !order.deliveryPhoto.startsWith('//')
                    ? `${API_BASE_URL.replace('/api', '')}${order.deliveryPhoto}`
                    : order.deliveryPhoto 
                }} 
                contentFit="cover" 
                style={{ width: '100%', height: '100%' }}
              />
            </View>
          </View>
        )}

        {/* Rating and Tip Selector */}
        {order.status === 'DELIVERED' && (
          <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 mb-4 shadow-xs">
            <View className="flex-row items-center gap-2 border-b border-slate-50 dark:border-zinc-800 pb-2.5 mb-3">
              <Star size={15} color="#e20a22" fill="#e20a22" />
              <Text className="text-slate-800 dark:text-zinc-100 font-black text-xs uppercase tracking-wider">Rate Delivery Experience</Text>
            </View>

            {reviewSubmitted ? (
              <View className="items-center py-4 gap-2">
                <Text style={{ fontSize: 32 }}>🎉</Text>
                <Text className="text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-wider">Feedback Submitted!</Text>
                <View className="flex-row gap-1 my-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={16} color="#fbbf24" fill={s <= rating ? '#fbbf24' : 'transparent'} />
                  ))}
                </View>
                {tip > 0 && (
                  <Text className="text-slate-500 dark:text-slate-400 text-[10px] font-bold">
                    Added rider tip: {formatPrice(tip)}
                  </Text>
                )}
                <Text className="text-slate-400 dark:text-zinc-550 text-[9px] font-semibold mt-1">Thank you for helping us improve our service.</Text>
              </View>
            ) : (
              <View className="gap-4">
                {/* Stars Selector */}
                <View className="items-center">
                  <Text className="text-slate-450 dark:text-zinc-500 text-[9px] font-bold uppercase tracking-wider mb-2">How was your rider's service?</Text>
                  <View className="flex-row gap-2">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isLit = starVal <= rating;
                      return (
                        <Pressable
                          key={starVal}
                          onPress={() => {
                            setRating(starVal);
                            triggerHaptic('light');
                          }}
                          className="p-1 active:scale-90"
                        >
                          <Star 
                            size={28} 
                            color={isLit ? '#fbbf24' : (isDarkMode ? '#3f3f46' : '#d1d5db')} 
                            fill={isLit ? '#fbbf24' : 'transparent'} 
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View className="h-px bg-slate-50 dark:bg-zinc-800/80" />

                {/* Rider Tips */}
                <View>
                  <Text className="text-slate-800 dark:text-zinc-200 font-black text-xs uppercase tracking-wider mb-1">Support your rider with a tip</Text>
                  <Text className="text-slate-500 dark:text-slate-400 text-[9px] font-bold mb-3">100% of tips go directly to your delivery partner.</Text>
                  
                  <View className="flex-row gap-2">
                    {[
                      { val: 10, label: '₹10' },
                      { val: 20, label: '₹20' },
                      { val: 30, label: '₹30' },
                      { val: 50, label: '₹50' },
                    ].map((tipOpt) => {
                      const isSelected = tip === tipOpt.val;
                      return (
                        <Pressable
                          key={tipOpt.val}
                          onPress={() => {
                            setTip(isSelected ? 0 : tipOpt.val);
                            triggerHaptic('light');
                          }}
                          className={`flex-1 py-2 rounded-xl border items-center justify-center ${
                            isSelected 
                              ? 'bg-rose-500/10 border-rose-500' 
                              : 'bg-slate-50 dark:bg-zinc-850 border-slate-200 dark:border-zinc-800'
                          }`}
                        >
                          <Text className={`text-[10px] font-extrabold ${isSelected ? 'text-rose-600 dark:text-rose-450' : 'text-slate-500 dark:text-slate-400'}`}>
                            {tipOpt.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* Submit review button */}
                <Pressable
                  onPress={handleSubmitReview}
                  disabled={isSubmittingReview || rating === 0}
                  className={`rounded-xl py-3 items-center flex-row justify-center gap-2 ${
                    rating === 0 
                      ? 'bg-slate-200 dark:bg-zinc-800 opacity-60' 
                      : 'bg-rose-600 active:bg-rose-700'
                  }`}
                >
                  {isSubmittingReview ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Sparkles size={12} color={rating === 0 ? '#94a3b8' : '#fff'} />
                  )}
                  <Text className={`font-extrabold text-xs uppercase tracking-wider ${rating === 0 ? 'text-slate-400 dark:text-zinc-500' : 'text-white'}`}>
                    {isSubmittingReview ? 'Submitting...' : 'Submit Feedback'}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {/* Destination Address / Pickup Address */}
         <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100/60 dark:border-zinc-800/40 p-4 mb-4 shadow-xs gap-3">
           <View className="flex-row items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
             <View className="flex-row items-center gap-2">
               <MapPin size={15} color="#e20a22" />
               <Text className="text-slate-800 dark:text-zinc-100 font-black text-xs uppercase tracking-wider">
                 {order.deliveryMethod === 'PICKUP' ? 'Pickup Location' : 'Delivery Destination'}
               </Text>
             </View>
             {order.address?.label && (
               <View className="bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-100 dark:border-rose-900/30">
                 <Text className="text-rose-600 dark:text-rose-400 font-extrabold text-[8.5px] uppercase">{order.address.label}</Text>
               </View>
             )}
           </View>
           
           <View>
             {order.deliveryMethod === 'PICKUP' ? (
               <View className="gap-2">
                 <Text className="text-slate-650 dark:text-zinc-300 text-xs font-semibold leading-relaxed">
                   {order.shopName === 'FastKirana Restaurant Kitchen' 
                     ? 'A.S Restaurant, Ghatampur, Kanpur Nagar, Kanpur, 209206'
                     : order.shopName === 'FastKirana Cafe Kitchen'
                     ? 'Vikas Medical Store/Cafe, NH34, Ghatampur, Kanpur Nagar, Kanpur, 209206'
                     : 'Vikas Medical Store, NH34, Ghatampur, Kanpur Nagar, Kanpur, 209206'}
                 </Text>
                 
                 <Pressable
                   onPress={() => {
                     const isRestaurant = order.shopName === 'FastKirana Restaurant Kitchen';
                     const lat = isRestaurant ? 26.160167 : 26.1534185;
                     const lng = isRestaurant ? 80.1691234 : 80.1714024;
                     Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
                   }}
                   className="flex-row items-center gap-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 px-3 py-2 rounded-xl active:bg-rose-100 self-start mt-1"
                 >
                   <Text style={{ fontSize: 11 }}>🧭</Text>
                   <Text className="text-primary font-black text-[10px] uppercase tracking-wider">Get Directions</Text>
                 </Pressable>
               </View>
             ) : (
               <Text className="text-slate-650 dark:text-zinc-300 text-xs font-semibold leading-relaxed">
                 {order.address?.houseNo ? `House No ${order.address.houseNo}, ` : ''}
                 {order.address?.street ? `${order.address.street}, ` : ''}
                 {order.address?.area ? `${order.address.area}, ` : ''}
                 {order.address?.city || 'Kanpur'} {order.address?.pincode ? `- ${order.address.pincode}` : ''}
               </Text>
             )}
           </View>

           <View className="h-px bg-slate-100 dark:bg-zinc-800 my-1" />

           <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Text style={{ fontSize: 11 }}>💳</Text>
                <Text className="text-slate-500 dark:text-zinc-400 text-[10px] font-black uppercase">Payment:</Text>
                <Text className="text-slate-700 dark:text-zinc-300 text-[10px] font-black uppercase">
                  {order.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '⚡ UPI Transaction'}
                </Text>
              </View>
              {order.paymentMethod === 'UPI' && (
                <View className={`px-2 py-0.5 rounded-md border ${
                  order.status === 'PENDING' 
                    ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30' 
                    : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
                }`}>
                  <Text className={`font-extrabold text-[8.5px] uppercase ${
                    order.status === 'PENDING' ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                  }`}>
                    {order.status === 'PENDING' ? 'Pending Verification' : 'PAID'}
                  </Text>
                </View>
              )}
            </View>

            {(order.deliverySlot || order.deliveryInstructions) && (
              <View className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-xl border border-slate-100 dark:border-zinc-850 gap-2 mt-1">
                {order.deliverySlot && (
                  <View className="flex-row items-center gap-1.5">
                    <Text style={{ fontSize: 11 }}>🕒</Text>
                    <Text className="text-slate-700 dark:text-zinc-300 text-[10px] font-black uppercase">Slot: {order.deliverySlot}</Text>
                  </View>
                )}
                {order.deliveryInstructions && (
                  <View className="flex-row items-start gap-1.5">
                    <Text style={{ fontSize: 11, marginTop: 1 }}>📝</Text>
                    <View className="flex-1">
                      <Text className="text-slate-400 dark:text-zinc-550 text-[8px] font-black uppercase tracking-wider">Rider Notes</Text>
                      <Text className="text-slate-650 dark:text-zinc-300 text-[10.5px] font-bold mt-0.5">{order.deliveryInstructions}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        
        {/* Payment Receipt & Bill Summary Card */}
        {(() => {
          const itemSubtotal = order.items?.reduce((acc, it) => acc + (it.price * it.quantity), 0) || order.total;
          const isPickup = order.deliveryMethod === 'PICKUP';
          const backendDeliveryFee = (order as any).deliveryFee !== undefined ? (order as any).deliveryFee : null;
          const isFreeDelivery = isPickup || itemSubtotal >= 199 || backendDeliveryFee === 0;
          const effectiveDeliveryFee = isFreeDelivery ? 0 : (backendDeliveryFee !== null ? backendDeliveryFee : 15);
          const handlingFee = (order as any).handlingFee ?? (order as any).miscFee ?? (order as any).packagingFee ?? 2;

          return (
            <View style={{
              backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
              borderRadius: 20,
              borderWidth: 1,
              borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
              padding: 16,
              marginBottom: 16,
              ...Platform.select({
                ios: {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.04,
                  shadowRadius: 6,
                },
                android: { elevation: 2 }
              })
            }}>
              {/* Header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: isDarkMode ? '#27272a' : '#f1f5f9', paddingBottom: 10, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: isDarkMode ? 'rgba(16,185,129,0.15)' : '#f0fdf4', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: isDarkMode ? 'rgba(16,185,129,0.3)' : '#d1fae5' }}>
                    <Receipt size={16} color="#10b981" strokeWidth={2.5} />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13.5, fontWeight: '900', color: isDarkMode ? '#fafafa' : '#0f172a', letterSpacing: -0.2 }}>
                      Bill Summary & Receipt
                    </Text>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
                      {order.items?.length || 0} Items • Paid via {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'UPI'}
                    </Text>
                  </View>
                </View>
                <View style={{ backgroundColor: isDarkMode ? '#27272a' : '#f8fafc', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0' }}>
                  <Text style={{ fontSize: 9, fontWeight: '800', color: isDarkMode ? '#a1a1aa' : '#64748b', textTransform: 'uppercase' }}>
                    {order.paymentMethod === 'COD' ? '💵 COD' : '⚡ UPI'}
                  </Text>
                </View>
              </View>

              {/* Individual Items List */}
              <View style={{ gap: 8, marginBottom: 12 }}>
                {order.items?.map((item, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 10 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
                        {item.quantity}x
                      </Text>
                      <Text numberOfLines={1} style={{ fontSize: 11.5, fontWeight: '700', color: isDarkMode ? '#f4f4f5' : '#1e293b', flex: 1 }}>
                        {item.name}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: isDarkMode ? '#fafafa' : '#0f172a' }}>
                      {formatPrice(item.price * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{ height: 1, backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9', marginVertical: 8 }} />

              {/* Charges Breakdown */}
              <View style={{ gap: 6, marginBottom: 10 }}>
                {/* Item Total */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '600', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Item Total</Text>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: isDarkMode ? '#e4e4e7' : '#334155' }}>
                    {formatPrice(itemSubtotal)}
                  </Text>
                </View>

                {/* Delivery Charge */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 11.5, fontWeight: '600', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Delivery Charge</Text>
                    {isFreeDelivery && (
                      <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 }}>
                        <Text style={{ fontSize: 8.5, fontWeight: '900', color: '#15803d', textTransform: 'uppercase' }}>FREE</Text>
                      </View>
                    )}
                  </View>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: isFreeDelivery ? '#10b981' : (isDarkMode ? '#e4e4e7' : '#334155') }}>
                    {isFreeDelivery ? 'FREE' : formatPrice(effectiveDeliveryFee)}
                  </Text>
                </View>

                {/* Handling & Packaging Fee */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 11.5, fontWeight: '600', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Handling & Packaging</Text>
                  <Text style={{ fontSize: 11.5, fontWeight: '700', color: isDarkMode ? '#e4e4e7' : '#334155' }}>
                    {formatPrice(handlingFee)}
                  </Text>
                </View>
              </View>

              <View style={{ height: 1.5, backgroundColor: isDarkMode ? '#3f3f46' : '#e2e8f0', marginVertical: 8 }} />

              {/* Final Total Paid */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 2 }}>
                <Text style={{ fontSize: 14, fontWeight: '900', color: isDarkMode ? '#fafafa' : '#0f172a' }}>
                  Grand Total
                </Text>
                <Text style={{ fontSize: 16, fontWeight: '900', color: '#e20a22' }}>
                  {formatPrice(order.total)}
                </Text>
              </View>
            </View>
          );
        })()}
 
        {/* Reorder Button */}
        <ScalePressable
          onPress={handleReorder}
          scaleValue={0.96}
          haptic="success"
          style={{ width: '100%', marginBottom: 40 }}
        >
          <View style={{
            borderRadius: 16,
            backgroundColor: '#047857',
            paddingBottom: 4,
            shadowColor: '#10b981',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.35,
            shadowRadius: 10,
            elevation: 6,
          }}>
            <LinearGradient
              colors={['#10b981', '#059669', '#047857']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <RefreshCw size={17} color="#ffffff" strokeWidth={2.5} />
              <Text numberOfLines={1} style={{ color: '#ffffff', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                REORDER THESE ITEMS ({order.items?.length || 0})
              </Text>
            </LinearGradient>
          </View>
        </ScalePressable>
      </ScrollView>
    </SafeAreaView>
  );
}
