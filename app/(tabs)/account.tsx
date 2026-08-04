import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, Platform, StyleSheet, TouchableOpacity, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { User, LogIn, LogOut, ShoppingBag, MapPin, Settings, HelpCircle, PhoneCall, ShieldCheck, Edit3, Save, X, Moon, Sun, ChevronRight, ChevronDown, Search, Package, ChefHat, Truck, Coffee } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { useTheme } from '../context/ThemeContext';
import { ScalePressable } from '../../components/shared/ScalePressable';
import { useUIStore } from '../../stores/ui-store';
import Logo from '../../components/shared/Logo';
import { API_BASE_URL, SUPPORT_PHONE } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptic';
import { LinearGradient } from 'expo-linear-gradient';
import { formatHeaderAddress } from '../../lib/utils';
import { THEME } from '../../lib/theme';
import { useScrollTabBar } from '../../hooks/use-scroll-tab-bar';
import BrandedTopHeader from '../../components/shared/BrandedTopHeader';

export default function AccountScreen() {
  const { isLoggedIn, user, token, setAuth, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
  const { onScroll: onTabBarScroll, onTouchStart: onTabBarTouchStart } = useScrollTabBar();
  const selectedLocation = useUIStore((s) => s.selectedLocation);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState<'name' | 'phone' | null>(null);
  const [showFaqModal, setShowFaqModal] = useState(false);

  const FAQ_ITEMS = [
    { q: 'What payment methods are supported?', a: 'We accept UPI (PhonePe, Google Pay, Paytm), Cash on Delivery (COD), and Net Banking.', icon: '💳' },
    { q: 'What if an item is missing or damaged?', a: 'Please call customer support immediately. We provide instant replacement or refund.', icon: '📦' },
    { q: 'What are the store operating hours?', a: 'FastKirana Dark Store & Cafe operate every day from 6:00 AM to 12:00 AM (Midnight).', icon: '🕒' },
    { q: 'Are there any delivery charges?', a: 'Delivery is 100% FREE for orders above ₹199. A nominal fee of ₹25 applies for smaller orders.', icon: '🚚' },
    { q: 'Can I order food & groceries together?', a: 'Yes! You can add dark store grocery items and hot Wedson Restaurant meals in a single cart order.', icon: '🍱' },
    { q: 'How do I track my order?', a: 'Go to "My Orders" in the app to track your delivery in real-time with live status updates.', icon: '📍' },
  ];

  const getAuthHeaders = (): Record<string, string> => {
    if (!token || !user) return {};
    return {
      'Content-Type': 'application/json',
      'x-user-id': user.id,
      'x-user-role': user.role,
      'x-user-email': user.email || '',
      'x-user-name': user.name || '',
      'x-user-phone': user.phone || '',
    };
  };

  const handleEditToggle = () => {
    triggerHaptic('light');
    if (!isEditing) {
      setEditName(user?.name || '');
      setEditPhone(user?.phone || '');
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'Name is required.');
      return;
    }
    if (!editPhone.trim() || editPhone.replace(/\D/g, '').length < 10) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsSaving(true);
    triggerHaptic('medium');

    try {
      const res = await fetch(`${API_BASE_URL}/profile/setup`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: editName.trim(),
          phone: editPhone.trim(),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (user && token) {
          setAuth(token, {
            ...user,
            name: editName.trim(),
            phone: editPhone.trim(),
          });
        }
        triggerHaptic('success');
        Alert.alert('Success', 'Profile updated successfully!');
        setIsEditing(false);
      } else {
        Alert.alert('Error', data.error || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Network request failed. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    triggerHaptic('light');
    setIsLogoutModalVisible(true);
  };

  const formatEmailForDisplay = (email: string) => {
    if (!email) return '';
    const lowerEmail = email.toLowerCase().trim();
    if (lowerEmail.endsWith('@fastkirana.com')) {
      const prefix = lowerEmail.split('@')[0];
      const phoneDigits = prefix.replace('wa-', '');
      if (/^\d{10}$/.test(phoneDigits)) {
        return `+91 ${phoneDigits}`;
      }
      if (prefix === 'help') return email;
      return prefix;
    }
    return email;
  };

  const sectionTitleStyle = { color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.black, letterSpacing: 0.5, textTransform: 'uppercase' as const };
  const cardSubtitleStyle = (iconColor: string) => ({ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.semibold, marginTop: 3 });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {/* Premium Header */}
      <View
        style={{
          width: '100%',
          backgroundColor: colors.background,
          zIndex: 50,
          borderBottomWidth: 1,
          borderColor: colors.borderLight,
        }}
      >
        <View style={{ paddingHorizontal: THEME.SPACING.lg, paddingTop: THEME.SPACING.sm, paddingBottom: THEME.SPACING.sm }}>
          <BrandedTopHeader style={{ paddingHorizontal: 0, paddingVertical: 0, borderBottomWidth: 0 }} />

          {/* Search Box */}
          <Pressable
            onPress={() => {
              triggerHaptic('light');
              router.push('/search');
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: THEME.RADIUS.pill,
              paddingHorizontal: THEME.SPACING.lg,
              height: 44,
              marginTop: THEME.SPACING.sm,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: isDarkMode ? 0.1 : 0.02,
              shadowRadius: 2,
              elevation: 1
            }}
          >
            <Search size={16} color={THEME.COLORS.brand.primary} style={{ marginRight: THEME.SPACING.sm }} />
            <Text style={{ flex: 1, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, color: colors.textSecondary, fontWeight: THEME.TYPOGRAPHY.weights.semibold }}>
              Search for products...
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        onScroll={onTabBarScroll}
        onTouchStart={onTabBarTouchStart}
        scrollEventThrottle={16}
      >
        {/* Profile Card Header */}
        <View style={{ paddingHorizontal: THEME.SPACING.lg, paddingTop: THEME.SPACING.lg, paddingBottom: THEME.SPACING.lg }}>
          <View
            style={{
              borderRadius: THEME.RADIUS.xl,
              borderWidth: 1,
              borderColor: isDarkMode ? colors.border : THEME.COLORS.brand.primaryLight,
              shadowColor: THEME.COLORS.brand.primary,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDarkMode ? 0.2 : 0.04,
              shadowRadius: 16,
              elevation: 3,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <LinearGradient
              colors={isDarkMode ? [`${THEME.COLORS.brand.primary}26`, colors.surface] : [THEME.COLORS.brand.primaryLight, colors.surface]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ padding: THEME.SPACING.lg, zIndex: 10 }}>
              {isLoggedIn && user ? (
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.md, flex: 1 }}>
                      {/* Premium Sleek Avatar */}
                      <View style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: colors.surfaceElevated,
                        borderWidth: 1,
                        borderColor: colors.border,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <User size={24} color={colors.textSecondary} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Pressable onPress={handleEditToggle}>
                          <Text style={{ color: colors.textPrimary, fontSize: THEME.TYPOGRAPHY.sizes.titleSm, fontWeight: THEME.TYPOGRAPHY.weights.black, letterSpacing: -0.4 }}>
                            {user?.name || 'FastKirana User'}
                          </Text>
                        </Pressable>
                        <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.medium, marginTop: 2 }}>
                          {formatEmailForDisplay(user?.email || '')}
                        </Text>

                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: THEME.SPACING.sm }}>
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            backgroundColor: isDarkMode ? `${THEME.COLORS.brand.error}1A` : `${THEME.COLORS.brand.primary}12`,
                            borderWidth: 1,
                            borderColor: isDarkMode ? `${THEME.COLORS.brand.error}35` : `${THEME.COLORS.brand.primary}20`,
                            paddingHorizontal: THEME.SPACING.sm,
                            paddingVertical: THEME.SPACING.xs,
                            borderRadius: THEME.RADIUS.pill,
                            alignSelf: 'flex-start'
                          }}>
                            <ShieldCheck size={11} color={THEME.COLORS.brand.error} />
                            <Text style={{ color: THEME.COLORS.brand.error, fontSize: THEME.TYPOGRAPHY.sizes.micro - 1, fontWeight: THEME.TYPOGRAPHY.weights.black, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                              {user?.role || 'user'} Member
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    <Pressable
                      onPress={handleEditToggle}
                      style={({ pressed }) => [{
                        transform: [{ scale: pressed ? 0.92 : 1 }],
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: colors.surfaceElevated,
                        borderWidth: 1,
                        borderColor: colors.border,
                        justifyContent: 'center',
                        alignItems: 'center'
                      }]}
                    >
                      <Edit3 size={15} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'column', width: '100%', gap: THEME.SPACING.md }}>
                  <View>
                    <Text style={{ color: colors.textPrimary, fontSize: THEME.TYPOGRAPHY.sizes.heroSm, fontWeight: THEME.TYPOGRAPHY.weights.black, letterSpacing: -0.5 }}>
                      Welcome to FastKirana
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.medium, marginTop: THEME.SPACING.sm, lineHeight: 18 }}>
                      Log in to view order history, track deliveries, and manage your delivery addresses.
                    </Text>
                  </View>
                  <ScalePressable
                    onPress={() => {
                      router.push('/(auth)/login');
                    }}
                    scaleValue={0.96}
                    haptic="medium"
                    style={{
                      width: '100%',
                      borderRadius: THEME.RADIUS.lg,
                      overflow: 'hidden',
                      elevation: 3,
                      shadowColor: THEME.COLORS.brand.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      position: 'relative'
                    }}
                  >
                    <LinearGradient
                      colors={[THEME.COLORS.brand.primary, THEME.COLORS.brand.primaryDark]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{ width: '100%', paddingVertical: THEME.SPACING.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                    >
                      <LogIn size={15} color="#ffffff" strokeWidth={2.5} />
                      <Text style={{ color: '#ffffff', fontWeight: THEME.TYPOGRAPHY.weights.extrabold, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Login
                      </Text>
                    </LinearGradient>
                  </ScalePressable>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Quick Action Cards Grid */}
        <View style={{ paddingHorizontal: THEME.SPACING.lg, marginBottom: THEME.SPACING.lg }}>
          <Text style={{ ...sectionTitleStyle, color: colors.textPrimary, textTransform: 'none', letterSpacing: -0.2 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: THEME.SPACING.md, marginTop: THEME.SPACING.md }}>
            {/* My Orders */}
            <Pressable
              onPress={() => isLoggedIn ? router.push('/orders') : router.push('/(auth)/login')}
              style={{
                width: '48%',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: THEME.RADIUS.lg,
                paddingVertical: THEME.SPACING.lg,
                paddingHorizontal: THEME.SPACING.sm,
                alignItems: 'center',
                ...Platform.select({
                  ios: {
                    shadowColor: THEME.COLORS.brand.primary,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDarkMode ? 0.25 : 0.04,
                    shadowRadius: 12,
                  },
                  android: {
                    elevation: 2,
                  }
                })
              }}
            >
              <LinearGradient
                colors={[THEME.COLORS.brand.primary, THEME.COLORS.brand.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: THEME.RADIUS.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: THEME.COLORS.brand.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 3
                }}
              >
                <ShoppingBag size={20} color="#ffffff" strokeWidth={2.2} />
              </LinearGradient>
              <Text style={{ color: colors.textPrimary, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, marginTop: THEME.SPACING.md, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                My Orders
              </Text>
              <Text style={{ ...cardSubtitleStyle(colors.textSecondary), color: colors.textSecondary }}>
                Order History
              </Text>
            </Pressable>

            {/* Saved Addresses */}
            <Pressable
              onPress={() => isLoggedIn ? router.push('/addresses') : router.push('/(auth)/login')}
              style={{
                width: '48%',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: THEME.RADIUS.lg,
                paddingVertical: THEME.SPACING.lg,
                paddingHorizontal: THEME.SPACING.sm,
                alignItems: 'center',
                ...Platform.select({
                  ios: {
                    shadowColor: THEME.COLORS.brand.success,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDarkMode ? 0.25 : 0.04,
                    shadowRadius: 12,
                  },
                  android: {
                    elevation: 2,
                  }
                })
              }}
            >
              <LinearGradient
                colors={[THEME.COLORS.brand.success, THEME.COLORS.brand.successDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: THEME.RADIUS.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: THEME.COLORS.brand.success,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 3
                }}
              >
                <MapPin size={20} color="#ffffff" strokeWidth={2.2} />
              </LinearGradient>
              <Text style={{ color: colors.textPrimary, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, marginTop: THEME.SPACING.md, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Addresses
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.medium, marginTop: 3 }}>
                Manage Locations
              </Text>
            </Pressable>

            {/* Contact Support */}
            <Pressable
              onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => Alert.alert('Support', `Call us at ${SUPPORT_PHONE}`))}
              style={{
                width: '48%',
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: THEME.RADIUS.lg,
                paddingVertical: THEME.SPACING.lg,
                paddingHorizontal: THEME.SPACING.sm,
                alignItems: 'center',
                ...Platform.select({
                  ios: {
                    shadowColor: THEME.COLORS.brand.accent,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: isDarkMode ? 0.25 : 0.04,
                    shadowRadius: 12,
                  },
                  android: {
                    elevation: 2,
                  }
                })
              }}
            >
              <LinearGradient
                colors={[THEME.COLORS.brand.accent, THEME.COLORS.brand.accentDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: THEME.RADIUS.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: THEME.COLORS.brand.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 3
                }}
              >
                <PhoneCall size={20} color="#ffffff" strokeWidth={2.2} />
              </LinearGradient>
              <Text style={{ color: colors.textPrimary, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, marginTop: THEME.SPACING.md, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Support
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.medium, marginTop: 3 }}>
                Instant Call Support
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Staff Operations Console Banner */}
        {isLoggedIn && user && user.role !== 'USER' && (
          <View style={{ paddingHorizontal: THEME.SPACING.lg, marginBottom: THEME.SPACING.lg }}>
            {user.role === 'ADMIN' ? (
              <View style={{ gap: THEME.SPACING.md }}>
                <Text style={{ color: colors.textSecondary, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.micro, textTransform: 'uppercase', letterSpacing: 0.8, paddingLeft: 4, marginBottom: THEME.SPACING.xs }}>
                  Admin Control Hub
                </Text>

                {[
                  { route: '/operations', icon: ShieldCheck, label: 'Operations Console', sub: 'Store configuration & live analytics', color: THEME.COLORS.brand.primary, bg: isDarkMode ? 'rgba(99,102,241,0.12)' : '#e0e7ff' },
                  { route: '/picker', icon: Package, label: 'Picker Console', sub: 'Packhouse inventory & dispatch queue', color: THEME.COLORS.brand.accent, bg: isDarkMode ? 'rgba(217,119,6,0.12)' : '#fef3c7' },
                  { route: '/rider', icon: Truck, label: 'Rider Console', sub: 'Delivery dispatch list & location tracking', color: '#8b5cf6', bg: isDarkMode ? 'rgba(139,92,246,0.12)' : '#f3e8ff' },
                  { route: '/restaurant-chef', icon: ChefHat, label: 'Restaurant Console', sub: 'Food prep & kitchen cooking queue', color: THEME.COLORS.brand.primary, bg: isDarkMode ? 'rgba(226,10,34,0.12)' : '#fff1f2' },
                ].map((item) => (
                  <Pressable
                    key={item.route}
                    onPress={() => {
                      triggerHaptic('medium');
                      router.push(item.route as any);
                    }}
                    style={({ pressed }) => [{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: THEME.SPACING.md,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      borderRadius: THEME.RADIUS.lg,
                      backgroundColor: colors.surface,
                      opacity: pressed ? 0.92 : 1,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDarkMode ? 0.15 : 0.02,
                      shadowRadius: 8,
                      elevation: 2,
                    }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm, flex: 1, paddingRight: THEME.SPACING.sm }}>
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: THEME.RADIUS.sm,
                        backgroundColor: item.bg,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <item.icon size={18} color={item.color} strokeWidth={2.5} />
                      </View>
                      <View style={{ flex: 1, flexShrink: 1 }}>
                        <Text style={{ color: colors.textPrimary, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.bodySm }}>
                          {item.label}
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.medium, marginTop: 2 }} numberOfLines={1}>
                          {item.sub}
                        </Text>
                      </View>
                    </View>
                    <ChevronRight size={14} color={colors.textMuted} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View
                style={{
                  borderRadius: THEME.RADIUS.xl,
                  padding: 1.5,
                  shadowColor: THEME.COLORS.brand.primary,
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: isDarkMode ? 0.25 : 0.08,
                  shadowRadius: 16,
                  elevation: 3
                }}
              >
                <LinearGradient
                  colors={isDarkMode ? [THEME.COLORS.brand.primary, '#312e81'] : [THEME.COLORS.brand.primary, THEME.COLORS.brand.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ borderRadius: THEME.RADIUS.xl - 1.5, overflow: 'hidden' }}
                >
                  <Pressable
                    onPress={() => {
                      triggerHaptic('medium');
                      const role = user.role;
                      if (role === 'PICKER') router.push('/picker');
                      else if (role === 'CHEF' || role === 'RESTAURANT_OWNER') router.push('/restaurant-chef');
                      else if (role === 'DELIVERY') router.push('/rider');
                      else router.push('/operations');
                    }}
                    style={({ pressed }) => ({
                      backgroundColor: colors.surface,
                      borderRadius: THEME.RADIUS.xl - 3,
                      padding: THEME.SPACING.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: pressed ? 0.92 : 1
                    })}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm }}>
                      <View style={{
                        width: 40,
                        height: 40,
                        borderRadius: THEME.RADIUS.sm,
                        backgroundColor: isDarkMode ? `${THEME.COLORS.brand.primary}2A` : THEME.COLORS.brand.primaryLight,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <ShieldCheck size={20} color={THEME.COLORS.brand.primary} strokeWidth={2.5} />
                      </View>
                      <View>
                        <Text style={{ color: colors.textPrimary, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.bodySm, letterSpacing: -0.2 }}>
                          Operations Console
                        </Text>
                        <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.medium, marginTop: 2 }}>
                          Manage tasks & store controls
                        </Text>
                      </View>
                    </View>
                    <View style={{
                      backgroundColor: THEME.COLORS.brand.primary,
                      paddingHorizontal: THEME.SPACING.md,
                      paddingVertical: THEME.SPACING.xs,
                      borderRadius: THEME.RADIUS.sm,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      <Text style={{ color: '#ffffff', fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.micro - 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        {user.role} Console
                      </Text>
                      <ChevronRight size={11} color="#ffffff" strokeWidth={2.5} />
                    </View>
                  </Pressable>
                </LinearGradient>
              </View>
            )}
          </View>
        )}

        {/* Menu Options Group Card */}
        <View style={{ paddingHorizontal: THEME.SPACING.lg, marginBottom: THEME.SPACING.xxl }}>
          <View style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
            borderRadius: THEME.RADIUS.xl,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.15 : 0.03,
            shadowRadius: 12,
            elevation: 2
          }}>
            {/* App Settings */}
            <Pressable
              onPress={() => Alert.alert('Settings', 'Settings screen coming soon!')}
              style={({ pressed }) => [{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: THEME.SPACING.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
                backgroundColor: pressed ? (isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc') : colors.surface,
              }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm }}>
                <LinearGradient
                  colors={[THEME.COLORS.brand.primaryLight, THEME.COLORS.brand.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: THEME.RADIUS.sm,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Settings size={18} color={THEME.COLORS.brand.primary} strokeWidth={2.2} />
                </LinearGradient>
                <View>
                  <Text style={{ color: colors.textPrimary, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.bodySm }}>
                    App Settings
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.medium, marginTop: 2 }}>
                    Preferences and settings
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={2.5} />
            </Pressable>

            {/* Help & FAQs */}
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                setShowFaqModal(true);
              }}
              style={({ pressed }) => [{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: THEME.SPACING.md,
                borderBottomWidth: isLoggedIn ? 1 : 0,
                borderBottomColor: colors.borderLight,
                backgroundColor: pressed ? (isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc') : colors.surface,
              }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm }}>
                <LinearGradient
                  colors={[THEME.COLORS.brand.accentLight, THEME.COLORS.brand.accentDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: THEME.RADIUS.sm,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <HelpCircle size={18} color={THEME.COLORS.brand.accent} strokeWidth={2.2} />
                </LinearGradient>
                <View>
                  <Text style={{ color: colors.textPrimary, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.bodySm }}>
                    Help & FAQs
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.medium, marginTop: 2 }}>
                    Instant answers & support helpline
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={colors.textMuted} strokeWidth={2.5} />
            </Pressable>

            {/* Theme Toggle */}
            <Pressable
              onPress={() => {
                triggerHaptic('light');
                toggleTheme();
              }}
              style={({ pressed }) => [{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: THEME.SPACING.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.borderLight,
                backgroundColor: pressed ? (isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc') : colors.surface,
              }]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm }}>
                <LinearGradient
                  colors={[isDarkMode ? '#fef3c7' : '#c7d2fe', isDarkMode ? '#fde68a' : '#a5b4fc']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: THEME.RADIUS.sm,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isDarkMode ? (
                    <Sun size={18} color="#d97706" strokeWidth={2.2} />
                  ) : (
                    <Moon size={18} color="#6366f1" strokeWidth={2.2} />
                  )}
                </LinearGradient>
                <View>
                  <Text style={{ color: colors.textPrimary, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.bodySm }}>
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.medium, marginTop: 2 }}>
                    {isDarkMode ? 'Switch to light theme' : 'Switch to dark theme'}
                  </Text>
                </View>
              </View>
              <View style={{
                width: 44,
                height: 26,
                borderRadius: 13,
                backgroundColor: isDarkMode ? THEME.COLORS.brand.warning : colors.border,
                justifyContent: 'center',
                alignItems: isDarkMode ? 'flex-end' : 'flex-start',
                paddingHorizontal: 3,
                borderWidth: 1,
                borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : colors.borderLight,
              }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: '#ffffff',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.15,
                  shadowRadius: 2,
                  elevation: 2,
                }} />
              </View>
            </Pressable>

            {/* Logout Row */}
            {isLoggedIn && (
              <Pressable
                onPress={handleLogout}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: THEME.SPACING.md,
                  backgroundColor: pressed ? `${THEME.COLORS.brand.error}0A` : colors.surface,
                })}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm, flex: 1 }}>
                  <LinearGradient
                    colors={[THEME.COLORS.brand.errorLight, THEME.COLORS.brand.error]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: THEME.RADIUS.sm,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <LogOut size={18} color="#ffffff" strokeWidth={2.2} />
                  </LinearGradient>
                  <View>
                    <Text style={{ color: THEME.COLORS.brand.error, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.bodySm }}>
                      Logout
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.medium, marginTop: 2 }}>
                      Sign out from your account
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color={THEME.COLORS.brand.error} strokeWidth={2.5} />
              </Pressable>
            )}
          </View>
        </View>

        {/* App Version Info */}
        <View style={{ alignItems: 'center', marginBottom: THEME.SPACING.xxl, marginTop: THEME.SPACING.xs }}>
          <View style={{ height: 1, backgroundColor: colors.borderLight, width: '80%', marginBottom: THEME.SPACING.lg }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.titleSm }}>⚡</Text>
            <Text style={{ color: colors.textSecondary, fontWeight: THEME.TYPOGRAPHY.weights.black, fontSize: THEME.TYPOGRAPHY.sizes.caption, letterSpacing: 2 }}>
              FASTKIRANA
            </Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.bold, marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Version 1.0.0 (Expo SDK 56)
          </Text>
        </View>
      </ScrollView>

      {/* Premium Logout Modal */}
      <Modal
        visible={isLogoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: THEME.SPACING.lg
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: isDarkMode ? colors.border : THEME.COLORS.brand.errorLight,
            borderRadius: THEME.RADIUS.xxl,
            width: '100%',
            maxWidth: 320,
            padding: THEME.SPACING.lg,
            alignItems: 'center',
            shadowColor: THEME.COLORS.brand.error,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDarkMode ? 0.35 : 0.08,
            shadowRadius: 24,
            elevation: 8,
          }}>
            {/* Warning Circle Icon */}
            <LinearGradient
              colors={[THEME.COLORS.brand.errorLight, '#fecdd3']}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: THEME.SPACING.md
              }}
            >
              <LogOut size={28} color={THEME.COLORS.brand.error} strokeWidth={2.5} />
            </LinearGradient>

            {/* Title */}
            <Text style={{
              color: colors.textPrimary,
              fontWeight: THEME.TYPOGRAPHY.weights.black,
              fontSize: THEME.TYPOGRAPHY.sizes.title,
              textAlign: 'center',
              marginBottom: THEME.SPACING.sm
            }}>
              Logout Account
            </Text>

            {/* Description */}
            <Text style={{
              color: colors.textSecondary,
              fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
              fontWeight: THEME.TYPOGRAPHY.weights.semibold,
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: THEME.SPACING.lg
            }}>
              Are you sure you want to log out from FastKirana? You will need to sign in again to access your orders and settings.
            </Text>

            {/* Action Buttons Row */}
            <View style={{
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: THEME.SPACING.md,
              gap: THEME.SPACING.md
            }}>
              {/* Cancel Button */}
              <ScalePressable
                onPress={() => {
                  setIsLogoutModalVisible(false);
                }}
                scaleValue={0.96}
                haptic="light"
                style={{
                  flex: 1,
                  height: 46,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: THEME.RADIUS.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{
                  color: colors.textSecondary,
                  fontWeight: THEME.TYPOGRAPHY.weights.black,
                  fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Cancel
                </Text>
              </ScalePressable>

              {/* Logout Button */}
              <ScalePressable
                onPress={() => {
                  setIsLogoutModalVisible(false);
                  logout();
                }}
                scaleValue={0.96}
                haptic="medium"
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: THEME.RADIUS.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: THEME.COLORS.brand.error,
                  shadowColor: THEME.COLORS.brand.error,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontWeight: THEME.TYPOGRAPHY.weights.black,
                  fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Logout
                </Text>
              </ScalePressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Profile Modal */}
      <Modal
        visible={isEditing}
        transparent={true}
        animationType="fade"
        onRequestClose={handleEditToggle}
      >
        <View style={{
          flex: 1,
          backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.55)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: THEME.SPACING.lg
        }}>
          <View style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: isDarkMode ? colors.border : THEME.COLORS.brand.errorLight,
            borderRadius: THEME.RADIUS.xxl,
            width: '100%',
            maxWidth: 340,
            padding: THEME.SPACING.lg,
            shadowColor: THEME.COLORS.brand.primary,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDarkMode ? 0.35 : 0.08,
            shadowRadius: 24,
            elevation: 8,
          }}>
            {/* Header Icon */}
            <View style={{ alignItems: 'center', marginBottom: THEME.SPACING.md }}>
              <LinearGradient
                colors={isDarkMode ? [`${THEME.COLORS.brand.primary}30`, `${THEME.COLORS.brand.primary}15`] : [THEME.COLORS.brand.primaryLight, THEME.COLORS.brand.errorLight]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDarkMode ? `${THEME.COLORS.brand.primary}30` : '#fecdd3'
                }}
              >
                <User size={24} color={THEME.COLORS.brand.primary} strokeWidth={2.5} />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={{
              color: colors.textPrimary,
              fontWeight: THEME.TYPOGRAPHY.weights.black,
              fontSize: THEME.TYPOGRAPHY.sizes.title,
              textAlign: 'center',
              marginBottom: THEME.SPACING.lg,
              letterSpacing: -0.3
            }}>
              Edit Profile
            </Text>

            {/* Full Name Input */}
            <View style={{ gap: THEME.SPACING.xs, marginBottom: THEME.SPACING.md }}>
              <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Full Name
              </Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                onFocus={() => setFocusedInput('name')}
                onBlur={() => setFocusedInput(null)}
                placeholder="Enter your name"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderWidth: 1.5,
                  borderColor: focusedInput === 'name'
                    ? THEME.COLORS.brand.primary
                    : colors.border,
                  borderRadius: THEME.RADIUS.md,
                  paddingHorizontal: THEME.SPACING.md,
                  paddingVertical: THEME.SPACING.sm,
                  color: colors.textPrimary,
                  fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
                  fontWeight: THEME.TYPOGRAPHY.weights.semibold
                }}
              />
            </View>

            {/* Phone Number Input */}
            <View style={{ gap: THEME.SPACING.xs, marginBottom: THEME.SPACING.lg }}>
              <Text style={{ color: colors.textSecondary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.black, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Phone Number
              </Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                onFocus={() => setFocusedInput('phone')}
                onBlur={() => setFocusedInput(null)}
                keyboardType="phone-pad"
                placeholder="Enter 10-digit mobile"
                placeholderTextColor={colors.textMuted}
                style={{
                  backgroundColor: colors.surfaceElevated,
                  borderWidth: 1.5,
                  borderColor: focusedInput === 'phone'
                    ? THEME.COLORS.brand.primary
                    : colors.border,
                  borderRadius: THEME.RADIUS.md,
                  paddingHorizontal: THEME.SPACING.md,
                  paddingVertical: THEME.SPACING.sm,
                  color: colors.textPrimary,
                  fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
                  fontWeight: THEME.TYPOGRAPHY.weights.semibold
                }}
              />
            </View>

            {/* Actions Row */}
            <View style={{
              flexDirection: 'row',
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: THEME.SPACING.md
            }}>
              {/* Cancel Button */}
              <ScalePressable
                onPress={handleEditToggle}
                scaleValue={0.96}
                haptic="light"
                style={{
                  flex: 1,
                  height: 46,
                  borderWidth: 1.5,
                  borderColor: colors.border,
                  borderRadius: THEME.RADIUS.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surface,
                }}
              >
                <Text style={{
                  color: colors.textSecondary,
                  fontWeight: THEME.TYPOGRAPHY.weights.black,
                  fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Cancel
                </Text>
              </ScalePressable>

              {/* Save Button */}
              <ScalePressable
                onPress={handleSaveProfile}
                disabled={isSaving}
                scaleValue={0.96}
                haptic="medium"
                style={{
                  flex: 1,
                  height: 46,
                  borderRadius: THEME.RADIUS.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: THEME.COLORS.brand.primary,
                  flexDirection: 'row',
                  gap: 6,
                  shadowColor: THEME.COLORS.brand.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Save size={15} color="#ffffff" strokeWidth={2.5} />
                    <Text style={{
                      color: '#ffffff',
                      fontWeight: THEME.TYPOGRAPHY.weights.black,
                      fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5
                    }}>
                      Save
                    </Text>
                  </>
                )}
              </ScalePressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Help & FAQs Interactive Modal */}
      <Modal
        visible={showFaqModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFaqModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
          <View style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: THEME.RADIUS.xl,
            borderTopRightRadius: THEME.RADIUS.xl,
            maxHeight: '85%',
            padding: THEME.SPACING.lg,
            borderWidth: 1,
            borderColor: colors.borderLight,
          }}>
            {/* Header */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: THEME.SPACING.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, paddingBottom: THEME.SPACING.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isDarkMode ? `${THEME.COLORS.brand.accent}24` : THEME.COLORS.brand.accentLight, alignItems: 'center', justifyContent: 'center' }}>
                  <HelpCircle size={20} color={THEME.COLORS.brand.accent} />
                </View>
                <View>
                  <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.titleSm, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary }}>Help & FAQs</Text>
                  <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: colors.textMuted }}>FastKirana Support Center</Text>
                </View>
              </View>
              <Pressable
                onPress={() => setShowFaqModal(false)}
                style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceElevated, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }}
              >
                <X size={18} color={colors.textPrimary} />
              </Pressable>
            </View>

            {/* FAQs List */}
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginBottom: THEME.SPACING.md }}>
              {FAQ_ITEMS.map((faq, idx) => {
                const isExpanded = false;
                return (
                  <View
                    key={idx}
                    style={{
                      backgroundColor: colors.surfaceElevated,
                      borderRadius: THEME.RADIUS.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      marginBottom: THEME.SPACING.sm,
                      overflow: 'hidden',
                    }}
                  >
                    <Pressable
                      onPress={() => {
                        triggerHaptic('light');
                      }}
                      style={{
                        padding: THEME.SPACING.md,
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm, flex: 1, paddingRight: THEME.SPACING.sm }}>
                        <Text style={{ fontSize: 16 }}>{faq.icon}</Text>
                        <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.black, color: colors.textPrimary, flex: 1 }}>{faq.q}</Text>
                      </View>
                      <ChevronDown size={16} color={colors.textMuted} />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>

            {/* Direct Support Call Footer */}
            <View style={{ gap: THEME.SPACING.sm }}>
              <Pressable
                onPress={() => {
                  setShowFaqModal(false);
                  Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {});
                }}
                style={{
                  backgroundColor: THEME.COLORS.brand.primary,
                  borderRadius: THEME.RADIUS.md,
                  paddingVertical: THEME.SPACING.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 8,
                  shadowColor: THEME.COLORS.brand.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <PhoneCall size={16} color="#ffffff" strokeWidth={2.5} />
                <Text style={{ color: '#ffffff', fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.black, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Call Customer Support ({SUPPORT_PHONE})
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loginBtnContainer: {
    width: '100%',
    backgroundColor: THEME.COLORS.brand.primary,
    borderRadius: THEME.RADIUS.lg,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: THEME.COLORS.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loginBtnPressable: {
    width: '100%',
    paddingVertical: THEME.SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: '#ffffff',
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
