import { View, Text, Pressable, TextInput, ActivityIndicator, Alert, ScrollView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { ArrowLeft, MapPin, Navigation, Compass, Search, Sparkles, CheckCircle2, AlertTriangle, ShoppingBag, ChevronRight } from 'lucide-react-native';
import * as Location from 'expo-location';
import { useUIStore } from '../stores/ui-store';
import { useTheme } from './context/ThemeContext';
import { ScalePressable } from '../components/shared/ScalePressable';
import { triggerHaptic } from '../lib/haptic';
import { API_BASE_URL } from '../lib/constants';
import { api } from '../lib/api-client';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { THEME } from '../lib/theme';

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
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

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

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

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
          setAddressText(resolvedAddress || 'Current Location');
        }
      } catch (err) {
        console.warn('Marker reverse geocode failed:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [markerCoords]);

  useEffect(() => {
    if (!userCoords) {
      handleUseCurrentLocation();
    }
  }, []);

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

      const [geocode] = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (geocode) {
        const name = geocode.name || geocode.street || '';
        const area = geocode.district || geocode.subregion || '';
        const city = geocode.city || '';
        const code = geocode.postalCode || '';
        const resolvedAddress = [name, area, city, code].filter(Boolean).join(', ');
        setAddressText(resolvedAddress || 'Current Location');
      } else {
        setAddressText('Current Location');
      }
      triggerHaptic('success');
    } catch (err) {
      console.error(err);
      Alert.alert('Location Error', 'Unable to fetch current location.');
    } finally {
      setGpsLoading(false);
    }
  };

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

      const resolvedStoreId = 'default-Ghatampur Market';
      const resolvedStoreName = 'Ghatampur';

      useUIStore.setState({
        selectedLocation: addressText,
        userCoords: { lat: markerCoords.latitude, lng: markerCoords.longitude },
        isLocationConfirmed: true,
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
      useUIStore.setState({
        selectedLocation: addressText,
        userCoords: { lat: markerCoords.latitude, lng: markerCoords.longitude },
        isLocationConfirmed: true,
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={isDarkMode ? 'light' : 'dark'} />
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScalePressable
          onPress={() => { router.back(); }}
          scaleValue={0.9}
          style={[styles.backBtn, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
        >
          <ArrowLeft size={18} color={isDarkMode ? '#ffffff' : colors.textPrimary} />
        </ScalePressable>
        <View style={styles.headerTextWrap}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Select Delivery Location</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>Dark Store Delivery Validation</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        {/* Search bar */}
        <View style={[styles.searchBarWrap, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={[styles.searchInputWrap, { backgroundColor: colors.borderLight, borderColor: colors.border }]}>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              placeholder="Search address or area..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleAddressSearch}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
          </View>
          <ScalePressable
            onPress={handleAddressSearch}
            disabled={isSearching}
            scaleValue={0.95}
            style={[styles.searchBtn, { backgroundColor: THEME.COLORS.brand.primary }]}
          >
            {isSearching ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.searchBtnText}>Search</Text>
            )}
          </ScalePressable>
        </View>

        {/* Current Location Quick Option */}
        <ScalePressable
          onPress={handleUseCurrentLocation}
          disabled={gpsLoading}
          scaleValue={0.98}
          style={[
            styles.gpsRow,
            {
              backgroundColor: isDarkMode ? 'rgba(79, 70, 229, 0.08)' : 'rgba(238, 242, 255, 0.4)',
              borderBottomColor: colors.borderLight,
            }
          ]}
        >
          <View style={styles.gpsLeft}>
            <Navigation size={18} color="#4f46e5" />
            <View>
              <Text style={[styles.gpsTitle, { color: isDarkMode ? '#818cf8' : '#4338ca' }]}>Use Current GPS Location</Text>
              <Text style={[styles.gpsSub, { color: colors.textMuted }]}>Detects address automatically</Text>
            </View>
          </View>
          {gpsLoading && <ActivityIndicator size="small" color="#4f46e5" />}
        </ScalePressable>

        {/* Map View */}
        <View style={[styles.mapWrap, { backgroundColor: colors.borderLight, borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          {Platform.OS === 'web' ? (
            <View style={styles.webMapWrap}>
              <iframe
                title="Delivery Location Map"
                src={`https://maps.google.com/maps?q=${markerCoords.latitude},${markerCoords.longitude}&z=15&output=embed`}
                style={{ width: '100%', height: '100%', border: 'none', minHeight: 300 }}
              />
              <View style={[styles.coordsBadge, { backgroundColor: isDarkMode ? 'rgba(24,24,27,0.9)' : 'rgba(255,255,255,0.9)', borderColor: colors.border }]}>
                <Text style={[styles.coordsText, { color: colors.textSecondary }]}>
                  Coordinates: {(markerCoords?.latitude || 26.1534185).toFixed(6)}, {(markerCoords?.longitude || 80.1714024).toFixed(6)}
                </Text>
              </View>
            </View>
          ) : isExpoGo && Platform.OS === 'android' ? (
            <View style={styles.webMapWrap}>
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
                        background-color: ${isDarkMode ? '#09090b' : '#fafbfe'};
                      }
                      .leaflet-control-zoom {
                        border: none !important;
                        box-shadow: 0 4px 10px rgba(0,0,0,0.12) !important;
                      }
                      .leaflet-bar a {
                        background-color: ${isDarkMode ? '#1c1c1f' : '#ffffff'} !important;
                        color: ${isDarkMode ? '#ffffff' : '#0f172a'} !important;
                        border: 1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'} !important;
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

                      var tileUrl = '${isDarkMode ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'}';
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
                        color: '#e20a22',
                        fillColor: '#e20a22',
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
                style={{ width: '100%', height: '100%', backgroundColor: isDarkMode ? '#09090b' : '#fafbfe' }}
              />
            </View>
          ) : !MapView ? (
            <View style={[styles.noMapWrap, { backgroundColor: colors.borderLight }]}>
              <View style={[styles.noMapIcon, { backgroundColor: isDarkMode ? 'rgba(225,29,72,0.1)' : THEME.COLORS.brand.primaryLight, borderColor: isDarkMode ? 'rgba(225,29,72,0.2)' : '#ffe4e6' }]}>
                <MapPin size={22} color={THEME.COLORS.brand.primary} />
              </View>
              <Text style={[styles.noMapTitle, { color: colors.textPrimary }]}>Maps Module Not Available</Text>
              <Text style={[styles.noMapSub, { color: colors.textMuted }]}>
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
                <Marker
                  coordinate={{ latitude: storeLat, longitude: storeLng }}
                  title="FastKirana Dark Store"
                  description="Fulfillment Center"
                  tracksViewChanges={false}
                >
                  <View style={[styles.mapStorePin, { backgroundColor: THEME.COLORS.brand.primary }]}>
                    <Text style={styles.mapPinText}>📦</Text>
                  </View>
                </Marker>

                <Marker
                  coordinate={markerCoords}
                  title="Delivery Target"
                  draggable
                  onDragEnd={(e: any) => {
                    triggerHaptic('medium');
                    setMarkerCoords(e.nativeEvent.coordinate);
                  }}
                >
                  <View style={styles.mapUserPin}>
                    <Text style={styles.mapPinText}>📍</Text>
                  </View>
                </Marker>

                <Circle
                  center={{ latitude: storeLat, longitude: storeLng }}
                  radius={deliveryRadius * 1000}
                  fillColor="rgba(226, 10, 34, 0.08)"
                  strokeColor="rgba(226, 10, 34, 0.8)"
                  strokeWidth={2.5}
                />
              </MapView>

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
                style={[styles.compassBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Compass size={20} color={isDarkMode ? '#cbd5e1' : '#334155'} />
              </Pressable>
            </>
          )}
        </View>

        {/* Selected location and distance summary */}
        <View style={[styles.bottomPanel, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <View style={styles.addressSection}>
            <View style={styles.addressHeader}>
              <MapPin size={16} color={THEME.COLORS.brand.primary} />
              <Text style={[styles.addressLabel, { color: colors.textPrimary }]}>Target Address</Text>
            </View>
            <TextInput
              value={addressText}
              onChangeText={setAddressText}
              multiline
              numberOfLines={2}
              style={[
                styles.addressInput,
                {
                  color: colors.textSecondary,
                  borderColor: colors.border,
                  backgroundColor: isDarkMode ? colors.surfaceElevated : THEME.COLORS.light.borderLight,
                }
              ]}
            />
          </View>

          {/* Distance and Delivery validation badge */}
          <View style={[styles.validationRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
            <View style={styles.distanceInfo}>
              <Text style={[styles.distanceLabel, { color: colors.textMuted }]}>Distance to Store</Text>
              <Text style={[styles.distanceValue, { color: colors.textPrimary }]}>{distance.toFixed(2)} km</Text>
            </View>

            <View style={[
              styles.zoneBadge,
              {
                backgroundColor: isWithinZone
                  ? (isDarkMode ? 'rgba(16,185,129,0.1)' : THEME.COLORS.successLight)
                  : (isDarkMode ? 'rgba(225,29,72,0.1)' : '#fef2f2'),
                borderColor: isWithinZone
                  ? (isDarkMode ? 'rgba(16,185,129,0.3)' : '#bbf7d0')
                  : (isDarkMode ? 'rgba(225,29,72,0.3)' : '#fecaca'),
              }
            ]}>
              <Text style={[
                styles.zoneBadgeText,
                {
                  color: isWithinZone
                    ? (isDarkMode ? '#34d399' : '#15803d')
                    : (isDarkMode ? '#f87171' : '#b91c1c'),
                }
              ]}>
                {isWithinZone ? '✅ Within Delivery Zone' : '❌ Outside Delivery Zone'}
              </Text>
            </View>
          </View>

          <ScalePressable
            onPress={handleConfirmLocation}
            disabled={isValidating}
            scaleValue={0.96}
            haptic="success"
            style={[styles.confirmBtn, { backgroundColor: THEME.COLORS.brand.primary, opacity: isValidating ? 0.8 : 1 }]}
          >
            {isValidating ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.confirmBtnText}>Confirm This Location</Text>
            )}
          </ScalePressable>
        </View>
      </ScrollView>

      {/* Premium Custom Success Modal */}
      {successModalVisible && (
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={ZoomIn.duration(350).springify()}
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)',
              }
            ]}
          >
            <View style={[styles.successIconWrap, { backgroundColor: isDarkMode ? 'rgba(16,185,129,0.12)' : '#ecfdf5' }]}>
              <CheckCircle2 size={28} color={THEME.COLORS.success} strokeWidth={2.5} />
            </View>

            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Location Configured!
            </Text>

            <Text style={[styles.modalBody, { color: colors.textSecondary }]}>
              Your order will be fulfilled by{"\n"}
              <Text style={{ fontWeight: '800', color: THEME.COLORS.brand.primary }}>
                {confirmedStoreName === 'Ghatampur' ? 'FastKirana Store' : (confirmedStoreName || 'FastKirana Store')}
              </Text>.
            </Text>

            {confirmedSurgeCharge > 0 && (
              <View style={[
                styles.surgeBanner,
                {
                  backgroundColor: isDarkMode ? 'rgba(217,119,6,0.12)' : '#fffbeb',
                  borderColor: isDarkMode ? 'rgba(217,119,6,0.2)' : '#fde68a',
                }
              ]}>
                <AlertTriangle size={14} color="#d97706" />
                <Text style={[styles.surgeText, { color: isDarkMode ? '#fbbf24' : '#b45309' }]}>
                  Surge charge of ₹{confirmedSurgeCharge} is active due to weather/high demand.
                </Text>
              </View>
            )}

            <ScalePressable
              onPress={() => {
                setSuccessModalVisible(false);
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/');
                }
              }}
              scaleValue={0.98}
              haptic="success"
              style={styles.continueBtn}
            >
              <LinearGradient
                colors={[THEME.COLORS.brand.primary, '#f43f5e']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueBtnGradient}
              >
                <ShoppingBag size={16} color="#ffffff" style={{ marginRight: 2 }} />
                <Text style={styles.continueBtnText}>Start Shopping</Text>
                <ChevronRight size={16} color="#ffffff" />
              </LinearGradient>
            </ScalePressable>
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm + 2,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: THEME.SPACING.sm + 2,
  },
  headerTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.body,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },
  headerSub: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
    marginTop: 1,
  },
  scrollView: { flex: 1 },
  searchBarWrap: {
    flexDirection: 'row',
    gap: THEME.SPACING.sm,
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm,
    borderBottomWidth: 1,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.xs + 1,
    paddingHorizontal: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.lg,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    paddingVertical: THEME.SPACING.sm + 1,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
  },
  searchBtn: {
    paddingHorizontal: THEME.SPACING.md + 4,
    borderRadius: THEME.RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBtnText: {
    color: '#ffffff',
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: THEME.SPACING.md + 4,
    paddingVertical: THEME.SPACING.sm + 2,
    borderBottomWidth: 1,
  },
  gpsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.sm + 2,
  },
  gpsTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },
  gpsSub: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
    marginTop: 1,
  },
  mapWrap: {
    height: 300,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  webMapWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  coordsBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: THEME.SPACING.xs,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
  },
  coordsText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro - 1,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
  },
  noMapWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: THEME.SPACING.xxl,
    gap: THEME.SPACING.sm,
  },
  noMapIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  noMapTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    textAlign: 'center',
  },
  noMapSub: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    textAlign: 'center',
    maxWidth: 280,
  },
  mapStorePin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  mapUserPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#ffffff',
    backgroundColor: '#4f46e5',
  },
  mapPinText: {
    fontSize: 12,
  },
  compassBtn: {
    position: 'absolute',
    bottom: THEME.SPACING.md + 4,
    right: THEME.SPACING.md + 4,
    padding: THEME.SPACING.sm + 2,
    borderRadius: THEME.RADIUS.full,
    borderWidth: 1,
  },
  bottomPanel: {
    padding: THEME.SPACING.md + 4,
    gap: THEME.SPACING.md,
    borderTopWidth: 1,
  },
  addressSection: {
    gap: THEME.SPACING.xs + 2,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.xs + 2,
  },
  addressLabel: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
  },
  addressInput: {
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
    lineHeight: 18,
    padding: THEME.SPACING.sm,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
    textAlignVertical: 'top',
    marginTop: THEME.SPACING.xs + 2,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: THEME.SPACING.sm + 2,
    marginTop: THEME.SPACING.xs,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  distanceInfo: {
    gap: 1,
  },
  distanceLabel: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  distanceValue: {
    fontSize: THEME.TYPOGRAPHY.sizes.body,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    marginTop: 1,
  },
  zoneBadge: {
    paddingHorizontal: THEME.SPACING.sm + 2,
    paddingVertical: THEME.SPACING.xs,
    borderRadius: THEME.RADIUS.lg,
    borderWidth: 1,
  },
  zoneBadgeText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  confirmBtn: {
    paddingVertical: THEME.SPACING.md + 2,
    borderRadius: THEME.RADIUS.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...THEME.SHADOWS.primaryGlow,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: THEME.SPACING.xxl,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: THEME.RADIUS.xl,
    padding: THEME.SPACING.xxl,
    alignItems: 'center',
    borderWidth: 1,
    ...THEME.SHADOWS.xl,
  },
  successIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: THEME.SPACING.md + 2,
  },
  modalTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.titleSm,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    textAlign: 'center',
    marginBottom: THEME.SPACING.xs + 2,
  },
  modalBody: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: THEME.SPACING.md + 4,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
  },
  surgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.sm,
    padding: THEME.SPACING.sm,
    borderRadius: THEME.RADIUS.md,
    borderWidth: 1,
    marginBottom: THEME.SPACING.md + 4,
    width: '100%',
  },
  surgeText: {
    flex: 1,
    fontSize: THEME.TYPOGRAPHY.sizes.micro + 1,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
  },
  continueBtn: {
    width: '100%',
    borderRadius: THEME.RADIUS.xl,
    ...THEME.SHADOWS.lg,
  },
  continueBtnGradient: {
    paddingVertical: THEME.SPACING.md + 4,
    paddingHorizontal: THEME.SPACING.md + 4,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderRadius: THEME.RADIUS.xl,
    gap: THEME.SPACING.xs + 2,
  },
  continueBtnText: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 1.0,
  },
});
