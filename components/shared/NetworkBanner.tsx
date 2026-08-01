import React, { useEffect, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  runOnJS 
} from 'react-native-reanimated';
import { WifiOff, Wifi } from 'lucide-react-native';
import { useTheme } from '../../app/context/ThemeContext';

let NetInfo: any = null;
try {
  NetInfo = require('@react-native-community/netinfo').default;
} catch (e) {
  // NetInfo not available (web or missing dependency)
}

export default function NetworkBanner() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [showRestored, setShowRestored] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const translateY = useSharedValue(-60);

  useEffect(() => {
    if (!NetInfo) return;

    const unsubscribe = NetInfo.addEventListener((state: any) => {
      const connected = state.isConnected ?? true;
      
      if (connected && isConnected === false) {
        // Connection restored
        setShowRestored(true);
        translateY.value = withTiming(0, { duration: 300 });
        
        const timer = setTimeout(() => {
          translateY.value = withTiming(-60, { duration: 300 });
          setTimeout(() => setShowRestored(false), 350);
        }, 3000);
        
        setIsConnected(true);
        return () => clearTimeout(timer);
      } else if (!connected) {
        setIsConnected(false);
        setShowRestored(false);
        translateY.value = withTiming(0, { duration: 300 });
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Don't render if connected and not showing restored message
  if (isConnected && !showRestored) return null;

  const isOffline = !isConnected;
  const bgColor = isOffline 
    ? (isDark ? '#7f1d1d' : '#dc2626') 
    : (isDark ? '#14532d' : '#16a34a');

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        backgroundColor: bgColor,
        paddingTop: Platform.OS === 'ios' ? 50 : 35,
        paddingBottom: 8,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
      }, animatedStyle]}
    >
      {isOffline ? (
        <WifiOff size={14} color="#fff" strokeWidth={2.5} />
      ) : (
        <Wifi size={14} color="#fff" strokeWidth={2.5} />
      )}
      <Text style={{ 
        color: '#ffffff', 
        fontSize: 11, 
        fontWeight: '800', 
        textTransform: 'uppercase', 
        letterSpacing: 0.5 
      }}>
        {isOffline ? 'No Internet Connection' : 'Connection Restored'}
      </Text>
    </Animated.View>
  );
}
