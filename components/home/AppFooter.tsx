import React from 'react';
import { View, Text, Platform, Pressable, Linking, Alert } from 'react-native';
import { router } from 'expo-router';
import { ScalePressable } from '../shared/ScalePressable';
import { Phone, Mail, Clock, MapPin } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';
import Logo from '../shared/Logo';
import { triggerHaptic } from '../../lib/haptic';
import { useUIStore } from '../../stores/ui-store';
import { THEME } from '../../lib/theme';
import { useTheme } from '../../app/context/ThemeContext';


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
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

  const trustedText = selectedLocation && selectedLocation !== 'Select Location'
    ? `🎉 Proudly Serve in ${selectedLocation}`
    : '🎉 Proudly Serve in Ghatampur';
  const contactPhone = shopPhone || '+917054470303';
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

  const footerBg = '#0a0a0f';
  const dividerColor = 'rgba(255,255,255,0.06)';
  const textMuted = '#94a3b8';
  const textDim = '#64748b';
  const textBright = '#e2e8f0';
  const socialProofColor = '#10b981';

  return (
    <View style={{ backgroundColor: footerBg, borderTopWidth: 1, borderTopColor: dividerColor, paddingBottom: 120 }}>
      {/* ── Social Proof Strip ── */}
      <View style={{
        backgroundColor: socialProofColor,
        paddingVertical: 14,
        paddingHorizontal: THEME.SPACING.lg,
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Text style={{ color: '#ffffff', fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.black, letterSpacing: 0.3, textAlign: 'center' }}>
          {trustedText}
        </Text>
      </View>

      {/* ── Main Footer Content ── */}
      <View style={{ paddingHorizontal: THEME.SPACING.lg, paddingTop: 32, paddingBottom: 16 }}>

        {/* ── 4-column grid on web / 2x2 on mobile ── */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {/* Column 1: Brand (full width on mobile) */}
          <View style={{ width: '100%', marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Logo size={36} />
              <View style={{ flexDirection: 'column' }}>
                <Text style={{ color: textBright, fontSize: THEME.TYPOGRAPHY.sizes.title, fontWeight: THEME.TYPOGRAPHY.weights.extrabold, letterSpacing: -0.5, lineHeight: 20 }}>
                  Fast<Text style={{ color: THEME.COLORS.brand.primary }}>Kirana</Text>
                </Text>
                <Text style={{ color: socialProofColor, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.bold, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>
                  Delivery App
                </Text>
              </View>
            </View>
            <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular, lineHeight: 18 }}>
              Groceries and daily essentials delivered instantly from our local dark stores. Fresh fruits, vegetables, dairy, and snacks at your doorstep in 10 minutes.
            </Text>
            {/* Social Media Icons (matching web: Instagram, X, Facebook) */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 16 }}>
              <ScalePressable
                onPress={() => {}}
                scaleValue={0.9}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <InstagramIcon size={14} color="#9ca3af" />
              </ScalePressable>
              <ScalePressable
                onPress={() => {}}
                scaleValue={0.9}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <XTwitterIcon size={14} color="#9ca3af" />
              </ScalePressable>
              <ScalePressable
                onPress={() => {}}
                scaleValue={0.9}
                style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <FacebookIcon size={14} color="#9ca3af" />
              </ScalePressable>
            </View>
          </View>

          {/* Columns 2-4: Shop | Account | Contact */}
          <View style={{ flexDirection: 'row', width: '100%', gap: 10, justifyContent: 'space-between' }}>
            {/* Column 2: Shop */}
            <View style={{ flex: 1.1 }}>
              <Text style={{ color: textBright, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.bold, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 14 }}>
                Shop
              </Text>
              <View style={{ gap: 10 }}>
                <ScalePressable onPress={() => handleLinkPress('/category/fruits-vegetables')} scaleValue={0.98}>
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>Fruits & Veg</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/category/dairy-breakfast')} scaleValue={0.98}>
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>Milk & Dairy</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/category/snacks-biscuits')} scaleValue={0.98}>
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>Snacks</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/category/beverages')} scaleValue={0.98}>
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>Beverages</Text>
                </ScalePressable>
              </View>
            </View>

            {/* Column 3: Account */}
            <View style={{ flex: 1.0 }}>
              <Text style={{ color: textBright, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.bold, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 14 }}>
                Account
              </Text>
              <View style={{ gap: 10 }}>
                <ScalePressable onPress={() => handleLinkPress('/(tabs)/account')} scaleValue={0.98}>
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>My Profile</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/orders')} scaleValue={0.98}>
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>My Orders</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/addresses')} scaleValue={0.98}>
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>Addresses</Text>
                </ScalePressable>
                <ScalePressable onPress={() => handleLinkPress('/cart')} scaleValue={0.98}>
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>Cart</Text>
                </ScalePressable>
              </View>
            </View>

            {/* Column 4: Contact */}
            <View style={{ flex: 1.5 }}>
              <Text style={{ color: textBright, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.bold, textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 14 }}>
                Contact
              </Text>
              <View style={{ gap: 10 }}>
                <ScalePressable onPress={handlePhonePress} scaleValue={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Phone size={11} color="#9ca3af" />
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }} numberOfLines={1}>{formatPhone(contactPhone)}</Text>
                </ScalePressable>
                <ScalePressable onPress={handleEmailPress} scaleValue={0.98} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Mail size={11} color="#9ca3af" />
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }} numberOfLines={1}>{contactEmail}</Text>
                </ScalePressable>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Clock size={11} color="#9ca3af" />
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }} numberOfLines={1}>{contactTimings}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                  <MapPin size={11} color="#9ca3af" style={{ marginTop: 2 }} />
                  <Text style={{ color: textMuted, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular, lineHeight: 14, flex: 1 }} numberOfLines={2}>{contactAddress}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Bottom Bar (matches web: copyright | payments | legal) ── */}
        <View style={{ borderTopWidth: 1, borderTopColor: dividerColor, marginTop: 40, paddingTop: 20 }}>
          {/* Row: Copyright + Payments */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Text style={{ color: textDim, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>
              © {new Date().getFullYear()} FastKirana. All rights reserved.
            </Text>
            <Text style={{ color: textDim, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>
              We accept: UPI • Cards • COD • Wallets
            </Text>
          </View>

          {/* Legal Links */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
            <ScalePressable onPress={() => handleLinkPress('privacy')} scaleValue={0.98}>
              <Text style={{ color: textDim, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>Privacy Policy</Text>
            </ScalePressable>
            <ScalePressable onPress={() => handleLinkPress('terms')} scaleValue={0.98}>
              <Text style={{ color: textDim, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>Terms of Service</Text>
            </ScalePressable>
            <ScalePressable onPress={() => handleLinkPress('refund')} scaleValue={0.98}>
              <Text style={{ color: textDim, fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.regular }}>Refund Policy</Text>
            </ScalePressable>
          </View>
        </View>
      </View>
    </View>
  );
}
