import { View, Text, Pressable, TextInput, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Navigation, Compass, Search, Sparkles, CheckCircle2, AlertTriangle, ShoppingBag, ChevronRight } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useUIStore } from '../stores/ui-store';
import { useTheme } from './context/ThemeContext';
import { triggerHaptic } from '../lib/haptic';
import { API_BASE_URL } from '../lib/constants';
import { api } from '../lib/api-client';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ZoomIn } from 'react-native-reanimated';

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
  const webViewRef = useRef<any>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [confirmedStoreName, setConfirmedStoreName] = useState('');
  const [confirmedSurgeCharge, setConfirmedSurgeCharge] = useState(0);

  const onWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'MAP_CLICK') {
        triggerHaptic('light');
        setMarkerCoords({
          latitude: data.lat,
          longitude: data.lng
        });
      }
    } catch (err) {
      console.warn('WebView message parse error:', err);
    }
  };

  useEffect(() => {
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'CENTER_MAP',
      lat: markerCoords.latitude,
      lng: markerCoords.longitude
    }));
  }, [markerCoords.latitude, markerCoords.longitude]);

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
      // Save details to stores
      const rawStoreId = store ? store.id : 'default-Ghatampur Market';
      const resolvedStoreId = (!rawStoreId || rawStoreId === 'default-swaroop-nagar' || rawStoreId === 'ghatampur') ? 'default-Ghatampur Market' : rawStoreId;
      const rawStoreName = store ? store.name : 'Ghatampur';
      const resolvedStoreName = (!rawStoreName || rawStoreName === 'Swaroop Nagar Hub' || rawStoreName === 'Ghatampur Hub') ? 'Ghatampur' : rawStoreName;

      useUIStore.setState({
        selectedLocation: addressText,
        userCoords: { lat: markerCoords.latitude, lng: markerCoords.longitude },
        assignedStoreId: resolvedStoreId,
        shopName: resolvedStoreName,
        surgeCharge: store ? store.surgeCharge : 0.0,
        groceryMartOpen: store ? (store.groceryOpen ?? true) : true,
        cafeOpen: store ? (store.cafeOpen ?? true) : true
      });

      triggerHaptic('success');
      setConfirmedStoreName(resolvedStoreName);
      setConfirmedSurgeCharge(store ? store.surgeCharge : 0.0);
      setSuccessModalVisible(true);
    } catch (err) {
      console.error(err);
      // Fallback
      useUIStore.setState({
        selectedLocation: addressText,
        userCoords: { lat: markerCoords.latitude, lng: markerCoords.longitude },
        assignedStoreId: 'default-Ghatampur Market',
        shopName: 'Ghatampur',
        surgeCharge: 0.0,
        groceryMartOpen: true,
        cafeOpen: true
      });
      triggerHaptic('warning');
      setConfirmedStoreName('Ghatampur');
      setConfirmedSurgeCharge(0.0);
      setSuccessModalVisible(true);
    } finally {
      setIsValidating(false);
    }
  };

  const isWithinZone = distance <= deliveryRadius;
  const isExpoGo = Constants.appOwnership === 'expo';

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
        <View className="flex-1 min-h-[300px] relative bg-slate-100 dark:bg-zinc-900 border-y border-slate-200 dark:border-zinc-800 overflow-hidden">
          {Platform.OS === 'web' ? (
            <View className="w-full h-full relative" style={{ minHeight: 300 }}>
              <iframe
                title="Delivery Location Map"
                src={`https://maps.google.com/maps?q=${markerCoords.latitude},${markerCoords.longitude}&z=15&output=embed`}
                style={{ width: '100%', height: '100%', border: 'none', minHeight: 300 }}
              />
              <View className="absolute bottom-2 left-2 bg-white/90 dark:bg-zinc-900/90 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm">
                <Text className="text-[9px] text-slate-600 dark:text-zinc-400 font-bold">
                  Coordinates: {(markerCoords?.latitude || 26.1534185).toFixed(6)}, {(markerCoords?.longitude || 80.1714024).toFixed(6)}
                </Text>
              </View>
            </View>
          ) : isExpoGo && Platform.OS === 'android' ? (
            // Modern Interactive Leaflet Map for Expo Go Android
            <View className="w-full h-full relative" style={{ minHeight: 300 }}>
              <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8" />
                    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
                    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
                    <style>
                      body, html, #map {
                        margin: 0; padding: 0; height: 100%; width: 100%;
                        background-color: ${isDark ? '#09090b' : '#fafbfe'};
                      }
                      .leaflet-control-zoom {
                        border: none !important;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.12) !important;
                      }
                      .leaflet-bar a {
                        background-color: ${isDark ? '#1c1c1f' : '#ffffff'} !important;
                        color: ${isDark ? '#ffffff' : '#0f172a'} !important;
                        border: 1px solid ${isDark ? '#27272a' : '#e2e8f0'} !important;
                      }
                    </style>
                  </head>
                  <body>
                    <div id="map"></div>
                    <script>
                      var map = L.map('map', {
                        zoomControl: true,
                        attributionControl: false
                      }).setView([${markerCoords.latitude}, ${markerCoords.longitude}], 15);

                      var tileUrl = '${isDark ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}';
                      L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(map);

                      var storeIcon = L.divIcon({
                        className: 'store-icon',
                        html: '<div style="width: 32px; height: 32px; border-radius: 16px; background-color: #e20a22; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.25); font-size: 14px;">📦</div>',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                      });

                      var userIcon = L.divIcon({
                        className: 'user-icon',
                        html: '<div style="width: 32px; height: 32px; border-radius: 16px; background-color: #4f46e5; border: 2.5px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.25); font-size: 14px;">📍</div>',
                        iconSize: [32, 32],
                        iconAnchor: [16, 16]
                      });

                      L.marker([${storeLat}, ${storeLng}], { icon: storeIcon }).addTo(map);
                      var userMarker = L.marker([${markerCoords.latitude}, ${markerCoords.longitude}], { icon: userIcon, draggable: true }).addTo(map);

                      L.circle([${storeLat}, ${storeLng}], {
                        color: '#f43f5e',
                        fillColor: '#f43f5e',
                        fillOpacity: 0.08,
                        radius: ${deliveryRadius * 1000}
                      }).addTo(map);

                      userMarker.on('dragend', function(e) {
                        var pos = userMarker.getLatLng();
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK', lat: pos.lat, lng: pos.lng }));
                      });

                      map.on('click', function(e) {
                        userMarker.setLatLng(e.latlng);
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'MAP_CLICK', lat: e.latlng.lat, lng: e.latlng.lng }));
                      });

                      window.addEventListener('message', function(e) {
                        try {
                          var data = JSON.parse(e.data);
                          if (data.type === 'CENTER_MAP') {
                            map.setView([data.lat, data.lng], 15);
                            userMarker.setLatLng([data.lat, data.lng]);
                          }
                        } catch(err) {}
                      });
                    </script>
                  </body>
                  </html>
                ` }}
                onMessage={onWebViewMessage}
                style={{ width: '100%', height: '100%', backgroundColor: isDark ? '#09090b' : '#fafbfe' }}
              />
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
                style={{ width: '100%', height: '100%' }}
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
            <TextInput
              value={addressText}
              onChangeText={setAddressText}
              multiline
              numberOfLines={2}
              style={{
                fontSize: 12,
                color: isDark ? '#e4e4e7' : '#475569',
                fontWeight: '600',
                lineHeight: 18,
                padding: 10,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: isDark ? '#3f3f46' : '#e2e8f0',
                backgroundColor: isDark ? '#18181b' : '#f8fafc',
                marginTop: 4,
                textAlignVertical: 'top',
              }}
            />
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

      {/* Premium Custom Success Modal */}
      {successModalVisible && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: 24,
        }}>
          <Animated.View 
            entering={ZoomIn.duration(350).springify()}
            style={{
              width: '100%',
              maxWidth: 320,
              borderRadius: 24,
              backgroundColor: isDark ? '#1c1c1e' : '#ffffff',
              padding: 24,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 15,
              elevation: 8,
            }}
          >
            {/* Pulsing Success Icon */}
            <View style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#ecfdf5',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 14,
            }}>
              <CheckCircle2 size={28} color="#10b981" strokeWidth={2.5} />
            </View>

            {/* Modal Title */}
            <Text style={{
              fontSize: 16,
              fontWeight: '900',
              color: isDark ? '#ffffff' : '#0f172a',
              textAlign: 'center',
              marginBottom: 8,
            }}>
              Location Configured!
            </Text>

            {/* Store details */}
            <Text style={{
              fontSize: 12,
              color: isDark ? '#a1a1aa' : '#475569',
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: 16,
              fontWeight: '600',
            }}>
              Your order will be fulfilled by our {"\n"}
              <Text style={{ fontWeight: '900', color: '#e20a22' }}>
                {confirmedStoreName || 'FastKirana Store'}
              </Text>.
            </Text>

            {/* Surge Charge Banner if applicable */}
            {confirmedSurgeCharge > 0 && (
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                padding: 10,
                borderRadius: 12,
                backgroundColor: isDark ? 'rgba(217, 119, 6, 0.12)' : '#fffbeb',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(217, 119, 6, 0.2)' : '#fde68a',
                marginBottom: 18,
              }}>
                <AlertTriangle size={14} color="#d97706" />
                <Text style={{
                  flex: 1,
                  fontSize: 10,
                  color: isDark ? '#fbbf24' : '#b45309',
                  fontWeight: '700',
                }}>
                  Surge charge of ₹{confirmedSurgeCharge} is active due to weather/high demand.
                </Text>
              </View>
            )}

            {/* Continue Button */}
            <Pressable
              onPress={() => {
                triggerHaptic('success');
                setSuccessModalVisible(false);
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              style={({ pressed }) => ({
                width: '100%',
                borderRadius: 24,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                elevation: 4,
                shadowColor: '#e20a22',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 8,
              })}
            >
              <LinearGradient
                colors={['#e20a22', '#f43f5e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  borderRadius: 24,
                  gap: 8,
                }}
              >
                <ShoppingBag size={15} color="#ffffff" style={{ marginRight: 2 }} />
                <Text style={{
                  fontSize: 13,
                  fontWeight: '900',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                }}>
                  Start Shopping
                </Text>
                <ChevronRight size={15} color="#ffffff" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}
