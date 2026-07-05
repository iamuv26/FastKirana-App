import React, { useEffect, useState, useRef, useMemo } from 'react';
import { View, Text, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useUIStore } from '../../stores/ui-store';
import { useTheme } from '../../app/context/ThemeContext';
import { Coffee, Utensils, Cookie, Moon, ArrowRight, MapPin } from 'lucide-react-native';
import { triggerHaptic } from '../../lib/haptic';
import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '../../lib/constants';

export default function TimeGreetingHero() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const selectedLocation = useUIStore((s) => s.selectedLocation);
  const groceryMartOpen = useUIStore((s) => s.groceryMartOpen);
  const cafeOpen = useUIStore((s) => s.cafeOpen);
  const pulseAnim = useRef(new Animated.Value(1)).current;
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
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.6,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Dynamic local time tracking (since device is in India/IST)
    const updateHour = () => {
      setCurrentHour(new Date().getHours());
    };
    
    updateHour();
    const interval = setInterval(updateHour, 60000);
    return () => clearInterval(interval);
  }, []);

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
        dotColor: 'bg-rose-500'
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
        dotColor: 'bg-amber-500'
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
        dotColor: 'bg-emerald-500'
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
        dotColor: 'bg-orange-500'
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
        dotColor: 'bg-indigo-500'
      };
    }
  }, [currentHour, groceryMartOpen, cafeOpen, settings]);

  return (
    <View className="mx-4 mb-5">
      {/* Time-Aware Greeting Badge */}
      <View className={`flex-row items-center gap-1.5 self-start px-3 py-1 rounded-full mb-2.5 border ${themeConfig.badgeBg} ${themeConfig.badgeBorder}`}>
        <View className="relative flex justify-center items-center w-3 h-3">
          <Animated.View 
            style={{
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.6],
                outputRange: [0.8, 0],
              }),
            }}
            className={`w-1.5 h-1.5 rounded-full absolute ${themeConfig.dotColor}`} 
          />
          <View className={`w-1.5 h-1.5 rounded-full ${themeConfig.dotColor}`} />
        </View>
        <View className="flex-row items-center gap-1">
          {themeConfig.icon}
          <Text className={`text-[10px] font-black uppercase tracking-wider ${themeConfig.badgeText}`}>
            {themeConfig.badge}
          </Text>
        </View>
      </View>

      <Text className="text-slate-800 dark:text-zinc-100 text-lg font-black leading-tight">
        {themeConfig.greeting}
      </Text>
      <Text className="text-slate-400 dark:text-zinc-400 text-[11px] font-medium mt-1 leading-normal">
        {themeConfig.subtitle}
      </Text>

      {/* Delivery Location Hero Card */}
      <LinearGradient
        colors={isDarkMode ? ['#241518', '#1c0f11'] : ['#fff5f5', '#fffcfc']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          marginTop: 16,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: isDarkMode ? 'rgba(244,63,94,0.15)' : '#ffe4e6',
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          shadowColor: '#f43f5e',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDarkMode ? 0.05 : 0.02,
          shadowRadius: 10,
          elevation: 1,
        }}
      >
        {/* Left Side Info */}
        <View className="flex-1 justify-center">
          <View className="flex-row items-center gap-1">
            <MapPin size={10} color="#e20a22" />
            <Text className="text-rose-600 dark:text-rose-400 text-[9px] font-black tracking-widest uppercase">
              Fast Delivery In
            </Text>
          </View>
          
          <Text className="text-slate-800 dark:text-zinc-100 text-lg font-black mt-1 leading-tight" numberOfLines={1}>
            {selectedLocation || 'Ghatampur'}
          </Text>
          
          <Text className="text-slate-500 dark:text-zinc-400 text-[10px] font-semibold mt-1.5 leading-normal" numberOfLines={2}>
            Milk, Fruits, Vegetables, Snacks & more
          </Text>

          <Pressable 
            onPress={() => {
              triggerHaptic('light');
            }}
            style={({ pressed }) => [{
              transform: [{ scale: pressed ? 0.96 : 1 }],
              opacity: pressed ? 0.9 : 1
            }]}
            className="flex-row items-center gap-1.5 bg-rose-600 rounded-full px-4 py-1.5 mt-3.5 self-start shadow-sm"
          >
            <Text className="text-white font-bold text-[11px]">Shop Now</Text>
            <ArrowRight size={11} color="#ffffff" strokeWidth={3} />
          </Pressable>
        </View>

        {/* Right Side Illustration - Polaroid Photo Sticker Frame */}
        <View 
          style={{ transform: [{ rotate: '4deg' }] }}
          className="w-24 h-24 rounded-2xl bg-white p-1 border border-slate-100 dark:border-zinc-800 shadow-md overflow-hidden justify-center items-center"
        >
          <Image
            source={require('../../assets/grocery_bag_banner.png')}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
          />
        </View>
      </LinearGradient>
    </View>
  );
}

