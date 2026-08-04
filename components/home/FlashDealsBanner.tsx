import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../app/context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Sparkles, Check, X } from 'lucide-react-native';
import { mmkvStorage } from '../../lib/storage';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';
import { THEME } from '../../lib/theme';

export default function FlashDealsBanner() {
  const [enabled, setEnabled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

  useEffect(() => {
    const isAlertActive = mmkvStorage.getItem('flash-deals-alerts-enabled') === 'true';
    const dismissed = mmkvStorage.getItem('flash-deals-banner-dismissed') === 'true';
    setEnabled(isAlertActive);
    setIsDismissed(dismissed || isAlertActive);
  }, []);

  const handleToggle = () => {
    triggerHaptic('light');
    if (enabled) {
      mmkvStorage.setItem('flash-deals-alerts-enabled', 'false');
      setEnabled(false);
      toast.info('Muted flash sale alerts.');
    } else {
      mmkvStorage.setItem('flash-deals-alerts-enabled', 'true');
      setEnabled(true);
      toast.success('⚡ Alerts Active! We will notify you before flash deals end.');
      // Dismiss the banner immediately after subscribing to keep UI clean
      mmkvStorage.setItem('flash-deals-banner-dismissed', 'true');
      setIsDismissed(true);
    }
  };

  const handleDismiss = () => {
    triggerHaptic('light');
    mmkvStorage.setItem('flash-deals-banner-dismissed', 'true');
    setIsDismissed(true);
  };

  if (isDismissed) return null;

  return (
    <View style={{ marginHorizontal: THEME.SPACING.lg, marginVertical: THEME.SPACING.xs, borderRadius: THEME.RADIUS.lg, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden', position: 'relative' }}>
      <LinearGradient
        colors={THEME.COLORS.gradients.primary as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Close Button */}
      <Pressable
        onPress={handleDismiss}
        style={{ position: 'absolute', top: 10, right: 10, padding: 4, zIndex: 20, borderRadius: THEME.RADIUS.pill, backgroundColor: 'rgba(255,255,255,0.1)' }}
      >
        <X size={14} color="#ffffff" strokeWidth={2.5} />
      </Pressable>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: THEME.SPACING.md, zIndex: 10, gap: THEME.SPACING.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: THEME.SPACING.sm, flex: 1 }}>
          {/* Accent Badge */}
          <View style={{ height: 44, width: 44, borderRadius: THEME.RADIUS.sm, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22 }}>⚡</Text>
          </View>

          <View style={{ flex: 1, paddingRight: THEME.SPACING.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: '#ffffff', letterSpacing: -0.2 }}>10-Min Flash Deal Alerts</Text>
              <Sparkles size={11} color="#fcd34d" fill="#fcd34d" />
            </View>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: THEME.TYPOGRAPHY.weights.medium, color: 'rgba(255,182,193,0.9)', marginTop: 4, lineHeight: 16 }}>
              Get notified the exact second limited-time bargains drop! Don't miss out on 60% items.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleToggle}
          style={{
            height: 34,
            paddingHorizontal: 16,
            borderRadius: THEME.RADIUS.sm,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            ...(enabled
              ? { backgroundColor: 'rgba(255,255,255,0.2)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' }
              : { backgroundColor: '#ffffff' }),
          }}
        >
          {enabled ? (
            <>
              <Check size={11} color="#ffffff" strokeWidth={3} />
              <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.bold, color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5 }}>Alerts Active</Text>
            </>
          ) : (
            <>
              <Bell size={11} color={THEME.COLORS.brand.primary} strokeWidth={2.5} />
              <Text style={{ color: THEME.COLORS.brand.primary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: THEME.TYPOGRAPHY.weights.bold, textTransform: 'uppercase', letterSpacing: 0.5 }}>Notify Me</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
