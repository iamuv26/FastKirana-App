import React from 'react';
import { View, StyleSheet, useWindowDimensions, Dimensions, Text, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { toast } from '../../lib/toast';
import { triggerHaptic } from '../../lib/haptic';
import { ScalePressable } from './ScalePressable';

export default function CafePromoCarousel() {
  const { width: windowWidth } = useWindowDimensions();
  const screenWidth = windowWidth > 0 ? windowWidth : (Dimensions.get('window').width > 0 ? Dimensions.get('window').width : 390);
  const carouselWidth = screenWidth > 768 ? 540 - 24 : screenWidth - 24;
  const bannerWidth = carouselWidth - 12; // Accounts for marginHorizontal: 6 on both sides
  const bannerHeight = bannerWidth / 3.0; // Exact 3:1 aspect ratio (1024x341 pixels)
  const wrapperHeight = bannerHeight + 15;

  const handleSlidePress = async () => {
    triggerHaptic('medium');
    await Clipboard.setStringAsync('FIRST5');
    toast.success('Coupon code "FIRST5" copied! 📋');
  };

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
