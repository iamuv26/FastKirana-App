import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, LayoutGrid, User } from 'lucide-react-native';
import { View, Text, Platform, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { ScalePressable } from '../../components/shared/ScalePressable';
import { useResponsive } from '../../lib/responsive';
import { useUIStore } from '../../stores/ui-store';
import Animated, {
  useSharedValue,
  SharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

// Helper to map route name to corresponding Lucide icon
const getIconComponent = (routeName: string) => {
  switch (routeName) {
    case 'index':
      return Home;
    case 'search':
      return Search;
    case 'categories':
      return LayoutGrid;
    case 'account':
      return User;
    default:
      return Home;
  }
};

interface TabButtonProps {
  route: any;
  isFocused: boolean;
  onPress: () => void;
  onLongPress: () => void;
  isDarkMode: boolean;
  progress: SharedValue<number>;
  index: number;
}

function TabButton({ route, isFocused, onPress, onLongPress, isDarkMode, progress, index }: TabButtonProps) {
  const IconComponent = getIconComponent(route.name);
  const inactiveColor = isDarkMode ? '#94a3b8' : '#64748b';

  // Animated progress (0 to 1) for smooth cross-fade between tabs
  const isActive = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    // Snappy spring for instant feel on switch, but still smooth
    isActive.value = withSpring(isFocused ? 1 : 0, {
      damping: 18,
      stiffness: 320,
      mass: 0.6,
    });
  }, [isFocused]);

  const iconContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: isActive.value > 0.5
      ? `rgba(226, 10, 34, ${0.08 + isActive.value * 0.92})` // full red when active, tinted when inactive
      : 'transparent',
    transform: [
      { scale: 1 + isActive.value * 0.08 }, // subtle size pop on active
      { translateY: -isActive.value * 1.5 },
    ],
  }));

  const iconColorStyle = useAnimatedStyle(() => ({
    opacity: isActive.value,
    transform: [
      { scale: 0.88 + isActive.value * 0.12 },
    ],
  }));

  // Inactive icon fades out as active fades in
  const inactiveIconStyle = useAnimatedStyle(() => ({
    opacity: 1 - isActive.value,
    position: 'absolute',
  }));

  const labelStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + isActive.value * 0.6,
    transform: [
      { translateY: (1 - isActive.value) * 2 },
    ],
  }));

  // Capitalized display label
  const label = route.name === 'index'
    ? 'Home'
    : route.name.charAt(0).toUpperCase() + route.name.slice(1);

  return (
    <ScalePressable
      onPress={onPress}
      onLongPress={onLongPress}
      scaleValue={0.93}
      haptic="light"
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <View style={styles.tabItemContainer}>
        {/* Animated Icon capsule */}
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.iconContainer, iconContainerStyle]}>
            {/* Inactive version (fades out) */}
            <Animated.View style={inactiveIconStyle}>
              <IconComponent
                size={20}
                color={inactiveColor}
                strokeWidth={1.8}
                fill="none"
              />
            </Animated.View>
            {/* Active version (fades in) */}
            <Animated.View style={iconColorStyle}>
              <IconComponent
                size={21}
                color="#ffffff"
                strokeWidth={2.5}
                fill={isFocused ? "#e20a22" : "none"}
              />
            </Animated.View>
          </Animated.View>
        </View>

        {/* Text Label */}
        <Animated.Text
          style={[
            styles.tabLabel,
            { color: isFocused ? '#e20a22' : inactiveColor },
            labelStyle,
          ]}
        >
          {label}
        </Animated.Text>
      </View>
    </ScalePressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { width: screenWidth } = useWindowDimensions();
  const responsive = useResponsive();

  const isTabBarVisible = useUIStore((s) => s.isTabBarVisible);
  const setTabBarVisible = useUIStore((s) => s.setTabBarVisible);

  // Floating margin calculations: sit neatly above home indicator on iOS
  const bottomMargin = insets.bottom > 0 ? insets.bottom + 6 : 16;

  // On large screens, the tab bar should not stretch — cap it
  const tabBarMaxWidth = responsive.isDesktop ? 560 : responsive.isTablet ? 420 : undefined;

  // Smoother indicator tracking — slight delay for premium feel
  const activeIndexShared = useSharedValue(state.index);
  const prevIndexRef = useRef(state.index);
  const translateYShared = useSharedValue(0);

  useEffect(() => {
    const prev = prevIndexRef.current;
    prevIndexRef.current = state.index;
    // Skip animation when direction hasn't changed — avoids double-spring visual
    if (prev !== state.index) {
      activeIndexShared.value = withSpring(state.index, {
        damping: 16,
        stiffness: 260,
        mass: 0.5,
      });
    }
  }, [state.index]);

  useEffect(() => {
    translateYShared.value = withTiming(isTabBarVisible ? 0 : 90, {
      duration: 260,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
    });
  }, [isTabBarVisible]);

  const indicatorStyle = useAnimatedStyle(() => {
    const totalBarWidth = tabBarMaxWidth ? tabBarMaxWidth - 32 : screenWidth - 32;
    const tabWidth = totalBarWidth / state.routes.length;
    const targetX = activeIndexShared.value * tabWidth + (tabWidth - 16) / 2;
    return {
      transform: [{ translateX: withTiming(targetX, { duration: 180, easing: Easing.out(Easing.cubic) }) }],
      opacity: 0.9,
    };
  });

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateYShared.value }],
  }));

  // Don't render children when fully hidden to free GPU work
  const isVisible = useSharedValue(isTabBarVisible ? 1 : 0);
  useEffect(() => {
    isVisible.value = withTiming(isTabBarVisible ? 1 : 0, {
      duration: 200,
      easing: Easing.bezier(0.32, 0.72, 0, 1),
    });
  }, [isTabBarVisible]);

  const childrenVisibilityStyle = useAnimatedStyle(() => ({
    opacity: isVisible.value,
  }));

  return (
    <Animated.View
      style={[
        styles.tabBarContainer,
        {
          bottom: bottomMargin,
          maxWidth: tabBarMaxWidth,
          alignSelf: tabBarMaxWidth ? 'center' : undefined,
          backgroundColor: isDarkMode ? 'rgba(9, 9, 11, 0.9)' : 'rgba(255, 255, 255, 0.92)',
          borderColor: isDarkMode ? 'rgba(63, 63, 70, 0.3)' : 'rgba(228, 228, 231, 0.6)',
          shadowColor: isDarkMode ? '#e20a22' : '#000000',
          shadowOpacity: isDarkMode ? 0.12 : 0.06,
        },
        animatedContainerStyle,
      ]}
      onTouchStart={() => setTabBarVisible(true)}
    >
      {/* Translucent backdrop — cheaper than BlurView, identical visual on AMOLED */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: isDarkMode ? 'rgba(24,24,27,0.92)' : 'rgba(255,255,255,0.92)' }]} />
      {/* Hairline top border */}
      <View pointerEvents="none" style={{ position:'absolute', top:0, left:0, right:0, height: StyleSheet.hairlineWidth, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)' }} />

      {/* Tab Buttons — fade out when hidden to free GPU */}
      <Animated.View style={[styles.buttonsContainer, childrenVisibilityStyle]}>
        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({ name: route.name, merge: true });
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TabButton
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
              onLongPress={onLongPress}
              isDarkMode={isDarkMode}
              progress={activeIndexShared}
              index={index}
            />
          );
        })}
      </Animated.View>

      {/* Sliding Active Indicator Line */}
      <Animated.View style={[styles.activeLine, indicatorStyle]} />
    </Animated.View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Lighter, snappier animation on iOS
        animation: 'fade',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    overflow: 'hidden',
    width: 'auto',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 8 },
        shadowRadius: 18,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonsContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
    zIndex: 2,
  },
  tabButton: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 2,
  },
  iconWrapper: {
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  iconContainer: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    letterSpacing: 0.2,
  },
  activeLine: {
    position: 'absolute',
    bottom: 5,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#e20a22',
    zIndex: 3,
    width: 16,
    alignSelf: 'center',
    // Soft glow on the indicator
    shadowColor: '#e20a22',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 1,
  },
});
