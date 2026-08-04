import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, interpolate, FadeInDown } from 'react-native-reanimated';
import { useUIStore } from '../../stores/ui-store';
import { useTheme } from '../../app/context/ThemeContext';
import { Coffee, Utensils, Cookie, Moon, ArrowRight, MapPin } from 'lucide-react-native';
import { triggerHaptic } from '../../lib/haptic';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../lib/constants';
import { router } from 'expo-router';
import { THEME } from '../../lib/theme';

export default function TimeGreetingHero() {

  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const selectedLocation = useUIStore((s) => s.selectedLocation);
  const groceryMartOpen = useUIStore((s) => s.groceryMartOpen);
  const cafeOpen = useUIStore((s) => s.cafeOpen);
  const pulse = useSharedValue(1);
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());

  // 1. Fetch live settings from backend database
  const { data: settings = {} } = useQuery<Record<string, string>>({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/settings`);
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json();
    },
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    // Pulse animation using Reanimated
    pulse.value = withRepeat(
      withTiming(1.6, { duration: 1000 }),
      -1,
      true
    );

    // Dynamic local time tracking (since device is in India/IST)
    const updateHour = () => {
      setCurrentHour(new Date().getHours());
    };

    updateHour();
    const interval = setInterval(updateHour, 60000);
    return () => clearInterval(interval);
  }, []);

  const animatedDotStyle = useAnimatedStyle(() => {
    const scale = pulse.value;
    const opacity = interpolate(
      pulse.value,
      [1, 1.6],
      [0.8, 0]
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  // 2. Resolve dynamic greetings & styling parameters
  const themeConfig = useMemo(() => {
    // CASE 1: Both Grocery and Cafe are closed
    if (!groceryMartOpen && !cafeOpen) {
      return {
        badge: '\u{1F634} STORE CLOSED',
        greeting: settings.hero_greeting_closed || "We're resting right now \u{1F4A4}",
        subtitle: settings.hero_subtitle_closed || "FastKirana Cafe & Mart are resting. We will be back to serve you fresh & hot goodies soon!",
        icon: <Moon size={10} color="#f43f5e" />,
        badgeBg: isDarkMode ? 'rgba(244,63,94,0.15)' : '#fff1f2',
        badgeBorder: isDarkMode ? 'rgba(244,63,94,0.3)' : '#ffe4e6',
        badgeText: isDarkMode ? '#fda4af' : '#e11d48',
        dotColor: '#f43f5e',
        lightGradient: ['#fff1f2', '#ffe4e6'] as [string, string],
        darkGradient: ['#1f1214', '#110507'] as [string, string]
      };
    }

    // 6 AM - 11 AM: Morning Mode
    if (currentHour >= 6 && currentHour < 11) {
      const isCafeClosed = !cafeOpen;
      const isMartClosed = !groceryMartOpen;

      return {
        badge: isMartClosed ? '☕ CAFE OPEN • MART CLOSED' : isCafeClosed ? '\u{1F4E6} MART OPEN • CAFE CLOSED' : '\u{1F373} BREAKFAST MODE',
        greeting: settings.hero_greeting_morning || "Good morning, let's get breakfast! \u{1F305}",
        subtitle: isMartClosed
          ? (settings.hero_subtitle_morning_mart_closed || 'Grocery Mart is resting, but our Cafe is firing up fresh hot brews and breakfast specials! ☕✨')
          : isCafeClosed
          ? (settings.hero_subtitle_morning_cafe_closed || 'Cafe is taking a break, but Grocery Mart is wide open and delivering fresh milk & fruits! \u{1F95B}\u{1F4E6}')
          : (settings.hero_subtitle_morning_both_open || 'Fresh milk, fruits, hot brews, and breakfast essentials delivered in minutes.'),
        icon: <Coffee size={10} color="#d97706" />,
        badgeBg: isDarkMode ? 'rgba(217,119,6,0.15)' : '#fffbeb',
        badgeBorder: isDarkMode ? 'rgba(217,119,6,0.3)' : '#fef3c7',
        badgeText: isDarkMode ? '#fbbf24' : '#b45309',
        dotColor: '#d97706',
        lightGradient: ['#ffedd5', '#fef3c7'] as [string, string],
        darkGradient: ['#291305', '#170b03'] as [string, string]
      };
    }
    // 11 AM - 4 PM: Lunch Mode
    else if (currentHour >= 11 && currentHour < 16) {
      const isCafeClosed = !cafeOpen;
      const isMartClosed = !groceryMartOpen;

      return {
        badge: isMartClosed ? '☕ CAFE OPEN • MART CLOSED' : isCafeClosed ? '\u{1F4E6} MART OPEN • CAFE CLOSED' : '\u{1F37D}️ LUNCH MODE',
        greeting: settings.hero_greeting_afternoon || "Good afternoon! Ready for lunch? \u{1F35B}",
        subtitle: isMartClosed
          ? (settings.hero_subtitle_afternoon_mart_closed || 'Grocery Mart is resting, but our Cafe is cooking delicious hot lunch dishes and rolls! \u{1F37E}✨')
          : isCafeClosed
          ? (settings.hero_subtitle_afternoon_cafe_closed || 'Cafe is taking a break, but Grocery Mart is delivering lunch staples, dal, and rice! \u{1F33E}\u{1F4E6}')
          : (settings.hero_subtitle_afternoon_both_open || 'Atta, rice, dal, fresh vegetables, and delicious hot rolls delivered fast.'),
        icon: <Utensils size={10} color="#10b981" />,
        badgeBg: isDarkMode ? 'rgba(16,185,129,0.15)' : '#f0fdf4',
        badgeBorder: isDarkMode ? 'rgba(16,185,129,0.3)' : '#dcfce7',
        badgeText: isDarkMode ? '#6ee7b7' : '#047857',
        dotColor: '#10b981',
        lightGradient: ['#f0fdf4', '#dcfce7'] as [string, string],
        darkGradient: ['#022c22', '#021811'] as [string, string]
      };
    }
    // 4 PM - 8 PM: Evening Snacks Mode
    else if (currentHour >= 16 && currentHour < 20) {
      const isCafeClosed = !cafeOpen;
      const isMartClosed = !groceryMartOpen;

      return {
        badge: isMartClosed ? '☕ CAFE OPEN • MART CLOSED' : isCafeClosed ? '\u{1F4E6} MART OPEN • CAFE CLOSED' : '\u{1F37F} SNACK MODE',
        greeting: settings.hero_greeting_evening || "It's snack o'clock! Tea & snacks are ready ☕",
        subtitle: isMartClosed
          ? (settings.hero_subtitle_evening_mart_closed || 'Grocery Mart is taking a break, but our Cafe is steaming hot chai & fresh samosas! ☕\u{1F9FF}')
          : isCafeClosed
          ? (settings.hero_subtitle_evening_cafe_closed || 'Cafe is resting, but Grocery Mart is delivering chips, biscuits, and munchies! \u{1F37F}\u{1F4E6}')
          : (settings.hero_subtitle_evening_both_open || 'Samosas, munchies, chips, and chilled soft drinks ready for tea time.'),
        icon: <Cookie size={10} color="#f97316" />,
        badgeBg: isDarkMode ? 'rgba(249,115,22,0.15)' : '#fff7ed',
        badgeBorder: isDarkMode ? 'rgba(249,115,22,0.3)' : '#ffedd5',
        badgeText: isDarkMode ? '#fdba74' : '#c2410c',
        dotColor: '#f97316',
        lightGradient: ['#ffedd5', '#ffe4e6'] as [string, string],
        darkGradient: ['#311005', '#1a0802'] as [string, string]
      };
    }
    // 8 PM - 6 AM: Late Night Cravings Mode
    else {
      const isCafeClosed = !cafeOpen;
      const isMartClosed = !groceryMartOpen;

      return {
        badge: isMartClosed ? '☕ CAFE OPEN • MART CLOSED' : isCafeClosed ? '\u{1F4E6} MART OPEN • CAFE CLOSED' : '\u{1F319} NIGHT MODE',
        greeting: settings.hero_greeting_night || "Late night cravings? We got you! \u{1F319}",
        subtitle: isMartClosed
          ? (settings.hero_subtitle_night_mart_closed || 'Grocery Mart is closed. Cafe is open to deliver hot night snacks & dessert cravings! \u{1F367}✨')
          : isCafeClosed
          ? (settings.hero_subtitle_night_cafe_closed || 'Cafe kitchen is resting, but Grocery Mart is active for ice cream, drinks & munchies! \u{1F366}\u{1F4E6}')
          : (settings.hero_subtitle_night_both_open || 'Indulge in ice creams, chocolates, late night munchies, and cafe specialties.'),
        icon: <Moon size={10} color="#6366f1" />,
        badgeBg: isDarkMode ? 'rgba(99,102,241,0.15)' : '#f5f3ff',
        badgeBorder: isDarkMode ? 'rgba(99,102,241,0.3)' : '#ede9fe',
        badgeText: isDarkMode ? '#c4b5fd' : '#7c3aed',
        dotColor: '#6366f1',
        lightGradient: ['#f5f3ff', '#ede9fe'] as [string, string],
        darkGradient: ['#0f0a21', '#060410'] as [string, string]
      };
    }
  }, [currentHour, groceryMartOpen, cafeOpen, settings, isDarkMode]);

  return (
    <Animated.View entering={FadeInDown.springify()} style={{ marginHorizontal: THEME.SPACING.lg, marginBottom: THEME.SPACING.xl }}>
      <LinearGradient
        colors={isDarkMode ? themeConfig.darkGradient : themeConfig.lightGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: THEME.RADIUS.lg,
          borderWidth: 1,
          borderColor: isDarkMode ? THEME.COLORS.dark.borderLight : 'rgba(0,0,0,0.04)',
          padding: THEME.SPACING.lg,
          position: 'relative',
          overflow: 'hidden',
          ...Platform.select({
            ios: THEME.SHADOWS.md,
            android: {
              elevation: 4,
            },
          }),
        }}
      >
        {/* Glossy decorative background accents */}
        <View style={{ position: 'absolute', right: -40, top: -40, width: 192, height: 192, borderRadius: 96, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.03)', zIndex: 0 }} />
        <View style={{ position: 'absolute', right: -20, bottom: -20, width: 144, height: 144, borderRadius: 72, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', backgroundColor: 'rgba(255,255,255,0.05)', zIndex: 0 }} />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: THEME.SPACING.lg }}>
          <View style={{ flex: 1 }}>
            {/* Time-Aware Greeting Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: THEME.RADIUS.pill, marginBottom: 12, borderWidth: 1, backgroundColor: themeConfig.badgeBg, borderColor: themeConfig.badgeBorder }}>
              <View style={{ position: 'relative', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', width: 10, height: 10 }}>
                <Animated.View
                  style={[animatedDotStyle, { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: themeConfig.dotColor }]}
                />
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: themeConfig.dotColor }} />
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {themeConfig.icon}
                <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: themeConfig.badgeText, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  {themeConfig.badge}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.titleSm, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: colors.textPrimary, lineHeight: 20 }}>
              {themeConfig.greeting}
            </Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.medium, color: colors.textSecondary, marginTop: 4, lineHeight: 18 }}>
              {themeConfig.subtitle}
            </Text>
          </View>

          {/* Right Side Illustration - Polaroid Photo Sticker Frame */}
          <View
            style={{ transform: [{ rotate: '4deg' }], width: 76, height: 76, borderRadius: THEME.RADIUS.sm, padding: 4, borderWidth: 1, borderColor: isDarkMode ? '#27272a' : '#f1f5f9', elevation: 3, backgroundColor: '#ffffff', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
          >
            <Image
              source={require('../../assets/grocery_bag_banner.webp')}
              style={{ width: '100%', height: '100%', borderRadius: THEME.RADIUS.xs }}
              contentFit="cover"
            />
          </View>
        </View>

      </LinearGradient>
    </Animated.View>
  );
}
