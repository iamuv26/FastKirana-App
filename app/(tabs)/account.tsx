import { View, Text, ScrollView, Pressable, TextInput, ActivityIndicator, Alert, Platform, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { User, LogIn, LogOut, ShoppingBag, MapPin, Settings, HelpCircle, PhoneCall, ShieldCheck, Edit3, Save, X, Moon, Sun, ChevronRight, ChevronDown, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { useState } from 'react';
import { useAuthStore } from '../../stores/auth-store';
import { useTheme } from '../context/ThemeContext';
import { useUIStore } from '../../stores/ui-store';
import Logo from '../../components/shared/Logo';
import { API_BASE_URL } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptic';
import { LinearGradient } from 'expo-linear-gradient';
import { formatHeaderAddress } from '../../lib/utils';

export default function AccountScreen() {
  const { isLoggedIn, user, token, setAuth, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const selectedLocation = useUIStore((s) => s.selectedLocation);

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);

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
        // Update local auth store
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
    if (email.startsWith('wa-') && email.includes('@')) {
      const phoneDigits = email.split('@')[0].replace('wa-', '');
      return `+91 ${phoneDigits}`;
    }
    return email;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#09090b' : '#f8fafc' }}>
      <StatusBar style={isDarkMode ? "light" : "dark"} />
      {/* Premium Header */}
      <View 
        style={{
          width: '100%',
          backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
          zIndex: 50,
          borderBottomWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
          {/* Top Row: Location & Theme */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            {/* Left: Brand Logo & Text */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9', 
                padding: 4, 
                borderRadius: 8, 
                borderWidth: 1, 
                borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                flexShrink: 0
              }}>
                <Logo size={24} />
              </View>
              <View style={{ marginLeft: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: -0.5, lineHeight: 18 }}>
                  <Text style={{ color: isDarkMode ? '#fafafa' : '#0f172a' }}>Fast</Text>
                  <Text style={{ color: '#e20a22' }}>Kirana</Text>
                </Text>
                <Text style={{ fontSize: 7, fontWeight: '900', color: '#16a34a', letterSpacing: 0.3, marginTop: 0 }}>
                  DELIVERY APP
                </Text>
              </View>
            </View>

            {/* Right: Location Capsule Picker */}
            <Pressable 
              onPress={() => {
                triggerHaptic('light');
                router.push('/location-picker');
              }}
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
                maxWidth: '60%'
              })}
            >
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: isDarkMode ? 'rgba(226,10,34,0.1)' : '#fff5f5', 
                borderWidth: 1, 
                borderColor: isDarkMode ? 'rgba(226,10,34,0.25)' : '#fecdd3', 
                borderRadius: 20, 
                paddingHorizontal: 8, 
                paddingVertical: 5,
                justifyContent: 'center',
              }}>
                <MapPin size={11} color="#e20a22" style={{ flexShrink: 0, marginRight: 3 }} />
                <Text 
                  numberOfLines={1} 
                  style={{ 
                    fontSize: 10, 
                    fontWeight: 'bold', 
                    color: isDarkMode ? '#fafafa' : '#0f172a',
                    flexShrink: 1,
                    marginRight: 3
                  }}
                >
                  {formatHeaderAddress(selectedLocation)}
                </Text>
                <ChevronDown size={8} color={isDarkMode ? '#cbd5e1' : '#64748b'} style={{ flexShrink: 0 }} />
              </View>
            </Pressable>
          </View>

          {/* Bottom Row: Search Box Shortcut */}
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              router.push('/search');
            }}
            className="flex-row items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-full px-4 h-11 w-full active:scale-[0.99]"
            style={Platform.OS === 'ios' ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 4,
            } : Platform.OS === 'android' ? {
              elevation: 1,
            } : undefined}
          >
            <Search size={16} color="#e20a22" style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '500', flex: 1 }}>
              Search for products...
            </Text>
          </Pressable>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Profile Card Header with Gradient */}
        {/* Profile Card Header - Premium Minimal Design */}
        <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}>
          <View
            style={{
              borderRadius: 24,
              borderWidth: 1,
              borderColor: isDarkMode ? '#2d2d30' : '#ffe4e6',
              shadowColor: '#e20a22',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDarkMode ? 0.2 : 0.04,
              shadowRadius: 16,
              elevation: 3,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <LinearGradient
              colors={isDarkMode ? ['#1e1415', '#121214'] : ['#fff5f5', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ padding: 24, zIndex: 10 }}>
              {isLoggedIn && user ? (
                <View>
                  {!isEditing ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flex: 1 }}>
                        {/* Premium Sleek Avatar */}
                        <View style={{
                          width: 60,
                          height: 60,
                          borderRadius: 30,
                          backgroundColor: isDarkMode ? '#27272a' : '#f8fafc',
                          borderWidth: 1,
                          borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }}>
                          <User size={24} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{ color: isDarkMode ? '#ffffff' : '#0f172a', fontSize: 18, fontWeight: '900', letterSpacing: -0.4 }}>
                            {user.name || 'FastKirana User'}
                          </Text>
                          <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 12, fontWeight: '600', marginTop: 2 }}>
                            {formatEmailForDisplay(user.email || '')}
                          </Text>
                          
                          <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4.5,
                            backgroundColor: isDarkMode ? 'rgba(239,68,68,0.1)' : 'rgba(226,10,34,0.05)',
                            borderWidth: 1,
                            borderColor: isDarkMode ? 'rgba(239,68,68,0.25)' : 'rgba(226,10,34,0.12)',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 99,
                            marginTop: 8,
                            alignSelf: 'flex-start'
                          }}>
                            <ShieldCheck size={11} color={isDarkMode ? '#ef4444' : '#e20a22'} />
                            <Text style={{ color: isDarkMode ? '#ef4444' : '#e20a22', fontSize: 9.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                              {user.role} Member
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Pressable
                        onPress={handleEditToggle}
                        style={({ pressed }) => [{
                          transform: [{ scale: pressed ? 0.92 : 1 }],
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: isDarkMode ? '#27272a' : '#f8fafc',
                          borderWidth: 1,
                          borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
                          justifyContent: 'center',
                          alignItems: 'center'
                        }]}
                      >
                        <Edit3 size={15} color={isDarkMode ? '#d4d4d8' : '#64748b'} />
                      </Pressable>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'column', gap: 12 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: isDarkMode ? '#27272a' : '#f1f5f9', paddingBottom: 10 }}>
                        <Text style={{ color: isDarkMode ? '#ffffff' : '#0f172a', fontSize: 14, fontWeight: '800', letterSpacing: -0.2 }}>Edit Profile</Text>
                        <Pressable onPress={handleEditToggle} style={{ padding: 4 }}>
                          <X size={18} color={isDarkMode ? '#a1a1aa' : '#64748b'} />
                        </Pressable>
                      </View>

                      <View style={{ gap: 6 }}>
                        <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Full Name</Text>
                        <TextInput
                          value={editName}
                          onChangeText={setEditName}
                          placeholder="Enter your name"
                          placeholderTextColor={isDarkMode ? '#71717a' : '#94a3b8'}
                          style={{
                            backgroundColor: isDarkMode ? '#27272a' : '#f8fafc',
                            borderWidth: 1,
                            borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
                            borderRadius: 14,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            color: isDarkMode ? '#ffffff' : '#0f172a',
                            fontSize: 13,
                            fontWeight: '600'
                          }}
                        />
                      </View>

                      <View style={{ gap: 6 }}>
                        <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>Phone Number</Text>
                        <TextInput
                          value={editPhone}
                          onChangeText={setEditPhone}
                          keyboardType="phone-pad"
                          placeholder="Enter 10-digit mobile"
                          placeholderTextColor={isDarkMode ? '#71717a' : '#94a3b8'}
                          style={{
                            backgroundColor: isDarkMode ? '#27272a' : '#f8fafc',
                            borderWidth: 1,
                            borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
                            borderRadius: 14,
                            paddingHorizontal: 16,
                            paddingVertical: 10,
                            color: isDarkMode ? '#ffffff' : '#0f172a',
                            fontSize: 13,
                            fontWeight: '600'
                          }}
                        />
                      </View>

                      <Pressable
                        onPress={handleSaveProfile}
                        disabled={isSaving}
                        style={({ pressed }) => [{
                          backgroundColor: '#e20a22',
                          paddingVertical: 14,
                          borderRadius: 14,
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexDirection: 'row',
                          gap: 6,
                          marginTop: 6,
                          opacity: pressed ? 0.9 : 1,
                          shadowColor: '#e20a22',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.2,
                          shadowRadius: 8,
                          elevation: 3
                        }]}
                      >
                        {isSaving ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <>
                            <Save size={15} color="#ffffff" strokeWidth={2.5} />
                            <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>Save Changes</Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  )}
                </View>
              ) : (
                <View style={{ flexDirection: 'column', width: '100%', gap: 16 }}>
                  <View>
                    <Text style={{ color: isDarkMode ? '#ffffff' : '#0f172a', fontSize: 22, fontWeight: '900', letterSpacing: -0.5 }}>
                      Welcome to FastKirana
                    </Text>
                    <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 13, fontWeight: '500', marginTop: 8, lineHeight: 18 }}>
                      Log in to view order history, track deliveries, and manage your delivery addresses.
                    </Text>
                  </View>
                  <View style={{
                    width: '100%',
                    backgroundColor: '#e20a22',
                    borderRadius: 14,
                    overflow: 'hidden',
                    elevation: 3,
                    shadowColor: '#e20a22',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    position: 'relative'
                  }}>
                    <LinearGradient
                      colors={['#e20a22', '#ff2d55']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <TouchableOpacity
                      activeOpacity={0.95}
                      onPress={() => {
                        triggerHaptic('medium');
                        router.push('/(auth)/login');
                      }}
                      style={{
                        width: '100%',
                        paddingVertical: 14,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <LogIn size={15} color="#ffffff" strokeWidth={2.5} />
                      <Text style={{
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: 13,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}>
                        Login
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Quick Action Cards Grid */}
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          <Text style={{ color: isDarkMode ? '#e4e4e7' : '#1e293b', fontWeight: '800', fontSize: 15, letterSpacing: -0.2 }}>
            Quick Actions
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
            {/* My Orders */}
            <Pressable 
              onPress={() => isLoggedIn ? router.push('/orders') : router.push('/(auth)/login')}
              className="w-[48%] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[22px] py-5 px-3.5 items-center active:scale-95"
              style={Platform.OS === 'ios' ? {
                shadowColor: '#e20a22',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDarkMode ? 0.25 : 0.06,
                shadowRadius: 14,
              } : Platform.OS === 'android' ? {
                elevation: 3,
              } : undefined}
            >
              <LinearGradient
                colors={['#ff416c', '#ff4b2b']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#ff416c',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4
                }}
              >
                <ShoppingBag size={22} color="#ffffff" strokeWidth={2.2} />
              </LinearGradient>
              <Text style={{ color: isDarkMode ? '#f4f4f5' : '#0f172a', fontWeight: '900', fontSize: 11, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                My Orders
              </Text>
              <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 9.5, fontWeight: '600', marginTop: 3 }}>
                Order History
              </Text>
            </Pressable>

            {/* Saved Addresses */}
            <Pressable 
              onPress={() => isLoggedIn ? router.push('/addresses') : router.push('/(auth)/login')}
              className="w-[48%] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[22px] py-5 px-3.5 items-center active:scale-95"
              style={Platform.OS === 'ios' ? {
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDarkMode ? 0.25 : 0.06,
                shadowRadius: 14,
              } : Platform.OS === 'android' ? {
                elevation: 3,
              } : undefined}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4
                }}
              >
                <MapPin size={22} color="#ffffff" strokeWidth={2.2} />
              </LinearGradient>
              <Text style={{ color: isDarkMode ? '#f4f4f5' : '#0f172a', fontWeight: '900', fontSize: 11, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Addresses
              </Text>
              <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 9.5, fontWeight: '600', marginTop: 3 }}>
                Manage Locations
              </Text>
            </Pressable>

            {/* Contact Support */}
            <Pressable 
              onPress={() => router.push('tel:1800123456')}
              className="w-[48%] bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-[22px] py-5 px-3.5 items-center active:scale-95"
              style={Platform.OS === 'ios' ? {
                shadowColor: '#3b82f6',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDarkMode ? 0.25 : 0.06,
                shadowRadius: 14,
              } : Platform.OS === 'android' ? {
                elevation: 3,
              } : undefined}
            >
              <LinearGradient
                colors={['#3b82f6', '#2563eb']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#3b82f6',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 4
                }}
              >
                <PhoneCall size={22} color="#ffffff" strokeWidth={2.2} />
              </LinearGradient>
              <Text style={{ color: isDarkMode ? '#f4f4f5' : '#0f172a', fontWeight: '900', fontSize: 11, marginTop: 14, textTransform: 'uppercase', letterSpacing: 0.6 }}>
                Support
              </Text>
              <Text style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: 9.5, fontWeight: '600', marginTop: 3 }}>
                Instant Call Support
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Staff Operations Console Banner */}
        {isLoggedIn && user && user.role !== 'USER' && (
          <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
            <LinearGradient
              colors={isDarkMode ? ['#312e81', '#1e1b4b'] : ['#e0e7ff', '#c7d2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 24,
                padding: 1.5,
                shadowColor: '#4f46e5',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: isDarkMode ? 0.25 : 0.08,
                shadowRadius: 16,
                elevation: 3
              }}
            >
              <Pressable 
                onPress={() => {
                  triggerHaptic('medium');
                  if (user.role === 'PICKER') router.push('/picker');
                  else if (user.role === 'CHEF') router.push('/chef');
                  else if (user.role === 'DELIVERY') router.push('/rider');
                  else router.push('/operations');
                }}
                style={({ pressed }) => [{
                  backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                  borderRadius: 22.5,
                  padding: 16,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: pressed ? 0.95 : 1
                }]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <LinearGradient
                    colors={['#e0e7ff', '#c7d2fe']}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ShieldCheck size={20} color="#4f46e5" strokeWidth={2.5} />
                  </LinearGradient>
                  <View style={{ flexDirection: 'column' }}>
                    <Text style={{ color: isDarkMode ? '#c7d2fe' : '#312e81', fontWeight: '800', fontSize: 13, letterSpacing: -0.2 }}>
                      Operations Console
                    </Text>
                    <Text style={{ color: '#94a3b8', fontSize: 9.5, fontWeight: '500', marginTop: 2 }}>
                      Manage tasks & store controls
                    </Text>
                  </View>
                </View>
                <View style={{
                  backgroundColor: '#4f46e5',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {user.role} Console
                  </Text>
                  <ChevronRight size={11} color="#ffffff" strokeWidth={2.5} />
                </View>
              </Pressable>
            </LinearGradient>
          </View>
        )}

        {/* Menu Options Group Card */}
        <View style={{ paddingHorizontal: 16, marginBottom: 24 }}>
          <View style={{
            backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
            borderWidth: 1,
            borderColor: isDarkMode ? '#27272a' : '#f1f5f9',
            borderRadius: 24,
            overflow: 'hidden',
            shadowColor: '#0f172a',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDarkMode ? 0.2 : 0.03,
            shadowRadius: 12,
            elevation: 2
          }}>
            {/* App Settings */}
            <Pressable 
              onPress={() => Alert.alert('Settings', 'Settings screen coming soon!')}
              className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800 active:bg-slate-50 dark:active:bg-zinc-800"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <LinearGradient
                  colors={['#e0e7ff', '#c7d2fe']}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Settings size={18} color="#4f46e5" strokeWidth={2.2} />
                </LinearGradient>
                <View style={{ flexDirection: 'column' }}>
                  <Text style={{ color: isDarkMode ? '#f4f4f5' : '#1e293b', fontWeight: '800', fontSize: 13 }}>
                    App Settings
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 9.5, fontWeight: '500', marginTop: 2 }}>
                    Preferences and settings
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={isDarkMode ? '#52525b' : '#cbd5e1'} strokeWidth={2.5} />
            </Pressable>

            {/* Theme Toggle (Dark / Light Mode) */}
            <Pressable 
              onPress={() => {
                triggerHaptic('medium');
                toggleTheme();
              }}
              className="flex-row items-center justify-between p-4 border-b border-slate-100 dark:border-zinc-800 active:bg-slate-50 dark:active:bg-zinc-800"
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <LinearGradient
                  colors={isDarkMode ? ['#3f3f46', '#27272a'] : ['#fef3c7', '#fde68a']}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {isDarkMode ? (
                    <Sun size={18} color="#fbbf24" strokeWidth={2.2} />
                  ) : (
                    <Moon size={18} color="#d97706" strokeWidth={2.2} />
                  )}
                </LinearGradient>
                <View style={{ flexDirection: 'column' }}>
                  <Text style={{ color: isDarkMode ? '#f4f4f5' : '#1e293b', fontWeight: '800', fontSize: 13 }}>
                    {isDarkMode ? 'Light Mode' : 'Dark Mode'}
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 9.5, fontWeight: '500', marginTop: 2 }}>
                    Switch to {isDarkMode ? 'light' : 'dark'} theme
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
                  {isDarkMode ? 'Dark' : 'Light'}
                </Text>
                <ChevronRight size={16} color={isDarkMode ? '#52525b' : '#cbd5e1'} strokeWidth={2.5} />
              </View>
            </Pressable>

            {/* Help & FAQs */}
            <Pressable 
              onPress={() => Alert.alert('Support', 'Please call our support at 1800-123-456.')}
              className={`flex-row items-center justify-between p-4 active:bg-slate-50 dark:active:bg-zinc-800 ${isLoggedIn ? 'border-b border-slate-100 dark:border-zinc-800' : ''}`}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <LinearGradient
                  colors={['#e0f2fe', '#bae6fd']}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <HelpCircle size={18} color="#0ea5e9" strokeWidth={2.2} />
                </LinearGradient>
                <View style={{ flexDirection: 'column' }}>
                  <Text style={{ color: isDarkMode ? '#f4f4f5' : '#1e293b', fontWeight: '800', fontSize: 13 }}>
                    Help & FAQs
                  </Text>
                  <Text style={{ color: '#94a3b8', fontSize: 9.5, fontWeight: '500', marginTop: 2 }}>
                    Find answers to common issues
                  </Text>
                </View>
              </View>
              <ChevronRight size={16} color={isDarkMode ? '#52525b' : '#cbd5e1'} strokeWidth={2.5} />
            </Pressable>

            {/* Logout Row (integrated into card) */}
            {isLoggedIn && (
              <Pressable 
                onPress={handleLogout}
                className="flex-row items-center justify-between p-4 active:bg-slate-50 dark:active:bg-zinc-800"
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <LinearGradient
                    colors={['#ffe4e6', '#fecdd3']}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <LogOut size={18} color="#ef4444" strokeWidth={2.2} />
                  </LinearGradient>
                  <View style={{ flexDirection: 'column' }}>
                    <Text style={{ color: '#ef4444', fontWeight: '800', fontSize: 13 }}>
                      Logout
                    </Text>
                    <Text style={{ color: '#94a3b8', fontSize: 9.5, fontWeight: '500', marginTop: 2 }}>
                      Sign out from your account
                    </Text>
                  </View>
                </View>
                <ChevronRight size={16} color="#ef4444" strokeWidth={2.5} />
              </Pressable>
            )}
          </View>
        </View>

        {/* App Version Info */}
        <View style={{ alignItems: 'center', marginBottom: 24, marginTop: 8 }}>
          <View style={{ height: 1, backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9', width: '80%', marginBottom: 20 }} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 14 }}>⚡</Text>
            <Text style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: '900', fontSize: 13, letterSpacing: 2 }}>
              FASTKIRANA
            </Text>
          </View>
          <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '700', marginTop: 6, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Version 1.0.0 (Expo SDK 56)
          </Text>
        </View>
      </ScrollView>

      {/* Premium Custom Logout Modal */}
      <Modal
        visible={isLogoutModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsLogoutModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24
        }}>
          <View style={{
            backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
            borderWidth: 1,
            borderColor: isDarkMode ? '#27272a' : '#ffe4e6',
            borderRadius: 32,
            width: '100%',
            maxWidth: 320,
            padding: 24,
            alignItems: 'center',
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: isDarkMode ? 0.35 : 0.08,
            shadowRadius: 24,
            elevation: 8,
          }}>
            {/* Warning Circle Icon */}
            <LinearGradient
              colors={['#ffe4e6', '#fecdd3']}
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16
              }}
            >
              <LogOut size={28} color="#ef4444" strokeWidth={2.5} />
            </LinearGradient>

            {/* Title */}
            <Text style={{
              color: isDarkMode ? '#ffffff' : '#1e293b',
              fontWeight: '900',
              fontSize: 18,
              textAlign: 'center',
              marginBottom: 8
            }}>
              Logout Account
            </Text>

            {/* Description */}
            <Text style={{
              color: isDarkMode ? '#a1a1aa' : '#64748b',
              fontSize: 12.5,
              fontWeight: '600',
              textAlign: 'center',
              lineHeight: 18,
              marginBottom: 24
            }}>
              Are you sure you want to log out from FastKirana? You will need to sign in again to access your orders and settings.
            </Text>

            {/* Action Buttons Row */}
            <View style={{ 
              flexDirection: 'row', 
              width: '100%',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 16
            }}>
              {/* Cancel Button */}
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('light');
                  setIsLogoutModalVisible(false);
                }}
                activeOpacity={0.7}
                style={{
                  width: '48%',
                  height: 46,
                  borderWidth: 1.5,
                  borderColor: isDarkMode ? '#27272a' : '#cbd5e1',
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
                }}
              >
                <Text style={{
                  color: isDarkMode ? '#cbd5e1' : '#475569',
                  fontWeight: '800',
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              {/* Logout Button */}
              <TouchableOpacity
                onPress={() => {
                  triggerHaptic('medium');
                  setIsLogoutModalVisible(false);
                  logout();
                }}
                activeOpacity={0.8}
                style={{
                  width: '48%',
                  height: 46,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#ef4444',
                }}
              >
                <Text style={{
                  color: '#ffffff',
                  fontWeight: '900',
                  fontSize: 13,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5
                }}>
                  Logout
                </Text>
              </TouchableOpacity>
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
    backgroundColor: '#e20a22',
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#e20a22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loginBtnPressable: {
    width: '100%',
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loginBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
