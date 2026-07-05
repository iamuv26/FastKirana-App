import React from 'react';
import { View, Text, Pressable, Linking, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { Phone, Mail, Clock, MapPin } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import Logo from '../shared/Logo';
import { triggerHaptic } from '../../lib/haptic';
import { useUIStore } from '../../stores/ui-store';

// ── Social Media SVG Icons (matching web exactly) ──
function InstagramIcon({ size = 16, color = '#9ca3af' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </Svg>
  );
}

function XTwitterIcon({ size = 16, color = '#9ca3af' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </Svg>
  );
}

function FacebookIcon({ size = 16, color = '#9ca3af' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
    </Svg>
  );
}

export default function AppFooter() {
  const shopPhone = useUIStore((s) => s.shopPhone);
  const selectedLocation = useUIStore((s) => s.selectedLocation);

  const trustedText = selectedLocation && selectedLocation !== 'Select Location'
    ? `🎉 Proudly Serve in ${selectedLocation}`
    : '🎉 Proudly Serve in Ghatampur';
  const contactPhone = shopPhone || '+918112849854';
  const contactEmail = 'help@fastkirana.com';
  const contactTimings = '6 AM - 12 AM';
  const contactAddress = 'NH34, Ghatampur, Kanpur Nagar';

  const formatPhone = (phone: string) => {
    return phone;
  };

  const handlePhonePress = () => {
    triggerHaptic('light');
    Linking.openURL(`tel:${contactPhone}`).catch(() => {
      Alert.alert('Error', 'Unable to open phone dialer');
    });
  };

  const handleEmailPress = () => {
    triggerHaptic('light');
    Linking.openURL(`mailto:${contactEmail}`).catch(() => {
      Alert.alert('Error', 'Unable to open email client');
    });
  };

  const handleLinkPress = (path: string) => {
    triggerHaptic('light');
    if (path.startsWith('/')) {
      router.push(path as any);
    } else {
      Alert.alert('Info', 'This page is coming soon in the mobile app!');
    }
  };

  return (
    <View className="bg-[#0a0a0f] border-t border-zinc-800/50">
      {/* ── Social Proof Strip (matches web: bg-accent/10 border-b) ── */}
      <View className="bg-[#00b140]/10 border-b border-[#00b140]/20 py-3 px-4">
        <Text className="text-[#00b140] text-[13px] font-bold text-center">
          {trustedText}
        </Text>
      </View>

      {/* ── Main Footer Content ── */}
      <View className="px-5 pt-8 pb-4">

        {/* ── 4-column grid on web / 2x2 on mobile ── */}
        <View className="flex-row flex-wrap">
          {/* Column 1: Brand (full width on mobile) */}
          <View className="w-full mb-7">
            <View className="flex-row items-center gap-2.5 mb-3">
              <Logo size={36} />
              <View className="flex-column">
                <Text className="text-white text-lg font-black tracking-tight leading-5">
                  Fast<Text className="text-rose-600">Kirana</Text>
                </Text>
                <Text className="text-[#00b140] text-[9px] font-black uppercase tracking-wider mt-0.5">
                  Delivery App
                </Text>
              </View>
            </View>
            <Text className="text-gray-400 text-[13px] leading-[20px] font-normal">
              Groceries and daily essentials delivered instantly from our local dark stores. Fresh fruits, vegetables, dairy, and snacks at your doorstep in 10 minutes.
            </Text>
            {/* Social Media Icons (matching web: Instagram, X, Facebook) */}
            <View className="flex-row items-center gap-3 mt-4">
              <Pressable
                onPress={() => triggerHaptic('light')}
                className="w-9 h-9 rounded-full bg-white/10 items-center justify-center active:opacity-70"
              >
                <InstagramIcon size={16} color="#9ca3af" />
              </Pressable>
              <Pressable
                onPress={() => triggerHaptic('light')}
                className="w-9 h-9 rounded-full bg-white/10 items-center justify-center active:opacity-70"
              >
                <XTwitterIcon size={16} color="#9ca3af" />
              </Pressable>
              <Pressable
                onPress={() => triggerHaptic('light')}
                className="w-9 h-9 rounded-full bg-white/10 items-center justify-center active:opacity-70"
              >
                <FacebookIcon size={16} color="#9ca3af" />
              </Pressable>
            </View>
          </View>

          {/* Columns 2-4: Shop | Account | Contact */}
          <View className="flex-row w-full gap-2">
            {/* Column 2: Shop */}
            <View className="flex-1">
              <Text className="text-gray-300 text-[13px] font-semibold uppercase tracking-wider mb-4">
                Shop
              </Text>
              <View className="gap-2.5">
                <Pressable onPress={() => handleLinkPress('/category/fruits-vegetables')} className="active:opacity-70">
                  <Text className="text-gray-400 text-[13px]">Fruits & Vegetables</Text>
                </Pressable>
                <Pressable onPress={() => handleLinkPress('/category/dairy-breakfast')} className="active:opacity-70">
                  <Text className="text-gray-400 text-[13px]">Dairy & Breakfast</Text>
                </Pressable>
                <Pressable onPress={() => handleLinkPress('/category/snacks-munchies')} className="active:opacity-70">
                  <Text className="text-gray-400 text-[13px]">Snacks</Text>
                </Pressable>
                <Pressable onPress={() => handleLinkPress('/category/beverages')} className="active:opacity-70">
                  <Text className="text-gray-400 text-[13px]">Beverages</Text>
                </Pressable>
              </View>
            </View>

            {/* Column 3: Account */}
            <View className="flex-1">
              <Text className="text-gray-300 text-[13px] font-semibold uppercase tracking-wider mb-4">
                Account
              </Text>
              <View className="gap-2.5">
                <Pressable onPress={() => handleLinkPress('/(tabs)/account')} className="active:opacity-70">
                  <Text className="text-gray-400 text-[13px]">My Profile</Text>
                </Pressable>
                <Pressable onPress={() => handleLinkPress('/orders')} className="active:opacity-70">
                  <Text className="text-gray-400 text-[13px]">My Orders</Text>
                </Pressable>
                <Pressable onPress={() => handleLinkPress('/addresses')} className="active:opacity-70">
                  <Text className="text-gray-400 text-[13px]">Saved Addresses</Text>
                </Pressable>
                <Pressable onPress={() => handleLinkPress('/cart')} className="active:opacity-70">
                  <Text className="text-gray-400 text-[13px]">Cart</Text>
                </Pressable>
              </View>
            </View>

            {/* Column 4: Contact */}
            <View className="flex-1">
              <Text className="text-gray-300 text-[13px] font-semibold uppercase tracking-wider mb-4">
                Contact
              </Text>
              <View className="gap-2.5">
                <Pressable onPress={handlePhonePress} className="flex-row items-center gap-2 active:opacity-70">
                  <Phone size={13} color="#9ca3af" />
                  <Text className="text-gray-400 text-[12px] flex-1" numberOfLines={1}>{formatPhone(contactPhone)}</Text>
                </Pressable>
                <Pressable onPress={handleEmailPress} className="flex-row items-center gap-2 active:opacity-70">
                  <Mail size={13} color="#9ca3af" />
                  <Text className="text-gray-400 text-[12px] flex-1" numberOfLines={1}>{contactEmail}</Text>
                </Pressable>
                <View className="flex-row items-center gap-2">
                  <Clock size={13} color="#9ca3af" />
                  <Text className="text-gray-400 text-[12px] flex-1" numberOfLines={1}>{contactTimings}</Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <MapPin size={13} color="#9ca3af" style={{ marginTop: 2 }} />
                  <Text className="text-gray-400 text-[12px] flex-1 leading-[18px]">{contactAddress}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Bottom Bar (matches web: copyright | payments | legal) ── */}
        <View className="border-t border-gray-700 mt-10 pt-5 pb-16">
          {/* Row: Copyright + Payments + Legal Links */}
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <Text className="text-gray-500 text-[11px]">
              © {new Date().getFullYear()} FastKirana. All rights reserved.
            </Text>
            <Text className="text-gray-500 text-[11px]">
              We accept: UPI • Cards • COD • Wallets
            </Text>
          </View>

          {/* Legal Links */}
          <View className="flex-row items-center gap-4 mt-3">
            <Pressable onPress={() => handleLinkPress('privacy')} className="active:opacity-70">
              <Text className="text-gray-500 text-[11px]">Privacy Policy</Text>
            </Pressable>
            <Pressable onPress={() => handleLinkPress('terms')} className="active:opacity-70">
              <Text className="text-gray-500 text-[11px]">Terms of Service</Text>
            </Pressable>
            <Pressable onPress={() => handleLinkPress('refund')} className="active:opacity-70">
              <Text className="text-gray-500 text-[11px]">Refund Policy</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}
