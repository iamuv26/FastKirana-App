import { View, Text, Pressable, ScrollView, TextInput, Alert, ActivityIndicator, Switch, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { ArrowLeft, MapPin, Trash2, Plus, Check, Navigation, Compass, Sparkles } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';
import { API_BASE_URL } from '../lib/constants';
import { formatPrice } from '../lib/utils';
import { triggerHaptic } from '../lib/haptic';
import { toast } from '../lib/toast';
import { useTheme } from './context/ThemeContext';

let MapView: any;
let Marker: any;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default;
    Marker = Maps.Marker;
  } catch (e) {
    console.warn('Failed to load react-native-maps in addresses.tsx:', e);
  }
}

interface Address {
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

export default function AddressesScreen() {
  const { user } = useAuthStore();
  const { selectedLocation, userCoords, storeLat, storeLng, setSelectedLocation, setUserCoords } = useUIStore();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [label, setLabel] = useState('Home');
  const [fullAddress, setFullAddress] = useState('');
  const [city, setCity] = useState('Ghatampur');
  const [pincode, setPincode] = useState('209206');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isDefault, setIsDefault] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  useEffect(() => {
    if (selectedLocation && selectedLocation !== 'Select Location' && !fullAddress) {
      setFullAddress(selectedLocation);
    }
  }, [selectedLocation]);

  const handleDetectLocation = async () => {
    setGpsLoading(true);
    triggerHaptic('light');

    const applyCoordsAndReverseGeocode = async (latitude: number, longitude: number) => {
      setUserCoords({ lat: latitude, lng: longitude });
      try {
        if (Platform.OS === 'web') {
          // Web OpenStreetMap Reverse Geocoding
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          if (res.ok) {
            const data = await res.json();
            const addr = data.address || {};
            const streetName = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || '';
            const areaName = addr.suburb || addr.city_district || addr.county || addr.state_district || '';
            const resolvedCity = addr.city || addr.town || addr.village || 'Ghatampur';
            const resolvedPin = addr.postcode || '209206';

            const combined = [streetName, areaName].filter(Boolean).join(', ');
            setFullAddress(combined || data.display_name?.split(',').slice(0, 3).join(',') || 'Ghatampur Market');
            setCity(resolvedCity);
            setPincode(resolvedPin);
            setSelectedLocation(combined || 'Current Location');
          } else {
            setFullAddress('Ghatampur Market, Kanpur');
          }
        } else {
          const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });
          if (geocode) {
            const name = geocode.name || geocode.street || '';
            const areaName = geocode.district || geocode.subregion || geocode.city || '';
            const resolvedCity = geocode.city || 'Ghatampur';
            const resolvedPin = geocode.postalCode || '209206';
            
            const combined = [name, areaName].filter(Boolean).join(', ');
            if (combined) setFullAddress(combined);
            if (resolvedCity) setCity(resolvedCity);
            if (resolvedPin) setPincode(resolvedPin);
            
            const resolvedAddress = [name, areaName, resolvedCity, resolvedPin].filter(Boolean).join(', ');
            setSelectedLocation(resolvedAddress || 'Current Location');
          }
        }
        triggerHaptic('success');
        toast.success('Location detected successfully!');
      } catch (err) {
        console.warn('Reverse geocode failed:', err);
        setFullAddress('Ghatampur Market, Kanpur');
      }
    };

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await applyCoordsAndReverseGeocode(position.coords.latitude, position.coords.longitude);
          setGpsLoading(false);
        },
        async (error) => {
          console.warn('Browser geolocation error:', error);
          // Fallback to Expo location or store default
          try {
            const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            await applyCoordsAndReverseGeocode(currentLocation.coords.latitude, currentLocation.coords.longitude);
          } catch (e) {
            Alert.alert('Location Error', 'Please enable location permissions in your browser.');
          } finally {
            setGpsLoading(false);
          }
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required to detect your address.');
          setGpsLoading(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await applyCoordsAndReverseGeocode(currentLocation.coords.latitude, currentLocation.coords.longitude);
      } catch (err) {
        console.error(err);
        Alert.alert('Location Error', 'Unable to fetch current location.');
      } finally {
        setGpsLoading(false);
      }
    }
  };

  const getAuthHeaders = (): Record<string, string> => {
    if (!user) return {};
    return {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-role': user.role,
      'x-user-email': user.email || '',
      'x-user-name': user.name || '',
      'x-user-phone': user.phone || '',
    };
  };
  const loadAddresses = async () => {
    setIsLoading(true);
    if (user?.id?.startsWith('mock-')) {
      try {
        const { mmkvStorage } = require('../lib/storage');
        const localData = mmkvStorage.getItem(`local_addresses_${user.id}`);
        if (localData) {
          setAddresses(JSON.parse(localData));
        } else {
          setAddresses([]);
        }
      } catch (e) {
        setAddresses([]);
      }
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const data = await res.json();
      if (res.ok) {
        setAddresses(data);
      } else {
        const { mmkvStorage } = require('../lib/storage');
        const localData = mmkvStorage.getItem(`local_addresses_${user?.id || 'guest'}`);
        if (localData) {
          setAddresses(JSON.parse(localData));
        } else {
          throw new Error(data.error || 'Failed to load addresses');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Error fetching addresses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleAddAddress = async () => {
    const cleanAddress = fullAddress.trim();
    const cleanPhone = phone.replace(/\D/g, '');

    if (!cleanAddress) {
      Alert.alert('Address Required', 'Please enter your complete delivery address.');
      return;
    }

    if (!cleanPhone || cleanPhone.length !== 10) {
      Alert.alert('Mobile Number Required', 'Please enter a valid 10-digit contact mobile number.');
      return;
    }

    if (!label || !city || !pincode) {
      Alert.alert('Missing Info', 'Please fill in all address details.');
      return;
    }

    const cleanPin = pincode.trim();
    const cleanCity = city.trim().toLowerCase();

    if (cleanPin !== '209206' && cleanPin !== '560034') {
      Alert.alert('Out of Zone', 'FastKirana only delivers to Ghatampur area (Pincode: 209206)');
      return;
    }

    if (!cleanCity.includes('ghatampur') && !cleanCity.includes('kanpur') && !cleanCity.includes('bangalore')) {
      Alert.alert('Out of Zone', 'FastKirana delivery is currently only available in Ghatampur / Kanpur');
      return;
    }

    setIsSaving(true);
    triggerHaptic('light');

    if (user?.id?.startsWith('mock-')) {
      try {
        const { mmkvStorage } = require('../lib/storage');
        const localKey = `local_addresses_${user.id}`;
        const localData = mmkvStorage.getItem(localKey);
        const list = localData ? JSON.parse(localData) : [];
        const newAddr = {
          id: `local-addr-${Date.now()}`,
          label,
          houseNo: '-',
          street: '-',
          area: cleanAddress,
          city,
          pincode: cleanPin,
          phone: cleanPhone,
          isDefault: list.length === 0 ? true : isDefault,
        };
        const updatedList = isDefault ? list.map((a: any) => ({ ...a, isDefault: false })).concat(newAddr) : list.concat(newAddr);
        mmkvStorage.setItem(localKey, JSON.stringify(updatedList));
        toast.success('Address saved locally!');
        setShowAddForm(false);
        setLabel('Home');
        setFullAddress('');
        setCity('Ghatampur');
        setPincode('209206');
        setIsDefault(false);
        setAddresses(updatedList);
        setTimeout(() => {
          router.back();
        }, 600);
      } catch (e) {
        Alert.alert('Error', 'Failed to save address locally');
      } finally {
        setIsSaving(false);
      }
      return;
    }

    let lat: number | null = userCoords?.lat || null;
    let lng: number | null = userCoords?.lng || null;
    if (!lat || !lng) {
      try {
        const geoPromise = Location.geocodeAsync(`${cleanAddress}, ${city} ${cleanPin}`);
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
        const geoResults = await Promise.race([geoPromise, timeoutPromise]);
        if (geoResults && geoResults.length > 0) {
          lat = geoResults[0].latitude;
          lng = geoResults[0].longitude;
        }
      } catch (e) {
        console.warn('Geocoding failed for address:', e);
      }
    }

    try {
      const res = await fetch(`${API_BASE_URL}/addresses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          label,
          houseNo: '-',
          street: '-',
          area: cleanAddress,
          city,
          pincode: cleanPin,
          phone: cleanPhone,
          isDefault,
          lat,
          lng,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('Address saved!');
        setShowAddForm(false);
        setLabel('Home');
        setFullAddress('');
        setCity('Ghatampur');
        setPincode('209206');
        setIsDefault(false);
        loadAddresses();
        setTimeout(() => {
          router.back();
        }, 600);
      } else {
        if (res.status === 401 || res.status === 403) {
          const { mmkvStorage } = require('../lib/storage');
          const localKey = `local_addresses_${user?.id || 'guest'}`;
          const localData = mmkvStorage.getItem(localKey);
          const list = localData ? JSON.parse(localData) : [];
          const newAddr = {
            id: `local-addr-${Date.now()}`,
            label,
            houseNo: '-',
            street: '-',
            area: cleanAddress,
            city,
            pincode: cleanPin,
            phone: cleanPhone,
            isDefault: list.length === 0 ? true : isDefault,
          };
          const updatedList = isDefault ? list.map((a: any) => ({ ...a, isDefault: false })).concat(newAddr) : list.concat(newAddr);
          mmkvStorage.setItem(localKey, JSON.stringify(updatedList));
          
          toast.success('Address saved locally (Demo mode)');
          setShowAddForm(false);
          setLabel('Home');
          setFullAddress('');
          setCity('Ghatampur');
          setPincode('209206');
          setIsDefault(false);
          setAddresses(updatedList);
          setTimeout(() => {
            router.back();
          }, 600);
        } else {
          throw new Error(data.error || 'Failed to save address');
        }
      }
    } catch (err: any) {
      console.warn('Network error saving address, falling back to local MMKV:', err);
      try {
        const { mmkvStorage } = require('../lib/storage');
        const localKey = `local_addresses_${user?.id || 'guest'}`;
        const localData = mmkvStorage.getItem(localKey);
        const list = localData ? JSON.parse(localData) : [];
        const newAddr = {
          id: `local-addr-${Date.now()}`,
          label,
          houseNo: '-',
          street: '-',
          area: cleanAddress,
          city,
          pincode: cleanPin,
          phone: cleanPhone,
          isDefault: list.length === 0 ? true : isDefault,
        };
        const updatedList = isDefault ? list.map((a: any) => ({ ...a, isDefault: false })).concat(newAddr) : list.concat(newAddr);
        mmkvStorage.setItem(localKey, JSON.stringify(updatedList));
        
        toast.success('Address saved locally (Demo fallback)');
        setShowAddForm(false);
        setLabel('Home');
        setFullAddress('');
        setCity('Ghatampur');
        setPincode('209206');
        setIsDefault(false);
        setAddresses(updatedList);
      } catch (storageErr) {
        Alert.alert('Error', err.message || 'Failed to create address.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    Alert.alert(
      'Delete Address 🗑️',
      'Are you sure you want to remove this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: async () => {
            triggerHaptic('medium');
            
            if (user?.id?.startsWith('mock-') || id.startsWith('local-addr-')) {
              try {
                const { mmkvStorage } = require('../lib/storage');
                const localKey = `local_addresses_${user?.id || 'guest'}`;
                const localData = mmkvStorage.getItem(localKey);
                if (localData) {
                  const list = JSON.parse(localData);
                  const updatedList = list.filter((a: any) => a.id !== id);
                  mmkvStorage.setItem(localKey, JSON.stringify(updatedList));
                  setAddresses(updatedList);
                  toast.success('Address deleted locally');
                }
              } catch (e) {
                toast.error('Failed to delete local address');
              }
              return;
            }

            try {
              const res = await fetch(`${API_BASE_URL}/addresses`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
                body: JSON.stringify({ id }),
              });
              const data = await res.json();
              if (res.ok) {
                toast.success('Address deleted');
                loadAddresses();
              } else {
                if (res.status === 401 || res.status === 403) {
                  const { mmkvStorage } = require('../lib/storage');
                  const localKey = `local_addresses_${user?.id || 'guest'}`;
                  const localData = mmkvStorage.getItem(localKey);
                  if (localData) {
                    const list = JSON.parse(localData);
                    const updatedList = list.filter((a: any) => a.id !== id);
                    mmkvStorage.setItem(localKey, JSON.stringify(updatedList));
                    setAddresses(updatedList);
                    toast.success('Address deleted locally (Demo)');
                  }
                } else {
                  throw new Error(data.error || 'Failed to delete address');
                }
              }
            } catch (err: any) {
              console.warn('Error deleting address from backend, trying local:', err);
              try {
                const { mmkvStorage } = require('../lib/storage');
                const localKey = `local_addresses_${user?.id || 'guest'}`;
                const localData = mmkvStorage.getItem(localKey);
                if (localData) {
                  const list = JSON.parse(localData);
                  const updatedList = list.filter((a: any) => a.id !== id);
                  mmkvStorage.setItem(localKey, JSON.stringify(updatedList));
                  setAddresses(updatedList);
                  toast.success('Address deleted locally');
                  return;
                }
              } catch (storageErr) {
                console.warn('Failed to delete address locally:', storageErr);
              }
              toast.error(err.message || 'Error deleting address');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-zinc-950">
      {/* Header */}
      <View className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex-row justify-between items-center shadow-xs">
        <View className="flex-row items-center gap-2.5">
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              router.back();
            }}
            className="w-8 h-8 rounded-full items-center justify-center active:bg-slate-100 dark:active:bg-zinc-800"
          >
            <ArrowLeft size={18} color={isDarkMode ? '#e4e4e7' : '#3f3f46'} />
          </Pressable>
          <Text className="text-slate-800 dark:text-zinc-100 font-black text-base">My Addresses</Text>
        </View>

        {!showAddForm && (
          <Pressable 
            onPress={() => setShowAddForm(true)}
            className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/20 items-center justify-center border border-rose-100 dark:border-rose-900/30 active:scale-95"
          >
            <Plus size={20} color="#e20a22" />
          </Pressable>
        )}
      </View>

      <ScrollView 
        className="flex-1 px-4 py-4" 
        contentContainerStyle={{ paddingBottom: 60 }}
        showsVerticalScrollIndicator={false}
      >
        {showAddForm ? (
          /* Add Address Form */
          <View className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 mb-10 shadow-xs gap-4">
            <Text className="text-slate-800 dark:text-zinc-100 font-black text-sm uppercase tracking-wider mb-1">Add New Address</Text>

            {/* Embedded Google Maps Location Picker Section */}
            <View className="bg-slate-50 dark:bg-zinc-800/60 border border-slate-200/80 dark:border-zinc-700/80 rounded-2xl overflow-hidden mb-2 shadow-xs">
              {/* Map Preview Container */}
              <View className="h-36 w-full relative bg-slate-200 dark:bg-zinc-800 items-center justify-center overflow-hidden">
                {Platform.OS !== 'web' && MapView ? (
                  <MapView
                    pointerEvents="none"
                    style={{ width: '100%', height: '100%' }}
                    region={{
                      latitude: userCoords?.lat || storeLat,
                      longitude: userCoords?.lng || storeLng,
                      latitudeDelta: 0.012,
                      longitudeDelta: 0.012,
                    }}
                  >
                    <Marker 
                      coordinate={{
                        latitude: userCoords?.lat || storeLat,
                        longitude: userCoords?.lng || storeLng,
                      }} 
                    />
                  </MapView>
                ) : (
                  <View className="w-full h-full bg-emerald-950/20 items-center justify-center p-4">
                    <View className="w-12 h-12 rounded-full bg-emerald-500/20 items-center justify-center mb-1">
                      <MapPin size={26} color="#10b981" />
                    </View>
                    <Text className="text-emerald-700 dark:text-emerald-400 font-black text-xs text-center">
                      Google Maps Pinpoint Picker
                    </Text>
                  </View>
                )}

                {/* Overlaid Pin Badge */}
                <View className="absolute top-2 left-2 bg-black/70 px-2.5 py-1 rounded-full flex-row items-center gap-1">
                  <View className="w-2 h-2 rounded-full bg-emerald-400" />
                  <Text className="text-white text-[9px] font-black uppercase tracking-wider">Live Pinpoint Active</Text>
                </View>
              </View>

              {/* Pin Address Details & Actions Bar */}
              <View className="p-3.5 gap-2.5">
                <View className="flex-row items-start gap-2">
                  <MapPin size={16} color="#e20a22" className="mt-0.5 flex-shrink-0" />
                  <View className="flex-1">
                    <Text className="text-slate-800 dark:text-zinc-100 font-extrabold text-xs leading-tight" numberOfLines={2}>
                      {selectedLocation && selectedLocation !== 'Select Location' ? selectedLocation : 'Locate pin to auto-fill address'}
                    </Text>
                    <Text className="text-slate-400 dark:text-zinc-400 text-[9.5px] font-semibold mt-0.5">
                      Lat: {(userCoords?.lat || storeLat).toFixed(4)}, Lng: {(userCoords?.lng || storeLng).toFixed(4)}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons Row */}
                <View className="flex-row gap-2 pt-1">
                  <Pressable
                    onPress={handleDetectLocation}
                    disabled={gpsLoading}
                    className="flex-1 bg-emerald-600 active:bg-emerald-700 py-2.5 px-3 rounded-xl flex-row items-center justify-center gap-1.5 shadow-xs"
                  >
                    {gpsLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Navigation size={13} color="#fff" />
                        <Text className="text-white font-extrabold text-[10.5px]">Auto-Detect GPS</Text>
                      </>
                    )}
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      triggerHaptic('light');
                      router.push('/location-picker');
                    }}
                    className="flex-1 bg-slate-800 dark:bg-zinc-700 active:bg-slate-900 py-2.5 px-3 rounded-xl flex-row items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Compass size={13} color="#fff" />
                    <Text className="text-white font-extrabold text-[10.5px]">Full Screen Map</Text>
                  </Pressable>
                </View>
              </View>
            </View>

            {/* Label Selector */}
            <View className="gap-1.5">
              <Text className="text-slate-650 dark:text-zinc-400 font-extrabold text-[10px] uppercase tracking-wider">Address Label</Text>
              <View className="flex-row gap-2">
                {['Home', 'Office', 'Other'].map((lbl) => (
                  <Pressable
                    key={lbl}
                    onPress={() => setLabel(lbl)}
                    className={`flex-1 py-2.5 rounded-xl border items-center ${
                      label === lbl 
                        ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' 
                        : 'bg-slate-50 dark:bg-zinc-800 border-slate-200/50 dark:border-zinc-700/50'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${label === lbl ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500 dark:text-zinc-400'}`}>{lbl}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Complete Delivery Address */}
            <View className="gap-1">
              <Text className="text-slate-650 dark:text-zinc-400 font-extrabold text-[10px] uppercase tracking-wider">
                Complete Delivery Address <Text className="text-rose-500 font-black">*</Text>
              </Text>
              <TextInput
                placeholder="e.g. House No 4, Vikas Medical Store Building 2nd floor, NH34 Main Road"
                placeholderTextColor={isDarkMode ? '#52525b' : '#cbd5e1'}
                multiline
                numberOfLines={2}
                value={fullAddress}
                onChangeText={setFullAddress}
                className="bg-slate-50 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-zinc-100 text-xs font-semibold min-h-[50px]"
              />
            </View>

            {/* City */}
            <View className="gap-1">
              <Text className="text-slate-650 dark:text-zinc-400 font-extrabold text-[10px] uppercase tracking-wider">City</Text>
              <TextInput
                placeholder="Ghatampur"
                placeholderTextColor={isDarkMode ? '#52525b' : '#cbd5e1'}
                value={city}
                onChangeText={setCity}
                className="bg-slate-50 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-zinc-100 text-xs font-semibold"
              />
            </View>

            {/* Pincode */}
            <View className="gap-1">
              <Text className="text-slate-650 dark:text-zinc-400 font-extrabold text-[10px] uppercase tracking-wider">Pincode</Text>
              <TextInput
                placeholder="209206"
                placeholderTextColor={isDarkMode ? '#52525b' : '#cbd5e1'}
                keyboardType="numeric"
                maxLength={6}
                value={pincode}
                onChangeText={setPincode}
                className="bg-slate-50 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-zinc-100 text-xs font-semibold"
              />
            </View>

            {/* Phone */}
            <View className="gap-1">
              <Text className="text-slate-650 dark:text-zinc-400 font-extrabold text-[10px] uppercase tracking-wider">
                Contact Phone Number (10 Digits) <Text className="text-rose-500 font-black">*</Text>
              </Text>
              <TextInput
                placeholder="e.g. +91 9999999999"
                placeholderTextColor={isDarkMode ? '#52525b' : '#cbd5e1'}
                value={phone}
                onChangeText={setPhone}
                className="bg-slate-50 dark:bg-zinc-800 border border-slate-200/80 dark:border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-slate-800 dark:text-zinc-100 text-xs font-semibold"
              />
            </View>

            {/* Default Address Switch */}
            <View className="flex-row items-center justify-between py-1">
              <View>
                <Text className="text-slate-800 dark:text-zinc-200 font-bold text-xs">Set as Default Address</Text>
                <Text className="text-slate-400 dark:text-zinc-500 text-[9px]">Use this address automatically at checkout</Text>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                trackColor={{ false: isDarkMode ? '#27272a' : '#e2e8f0', true: '#fecdd3' }}
                thumbColor={isDefault ? '#e20a22' : '#cbd5e1'}
              />
            </View>

            {/* Form buttons */}
            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={() => setShowAddForm(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-zinc-800 rounded-xl items-center"
              >
                <Text className="text-slate-600 dark:text-zinc-350 font-bold text-xs">Cancel</Text>
              </Pressable>
              
              <Pressable
                onPress={handleAddAddress}
                disabled={isSaving}
                className="flex-1 py-3 bg-rose-600 rounded-xl items-center justify-center flex-row"
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-black text-xs">Save Address</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : isLoading ? (
          <View className="flex-1 justify-center items-center py-20">
            <ActivityIndicator size="large" color="#e20a22" />
          </View>
        ) : addresses.length === 0 ? (
          /* Empty view */
          <View className="items-center justify-center py-20 px-6">
            <Text className="text-5xl">📍</Text>
            <Text className="text-slate-800 dark:text-zinc-100 font-black text-base mt-4">No Saved Addresses</Text>
            <Text className="text-slate-400 dark:text-zinc-400 text-xs mt-1 text-center leading-4">
              Add your home or office address to receive lightning fast 8-minute grocery deliveries.
            </Text>
            <Pressable 
              onPress={() => setShowAddForm(true)}
              className="bg-rose-600 px-6 py-3 rounded-xl mt-6 shadow-xs active:scale-95"
            >
              <Text className="text-white font-extrabold text-xs">Add Address</Text>
            </Pressable>
          </View>
        ) : (
          /* Addresses List */
          <View className="gap-3 mb-10">
            {addresses.map((address) => (
              <View key={address.id} className="bg-white dark:bg-zinc-900 rounded-2xl border border-slate-100 dark:border-zinc-800 p-4 flex-row justify-between items-center shadow-xs">
                <View className="flex-1 pr-4">
                  <View className="flex-row items-center gap-2 mb-2">
                    <Text className="text-slate-800 dark:text-zinc-100 font-black text-sm">{address.label}</Text>
                    {address.isDefault && (
                      <View className="bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-full flex-row items-center gap-0.5">
                        <Check size={8} color="#047857" strokeWidth={3} />
                        <Text className="text-emerald-700 dark:text-emerald-400 font-black text-[7px] uppercase tracking-wider">Default</Text>
                      </View>
                    )}
                  </View>
                  <Text numberOfLines={1} className="text-slate-550 dark:text-zinc-350 text-xs font-semibold leading-relaxed">
                    {[
                      address.houseNo && address.houseNo !== '-' ? `House No ${address.houseNo}` : '',
                      address.street && address.street !== '-' ? address.street : '',
                      address.area && address.area !== '-' ? address.area : '',
                      address.city,
                      address.pincode ? `- ${address.pincode}` : ''
                    ].filter(Boolean).join(', ')}
                  </Text>
                  <Text className="text-slate-400 dark:text-zinc-500 text-[10px] mt-1">Contact: {address.phone}</Text>
                </View>

                <Pressable
                  onPress={() => handleDeleteAddress(address.id)}
                  className="w-9 h-9 rounded-full bg-slate-50 dark:bg-zinc-800 border border-slate-100 dark:border-zinc-700 items-center justify-center active:bg-rose-50 dark:active:bg-rose-950/20"
                >
                  <Trash2 size={16} color="#ef4444" />
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
