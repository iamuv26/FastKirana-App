import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, LayoutGrid, User } from 'lucide-react-native';
import { View, Text, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import Logo from '../../components/shared/Logo';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

interface TabIconProps {
  IconComponent?: any;
  color: any;
  focused: boolean;
  isLogo?: boolean;
  logoSize?: number;
}

function TabIcon({ IconComponent, color, focused, isLogo = false, logoSize = 22 }: TabIconProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const dotWidth = useSharedValue(0);
  const dotOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (focused) {
      // Bounce animation: quick scale up then settle
      scale.value = withSequence(
        withSpring(1.18, { damping: 6, stiffness: 350 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      // Subtle upward lift
      translateY.value = withSpring(-2, { damping: 12, stiffness: 180 });
      // Dot indicator animates in
      dotWidth.value = withSpring(6, { damping: 14, stiffness: 300 });
      dotOpacity.value = withTiming(1, { duration: 200 });
      // Glow pulse
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 180 });
      dotWidth.value = withSpring(0, { damping: 14, stiffness: 300 });
      dotOpacity.value = withTiming(0, { duration: 150 });
      glowOpacity.value = withTiming(0, { duration: 150 });
    }
    return () => {
      cancelAnimation(glowOpacity);
    };
  }, [focused]);

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    width: dotWidth.value,
    height: dotWidth.value,
    borderRadius: dotWidth.value / 2,
    opacity: dotOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.tabIconContainer}>
      {/* Icon with bounce */}
      <Animated.View style={iconAnimatedStyle}>
        {isLogo ? (
          <Logo size={logoSize} />
        ) : (
          <IconComponent size={21} color={color} strokeWidth={focused ? 2.5 : 1.8} />
        )}
      </Animated.View>

    </View>
  );
}

/** Frosted glass tab bar background */
function TabBarBackground() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Top glow / shadow line */}
      <View
        style={[
          styles.topGlow,
          {
            backgroundColor: isDarkMode
              ? 'rgba(226, 10, 34, 0.06)'
              : 'rgba(226, 10, 34, 0.04)',
            shadowColor: isDarkMode ? '#e20a22' : '#000',
            shadowOpacity: isDarkMode ? 0.15 : 0.06,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: -3 },
            elevation: 8,
          },
        ]}
      />
      <BlurView
        intensity={isDarkMode ? 50 : 70}
        tint={isDarkMode ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />
      {/* Solid background to prevent content showing through and overlapping */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: isDarkMode
              ? 'rgba(17, 24, 39, 0.75)'
              : 'rgba(255, 255, 255, 0.8)',
          },
        ]}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const activeColor = '#e20a22'; // Brand red (FastKirana theme)
  const inactiveColor = isDarkMode ? '#94a3b8' : '#64748b'; // Dynamic slate color
  const insets = useSafeAreaInsets();

  const barHeight = 56 + (insets.bottom > 0 ? insets.bottom : 8);
  const bottomPadding = insets.bottom > 0 ? insets.bottom - 4 : 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: barHeight,
          paddingBottom: bottomPadding,
          paddingTop: 6,
          // Top border glow via shadow (Android + iOS)
          ...Platform.select({
            ios: {
              shadowColor: isDarkMode ? '#e20a22' : '#000000',
              shadowOpacity: isDarkMode ? 0.12 : 0.05,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: -4 },
            },
            android: {
              elevation: 12,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          fontFamily: 'PlusJakartaSans_700Bold',
          letterSpacing: 0.2,
          marginTop: -2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon color={color} focused={focused} isLogo={true} logoSize={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={Search} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={LayoutGrid} color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon IconComponent={User} color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
    gap: 3,
  },
  dotWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 8,
    width: 16,
  },
  dot: {
    backgroundColor: '#e20a22',
  },
  dotGlow: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e20a22',
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 10,
  },
});
