import { View, Text, Pressable, ScrollView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Coffee, Flame, ChevronRight, Clock } from 'lucide-react-native';
import { formatPrice } from '../../lib/utils';
import { useTheme } from '../../app/context/ThemeContext';
import { THEME } from '../../lib/theme';
import { triggerHaptic } from '../../lib/haptic';

export default function CafeFlashDeals() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  // Flash Deals Countdown (starts at 15m 00s for demo)
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes in seconds

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 900));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  const flashProducts = [
    { id: 'p1', name: 'Fresh Strawberries', price: 99, mrp: 199, discount: '50% OFF', unit: '250g', emoji: '🍓' },
    { id: 'p2', name: 'Amul Salted Butter', price: 48, mrp: 60, discount: '20% OFF', unit: '100g', emoji: '🧈' },
    { id: 'p3', name: 'Coca-Cola Zero Sugar', price: 30, mrp: 40, discount: '25% OFF', unit: '300ml', emoji: '🥤' }
  ];

  return (
    <View style={{ marginBottom: THEME.SPACING.xl }}>
      {/* Cafe Banner Section */}
      <Pressable 
        onPress={() => {
          triggerHaptic('light');
          router.push('/cafe');
        }}
        style={{
          marginHorizontal: THEME.SPACING.lg,
          marginBottom: THEME.SPACING.lg,
          padding: THEME.SPACING.lg,
          borderRadius: THEME.RADIUS.lg,
          backgroundColor: '#2e1505',
          borderWidth: 1,
          borderColor: '#451a03',
          position: 'relative',
          overflow: 'hidden',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          ...Platform.select<any>({
            ios: THEME.SHADOWS.sm,
            android: { elevation: 2 }
          })
        }}
      >
        <View style={{ zIndex: 10, flex: 1, paddingRight: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: THEME.RADIUS.pill, alignSelf: 'flex-start' }}>
            <Coffee size={12} color="#fcd34d" />
            <Text style={{ color: '#fcd34d', fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700' }} className="uppercase tracking-wider">FastKirana Café</Text>
          </View>
          <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800', marginTop: 8, lineHeight: 22 }}>Chai, Coffee & Hot Bites!</Text>
          <Text style={{ color: '#fed7aa', fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '500', marginTop: 4 }}>Freshly brewed and delivered steaming hot in 8 mins.</Text>
        </View>

        <View style={{ backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: THEME.RADIUS.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', zIndex: 10 }}>
          <Text style={{ color: '#fed7aa', fontWeight: '700', fontSize: THEME.TYPOGRAPHY.sizes.micro, textTransform: 'uppercase', textAlign: 'center' }}>Order Food</Text>
          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12, marginTop: 2, textAlign: 'center' }}>View Menu</Text>
        </View>

        {/* Decorative background emoji */}
        <Text style={{ position: 'absolute', right: -10, top: -10, fontSize: 72, opacity: 0.08 }}>☕</Text>
      </Pressable>

      {/* Flash Deals Section */}
      <View style={{ marginHorizontal: THEME.SPACING.lg, borderRadius: THEME.RADIUS.lg, padding: THEME.SPACING.lg, backgroundColor: isDarkMode ? THEME.COLORS.dark.surface : '#ffffff', borderColor: isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9' }} className="border shadow-xs">
        {/* Flash Header */}
        <View className="flex-row justify-between items-center mb-3.5">
          <View className="flex-row items-center gap-1.5">
            <Flame size={18} color="#f97316" fill="#f97316" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: isDarkMode ? '#fafafa' : '#1e293b' }}>Flash Deals</Text>
          </View>
          
          <View style={{ backgroundColor: isDarkMode ? 'rgba(249,115,22,0.15)' : '#fff7ed', borderColor: isDarkMode ? 'rgba(249,115,22,0.25)' : '#ffedd5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: THEME.RADIUS.sm }} className="flex-row items-center gap-1 border">
            <Clock size={12} color="#ea580c" />
            <Text style={{ color: '#ea580c', fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700' }} className="tracking-wider uppercase">
              {formatTime(timeLeft)}
            </Text>
          </View>
        </View>

        {/* Horizontal Deals list */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: THEME.SPACING.md }} className="flex-row">
          {flashProducts.map((product) => (
            <Pressable
              key={product.id}
              onPress={() => router.push(`/product/${product.id}`)}
              style={{
                width: 124,
                backgroundColor: isDarkMode ? THEME.COLORS.dark.surfaceElevated : '#f8fafc',
                borderColor: isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9',
                borderRadius: THEME.RADIUS.sm,
                padding: 10,
                alignItems: 'center',
              }}
              className="border"
            >
              {/* Product Label badge */}
              <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: THEME.COLORS.brand.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: THEME.RADIUS.xs, zIndex: 10 }}>
                <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '700' }} className="uppercase">{product.discount}</Text>
              </View>

              {/* Product Emoji */}
              <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#ffffff', borderWidth: 1, borderColor: isDarkMode ? '#27272a' : '#f1f5f9' }} className="items-center justify-center mb-2.5 mt-4">
                <Text style={{ fontSize: 26 }}>{product.emoji}</Text>
              </View>

              {/* Product Info */}
              <Text
                style={{
                  color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary,
                  fontSize: 11,
                  fontWeight: '600',
                  height: 32,
                  textAlign: 'center',
                }}
                numberOfLines={2}
              >
                {product.name}
              </Text>
              <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '500', color: isDarkMode ? '#71717a' : '#94a3b8', marginTop: 2 }}>{product.unit}</Text>

              {/* Pricing & Add */}
              <View style={{ borderTopColor: isDarkMode ? THEME.COLORS.dark.border : '#f1f5f9' }} className="flex-row items-center justify-between w-full mt-2.5 border-t pt-2">
                <View>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }}>{formatPrice(product.price)}</Text>
                  <Text style={{ fontSize: 9, fontWeight: '400', color: isDarkMode ? '#71717a' : '#94a3b8' }} className="line-through">{formatPrice(product.mrp)}</Text>
                </View>
                <Pressable style={{ backgroundColor: THEME.COLORS.brand.primary, borderRadius: THEME.RADIUS.xs, paddingHorizontal: 10, paddingVertical: 6 }}>
                  <Text style={{ color: '#ffffff', fontSize: 10, fontWeight: '700' }}>ADD</Text>
                </Pressable>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}
