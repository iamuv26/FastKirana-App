import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { ShoppingBasket } from 'lucide-react-native';
import { useTheme } from '../../app/context/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

export default function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const progress = useSharedValue(0);
  const fade = useSharedValue(1);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  useEffect(() => {
    // Smooth progress bar loading animation (1.5 seconds)
    progress.value = withTiming(1, { duration: 1500 }, (finished) => {
      if (finished) {
        // Smoothly fade out screen (300ms)
        fade.value = withTiming(0, { duration: 300 }, (fadeFinished) => {
          if (fadeFinished) {
            runOnJS(onFinish)();
          }
        });
      }
    });
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
  }));

  return (
    <Animated.View 
      style={[
        StyleSheet.absoluteFill, 
        { 
          backgroundColor: isDarkMode ? '#09090b' : '#ffffff', 
          zIndex: 99999, 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingVertical: 64,
        },
        containerStyle
      ]}
    >
      {/* Empty top spacer to balance layout */}
      <View style={{ height: 20 }} />

      {/* Main Logo, Slogan, and Basket */}
      <View style={{ alignItems: 'center' }}>
        {/* Red F Logo */}
        <Image 
          source={require('../../assets/splash-icon.png')} 
          style={{ width: 140, height: 140, borderRadius: 32, marginBottom: 20 }}
          resizeMode="contain"
        />

        {/* Brand Text */}
        <Text style={{ fontSize: 36, fontWeight: '900', letterSpacing: -1, lineHeight: 40 }}>
          <Text style={{ color: isDarkMode ? '#ffffff' : '#1e293b' }}>Fast</Text>
          <Text style={{ color: '#e20a22' }}>Kirana</Text>
        </Text>

        {/* Slogan categories */}
        <Text style={{ color: isDarkMode ? '#71717a' : '#94a3b8', fontSize: 11.5, fontWeight: '800', letterSpacing: 0.5, marginTop: 8 }}>
          —  Groceries  •  Food  •  Essentials  —
        </Text>

        {/* Basket Icon */}
        <View style={{ marginTop: 36, alignItems: 'center' }}>
          <ShoppingBasket size={42} color="#e20a22" strokeWidth={1.5} />
        </View>
      </View>

      {/* Bottom Slogan & Loading Bar */}
      <View style={{ alignItems: 'center', marginBottom: 20 }}>
        {/* Delivering promise */}
        <Text style={{ fontSize: 12.5, fontWeight: '900', color: isDarkMode ? '#a1a1aa' : '#94a3b8', marginBottom: 14 }}>
          Fast. Fresh. <Text style={{ color: '#e20a22' }}>Delivered.</Text>
        </Text>

        {/* Progress Bar Container */}
        <View style={{ width: 150, height: 5, backgroundColor: isDarkMode ? '#27272a' : '#ffe4e6', borderRadius: 9999, overflow: 'hidden' }}>
          <Animated.View 
            style={[
              { height: '100%', backgroundColor: '#e20a22' },
              progressStyle
            ]} 
          />
        </View>
      </View>
    </Animated.View>
  );
}
