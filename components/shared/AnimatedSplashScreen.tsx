import React, { useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import { ShoppingBasket } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { THEME } from '../../lib/theme';
import { useTheme } from '../../app/context/ThemeContext';


const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

// City Skyline SVG component
function CitySkyline({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <Svg
      width={SCREEN_WIDTH}
      height={120}
      viewBox="0 0 400 120"
      preserveAspectRatio="xMidYMax slice"
      style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
    >
      {/* Background buildings (lighter) */}
      <Path
        d="M0,120 L0,85 L12,85 L12,70 L18,70 L18,60 L24,60 L24,70 L30,70 L30,85 L38,85 L38,55 L42,55 L42,45 L48,45 L48,55 L52,55 L52,85 L60,85 L60,75 L68,75 L68,65 L72,65 L72,55 L78,55 L78,45 L82,45 L82,55 L86,55 L86,65 L90,65 L90,85 L100,85 L100,50 L104,50 L104,40 L110,40 L110,50 L114,50 L114,85 L124,85 L124,70 L128,70 L128,58 L134,58 L134,48 L138,48 L138,58 L142,58 L142,70 L148,70 L148,85 L158,85 L158,62 L164,62 L164,52 L168,52 L168,42 L174,42 L174,52 L178,52 L178,62 L184,62 L184,85 L194,85 L194,72 L200,72 L200,58 L206,58 L206,48 L212,48 L212,38 L216,38 L216,48 L220,48 L220,58 L226,58 L226,72 L232,72 L232,85 L240,85 L240,65 L246,65 L246,50 L250,50 L250,40 L256,40 L256,50 L260,50 L260,65 L266,65 L266,85 L276,85 L276,58 L282,58 L282,45 L288,45 L288,35 L292,35 L292,45 L296,45 L296,58 L302,58 L302,85 L310,85 L310,70 L316,70 L316,55 L322,55 L322,70 L328,70 L328,85 L340,85 L340,60 L346,60 L346,48 L352,48 L352,60 L358,60 L358,85 L368,85 L368,72 L374,72 L374,58 L380,58 L380,72 L386,72 L386,85 L400,85 L400,120 Z"
        fill={isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(254, 205, 211, 0.35)'}
      />
      {/* Foreground buildings (darker) */}
      <Path
        d="M0,120 L0,95 L20,95 L20,78 L26,78 L26,68 L32,68 L32,78 L38,78 L38,95 L50,95 L50,82 L56,82 L56,72 L60,72 L60,82 L66,82 L66,95 L80,95 L80,75 L86,75 L86,62 L90,62 L90,75 L96,75 L96,95 L110,95 L110,80 L116,80 L116,68 L122,68 L122,80 L128,80 L128,95 L145,95 L145,72 L150,72 L150,60 L156,60 L156,72 L162,72 L162,95 L178,95 L178,78 L184,78 L184,65 L190,65 L190,78 L196,78 L196,95 L215,95 L215,70 L220,70 L220,58 L226,58 L226,70 L232,70 L232,95 L248,95 L248,82 L254,82 L254,68 L260,68 L260,82 L266,82 L266,95 L282,95 L282,76 L288,76 L288,64 L294,64 L294,76 L300,76 L300,95 L318,95 L318,80 L324,80 L324,66 L330,66 L330,80 L336,80 L336,95 L355,95 L355,74 L360,74 L360,62 L366,62 L366,74 L372,74 L372,95 L388,95 L388,82 L394,82 L394,95 L400,95 L400,120 Z"
        fill={isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(254, 205, 211, 0.55)'}
      />
      {/* Small clouds */}
      <Path
        d="M60,42 Q65,36 72,42 Q76,38 82,42 Q78,46 72,46 Q66,46 60,42 Z"
        fill="rgba(254, 205, 211, 0.4)"
      />
      <Path
        d="M300,35 Q306,28 314,35 Q319,30 326,35 Q321,40 314,40 Q307,40 300,35 Z"
        fill="rgba(254, 205, 211, 0.3)"
      />
    </Svg>
  );
}

export default function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const progress = useSharedValue(0);
  const fade = useSharedValue(1);

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
          backgroundColor: isDarkMode ? THEME.COLORS.dark.background : '#ffffff', 
          zIndex: 99999, 
          alignItems: 'center', 
          justifyContent: 'space-between',
          paddingTop: 80,
          paddingBottom: 50,
        },
        containerStyle
      ]}
    >
      {/* Bottom gradient background */}
      <LinearGradient
        colors={isDarkMode 
          ? ['transparent', 'rgba(255,255,255,0.01)', 'rgba(255,255,255,0.03)']
          : ['transparent', 'rgba(255, 228, 230, 0.25)', 'rgba(254, 205, 211, 0.45)']
        }
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '50%',
        }}
      />

      {/* City Skyline at bottom */}
      <CitySkyline isDarkMode={isDarkMode} />

      {/* Top spacer */}
      <View style={{ height: 20 }} />

      {/* Center Content: Logo + Text + Basket */}
      <View style={{ alignItems: 'center' }}>
        {/* Red F App Icon */}
        <Image 
          source={require('../../assets/icon.png')} 
          style={{ width: 140, height: 140, borderRadius: THEME.RADIUS.lg, marginBottom: 20 }}
          resizeMode="contain"
        />

        {/* Brand Name */}
        <Text style={{ fontSize: 38, fontWeight: '800', letterSpacing: -1, lineHeight: 44 }}>
          <Text style={{ color: isDarkMode ? '#ffffff' : '#1e293b' }}>Fast</Text>
          <Text style={{ color: THEME.COLORS.brand.primary }}>Kirana</Text>
        </Text>

        {/* Tagline */}
        <Text style={{ color: isDarkMode ? '#71717a' : '#94a3b8', fontSize: 12, fontWeight: '700', letterSpacing: 0.5, marginTop: 8 }}>
          —  Groceries  •  Food  •  Essentials  —
        </Text>

        {/* Basket Icon */}
        <View style={{ marginTop: 36, alignItems: 'center' }}>
          <ShoppingBasket size={42} color={THEME.COLORS.brand.primary} strokeWidth={1.5} />
        </View>
      </View>

      {/* Bottom: Tagline + Loading Bar */}
      <View style={{ alignItems: 'center', width: '100%', zIndex: 10 }}>
        {/* Delivering tagline */}
        <Text style={{ fontSize: 13, fontWeight: '700', color: isDarkMode ? '#a1a1aa' : '#94a3b8', marginBottom: 16 }}>
          Fast. Fresh. <Text style={{ color: THEME.COLORS.brand.primary }}>Delivered.</Text>
        </Text>

        {/* Animated Progress Bar */}
        <View style={{ width: 160, height: 5, backgroundColor: isDarkMode ? THEME.COLORS.dark.border : '#ffe4e6', borderRadius: 9999, overflow: 'hidden' }}>
          <Animated.View 
            style={[
              { height: '100%', backgroundColor: THEME.COLORS.brand.primary, borderRadius: 9999 },
              progressStyle
            ]} 
          />
        </View>
      </View>
    </Animated.View>
  );
}
