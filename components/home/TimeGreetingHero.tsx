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
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  useEffect(() => {
    // Pulse animation using Reanimated
    pulse.value = withRepeat(
      withTiming(1.6, { duration: 1000 }),
      -1, // infinite loop
      true // reverse direction (alternate between 1 and 1.6)
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

  // 2. Resolve dynamic greetings & styling parameters based on operational status and time
  const themeConfig = useMemo(() => {
    // CASE 1: Both Grocery and Cafe are closed
    if (!groceryMartOpen && !cafeOpen) {
      return {
        badge: '😴 STORE CLOSED',
        greeting: settings.hero_greeting_closed || "We're resting right now 💤",
        subtitle: settings.hero_subtitle_closed || "FastKirana Cafe & Mart are resting. We will be back to serve you fresh & hot goodies soon!",
        icon: <Moon size={10} color="#f43f5e" />,
        badgeBg: 'bg-rose-50 dark:bg-rose-950/20',
        badgeBorder: 'border-rose-100 dark:border-rose-900/30',
        badgeText: 'text-rose-700 dark:text-rose-450',
        dotColor: 'bg-rose-500',
        lightGradient: ['#fff1f2', '#ffe4e6'] as [string, string],
        darkGradient: ['#1f1214', '#110507'] as [string, string]
      };
    }

    // 6 AM - 11 AM: Morning Mode
    if (currentHour >= 6 && currentHour < 11) {
      const isCafeClosed = !cafeOpen;
      const isMartClosed = !groceryMartOpen;

      return {
        badge: isMartClosed ? '☕ CAFE OPEN • MART CLOSED' : isCafeClosed ? '📦 MART OPEN • CAFE CLOSED' : '🍳 BREAKFAST MODE',
        greeting: settings.hero_greeting_morning || "Good morning, let's get breakfast! 🌅",
        subtitle: isMartClosed 
          ? (settings.hero_subtitle_morning_mart_closed || 'Grocery Mart is resting, but our Cafe is firing up fresh hot brews and breakfast specials! ☕✨')
          : isCafeClosed
          ? (settings.hero_subtitle_morning_cafe_closed || 'Cafe is taking a break, but Grocery Mart is wide open and delivering fresh milk & fruits! 🥛📦')
          : (settings.hero_subtitle_morning_both_open || 'Fresh milk, fruits, hot brews, and breakfast essentials delivered in minutes.'),
        icon: <Coffee size={10} color="#d97706" />,
        badgeBg: 'bg-amber-50 dark:bg-amber-950/20',
        badgeBorder: 'border-amber-100 dark:border-amber-900/30',
        badgeText: 'text-amber-700 dark:text-amber-450',
        dotColor: 'bg-amber-500',
        lightGradient: ['#ffedd5', '#fef3c7'] as [string, string],
        darkGradient: ['#291305', '#170b03'] as [string, string]
      };
    }
    // 11 AM - 4 PM: Lunch Mode
    else if (currentHour >= 11 && currentHour < 16) {
      const isCafeClosed = !cafeOpen;
      const isMartClosed = !groceryMartOpen;

      return {
        badge: isMartClosed ? '☕ CAFE OPEN • MART CLOSED' : isCafeClosed ? '📦 MART OPEN • CAFE CLOSED' : '🍽️ LUNCH MODE',
        greeting: settings.hero_greeting_afternoon || "Good afternoon! Ready for lunch? 🍛",
        subtitle: isMartClosed
          ? (settings.hero_subtitle_afternoon_mart_closed || 'Grocery Mart is resting, but our Cafe is cooking delicious hot lunch dishes and rolls! 🥡✨')
          : isCafeClosed
          ? (settings.hero_subtitle_afternoon_cafe_closed || 'Cafe is taking a break, but Grocery Mart is delivering lunch staples, dal, and rice! 🌾📦')
          : (settings.hero_subtitle_afternoon_both_open || 'Atta, rice, dal, fresh vegetables, and delicious hot rolls delivered fast.'),
        icon: <Utensils size={10} color="#10b981" />,
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/20',
        badgeBorder: 'border-emerald-100 dark:border-emerald-900/30',
        badgeText: 'text-emerald-700 dark:text-emerald-450',
        dotColor: 'bg-emerald-500',
        lightGradient: ['#f0fdf4', '#dcfce7'] as [string, string],
        darkGradient: ['#022c22', '#021811'] as [string, string]
      };
    }
    // 4 PM - 8 PM: Evening Snacks Mode
    else if (currentHour >= 16 && currentHour < 20) {
      const isCafeClosed = !cafeOpen;
      const isMartClosed = !groceryMartOpen;

      return {
        badge: isMartClosed ? '☕ CAFE OPEN • MART CLOSED' : isCafeClosed ? '📦 MART OPEN • CAFE CLOSED' : '🍿 SNACK MODE',
        greeting: settings.hero_greeting_evening || "It's snack o'clock! Tea & snacks are ready ☕",
        subtitle: isMartClosed
          ? (settings.hero_subtitle_evening_mart_closed || 'Grocery Mart is taking a break, but our Cafe is steaming hot chai & fresh samosas! ☕🥟')
          : isCafeClosed
          ? (settings.hero_subtitle_evening_cafe_closed || 'Cafe is resting, but Grocery Mart is delivering chips, biscuits, and munchies! 🍿📦')
          : (settings.hero_subtitle_evening_both_open || 'Samosas, munchies, chips, and chilled soft drinks ready for tea time.'),
        icon: <Cookie size={10} color="#f97316" />,
        badgeBg: 'bg-orange-50 dark:bg-orange-950/20',
        badgeBorder: 'border-orange-100 dark:border-orange-900/30',
        badgeText: 'text-orange-700 dark:text-orange-450',
        dotColor: 'bg-orange-500',
        lightGradient: ['#ffedd5', '#ffe4e6'] as [string, string],
        darkGradient: ['#311005', '#1a0802'] as [string, string]
      };
    }
    // 8 PM - 6 AM: Late Night Cravings Mode
    else {
      const isCafeClosed = !cafeOpen;
      const isMartClosed = !groceryMartOpen;

      return {
        badge: isMartClosed ? '☕ CAFE OPEN • MART CLOSED' : isCafeClosed ? '📦 MART OPEN • CAFE CLOSED' : '🌙 NIGHT MODE',
        greeting: settings.hero_greeting_night || "Late night cravings? We got you! 🌙",
        subtitle: isMartClosed
          ? (settings.hero_subtitle_night_mart_closed || 'Grocery Mart is closed. Cafe is open to deliver hot night snacks & dessert cravings! 🍧✨')
          : isCafeClosed
          ? (settings.hero_subtitle_night_cafe_closed || 'Cafe kitchen is resting, but Grocery Mart is active for ice cream, drinks & munchies! 🍦📦')
          : (settings.hero_subtitle_night_both_open || 'Indulge in ice creams, chocolates, late night munchies, and cafe specialties.'),
        icon: <Moon size={10} color="#6366f1" />,
        badgeBg: 'bg-indigo-50 dark:bg-indigo-950/20',
        badgeBorder: 'border-indigo-100 dark:border-indigo-900/30',
        badgeText: 'text-indigo-700 dark:text-indigo-400',
        dotColor: 'bg-indigo-500',
        lightGradient: ['#f5f3ff', '#ede9fe'] as [string, string],
        darkGradient: ['#0f0a21', '#060410'] as [string, string]
      };
    }
  }, [currentHour, groceryMartOpen, cafeOpen, settings]);

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
          ...Platform.select<any>({
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
            <View className={`flex-row items-center gap-1.5 self-start px-2.5 py-1 rounded-full mb-3 border ${themeConfig.badgeBg} ${themeConfig.badgeBorder}`}>
              <View className="relative flex justify-center items-center w-2.5 h-2.5">
                <Animated.View 
                  style={animatedDotStyle}
                  className={`w-1.5 h-1.5 rounded-full absolute ${themeConfig.dotColor}`} 
                />
                <View className={`w-1.5 h-1.5 rounded-full ${themeConfig.dotColor}`} />
              </View>
              <View className="flex-row items-center gap-1">
                {themeConfig.icon}
                <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700' }} className={`uppercase tracking-wider ${themeConfig.badgeText}`}>
                  {themeConfig.badge}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.titleSm, fontWeight: '700', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }} className="leading-tight">
              {themeConfig.greeting}
            </Text>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '500', color: isDarkMode ? THEME.COLORS.dark.textSecondary : THEME.COLORS.light.textSecondary, marginTop: 4 }} className="leading-normal">
              {themeConfig.subtitle}
            </Text>
          </View>

          {/* Right Side Illustration - Polaroid Photo Sticker Frame */}
          <View 
            style={{ transform: [{ rotate: '4deg' }], width: 76, height: 76, borderRadius: THEME.RADIUS.sm, padding: 4, borderWidth: 1, borderColor: isDarkMode ? '#27272a' : '#f1f5f9', elevation: 3 }}
            className="bg-white shadow-md overflow-hidden justify-center items-center"
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
