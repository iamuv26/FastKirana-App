import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Platform,
  TextInput,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Search, ChevronLeft, Flame, ShoppingBag, Utensils } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '../../lib/query-keys';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { triggerHaptic } from '../../lib/haptic';
import { API_BASE_URL } from '../../lib/constants';
import BrandedTopHeader from '../../components/shared/BrandedTopHeader';
import {
  RestaurantCard,
  type Restaurant,
} from '../../components/restaurant/RestaurantCard';
import { useResponsive, getCenteredContainerStyle } from '../../lib/responsive';

export default function RestaurantsScreen() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();
  const isGrid = responsive.isTablet || responsive.isDesktop;

  const [search, setSearch] = useState('');

  const { data: restaurants = [], isLoading, refetch, isRefetching } =
    useQuery<Restaurant[]>({
      queryKey: queryKeys.restaurants.listing,
      queryFn: async () => {
        try {
          const res = await fetch(`${API_BASE_URL}/restaurants?all=false`);
          if (!res.ok) throw new Error('fetch failed');
          const data = await res.json();
          return Array.isArray(data) ? data : [];
        } catch (e) {
          return [];
        }
      },
      staleTime: 30_000,
    });

  const filtered = useMemo(() => {
    let list = restaurants.filter((r) => r.isActive !== false);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisineTags.some((t) => t.toLowerCase().includes(q)) ||
          (r.city || '').toLowerCase().includes(q),
      );
    }

    return list.sort((a, b) => {
      const aOpen = a.isOpen ? 1 : 0;
      const bOpen = b.isOpen ? 1 : 0;
      if (aOpen !== bOpen) return bOpen - aOpen;
      return b.rating - a.rating;
    });
  }, [restaurants, search]);

  const handleOpenRestaurant = (r: Restaurant) => {
    triggerHaptic('light');
    router.push(`/restaurants/${r.slug}`);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? '#09090b' : '#fff8f3' },
      ]}
    >
      {/* ═══ BRANDED HEADER & SEARCH ═══ */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 4,
            backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
            borderBottomColor: isDarkMode
              ? 'rgba(39,39,42,0.8)'
              : 'rgba(226,10,34,0.08)',
          },
        ]}
      >
        <BrandedTopHeader showBack={false} style={{ paddingHorizontal: 0, paddingVertical: 0, borderBottomWidth: 0 }} />

        {/* ═══ SEARCH BAR ═══ */}
        <View
          style={[
            styles.searchWrap,
            {
              backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
              borderColor: isDarkMode ? 'rgba(39,39,42,0.8)' : '#fde2dc',
            },
          ]}
        >
          <Search
            size={18}
            color={isDarkMode ? '#71717a' : '#e20a22'}
            strokeWidth={2.2}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search restaurants, cuisines..."
            placeholderTextColor={isDarkMode ? '#71717a' : '#94a3b8'}
            style={[
              styles.searchInput,
              { color: isDarkMode ? '#fafafa' : '#0f172a' },
            ]}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable
              onPress={() => setSearch('')}
              style={styles.clearSearchBtn}
            >
              <Text
                style={[
                  styles.clearSearchText,
                  { color: isDarkMode ? '#a1a1aa' : '#64748b' },
                ]}
              >
                ✕
              </Text>
            </Pressable>
          )}
        </View>

        {/* ═══ ROW 3: STORE SWITCHER TAB PILLS ═══ */}
        <View 
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'stretch',
            width: '100%',
            height: 48,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: isDarkMode ? '#27272a' : 'rgba(0,0,0,0.06)',
            backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
            padding: 3,
            marginTop: 8,
            position: 'relative',
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
              },
              android: { elevation: 2 },
            }),
          }}
        >
          {/* Grocery Segment */}
          <Pressable
            onPress={() => {
              triggerHaptic('medium');
              if (router.canGoBack()) router.back();
              else router.replace('/(tabs)');
            }}
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              borderRadius: 21,
              gap: 8,
            }}
          >
            <ShoppingBag size={18} color={isDarkMode ? '#a1a1aa' : '#475569'} strokeWidth={2.2} />
            <View>
              <Text allowFontScaling={false} style={{ fontSize: 13, fontWeight: '900', color: isDarkMode ? '#fafafa' : '#1e293b', lineHeight: 15 }}>
                Grocery
              </Text>
              <Text allowFontScaling={false} style={{ fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5, color: '#64748b', textTransform: 'uppercase' }}>
                FAST DELIVERY
              </Text>
            </View>
          </Pressable>

          {/* Food Segment (Active) */}
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              borderRadius: 21,
              backgroundColor: '#ea580c',
              gap: 8,
              shadowColor: '#ea580c',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Utensils size={18} color="#ffffff" strokeWidth={2.2} />
            <View>
              <Text allowFontScaling={false} style={{ fontSize: 13, fontWeight: '900', color: '#ffffff', lineHeight: 15 }}>
                Food
              </Text>
              <Text allowFontScaling={false} style={{ fontSize: 7.5, fontWeight: '900', letterSpacing: 0.5, color: '#fde047', textTransform: 'uppercase' }}>
                CAFE & RESTAURANT
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* ═══ RESTAURANTS HEADER ═══ */}
      <View style={styles.resultsHeader}>
        <Flame size={16} color="#e20a22" fill="#e20a22" strokeWidth={0} />
        <Text
          style={[
            styles.resultsTitle,
            { color: isDarkMode ? '#fafafa' : '#0f172a' },
          ]}
        >
          {filtered.length} restaurants near you
        </Text>
      </View>

      {/* ═══ RESTAURANT SKELETON LOADER / CARDS ═══ */}
      {isLoading ? (
        <View style={{ paddingHorizontal: responsive.spacing.page, gap: 14, paddingTop: 12 }}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={{
                height: 180,
                borderRadius: 16,
                backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
                overflow: 'hidden',
                borderWidth: 1,
                borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
              }}
            >
              <View style={{ height: 110, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0' }} />
              <View style={{ padding: 12, gap: 6 }}>
                <View style={{ height: 16, width: '60%', backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', borderRadius: 4 }} />
                <View style={{ height: 12, width: '40%', backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0', borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={{ fontSize: 42 }}>🍽️</Text>
          <Text
            style={[
              styles.emptyTitle,
              { color: isDarkMode ? '#fafafa' : '#0f172a' },
            ]}
          >
            No restaurants found
          </Text>
          <Text
            style={[
              styles.emptyText,
              { color: isDarkMode ? '#a1a1aa' : '#64748b' },
            ]}
          >
            Try a different search
          </Text>
          {search && (
            <Pressable
              onPress={() => setSearch('')}
              style={[styles.clearBtn, { backgroundColor: '#fff5ec' }]}
            >
              <Text style={{ color: '#c81d2c', fontWeight: '800', fontSize: 13 }}>
                Clear search
              </Text>
            </Pressable>
          )}
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#e20a22"
              colors={['#e20a22', '#c81d2c', '#e20a22']}
              progressBackgroundColor={isDarkMode ? '#18181b' : '#ffffff'}
            />
          }
          contentContainerStyle={{
            paddingTop: 4,
            paddingHorizontal: responsive.isLargeScreen ? 0 : responsive.spacing.page,
            paddingBottom: insets.bottom + 90,
            ...getCenteredContainerStyle(responsive),
          }}
        >
          {isGrid ? (
            /* ── Tablet/Desktop: 2-column grid ── */
            <View style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              paddingHorizontal: responsive.spacing.page,
              gap: responsive.spacing.card,
            }}>
              {filtered.map((r, i) => (
                <View key={r.id} style={{
                  width: '48%',
                  maxWidth: 420,
                }}>
                  <Animated.View entering={FadeInDown.delay(Math.min(i, 8) * 50).duration(350)}>
                    <RestaurantCard
                      restaurant={r}
                      index={i}
                      onPress={() => handleOpenRestaurant(r)}
                      isGrid={isGrid}
                    />
                  </Animated.View>
                </View>
              ))}
            </View>
          ) : (
            /* ── Phone: single column ── */
            <>
              {filtered.map((r, i) => (
                <Animated.View
                  key={r.id}
                  entering={FadeInDown.delay(Math.min(i, 8) * 50).duration(350)}
                >
                  <RestaurantCard
                    restaurant={r}
                    index={i}
                    onPress={() => handleOpenRestaurant(r)}
                  />
                </Animated.View>
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  /* ── Header ── */
  header: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginLeft: 10,
  },

  /* ── Search bar ── */
  searchWrap: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontWeight: '600', padding: 0 },
  clearSearchBtn: { padding: 4 },
  clearSearchText: { fontSize: 14, fontWeight: '600' },

  /* ── Results header ── */
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 4,
  },
  resultsTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },

  /* ── States ── */
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: { marginTop: 10, fontSize: 13, fontWeight: '700' },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: { marginTop: 12, fontSize: 17, fontWeight: '900' },
  emptyText: { marginTop: 4, fontSize: 13, fontWeight: '600' },
  clearBtn: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
});
