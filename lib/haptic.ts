import * as Haptics from 'expo-haptics';

export type HapticType = 'light' | 'medium' | 'success' | 'warning';

export function triggerHaptic(type: HapticType = 'light') {
  try {
    switch (type) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      default:
        Haptics.selectionAsync();
        break;
    }
  } catch (err) {
    console.warn('Native haptic feedback failed:', err);
  }
}
