import { View, Text, ScrollView, Pressable, Platform } from 'react-native';
import { useEffect, useState, useMemo } from 'react';
import ProductCard, { Product } from '../product/ProductCard';
import { ChevronRight } from 'lucide-react-native';
import { triggerHaptic } from '../../lib/haptic';
import { useTheme } from '../../app/context/ThemeContext';
import { THEME } from '../../lib/theme';

interface FlashDealsProps {
  products: Product[];
}

export default function FlashDeals({ products }: FlashDealsProps) {

  const [timeLeft, setTimeLeft] = useState('00:00:00');
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date();
      // Target is the next hour boundary
      target.setHours(now.getHours() + 1, 0, 0, 0);
      const diff = target.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const hStr = hours < 10 ? '0' + hours : hours;
      const mStr = minutes < 10 ? '0' + minutes : minutes;
      const sStr = seconds < 10 ? '0' + seconds : seconds;

      setTimeLeft(`${hStr}:${mStr}:${sStr}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter products that have discounts for deals
  const dealProducts = useMemo(() => {
    return products
      .filter((p) => p.isAvailable !== false && p.discount > 0 && !(p.category?.slug === 'cafe' || p.tags?.includes('cafe') || p.id.startsWith('c')))
      .slice(0, 8);
  }, [products]);

  if (dealProducts.length === 0) return null;

  return (
    <View style={{ marginBottom: THEME.SPACING.lg }}>
      {/* Header Row */}
      <View style={{ marginHorizontal: THEME.SPACING.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.SPACING.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.xs }}>
          <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.titleSm, fontWeight: '700', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }}>⚡ Flash Deals</Text>
          <View style={{ backgroundColor: isDarkMode ? 'rgba(239,68,68,0.15)' : '#ffe4e6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: THEME.RADIUS.xs, borderWidth: 1, borderColor: isDarkMode ? 'rgba(239,68,68,0.25)' : '#fecdd3' }}>
            <Text style={{ color: THEME.COLORS.brand.primary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700' }} className="tabular-nums">
              Ends in {timeLeft}
            </Text>
          </View>
        </View>

        {dealProducts.length > 4 && (
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              setIsExpanded(!isExpanded);
            }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
          >
            <Text style={{ color: THEME.COLORS.brand.primary, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '700' }}>
              {isExpanded ? 'Show Less' : 'See All'}
            </Text>
            <ChevronRight 
              size={13} 
              color={THEME.COLORS.brand.primary} 
              style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }} 
            />
          </Pressable>
        )}
      </View>

      {/* Conditional Layout: Expanded Vertical 2-Column Grid vs Horizontal Slider */}
      {isExpanded ? (
        <View style={{ marginHorizontal: THEME.SPACING.lg }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 2 }}>
            {dealProducts.map((product, idx) => (
              <View key={product.id} style={{ width: '48%', marginBottom: THEME.SPACING.md }}>
                <ProductCard product={product} index={idx} className="w-full" />
              </View>
            ))}
          </View>
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              setIsExpanded(false);
            }}
            style={{
              width: '100%',
              paddingVertical: 10,
              backgroundColor: isDarkMode ? THEME.COLORS.dark.surfaceElevated : '#fcf8f8',
              borderRadius: THEME.RADIUS.sm,
              borderWidth: 1,
              borderColor: isDarkMode ? 'rgba(239,68,68,0.2)' : 'rgba(226,10,34,0.1)',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 4,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: THEME.COLORS.brand.primary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '750' as any }}>Show Less ▴</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: THEME.SPACING.lg, gap: THEME.SPACING.md, alignItems: 'flex-start' }}
          decelerationRate="fast"
        >
          {dealProducts.length <= 4 ? (
            dealProducts.map((product, idx) => (
              <View key={product.id} style={{ width: 144 }}>
                <ProductCard product={product} className="w-full" index={idx} />
              </View>
            ))
          ) : (
            <>
              {dealProducts.slice(0, 4).map((product, idx) => (
                <View key={product.id} style={{ width: 144 }}>
                  <ProductCard product={product} className="w-full" index={idx} />
                </View>
              ))}

              {/* See More Card */}
              <Pressable
                onPress={() => {
                  triggerHaptic('light');
                  setIsExpanded(true);
                }}
                style={{
                  width: 144,
                  height: 244, // Match ProductCard actual height (244px)
                  borderRadius: THEME.RADIUS.md,
                  backgroundColor: isDarkMode ? THEME.COLORS.dark.surface : THEME.COLORS.light.surface,
                  borderWidth: 1,
                  borderColor: isDarkMode ? THEME.COLORS.dark.border : THEME.COLORS.light.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 12,
                  marginBottom: 16, // Align bottom edge
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDarkMode ? 0.2 : 0.05,
                      shadowRadius: 8,
                    },
                    android: {
                      elevation: 2,
                    },
                  })
                }}
              >
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: isDarkMode ? 'rgba(226,10,34,0.1)' : '#fff5f5',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  <ChevronRight size={16} color={THEME.COLORS.brand.primary} />
                </View>
                <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '700', color: isDarkMode ? '#fafafa' : '#0f172a', textAlign: 'center' }}>
                  See More
                </Text>
                <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '500', color: THEME.COLORS.brand.primary, marginTop: 2, textAlign: 'center' }}>
                  {`+${dealProducts.length - 4} Deals Left`}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
