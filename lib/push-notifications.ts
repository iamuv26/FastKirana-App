import { toast } from './toast';

// expo-notifications has been removed from dependencies to prevent
// native Firebase startup crashes on standalone Android builds.
// All notification functions are now safe no-ops that use toast fallbacks.

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  console.log('[PushNotifications] Notifications module not installed. Skipping registration.');
  return null;
}

export async function sendLocalNotification(title: string, body: string) {
  toast.info(`🔔 ${title}: ${body}`);
}
