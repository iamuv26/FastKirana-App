import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Sparkles, Check, X } from 'lucide-react-native';
import { mmkvStorage } from '../../lib/storage';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';
import { THEME } from '../../lib/theme';

export default function FlashDealsBanner() {
  const [enabled, setEnabled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

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
    <View style={{ marginHorizontal: THEME.SPACING.lg, marginVertical: THEME.SPACING.xs, borderRadius: THEME.RADIUS.lg }} className="overflow-hidden border border-white/10 relative">
      <LinearGradient
        colors={THEME.COLORS.gradients.primary as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Close Button */}
      <Pressable
        onPress={handleDismiss}
        style={{ position: 'absolute', top: 10, right: 10, padding: 4, zIndex: 20 }}
        className="rounded-full bg-white/10 active:bg-white/20"
      >
        <X size={14} color="#ffffff" strokeWidth={2.5} />
      </Pressable>

      <View className="flex-row items-center justify-between p-4 z-10 gap-3">
        <View className="flex-row items-center gap-3 flex-1">
          {/* Accent Badge */}
          <View style={{ height: 44, width: 44, borderRadius: THEME.RADIUS.sm }} className="overflow-hidden bg-white/10 border border-white/25 items-center justify-center shrink-0">
            <Text className="text-xl">⚡</Text>
          </View>
          
          <View className="flex-1 pr-4">
            <View className="flex-row items-center gap-1 flex-wrap">
              <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.bodySm, fontWeight: '700' }} className="text-white tracking-tight">10-Min Flash Deal Alerts</Text>
              <Sparkles size={11} color="#fcd34d" fill="#fcd34d" />
            </View>
            <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.caption, fontWeight: '500', marginTop: 4 }} className="text-rose-100/90 leading-normal">
              Get notified the exact second limited-time bargains drop! Don't miss out on 60% items.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleToggle}
          style={{ height: 34, paddingHorizontal: 16, borderRadius: THEME.RADIUS.sm }}
          className={`shadow-xs active:scale-95 shrink-0 flex-row items-center justify-center gap-1.5 ${
            enabled ? 'bg-white/20 border border-white/30' : 'bg-white'
          }`}
        >
          {enabled ? (
            <>
              <Check size={11} color="#ffffff" strokeWidth={3} />
              <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700' }} className="text-white uppercase tracking-wider">Alerts Active</Text>
            </>
          ) : (
            <>
              <Bell size={11} color={THEME.COLORS.brand.primary} strokeWidth={2.5} />
              <Text style={{ color: THEME.COLORS.brand.primary, fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '700' }} className="uppercase tracking-wider">Notify Me</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
