import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { toast } from './toast';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: any = null;
if (!isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    // Set up default foreground notification presentation behavior
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
  } catch (e) {
    console.warn('Failed to load expo-notifications:', e);
  }
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (isExpoGo || !Notifications) {
    console.warn('[PushNotifications] Remote push notifications are not supported in Expo Go. Skipping registration.');
    return null;
  }

  let token: string | null = null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#e20a22',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token for push notifications!');
      return null;
    }

    try {
      // Fetches the push token from Expo Notification Services
      const pushToken = await Notifications.getExpoPushTokenAsync();
      token = pushToken.data;
      console.log('[PushNotifications] Registered Token:', token);
    } catch (error) {
      console.warn('[PushNotifications] Error fetching token:', error);
    }
  } else {
    console.log('[PushNotifications] Must use a physical device for notifications');
  }

  return token;
}

export async function sendLocalNotification(title: string, body: string) {
  if (Notifications) {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          sound: true,
        },
        trigger: null, // deliver immediately
      });
    } catch (e) {
      console.warn('Failed to send local notification:', e);
      toast.info(`${title}: ${body}`);
    }
  } else {
    toast.info(`🔔 ${title}: ${body}`);
  }
}

