import React from 'react';
import { View, Text, Pressable, Linking, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { ScalePressable } from '../shared/ScalePressable';
import { Phone, Mail, Clock, MapPin } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import Logo from '../shared/Logo';
import { triggerHaptic } from '../../lib/haptic';
import { useUIStore } from '../../stores/ui-store';
import { THEME } from '../../lib/theme';


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
    <View style={{ backgroundColor: '#0a0a0f', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)' }}>
      {/* ── Social Proof Strip (matches web: bg-accent/10 border-b) ── */}
      <View style={{ backgroundColor: 'rgba(16,185,129,0.1)', borderBottomWidth: 1, borderBottomColor: 'rgba(16,185,129,0.2)', paddingVertical: 12, paddingHorizontal: 16 }}>
        <Text style={{ color: '#10b981', fontSize: 13, fontWeight: '700', textAlign: 'center' }}>
          {trustedText}
        </Text>
      </View>

      {/* ── Main Footer Content ── */}
      <View style={{ paddingHorizontal: THEME.SPACING.lg, paddingTop: 32, paddingBottom: 16 }}>

        {/* ── 4-column grid on web / 2x2 on mobile ── */}
        <View className="flex-row flex-wrap">
          {/* Column 1: Brand (full width on mobile) */}
          <View style={{ width: '100%', marginBottom: 28 }}>
            <View className="flex-row items-center gap-2.5 mb-3">
              <Logo size={36} />
              <View className="flex-column">
                <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: '800' }} className="tracking-tight leading-5">
                  Fast<Text style={{ color: THEME.COLORS.brand.primary }}>Kirana</Text>
                </Text>
                <Text style={{ color: '#10b981', fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700' }} className="uppercase tracking-wider mt-0.5">
                  Delivery App
                </Text>
              </View>
            </View>
            <Text style={{ color: '#94a3b8', fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '400', lineHeight: 18 }}>
              Groceries and daily essentials delivered instantly from our local dark stores. Fresh fruits, vegetables, dairy, and snacks at your doorstep in 10 minutes.
            </Text>
            {/* Social Media Icons (matching web: Instagram, X, Facebook) */}
            <View className="flex-row items-center gap-3 mt-4">
              <ScalePressable
                onPress={() => {}}
                scaleValue={0.9}
                style={{ width: 36, height: 36, borderRadius: THEME.RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.08)' }}
                className="items-center justify-center"
              >
                <InstagramIcon size={16} color="#9ca3af" />
              </ScalePressable>
              <ScalePressable
                onPress={() => {}}
                scaleValue={0.9}
                style={{ width: 36, height: 36, borderRadius: THEME.RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.08)' }}
                className="items-center justify-center"
              >
                <XTwitterIcon size={16} color="#9ca3af" />
              </ScalePressable>
              <ScalePressable
                onPress={() => {}}
                scaleValue={0.9}
                style={{ width: 36, height: 36, borderRadius: THEME.RADIUS.sm, backgroundColor: 'rgba(255,255,255,0.08)' }}
                className="items-center justify-center"
              >
                <FacebookIcon size={16} color="#9ca3af" />
              </ScalePressable>
            </View>
          </View>

          {/* Columns 2-4: Shop | Account | Contact */}
          <View className="flex-row w-full gap-2">
            {/* Column 2: Shop */}
            <View className="flex-1">
              <Text style={{ color: '#e2e8f0', fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '700', marginBottom: 16 }} className="uppercase tracking-wider">
                Shop
              </Text>
              <View className="gap-2.5">
                <ScalePressable onPress={() => handleLinkPress('/category/fruits-vegetables')} scaleValue={0.98}>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>Fruits & Vegetables</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/category/dairy-breakfast')} scaleValue={0.98}>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>Dairy & Breakfast</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/category/snacks-biscuits')} scaleValue={0.98}>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>Snacks</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/category/beverages')} scaleValue={0.98}>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>Beverages</Text>
                </ScalePressable>
              </View>
            </View>

            {/* Column 3: Account */}
            <View className="flex-1">
              <Text style={{ color: '#e2e8f0', fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '700', marginBottom: 16 }} className="uppercase tracking-wider">
                Account
              </Text>
              <View className="gap-2.5">
                <ScalePressable onPress={() => handleLinkPress('/(tabs)/account')} scaleValue={0.98}>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>My Profile</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/orders')} scaleValue={0.98}>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>My Orders</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/addresses')} scaleValue={0.98}>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>Saved Addresses</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/cart')} scaleValue={0.98}>
                  <Text style={{ color: '#94a3b8', fontSize: 12 }}>Cart</Text>
                </ScalePressable>
              </View>
            </View>

            {/* Column 4: Contact */}
            <View className="flex-1">
              <Text style={{ color: '#e2e8f0', fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '700', marginBottom: 16 }} className="uppercase tracking-wider">
                Contact
              </Text>
              <View className="gap-2.5">
                <ScalePressable onPress={handlePhonePress} scaleValue={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Phone size={13} color="#9ca3af" />
                  <Text style={{ color: '#94a3b8', fontSize: 11 }} numberOfLines={1}>{formatPhone(contactPhone)}</Text>
                </ScalePressable>
                <ScalePressable onPress={handleEmailPress} scaleValue={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Mail size={13} color="#9ca3af" />
                  <Text style={{ color: '#94a3b8', fontSize: 11 }} numberOfLines={1}>{contactEmail}</Text>
                </ScalePressable>
                <View className="flex-row items-center gap-2">
                  <Clock size={13} color="#9ca3af" />
                  <Text style={{ color: '#94a3b8', fontSize: 11 }} numberOfLines={1}>{contactTimings}</Text>
                </View>
                <View className="flex-row items-start gap-2">
                  <MapPin size={13} color="#9ca3af" style={{ marginTop: 2 }} />
                  <Text style={{ color: '#94a3b8', fontSize: 11, lineHeight: 15 }} className="flex-1">{contactAddress}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Bottom Bar (matches web: copyright | payments | legal) ── */}
        <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', marginTop: 40, paddingTop: 20, paddingBottom: 64 }}>
          {/* Row: Copyright + Payments + Legal Links */}
          <View className="flex-row flex-wrap items-center justify-between gap-3">
            <Text style={{ color: '#64748b', fontSize: 11 }}>
              © {new Date().getFullYear()} FastKirana. All rights reserved.
            </Text>
            <Text style={{ color: '#64748b', fontSize: 11 }}>
              We accept: UPI • Cards • COD • Wallets
            </Text>
          </View>

          {/* Legal Links */}
          <View className="flex-row items-center gap-4 mt-3">
            <ScalePressable onPress={() => handleLinkPress('privacy')} scaleValue={0.98}>
              <Text style={{ color: '#64748b', fontSize: 11 }}>Privacy Policy</Text>
            </ScalePressable>
            <ScalePressable onPress={() => handleLinkPress('terms')} scaleValue={0.98}>
              <Text style={{ color: '#64748b', fontSize: 11 }}>Terms of Service</Text>
            </ScalePressable>
            <ScalePressable onPress={() => handleLinkPress('refund')} scaleValue={0.98}>
              <Text style={{ color: '#64748b', fontSize: 11 }}>Refund Policy</Text>
            </ScalePressable>
          </View>
        </View>
      </View>
    </View>
  );
}
