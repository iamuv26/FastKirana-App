import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Sparkles, Check, X } from 'lucide-react-native';
import { mmkvStorage } from '../../lib/storage';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';

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
    <View className="mx-4 my-3 rounded-2xl overflow-hidden shadow-sm border border-white/10 relative">
      <LinearGradient
        colors={['#dc2626', '#e11d48', '#f97316']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Close Button */}
      <Pressable
        onPress={handleDismiss}
        className="absolute top-2.5 right-2.5 p-1 rounded-full bg-white/10 active:bg-white/20 z-20"
      >
        <X size={14} color="#ffffff" strokeWidth={2.5} />
      </Pressable>

      <View className="flex-row items-center justify-between p-4 z-10 gap-3">
        <View className="flex-row items-center gap-3 flex-1">
          {/* Accent Badge */}
          <View className="h-11 w-11 rounded-xl overflow-hidden bg-white/10 border border-white/25 items-center justify-center shrink-0">
            <Text className="text-xl">⚡</Text>
          </View>
          
          <View className="flex-1 pr-4">
            <View className="flex-row items-center gap-1 flex-wrap">
              <Text className="text-white font-black text-xs tracking-tight">10-Min Flash Deal Alerts</Text>
              <Sparkles size={11} color="#fcd34d" fill="#fcd34d" />
            </View>
            <Text className="text-rose-100/90 text-[10px] font-bold mt-1 leading-relaxed">
              Get notified the exact second limited-time bargains drop! Don't miss out on 60% items.
            </Text>
          </View>
        </View>

        <Pressable
          onPress={handleToggle}
          className={`h-9 px-4 rounded-xl shadow-xs active:scale-95 shrink-0 flex-row items-center justify-center gap-1.5 ${
            enabled ? 'bg-white/20 border border-white/30' : 'bg-white'
          }`}
        >
          {enabled ? (
            <>
              <Check size={11} color="#ffffff" strokeWidth={3} />
              <Text className="text-white font-black text-[10px] uppercase tracking-wider">Alerts Active</Text>
            </>
          ) : (
            <>
              <Bell size={11} color="#e11d48" strokeWidth={2.5} />
              <Text className="text-rose-600 font-black text-[10px] uppercase tracking-wider">Notify Me</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  );
}
