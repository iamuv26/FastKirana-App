import { toast } from './toast';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

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

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

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
    if (Platform.OS !== 'web') {
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
