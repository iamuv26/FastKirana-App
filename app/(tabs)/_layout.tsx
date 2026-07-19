import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Home, Search, LayoutGrid, User } from 'lucide-react-native';
import { View, Text, Platform, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';
import { ScalePressable } from '../../components/shared/ScalePressable';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
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
}

function TabButton({ route, isFocused, onPress, onLongPress, isDarkMode }: TabButtonProps) {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isFocused) {
      // Premium spring bounce feedback
      scale.value = withSequence(
        withSpring(1.15, { damping: 6, stiffness: 350 }),
        withSpring(1, { damping: 10, stiffness: 200 })
      );
      translateY.value = withSpring(-1, { damping: 12, stiffness: 180 });
    } else {
      scale.value = withSpring(1, { damping: 12, stiffness: 200 });
      translateY.value = withSpring(0, { damping: 12, stiffness: 180 });
    }
  }, [isFocused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const IconComponent = getIconComponent(route.name);
  const inactiveColor = isDarkMode ? '#94a3b8' : '#64748b';

  // Capitalized display label
  const label = route.name === 'index' 
    ? 'Home' 
    : route.name.charAt(0).toUpperCase() + route.name.slice(1);

  return (
    <ScalePressable
      onPress={onPress}
      onLongPress={onLongPress}
      scaleValue={0.94}
      haptic="light"
      style={styles.tabButton}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <View style={styles.tabItemContainer}>
        {/* Animated Icon capsule */}
        <Animated.View
          style={[
            styles.iconContainer,
            isFocused && { backgroundColor: '#e20a22' },
            animatedStyle,
          ]}
        >
          <IconComponent
            size={20}
            color={isFocused ? '#ffffff' : inactiveColor}
            strokeWidth={isFocused ? 2.5 : 1.8}
            fill="none"
          />
        </Animated.View>

        {/* Text Label */}
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? '#e20a22' : inactiveColor },
            isFocused && styles.tabLabelActive,
          ]}
        >
          {label}
        </Text>
      </View>
    </ScalePressable>
  );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const { width: screenWidth } = useWindowDimensions();

  // Floating margin calculations: sit neatly above home indicator on iOS
  const bottomMargin = insets.bottom > 0 ? insets.bottom + 6 : 16;

  // Reanimated active line tracking for smooth horizontal slide transitions
  const activeIndexShared = useSharedValue(state.index);

  useEffect(() => {
    activeIndexShared.value = withSpring(state.index, { damping: 20, stiffness: 180 });
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => {
    // Width minus the margins (16 * 2 = 32)
    const totalBarWidth = screenWidth - 32;
    const tabWidth = totalBarWidth / state.routes.length;
    const lineWidth = 18;
    const targetX = activeIndexShared.value * tabWidth + (tabWidth - lineWidth) / 2;
    return {
      transform: [{ translateX: targetX }],
    };
  });

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          bottom: bottomMargin,
          backgroundColor: isDarkMode ? 'rgba(9, 9, 11, 0.92)' : 'rgba(255, 255, 255, 0.92)',
          borderColor: isDarkMode ? 'rgba(63, 63, 70, 0.3)' : 'rgba(228, 228, 231, 0.6)',
          shadowColor: isDarkMode ? '#e20a22' : '#000000',
          shadowOpacity: isDarkMode ? 0.15 : 0.08,
        },
      ]}
    >
      {/* Frosted Glass Background */}
      <BlurView
        intensity={isDarkMode ? 40 : 60}
        tint={isDarkMode ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      />

      {/* Tab Buttons */}
      <View style={styles.buttonsContainer}>
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
            />
          );
        })}
      </View>

      {/* Sliding Active Indicator Line */}
      <Animated.View style={[styles.activeLine, indicatorStyle]} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
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
    height: 70,
    borderRadius: 35,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
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
    paddingTop: 5,
    paddingBottom: 2,
  },
  iconContainer: {
    width: 52,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontWeight: '800',
  },
  activeLine: {
    position: 'absolute',
    bottom: 6,
    height: 2.5,
    borderRadius: 1.25,
    backgroundColor: '#e20a22',
    zIndex: 3,
  },
});
