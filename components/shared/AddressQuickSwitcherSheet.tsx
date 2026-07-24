import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Pressable, ScrollView, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { MapPin, Navigation, Home, Briefcase, Plus, Check, ChevronRight, X, Sparkles, Building2, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withRepeat,
  withSequence
} from 'react-native-reanimated';
import { useUIStore } from '../../stores/ui-store';
import { useAuthStore } from '../../stores/auth-store';
import { useTheme } from '../../app/context/ThemeContext';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';
import { API_BASE_URL } from '../../lib/constants';
import * as Location from 'expo-location';
import { ScalePressable } from './ScalePressable';

export interface SavedAddress {
  id: string;
  label: string;
  houseNo: string;
  street: string;
  area: string;
  city: string;
  pincode: string;
  phone: string;
  isDefault: boolean;
}

interface AddressQuickSwitcherSheetProps {
  visible: boolean;
  onClose: () => void;
}

export default function AddressQuickSwitcherSheet({ visible, onClose }: AddressQuickSwitcherSheetProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  const { user } = useAuthStore();
  const { selectedLocation, setSelectedLocation, setUserCoords, setLocationConfirmed } = useUIStore();

  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Reanimated Spring Motion Values
  const sheetY = useSharedValue(500);
  const backdropOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = withTiming(1, { duration: 250 });
      sheetY.value = withSpring(0, { damping: 18, stiffness: 120, mass: 0.9 });
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.06, { duration: 900 }),
          withTiming(1, { duration: 900 })
        ),
        -1,
        true
      );
    } else {
      backdropOpacity.value = withTiming(0, { duration: 180 });
      sheetY.value = withTiming(500, { duration: 180 });
    }
  }, [visible]);

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetY.value }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Fetch user addresses from server
  useEffect(() => {
    if (!visible || !user) return;

    const fetchAddresses = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/addresses`, {
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.id,
            'x-user-role': user.role,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setAddresses(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('Failed to fetch saved addresses:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [visible, user]);

  const handleSelectAddress = (addr: SavedAddress) => {
    triggerHaptic('success');
    const fullText = [addr.houseNo, addr.street, addr.area, addr.city, addr.pincode].filter(Boolean).join(', ');
    const displayLocation = `${addr.label ? `${addr.label}: ` : ''}${fullText}`;
    
    setSelectedLocation(displayLocation || addr.area || 'Ghatampur Market, Kanpur');
    setLocationConfirmed(true);
    toast.success(`Delivering to ${addr.label || 'Saved Address'} 🚚`);
    onClose();
  };

  const handleDetectGPS = async () => {
    setGpsLoading(true);
    triggerHaptic('medium');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.error('Location permission is required.');
        setGpsLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;
      setUserCoords({ lat: latitude, lng: longitude });

      const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude }).catch(() => []);
      let resolvedAddress = '';
      if (geocode) {
        const street = geocode.street || geocode.name || '';
        const area = geocode.district || geocode.subregion || geocode.city || '';
        const city = geocode.city || geocode.region || '';
        const postalCode = geocode.postalCode || '';
        resolvedAddress = [street, area, city, postalCode].filter(Boolean).join(', ');
      }

      const finalAddr = resolvedAddress || 'Current Location';
      setSelectedLocation(finalAddr);
      setLocationConfirmed(true);
      toast.success(`📍 Location set: ${finalAddr}`);
      onClose();
    } catch (err) {
      console.warn('GPS detection error:', err);
      toast.error('Could not detect location.');
    } finally {
      setGpsLoading(false);
    }
  };

  const getLabelIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('home')) return <Home size={18} color="#e11d48" />;
    if (l.includes('work') || l.includes('office')) return <Briefcase size={18} color="#2563eb" />;
    return <Building2 size={18} color="#16a34a" />;
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop overlay */}
        <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>

        {/* Animated Sheet */}
        <Animated.View style={[styles.sheetCard, isDarkMode ? styles.sheetCardDark : styles.sheetCardLight, animatedSheetStyle]}>
          
          {/* Drag Handle */}
          <View style={[styles.handlePill, isDarkMode ? styles.handlePillDark : styles.handlePillLight]} />

          {/* Close Button Top Right */}
          <View style={styles.closeWrap}>
            <Pressable onPress={onClose} style={[styles.closeBtn, isDarkMode ? styles.closeBtnDark : styles.closeBtnLight]}>
              <X size={16} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
            </Pressable>
          </View>

          {/* Pretty Location Icon Graphic Header */}
          <View style={{ alignItems: 'center', marginTop: -4, marginBottom: 14 }}>
            <Animated.View style={[styles.pinOuterCircle, isDarkMode ? styles.pinOuterDark : styles.pinOuterLight, animatedPulseStyle]}>
              <View style={[styles.pinInnerCircle, isDarkMode ? styles.pinInnerDark : styles.pinInnerLight]}>
                <MapPin size={24} color="#e11d48" fill="#e11d48" />
              </View>
            </Animated.View>

            <Text style={[styles.mainHeading, isDarkMode ? styles.textLight : styles.textDark]}>
              Where should we deliver?
            </Text>
            
            <Text style={[styles.mainDescription, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
              Set your location to check store availability & local inventory.
            </Text>

            {/* Feature Capsule Pill */}
            <View style={[styles.featurePill, isDarkMode ? styles.featurePillDark : styles.featurePillLight]}>
              <Sparkles size={12} color="#e11d48" style={{ marginRight: 4 }} />
              <Text style={styles.featurePillText}>
                Instant Delivery Available in Your Area
              </Text>
              <Text style={{ fontSize: 12, marginLeft: 4 }}>⚡</Text>
            </View>
          </View>

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            {/* High-Precision GPS Auto-Detect Location Card */}
            <View style={styles.buttonWrapper}>
              <ScalePressable
                onPress={handleDetectGPS}
                disabled={gpsLoading}
                scaleValue={0.98}
                style={[
                  styles.gpsCard,
                  isDarkMode ? styles.gpsCardDark : styles.gpsCardLight,
                ]}
              >
                {gpsLoading ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 4 }}>
                    <ActivityIndicator size="small" color="#e11d48" />
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#e11d48', marginLeft: 8 }}>
                      Fetching precise GPS location...
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.gpsIconCircle}>
                      <Navigation size={18} color="#e11d48" />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.gpsCardTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                          Auto-Detect Location (GPS)
                        </Text>
                        <View style={styles.livePulseDot} />
                      </View>
                      <Text style={[styles.gpsCardSub, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
                        High-accuracy GPS location fetcher
                      </Text>
                    </View>
                    <ChevronRight size={16} color="#e11d48" />
                  </>
                )}
              </ScalePressable>
            </View>

            {/* Search or Pick Location on Map */}
            <View style={styles.buttonWrapper}>
              <ScalePressable
                onPress={() => {
                  onClose();
                  triggerHaptic('light');
                  router.push('/addresses');
                }}
                scaleValue={0.98}
                style={[
                  styles.optionCard,
                  isDarkMode ? styles.optionCardDark : styles.optionCardLight,
                ]}
              >
                <View style={[styles.optionIconWrap, { backgroundColor: isDarkMode ? 'rgba(225, 29, 72, 0.15)' : '#fff1f2' }]}>
                  <Search size={17} color="#e11d48" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.optionTitle, isDarkMode ? styles.textLight : styles.textDark]}>
                    Search or Pick Location on Map
                  </Text>
                  <Text style={[styles.optionSub, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
                    Find address by street, area, or pincode
                  </Text>
                </View>
                <ChevronRight size={16} color={isDarkMode ? '#71717a' : '#94a3b8'} />
              </ScalePressable>
            </View>

            {/* Use Default Location Row */}
            <View style={styles.buttonWrapper}>
              <ScalePressable
                onPress={() => {
                  triggerHaptic('success');
                  setSelectedLocation('Ghatampur Market, Kanpur');
                  setLocationConfirmed(true);
                  toast.success('Location set to Ghatampur Market, Kanpur');
                  onClose();
                }}
                scaleValue={0.98}
                style={[
                  styles.optionCard,
                  isDarkMode ? styles.optionCardDark : styles.optionCardLight,
                ]}
              >
                <View style={[styles.optionIconWrap, { backgroundColor: isDarkMode ? 'rgba(22, 163, 74, 0.15)' : '#f0fdf4' }]}>
                  <MapPin size={17} color="#16a34a" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#16a34a' }}>
                    Use Default: Ghatampur Market, Kanpur
                  </Text>
                  <Text style={[styles.optionSub, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
                    Main Store & Central Hub Area
                  </Text>
                </View>
                <ChevronRight size={16} color="#16a34a" />
              </ScalePressable>
            </View>

            {/* Saved Addresses Section */}
            {loading ? (
              <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#e11d48" />
                <Text style={{ fontSize: 12, color: isDarkMode ? '#a1a1aa' : '#64748b', marginTop: 6, fontWeight: '600' }}>
                  Loading saved addresses...
                </Text>
              </View>
            ) : addresses.length > 0 ? (
              <View style={{ marginTop: 8 }}>
                <Text style={[styles.sectionHeading, isDarkMode ? styles.subtextDark : styles.subtextLight]}>
                  SAVED ADDRESSES ({addresses.length})
                </Text>

                {addresses.map((item) => {
                  const fullAddr = [item.houseNo, item.street, item.area, item.city].filter(Boolean).join(', ');
                  const isSelected = selectedLocation.includes(item.area || item.houseNo || '###');

                  return (
                    <View key={item.id} style={styles.buttonWrapper}>
                      <ScalePressable
                        onPress={() => handleSelectAddress(item)}
                        scaleValue={0.98}
                        style={[
                          styles.addressCard,
                          isDarkMode ? styles.addressCardDark : styles.addressCardLight,
                          isSelected && (isDarkMode ? styles.addressCardSelectedDark : styles.addressCardSelectedLight),
                        ]}
                      >
                        <View style={styles.addressIconWrap}>
                          {getLabelIcon(item.label || 'Home')}
                        </View>
                        <View style={{ flex: 1, marginLeft: 12, marginRight: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={[styles.addressLabel, isDarkMode ? styles.textLight : styles.textDark]}>
                              {item.label || 'Saved Location'}
                            </Text>
                            {item.isDefault && (
                              <View style={styles.defaultTag}>
                                <Text style={styles.defaultTagText}>DEFAULT</Text>
                              </View>
                            )}
                          </View>
                          <Text 
                            numberOfLines={2} 
                            style={[styles.addressDetails, isDarkMode ? styles.subtextDark : styles.subtextLight]}
                          >
                            {fullAddr}
                          </Text>
                        </View>

                        {isSelected ? (
                          <View style={styles.checkBadge}>
                            <Check size={13} color="#ffffff" strokeWidth={3} />
                          </View>
                        ) : (
                          <ChevronRight size={16} color={isDarkMode ? '#52525b' : '#cbd5e1'} />
                        )}
                      </ScalePressable>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Manage & Add New Address */}
            <View style={{ marginTop: 6, marginBottom: 14 }}>
              <ScalePressable
                onPress={() => {
                  onClose();
                  triggerHaptic('light');
                  router.push('/addresses');
                }}
                scaleValue={0.98}
                style={[
                  styles.addAddressBtn,
                  isDarkMode ? styles.addAddressBtnDark : styles.addAddressBtnLight,
                ]}
              >
                <Plus size={15} color="#e11d48" style={{ marginRight: 5 }} />
                <Text style={styles.addAddressBtnText}>
                  + Add New Address / Manage Saved
                </Text>
              </ScalePressable>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheetCard: {
    width: '100%',
    maxHeight: '88%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
  },
  sheetCardLight: {
    backgroundColor: '#ffffff',
  },
  sheetCardDark: {
    backgroundColor: '#18181b',
  },
  handlePill: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
  },
  handlePillLight: {
    backgroundColor: '#e2e8f0',
  },
  handlePillDark: {
    backgroundColor: '#3f3f46',
  },
  closeWrap: {
    alignItems: 'flex-end',
    marginTop: -6,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: {
    backgroundColor: '#f1f5f9',
  },
  closeBtnDark: {
    backgroundColor: '#27272a',
  },
  pinOuterCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinOuterLight: {
    backgroundColor: '#fff1f2',
  },
  pinOuterDark: {
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
  },
  pinInnerCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },
  pinInnerLight: {
    backgroundColor: '#ffffff',
  },
  pinInnerDark: {
    backgroundColor: '#27272a',
  },
  mainHeading: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 3,
  },
  mainDescription: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
  },
  featurePillLight: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  featurePillDark: {
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  featurePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#e11d48',
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
  buttonWrapper: {
    width: '100%',
    marginBottom: 8,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  gpsCardLight: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  gpsCardDark: {
    backgroundColor: 'rgba(225, 29, 72, 0.14)',
    borderColor: 'rgba(225, 29, 72, 0.35)',
  },
  gpsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#e11d48',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  gpsCardTitle: {
    fontSize: 13,
    fontWeight: '900',
  },
  gpsCardSub: {
    fontSize: 11,
    marginTop: 1.5,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  optionCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#f1f5f9',
  },
  optionCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  optionIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  optionSub: {
    fontSize: 11,
    marginTop: 1.5,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.2,
  },
  addressCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  addressCardDark: {
    backgroundColor: '#27272a',
    borderColor: '#3f3f46',
  },
  addressCardSelectedLight: {
    borderColor: '#e11d48',
    backgroundColor: '#fff1f2',
  },
  addressCardSelectedDark: {
    borderColor: '#e11d48',
    backgroundColor: 'rgba(225, 29, 72, 0.15)',
  },
  addressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.04)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  addressDetails: {
    fontSize: 11.5,
    marginTop: 1.5,
    lineHeight: 15,
  },
  defaultTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    marginLeft: 6,
  },
  defaultTagText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#15803d',
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#e11d48',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  addAddressBtnLight: {
    backgroundColor: '#fff1f2',
    borderColor: '#fecdd3',
  },
  addAddressBtnDark: {
    backgroundColor: 'rgba(225, 29, 72, 0.12)',
    borderColor: 'rgba(225, 29, 72, 0.3)',
  },
  addAddressBtnText: {
    color: '#e11d48',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
