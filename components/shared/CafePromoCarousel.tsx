import React from 'react';
import { View, StyleSheet, useWindowDimensions, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { ChefHat, Sparkles } from 'lucide-react-native';
import { toast } from '../../lib/toast';
import { triggerHaptic } from '../../lib/haptic';
import { ScalePressable } from './ScalePressable';

export default function CafePromoCarousel({ mode = 'cafe' }: { mode?: 'cafe' | 'restaurant' }) {
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = windowWidth > 0 ? windowWidth : 390;
  const carouselWidth = screenWidth > 768 ? 540 - 24 : screenWidth - 24;
  const bannerWidth = carouselWidth - 12; // Accounts for marginHorizontal: 6 on both sides
  const bannerHeight = Math.max(105, bannerWidth / 3.0); // Aspect ratio (1024x341)
  const wrapperHeight = bannerHeight + 12;

  const handleSlidePress = async () => {
    triggerHaptic('medium');
    const code = mode === 'restaurant' ? 'WEDSON100' : 'FIRST5';
    await Clipboard.setStringAsync(code);
    toast.success(`Coupon code "${code}" copied! 📋`);
  };

  if (mode === 'restaurant') {
    return (
      <View style={styles.container}>
        <ScalePressable
          onPress={handleSlidePress}
          scaleValue={0.97}
          style={{
            width: carouselWidth,
            height: wrapperHeight,
            justifyContent: 'center',
          }}
        >
          <View style={{
            width: bannerWidth,
            marginHorizontal: 6,
            height: bannerHeight,
            borderRadius: 20,
            overflow: 'hidden',
            borderWidth: 1.5,
            borderColor: 'rgba(226, 10, 34, 0.25)',
            backgroundColor: '#18181b',
            elevation: 4,
            shadowColor: '#e20a22',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
          }}>
            <LinearGradient
              colors={['#881337', '#e20a22', '#9f1239']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ width: '100%', height: '100%', paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}
            >
              <View style={{ flex: 1, paddingRight: 10, zIndex: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, alignSelf: 'flex-start', marginBottom: 6 }}>
                  <ChefHat size={12} color="#ffffff" />
                  <Text style={{ color: '#ffffff', fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Wedson Restaurant Special
                  </Text>
                </View>
                <Text numberOfLines={1} style={{ color: '#ffffff', fontSize: 16, fontWeight: '900', letterSpacing: -0.3 }}>
                  FLAT ₹100 OFF ON MEALS
                </Text>
                <Text style={{ color: '#fecaca', fontSize: 10, fontWeight: '700', marginTop: 2 }}>
                  Use Code: <Text style={{ color: '#ffffff', fontWeight: '900' }}>WEDSON100</Text> • Tap to Copy
                </Text>
              </View>

              <View style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                <Text style={{ fontSize: 26 }}>🥘</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 }}>
                  <Sparkles size={10} color="#fef08a" />
                  <Text style={{ color: '#ffffff', fontSize: 8.5, fontWeight: '900', textTransform: 'uppercase' }}>HOT & FRESH</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </ScalePressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScalePressable
        onPress={handleSlidePress}
        scaleValue={0.97}
        style={{
          width: carouselWidth,
          height: wrapperHeight,
          justifyContent: 'center',
        }}
      >
        <View style={{
          width: bannerWidth,
          marginHorizontal: 6,
          height: bannerHeight,
          borderRadius: 20,
          overflow: 'hidden',
          borderWidth: 1.5,
          borderColor: 'rgba(0, 0, 0, 0.05)',
          backgroundColor: '#ffffff',
          elevation: 3,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 4,
        }}>
          <Image
            source={require('../../assets/first5_banner.png')}
            resizeMode="cover"
            style={{ width: '100%', height: '100%' }}
          />
        </View>
      </ScalePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 8,
    alignItems: 'center',
  },
});
