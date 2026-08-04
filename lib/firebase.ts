import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { getDatabase } from 'firebase/database';
import { Platform } from 'react-native';
import { toast } from './toast';

// Firebase configuration from environment or production defaults
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDummyKeyFastKirana2026",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "fastkirana-app.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "fastkirana-app",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "fastkirana-app.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "6648d7703e29",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:6648d7703e29:web:fastkirana2026",
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || "https://fastkirana-app-default-rtdb.firebaseio.com",
};

// Initialize Firebase App singleton
export const firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Realtime Database for Live Order & Driver Location Tracking
export const firebaseRealtimeDb = getDatabase(firebaseApp);

/**
 * Register Firebase Cloud Messaging (FCM) Web & Mobile Push Token
 */
export async function getFcmPushToken(): Promise<string | null> {
  try {
    const messagingSupported = await isSupported();
    if (!messagingSupported) {
      console.log('[Firebase] Messaging not supported on this browser/platform.');
      return null;
    }

    const messaging = getMessaging(firebaseApp);
    
    // Request permission on Web
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('[Firebase] Notification permission denied by user.');
        return null;
      }
    }

    // Get FCM Token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || process.env.EXPO_PUBLIC_VAPID_KEY || 'BH-FastKirana-VAPID-Key-2026'
    });

    console.log('🔥 [Firebase] FCM Token obtained:', token);
    return token;
  } catch (error) {
    console.warn('[Firebase] Error obtaining FCM Token:', error);
    return null;
  }
}

/**
 * Listen for foreground push messages
 */
export async function listenForegroundMessages() {
  try {
    const messagingSupported = await isSupported();
    if (!messagingSupported) return;

    const messaging = getMessaging(firebaseApp);
    onMessage(messaging, (payload) => {
      console.log('🔥 [Firebase] Foreground Message received:', payload);
      const title = payload.notification?.title || 'FastKirana Update';
      const body = payload.notification?.body || 'You have a new update!';
      toast.info(`🔔 ${title}: ${body}`);
    });
  } catch (err) {
    console.warn('[Firebase] Error setting up foreground message listener:', err);
  }
}
