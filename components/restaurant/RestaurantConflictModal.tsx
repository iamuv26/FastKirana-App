import React from 'react';
import { View, Text, Modal, StyleSheet, Platform } from 'react-native';
import { UtensilsCrossed } from 'lucide-react-native';
import { ScalePressable } from '../shared/ScalePressable';
import { useTheme } from '../../app/context/ThemeContext';
import { triggerHaptic } from '../../lib/haptic';

interface RestaurantConflictModalProps {
  visible: boolean;
  currentRestaurantName: string;
  newRestaurantName: string;
  onCancel: () => void;
  onConfirmReplace: () => void;
}

export default function RestaurantConflictModal({
  visible,
  currentRestaurantName,
  newRestaurantName,
  onCancel,
  onConfirmReplace,
}: RestaurantConflictModalProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
              borderColor: isDarkMode ? '#27272a' : '#fee2e2',
            },
          ]}
        >
          {/* Header Icon */}
          <View style={styles.iconWrap}>
            <UtensilsCrossed size={26} color="#ea580c" strokeWidth={2.2} />
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: isDarkMode ? '#fafafa' : '#0f172a' }]}>
            Replace items in cart?
          </Text>

          {/* Subtitle / Message */}
          <Text style={[styles.message, { color: isDarkMode ? '#a1a1aa' : '#475569' }]}>
            Your cart already contains items from{' '}
            <Text style={{ fontWeight: '800', color: isDarkMode ? '#fb923c' : '#ea580c' }}>
              {currentRestaurantName || 'another restaurant'}
            </Text>
            . Would you like to reset your cart to add dishes from{' '}
            <Text style={{ fontWeight: '800', color: isDarkMode ? '#fb923c' : '#ea580c' }}>
              {newRestaurantName || 'this restaurant'}
            </Text>
            ?
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <ScalePressable
              onPress={() => {
                triggerHaptic('light');
                onCancel();
              }}
              scaleValue={0.96}
              style={[
                styles.cancelBtn,
                {
                  backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
                  borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
                },
              ]}
            >
              <Text style={[styles.cancelBtnText, { color: isDarkMode ? '#d4d4d8' : '#334155' }]}>
                No, Keep Cart
              </Text>
            </ScalePressable>

            <ScalePressable
              onPress={() => {
                triggerHaptic('medium');
                onConfirmReplace();
              }}
              scaleValue={0.96}
              style={styles.replaceBtn}
            >
              <Text style={styles.replaceBtnText}>Replace & Add</Text>
            </ScalePressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 999,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  replaceBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#ea580c',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  replaceBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
