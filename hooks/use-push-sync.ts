import { useEffect } from 'react';
import { useAuthStore } from '../stores/auth-store';
import { registerForPushNotificationsAsync } from '../lib/push-notifications';
import { api } from '../lib/api-client';

export function usePushSync() {
  const { isLoggedIn, user } = useAuthStore();

  useEffect(() => {
    if (!isLoggedIn || !user) return;

    const syncPushToken = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (!token) return;

        console.log('[PushSync] Syncing Expo Push Token with backend...');
        await api.post('/push/subscribe', {
          subscription: {
            endpoint: token,
            keys: {
              p256dh: 'expo',
              auth: 'expo'
            }
          }
        });
        console.log('[PushSync] Token synced successfully!');
      } catch (err) {
        console.warn('[PushSync] Failed to sync push token with backend:', err);
      }
    };

    // Delay slightly to allow auth state to settle
    const timer = setTimeout(syncPushToken, 2000);
    return () => clearTimeout(timer);
  }, [isLoggedIn, user]);
}
