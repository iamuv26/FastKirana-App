import { toast } from './toast';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

let Notifications: any = null;

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    // Set up the default notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (error) {
    console.warn('[PushNotifications] Failed to load expo-notifications:', error);
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web' || isExpoGo || !Notifications) {
    console.log('[PushNotifications] Skipping registration (Web, Expo Go, or Notifications not available)');
    return 'MOCK_EXPO_GO_TOKEN';
  }

  try {
    if (!Device.isDevice) {
      console.log('[PushNotifications] Must use physical device for Push Notifications');
      return 'MOCK_EMULATOR_TOKEN';
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('[PushNotifications] Failed to get permission for push notification!');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '6648d770-3e29-4432-b716-860070646aec',
    });
    
    const token = tokenData.data;
    console.log('[PushNotifications] Expo push token obtained:', token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#e20a22',
      });
    }

    return token;
  } catch (error) {
    console.warn('[PushNotifications] Error registering for push notifications:', error);
    return null;
  }
}

export async function sendLocalNotification(title: string, body: string) {
  try {
    if (Platform.OS !== 'web' && !isExpoGo && Notifications) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null,
      });
    } else {
      toast.info(`🔔 ${title}: ${body}`);
    }
  } catch (err) {
    toast.info(`🔔 ${title}: ${body}`);
  }
}

export function addNotificationResponseListener(handler: (response: any) => void): { remove: () => void } {
  if (Platform.OS !== 'web' && !isExpoGo && Notifications) {
    try {
      return Notifications.addNotificationResponseReceivedListener(handler);
    } catch (error) {
      console.warn('[PushNotifications] Failed to add notification response listener:', error);
    }
  }
  return { remove: () => {} };
}


