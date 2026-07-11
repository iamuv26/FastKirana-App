import { View, Text, Pressable, TextInput, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Navigation, Compass, Search, Sparkles } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useUIStore } from '../stores/ui-store';
import { useTheme } from './context/ThemeContext';
import { triggerHaptic } from '../lib/haptic';
import { API_BASE_URL } from '../lib/constants';
import { api } from '../lib/api-client';

let MapView: any;
let Marker: any;
let Circle: any;

if (Platform.OS !== 'web') {
  try {
    const Maps = require('react-native-maps');
    MapView = Maps.default || Maps;
    Marker = Maps.Marker || require('react-native-maps').Marker;
    Circle = Maps.Circle || require('react-native-maps').Circle;
  } catch (e) {
    console.warn('Failed to load react-native-maps:', e);
  }
}

export default function LocationPickerScreen() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { 
    selectedLocation, 
    userCoords, 
    deliveryRadius, 
    storeLat,
    storeLng
  } = useUIStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Default region points to userCoords or fallback to Store
  const [region, setRegion] = useState({
    latitude: userCoords?.lat || storeLat || 26.1534185,
    longitude: userCoords?.lng || storeLng || 80.1714024,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [markerCoords, setMarkerCoords] = useState({
    latitude: userCoords?.lat || storeLat || 26.1534185,
    longitude: userCoords?.lng || storeLng || 80.1714024,
  });

  const [addressText, setAddressText] = useState(selectedLocation || 'Select Location');
  const [distance, setDistance] = useState(0);

  const mapRef = useRef<any>(null);

  // Haversine formula to compute distance in km
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Update distance & address when marker coordinate changes with 1000ms debounce
  useEffect(() => {
    const d = calculateDistance(storeLat, storeLng, markerCoords.latitude, markerCoords.longitude);
    setDistance(d);

    const timer = setTimeout(async () => {
      try {
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: markerCoords.latitude,
          longitude: markerCoords.longitude
        });
        if (geocode) {
          const name = geocode.name || geocode.street || '';
          const area = geocode.district || geocode.subregion || '';
          const city = geocode.city || '';
          const code = geocode.postalCode || '';
          const resolvedAddress = [name, area, city, code].filter(Boolean).join(', ');
          setAddressText(resolvedAddress || `Lat: ${markerCoords.latitude.toFixed(4)}, Lng: ${markerCoords.longitude.toFixed(4)}`);
        }
      } catch (err) {
        console.warn('Marker reverse geocode failed:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [markerCoords]);

  // Auto-detect current location on mount if no coords are set yet
  useEffect(() => {
    if (!userCoords) {
      handleUseCurrentLocation();
    }
  }, []);

  // Request GPS Location
  const handleUseCurrentLocation = async () => {
    setGpsLoading(true);
    triggerHaptic('light');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to detect your address.');
        setGpsLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = currentLocation.coords;

      // Animate map
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 1000);

      setMarkerCoords({ latitude, longitude });
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      });

      // Reverse geocode
      const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode) {
        const name = geocode.name || geocode.street || '';
        const area = geocode.district || geocode.subregion || '';
        const city = geocode.city || '';
        const code = geocode.postalCode || '';
        const resolvedAddress = [name, area, city, code].filter(Boolean).join(', ');
        setAddressText(resolvedAddress || 'Current Location');
      } else {
        setAddressText(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
      }
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
      Alert.alert('Location Error', 'Unable to fetch current location.');
    } finally {
      setGpsLoading(false);
    }
  };

  // Geocode manual address search
  const handleAddressSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    triggerHaptic('light');
    try {
      let results = await Location.geocodeAsync(searchQuery).catch(() => []);
      
      if (!results || results.length === 0) {
        console.log('Local geocoding returned no results, fetching from backend geocoder:', searchQuery);
        const response = await api.get(`/geocode?address=${encodeURIComponent(searchQuery)}`);
        const apiResults = response?.data?.results || response?.results;
        if (apiResults && apiResults.length > 0) {
          const loc = apiResults[0]?.geometry?.location;
          if (loc && loc.lat && loc.lng) {
            results = [{ latitude: loc.lat, longitude: loc.lng }];
          }
        }
      }

      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        
        mapRef.current?.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }, 1000);

        setMarkerCoords({ latitude, longitude });
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        });

        setAddressText(searchQuery);
        triggerHaptic('success');
      } else {
        Alert.alert('Search Failed', 'Location not found. Try search terms like "Ghatampur, Kanpur" or a specific area.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Search Error', 'Unable to find that location.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmLocation = async () => {
    setIsValidating(true);
    triggerHaptic('medium');
    try {
      const response = await fetch(`${API_BASE_URL}/location/check-store?lat=${markerCoords.latitude}&lng=${markerCoords.longitude}`);
      if (!response.ok) throw new Error('Store coverage check failed');
      const store = await response.json();
      
      // Save details to stores
      useUIStore.setState({
        selectedLocation: addressText,
        userCoords: { lat: markerCoords.latitude, lng: markerCoords.longitude },
        assignedStoreId: store ? store.id : null,
        shopName: store ? store.name : 'FastKirana',
        surgeCharge: store ? store.surgeCharge : 0.0,
        groceryMartOpen: store ? (store.groceryOpen ?? true) : true,
        cafeOpen: store ? (store.cafeOpen ?? true) : true
      });

      triggerHaptic('success');
      Alert.alert(
        'Delivery Store Configured',
        `Your order will be fulfilled by: ${store.name || 'FastKirana Hub'}.${
          store.surgeCharge > 0 ? `\n\nNote: A weather/surge charge of ₹${store.surgeCharge} is currently applicable in this area.` : ''
        }`,
        [{ text: 'Continue', onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/');
          }
        }}]
      );
    } catch (err) {
      console.error(err);
      // Fallback
      useUIStore.setState({
        selectedLocation: addressText,
        userCoords: { lat: markerCoords.latitude, lng: markerCoords.longitude },
        assignedStoreId: null,
        shopName: 'FastKirana',
        surgeCharge: 0.0,
        groceryMartOpen: true,
        cafeOpen: true
      });
      Alert.alert(
        'Location Confirmed',
        'Your location has been set. Fulfilling from central default store.',
        [{ text: 'Continue', onPress: () => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/');
          }
        }}]
      );
    } finally {
      setIsValidating(false);
    }
  };

  const isWithinZone = distance <= deliveryRadius;

  return (
    <SafeAreaView className="flex-1 bg-slate-50 dark:bg-zinc-950">
      <StatusBar style={isDark ? "light" : "dark"} />
      {/* Header */}
      <View className="bg-white dark:bg-zinc-900 px-4 py-3 border-b border-slate-100 dark:border-zinc-800 flex-row items-center gap-3">
        <Pressable 
          onPress={() => {
            triggerHaptic('light');
            router.back();
          }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
          }}
        >
          <ArrowLeft size={18} color={isDark ? '#ffffff' : '#0f172a'} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-slate-850 dark:text-zinc-100 font-black text-base">Select Delivery Location</Text>
          <Text className="text-slate-400 dark:text-zinc-400 text-[10px] font-bold mt-0.5">Dark Store Delivery Validation</Text>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Search bar */}
        <View className="p-4 bg-white dark:bg-zinc-900 border-b border-slate-100 dark:border-zinc-800 flex-row gap-2">
          <View className="flex-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl flex-row items-center px-3.5">
            <Search size={16} color={isDark ? '#a1a1aa' : '#64748b'} />
            <TextInput
              placeholder="Search address or area..."
              placeholderTextColor={isDark ? '#52525b' : '#94a3b8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleAddressSearch}
              className="flex-1 py-2.5 ml-2 text-slate-800 dark:text-zinc-100 font-bold text-xs"
            />
          </View>
          <Pressable 
            onPress={handleAddressSearch}
            disabled={isSearching}
            className="bg-rose-600 active:bg-rose-700 px-4 rounded-xl items-center justify-center"
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text className="text-white font-extrabold text-xs">Search</Text>
            )}
          </Pressable>
        </View>

        {/* Current Location Quick Option */}
        <Pressable 
          onPress={handleUseCurrentLocation}
          disabled={gpsLoading}
          className="bg-indigo-50/50 dark:bg-indigo-950/20 px-4 py-3.5 flex-row items-center justify-between border-b border-slate-100 dark:border-zinc-800"
        >
          <View className="flex-row items-center gap-3">
            <Navigation size={18} color="#4f46e5" />
            <View>
              <Text className="text-indigo-700 dark:text-indigo-400 font-black text-xs">Use Current GPS Location</Text>
              <Text className="text-slate-400 dark:text-zinc-400 text-[10px] font-semibold mt-0.5">Detects address automatically</Text>
            </View>
          </View>
          {gpsLoading && <ActivityIndicator size="small" color="#4f46e5" />}
        </Pressable>

        {/* Map View */}
        <View className="flex-1 min-h-[280px] relative bg-slate-100 dark:bg-zinc-900 border-y border-slate-200 dark:border-zinc-800">
          {Platform.OS === 'web' ? (
            <View className="w-full h-full relative" style={{ minHeight: 280 }}>
              <iframe
                title="Delivery Location Map"
                src={`https://maps.google.com/maps?q=${markerCoords.latitude},${markerCoords.longitude}&z=15&output=embed`}
                style={{ width: '100%', height: '100%', border: 'none', minHeight: 280 }}
              />
              <View className="absolute bottom-2 left-2 bg-white/90 dark:bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                <Text className="text-[9px] text-slate-600 dark:text-zinc-400 font-bold">
                  Coordinates: {(markerCoords?.latitude || 26.1534185).toFixed(6)}, {(markerCoords?.longitude || 80.1714024).toFixed(6)}
                </Text>
              </View>
            </View>
          ) : !MapView ? (
            <View className="w-full h-full justify-center items-center p-6 bg-slate-50 dark:bg-zinc-900 gap-2">
              <View className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 items-center justify-center">
                <MapPin size={22} color="#e20a22" />
              </View>
              <Text className="text-slate-800 dark:text-zinc-100 font-black text-xs text-center">
                Maps Module Not Available
              </Text>
              <Text className="text-slate-400 dark:text-zinc-450 text-[10px] text-center max-w-[280px]">
                Google Maps Services are not configured or supported on this device. You can still auto-detect GPS coordinates or proceed using manual address text entry.
              </Text>
            </View>
          ) : (
            <>
              <MapView
                ref={mapRef}
                initialRegion={region}
                onPress={(e: any) => {
                  triggerHaptic('light');
                  setMarkerCoords(e.nativeEvent.coordinate);
                }}
                className="w-full h-full"
              >
                {/* Dark Store Pin */}
                <Marker
                  coordinate={{ latitude: storeLat, longitude: storeLng }}
                  title="FastKirana Dark Store"
                  description="Fulfillment Center"
                  tracksViewChanges={false}
                >
                  <View className="w-8 h-8 rounded-full bg-rose-600 items-center justify-center border-2 border-white shadow-md">
                    <Text className="text-[12px]">📦</Text>
                  </View>
                </Marker>

                {/* Selected User Pin */}
                <Marker
                  coordinate={markerCoords}
                  title="Delivery Target"
                  draggable
                  onDragEnd={(e: any) => {
                    triggerHaptic('medium');
                    setMarkerCoords(e.nativeEvent.coordinate);
                  }}
                >
                  <View className="w-8 h-8 rounded-full bg-indigo-600 items-center justify-center border-2 border-white shadow-md">
                    <Text className="text-[12px]">📍</Text>
                  </View>
                </Marker>

                {/* Delivery zone radius circle */}
                <Circle
                  center={{ latitude: storeLat, longitude: storeLng }}
                  radius={deliveryRadius * 1000} // radius in meters
                  fillColor="rgba(244, 63, 94, 0.12)"
                  strokeColor="rgba(244, 63, 94, 0.4)"
                  strokeWidth={1.5}
                />
              </MapView>

              {/* Compass Float Button */}
              <Pressable 
                onPress={() => {
                  triggerHaptic('light');
                  mapRef.current?.animateToRegion({
                    latitude: storeLat,
                    longitude: storeLng,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                  }, 600);
                }}
                className="absolute bottom-4 right-4 bg-white dark:bg-zinc-800 p-2.5 rounded-full shadow-lg border border-slate-100 dark:border-zinc-700 active:scale-95"
              >
                <Compass size={20} color={isDark ? '#cbd5e1' : '#334155'} />
              </Pressable>
            </>
          )}
        </View>

        {/* Selected location and distance summary */}
        <View className="bg-white dark:bg-zinc-900 border-t border-slate-100 dark:border-zinc-800 p-5 gap-4">
          <View className="flex-col gap-1.5">
            <View className="flex-row items-center gap-1.5">
              <MapPin size={16} color="#e20a22" />
              <Text className="text-slate-800 dark:text-zinc-100 font-black text-sm">Target Address</Text>
            </View>
            <Text className="text-slate-500 dark:text-zinc-400 font-semibold text-xs leading-5">
              {addressText}
            </Text>
          </View>

          {/* Distance and Delivery validation badge */}
          <View className="flex-row items-center justify-between border-y border-slate-100 dark:border-zinc-800 py-3 mt-1">
            <View className="flex-col">
              <Text className="text-slate-400 dark:text-zinc-400 text-[10px] font-bold uppercase tracking-wider">Distance to Store</Text>
              <Text className="text-slate-800 dark:text-zinc-100 font-black text-base mt-0.5">{distance.toFixed(2)} km</Text>
            </View>

            <View className={`px-3 py-1.5 rounded-xl border ${
              isWithinZone 
                ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40' 
                : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
            }`}>
              <Text className={`font-black text-[10px] uppercase tracking-wide ${
                isWithinZone ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
              }`}>
                {isWithinZone ? '✅ Within Delivery Zone' : '❌ Outside Delivery Zone'}
              </Text>
            </View>
          </View>

          {/* Confirm Button */}
          <Pressable 
            onPress={handleConfirmLocation}
            disabled={isValidating}
            style={{ opacity: isValidating ? 0.8 : 1 }}
            className="bg-rose-600 active:bg-rose-700 py-3.5 rounded-xl flex-row items-center justify-center gap-1.5 shadow-sm"
          >
            {isValidating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-white font-extrabold text-xs uppercase tracking-wider">Confirm This Location</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
