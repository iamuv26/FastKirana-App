import { Alert, ToastAndroid, Platform } from 'react-native';

export const toast = {
  success: (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      // iOS / Other fallback
      console.log('Toast Success:', message);
    }
  },
  error: (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Alert', message);
    }
  },
  info: (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      console.log('Toast Info:', message);
    }
  },
  warning: (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Warning', message);
    }
  },
};
