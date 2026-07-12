import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { router } from 'expo-router';
import { ShoppingBag, Coffee } from 'lucide-react-native';
import { triggerHaptic } from '../../lib/haptic';
import { useTheme } from '../../app/context/ThemeContext';

interface StoreSelectorHeaderProps {
  activeStore: 'grocery' | 'cafe';
}

export default function StoreSelectorHeader({ activeStore }: StoreSelectorHeaderProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const handleSwitchStore = (store: 'grocery' | 'cafe') => {
    if (store === activeStore) return;
    
    triggerHaptic('light');
    if (store === 'grocery') {
      router.back();
    } else {
      router.push('/cafe');
    }
  };

  const isGrocery = activeStore === 'grocery';
  const isCafe = activeStore === 'cafe';

  // Grocery pill colors
  const groceryBg = isGrocery ? '#e20a22' : (isDarkMode ? '#1c1c1e' : '#ffffff');
  const groceryBorder = isGrocery ? '#e20a22' : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#fecdd3');
  const groceryIconColor = isGrocery ? '#ffffff' : '#e20a22';
  const groceryTextColor = isGrocery ? '#ffffff' : '#e20a22';

  // Café pill colors
  const cafeBg = isCafe ? '#ea580c' : (isDarkMode ? '#1c1c1e' : '#ffffff');
  const cafeBorder = isCafe ? '#ea580c' : (isDarkMode ? 'rgba(255,255,255,0.08)' : '#fed7aa');
  const cafeIconColor = isCafe ? '#ffffff' : '#ea580c';
  const cafeTextColor = isCafe ? '#ffffff' : '#ea580c';

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      width: '100%',
      marginVertical: 10,
    }}>
      {/* Grocery Store Pill */}
      <Pressable
        onPress={() => handleSwitchStore('grocery')}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          height: 38,
          borderRadius: 19,
          paddingHorizontal: 12,
          borderWidth: 1,
          backgroundColor: groceryBg,
          borderColor: groceryBorder,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          ...(Platform.OS === 'android' ? { elevation: 1 } : {
            shadowColor: isGrocery ? '#e20a22' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
          }),
        })}
      >
        <ShoppingBag 
          size={14} 
          color={groceryIconColor} 
          strokeWidth={2.5} 
          style={{ marginRight: 5 }} 
        />
        <Text style={{
          fontSize: 12.5,
          fontWeight: '900',
          letterSpacing: 0.2,
          color: groceryTextColor,
        }}>
          Grocery
        </Text>
      </Pressable>

      {/* Café Store Pill */}
      <Pressable
        onPress={() => handleSwitchStore('cafe')}
        style={({ pressed }) => ({
          flex: 1,
          flexDirection: 'row' as const,
          alignItems: 'center' as const,
          justifyContent: 'center' as const,
          height: 38,
          borderRadius: 19,
          paddingHorizontal: 12,
          borderWidth: 1,
          backgroundColor: cafeBg,
          borderColor: cafeBorder,
          transform: [{ scale: pressed ? 0.96 : 1 }],
          ...(Platform.OS === 'android' ? { elevation: 1 } : {
            shadowColor: isCafe ? '#ea580c' : '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
          }),
        })}
      >
        <Coffee 
          size={14} 
          color={cafeIconColor} 
          strokeWidth={2.5} 
          style={{ marginRight: 5 }} 
        />
        <Text style={{
          fontSize: 12.5,
          fontWeight: '900',
          letterSpacing: 0.2,
          color: cafeTextColor,
        }}>
          Café
        </Text>
      </Pressable>
    </View>
  );
}
