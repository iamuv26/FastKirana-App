import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuthStore } from '../stores/auth-store';
import { triggerHaptic } from '../lib/haptic';
import { toast } from '../lib/toast';
import { THEME } from '../lib/theme';

export default function LoginCallbackScreen() {
  const params = useLocalSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    try {
      console.log('[LoginCallback] Received params:', params);
      const { user, token } = params;

      if (user) {
        let userStr = user as string;
        if (userStr.includes('%')) {
          userStr = decodeURIComponent(userStr);
        }
        const userObj = JSON.parse(userStr);
        const resolvedToken = (token as string) || userObj.token || 'google-oauth-session-token';

        triggerHaptic('success');
        setAuth(resolvedToken, userObj);
        toast.success('Successfully logged in with Google!');

        // Redirect to appropriate console or homepage based on role
        if (userObj.role === 'PICKER') router.replace('/picker');
        else if (userObj.role === 'CHEF' || userObj.role === 'RESTAURANT_OWNER') router.replace('/restaurant-chef');
        else if (userObj.role === 'DELIVERY') router.replace('/rider');
        else if (userObj.role === 'ADMIN') router.replace('/operations');
        else router.replace('/(tabs)');
      } else {
        console.error('[LoginCallback] No user data found in params');
        toast.error('Google login failed. Please try again.');
        router.replace('/(auth)/login');
      }
    } catch (err) {
      console.error('[LoginCallback] Error parsing user details:', err);
      toast.error('Google login failed. Please try again.');
      router.replace('/(auth)/login');
    }
  }, [params]);

  return (
    <View style={{ flex: 1, backgroundColor: THEME.COLORS.light.background, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={THEME.COLORS.brand.primary} />
      <Text style={{ marginTop: 16, color: THEME.COLORS.light.textSecondary, fontWeight: '600' }}>Signing you in...</Text>
    </View>
  );
}
