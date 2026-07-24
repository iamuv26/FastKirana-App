import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator, Alert, StyleSheet, Platform } from 'react-native';
import { MapPin, Navigation, Search, ChevronRight, Sparkles, Compass } from 'lucide-react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming, 
  withRepeat, 
  withSequence, 
  Easing, 
  cancelAnimation 
} from 'react-native-reanimated';
import { useUIStore } from '../../stores/ui-store';
import { useAuthStore } from '../../stores/auth-store';
import { useTheme } from '../../app/context/ThemeContext';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';
import { ScalePressable } from './ScalePressable';

export default function LocationGateModal() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const { isLoggedIn } = useAuthStore();
  const { 
    isLocationConfirmed, 
    setSelectedLocation, 
    setUserCoords, 
    setLocationConfirmed 
  } = useUIStore();

  const [loadingGps, setLoadingGps] = useState(false);

  // Reanimated Spring Animation Values
  const modalY = useSharedValue(500);
  const backdropOpacity = useSharedValue(0);
  const pulseRadar = useSharedValue(1);

  const visible = isLoggedIn && !isLocationConfirmed;

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 300 });
      modalY.value = withSpring(0, { damping: 18, stiffness: 110, mass: 0.9 });

      // Ambient radar pulsing ring around location icon
      pulseRadar.value = withRepeat(
        withSequence(
          withTiming(1.25, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
    } else {
      backdropOpacity.value = withTiming(0, { duration: 200 });
      modalY.value = withTiming(500, { duration: 200 });
      cancelAnimation(pulseRadar);
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedModalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: modalY.value }],
  }));

  const animatedRadarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseRadar.value }],
    opacity: withTiming(loadingGps ? 1 : 0.6),
  }));

  const handleDetectLocation = async () => {
    setLoadingGps(true);
    triggerHaptic('medium');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Location permission is required to automatically detect your address.');
        setLoadingGps(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;
      setUserCoords({ lat: latitude, lng: longitude });

      const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
      
      let resolvedAddress = '';
      if (geocode) {
        const name = geocode.name || geocode.street || '';
        const area = geocode.district || geocode.subregion || '';
        const city = geocode.city || '';
        resolvedAddress = [name, area, city].filter(Boolean).join(', ');
      }

      if (!resolvedAddress) {
        resolvedAddress = 'Current Location';
      }

      setSelectedLocation(resolvedAddress);
      setLocationConfirmed(true);
      triggerHaptic('success');
      toast.success(`Delivering to ${resolvedAddress} ⚡`);
    } catch (err) {
      console.warn('GPS location detection failed:', err);
      Alert.alert('Location Detection Failed', 'Unable to fetch location automatically. Please select location manually.');
    } finally {
      setLoadingGps(false);
    }
  };

  const handleManualPicker = () => {
    triggerHaptic('light');
    setLocationConfirmed(true);
    router.push('/location-picker');
  };

  const handleUseDefault = () => {
    triggerHaptic('light');
    setSelectedLocation('Ghatampur Market, Kanpur');
    setUserCoords({ lat: 26.1534185, lng: 80.1714024 });
    setLocationConfirmed(true);
    toast.success('Location set to Ghatampur Market');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={() => {}}
    >
      <View style={styles.overlayContainer}>
        {/* Animated Dark Backdrop */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]} />

        {/* Animated Bouncy Bottom Sheet */}
        <Animated.View style={[styles.modalCard, isDarkMode ? styles.modalCardDark : styles.modalCardLight, animatedModalStyle]}>
          
          {/* Top Handle Pill */}
          <View style={[styles.handlePill, isDarkMode ? styles.handlePillDark : styles.handlePillLight]} />

          {/* Large Header Icon with Radar Pulse */}
          <View style={styles.iconWrapper}>
            <Animated.View style={[styles.radarRing, animatedRadarStyle]} />
            <View style={styles.iconCircle}>
              <MapPin size={40} color="#e20a22" strokeWidth={2.4} />
            </View>
          </View>

          {/* Large Title */}
          <Text style={[styles.title, isDarkMode ? styles.textLight : styles.textDark]}>
            Where should we deliver?
          </Text>

          <Text style={[styles.subtitle, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
            Set your delivery location to check store availability, local inventory, and instant delivery service.
          </Text>

          {/* Prominent ETA Badge */}
          <View style={[styles.etaBadge, isDarkMode ? styles.etaBadgeDark : styles.etaBadgeLight]}>
            <Sparkles size={16} color="#e20a22" style={{ marginRight: 8 }} />
            <Text style={[styles.etaText, isDarkMode ? styles.etaTextDark : styles.etaTextLight]}>
              Instant Delivery Available in Your Area ⚡
            </Text>
          </View>

          {/* Action 1: BOLDER Auto GPS Detect Button */}
          <View style={styles.buttonWrapper}>
            <ScalePressable
              onPress={handleDetectLocation}
              disabled={loadingGps}
              scaleValue={0.97}
              style={styles.gpsButton}
            >
              {loadingGps ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#ffffff" size="small" />
                  <Text style={[styles.gpsButtonText, { marginLeft: 10 }]}>Finding Your Address...</Text>
                </View>
              ) : (
                <>
                  <Navigation size={22} color="#ffffff" style={{ marginRight: 10 }} />
                  <Text style={styles.gpsButtonText}>Detect My Current Location</Text>
                </>
              )}
            </ScalePressable>
          </View>

          {/* Action 2: Manual Search / Picker Button */}
          <View style={styles.buttonWrapper}>
            <ScalePressable
              onPress={handleManualPicker}
              scaleValue={0.98}
              style={[
                styles.pickerButton,
                isDarkMode ? styles.pickerButtonDark : styles.pickerButtonLight,
              ]}
            >
              <Search size={20} color={isDarkMode ? '#cbd5e1' : '#475569'} style={{ marginRight: 12 }} />
              <Text style={[styles.pickerButtonText, isDarkMode ? styles.textLight : styles.textDark]}>
                Search or Pick Location on Map
              </Text>
              <ChevronRight size={20} color={isDarkMode ? '#71717a' : '#94a3b8'} style={{ marginLeft: 'auto' }} />
            </ScalePressable>
          </View>

          {/* Action 3: Quick Default Location Button */}
          <View style={styles.buttonWrapper}>
            <ScalePressable
              onPress={handleUseDefault}
              scaleValue={0.97}
              style={styles.defaultButton}
            >
              <Compass size={16} color="#e20a22" style={{ marginRight: 8 }} />
              <Text style={styles.defaultButtonText}>
                Use Default: Ghatampur Market, Kanpur
              </Text>
            </ScalePressable>
          </View>

        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
  },
  modalCard: {
    width: '100%',
    maxHeight: '92%',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 44 : 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  modalCardLight: {
    backgroundColor: '#ffffff',
  },
  modalCardDark: {
    backgroundColor: '#141416',
  },
  handlePill: {
    width: 48,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 24,
  },
  handlePillLight: {
    backgroundColor: '#e2e8f0',
  },
  handlePillDark: {
    backgroundColor: '#3f3f46',
  },
  iconWrapper: {
    width: 90,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(226, 10, 34, 0.15)',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e20a22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14.5,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
    paddingHorizontal: 8,
    fontWeight: '500',
  },
  textLight: {
    color: '#f4f4f5',
  },
  textDark: {
    color: '#0f172a',
  },
  subtextLight: {
    color: '#64748b',
  },
  subtextDark: {
    color: '#a1a1aa',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    marginBottom: 26,
  },
  etaBadgeLight: {
    backgroundColor: '#fff1f2',
    borderWidth: 1.5,
    borderColor: '#fecdd3',
  },
  etaBadgeDark: {
    backgroundColor: 'rgba(226, 10, 34, 0.18)',
    borderWidth: 1.5,
    borderColor: 'rgba(226, 10, 34, 0.4)',
  },
  etaText: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  etaTextLight: {
    color: '#991b1b',
  },
  etaTextDark: {
    color: '#fca5a5',
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 14,
  },
  gpsButton: {
    width: '100%',
    height: 58,
    borderRadius: 20,
    backgroundColor: '#e20a22',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#e20a22',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gpsButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pickerButton: {
    width: '100%',
    height: 56,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  pickerButtonLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  pickerButtonDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  pickerButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  defaultButton: {
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  defaultButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e20a22',
  },
});
