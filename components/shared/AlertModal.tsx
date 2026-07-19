import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ScalePressable } from './ScalePressable';
import { Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../app/context/ThemeContext';
import { THEME } from '../../lib/theme';

interface AlertModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

export default function AlertModal({ visible, onClose, title, message }: AlertModalProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.alertContainer,
          { 
            backgroundColor: isDarkMode ? THEME.COLORS.dark.surface : THEME.COLORS.light.surface, 
            borderColor: isDarkMode ? THEME.COLORS.dark.border : '#ffe4e6' 
          }
        ]}>
          {/* Glowing Icon Circle */}
          <LinearGradient
            colors={isDarkMode ? ['#423812', '#2f270a'] : ['#fef08a', '#fde047']}
            style={styles.iconCircle}
          >
            <Bell size={28} color={isDarkMode ? '#eab308' : '#854d0e'} strokeWidth={2.5} />
          </LinearGradient>

          {/* Title */}
          <Text style={[styles.title, { color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: isDarkMode ? THEME.COLORS.dark.textSecondary : THEME.COLORS.light.textSecondary }]}>
            {message}
          </Text>

          {/* Got it Button */}
          <ScalePressable
            onPress={onClose}
            scaleValue={0.96}
            haptic="medium"
            style={styles.button}
          >
            <LinearGradient
              colors={THEME.COLORS.gradients.primary as any}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Text style={styles.buttonText}>Got It</Text>
            </LinearGradient>
          </ScalePressable>
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
    padding: 24,
  },
  alertContainer: {
    borderWidth: 1,
    borderRadius: THEME.RADIUS.xl,
    width: '100%',
    maxWidth: 320,
    padding: 24,
    alignItems: 'center',
    ...THEME.SHADOWS.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    shadowColor: '#eab308',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontWeight: '700',
    fontSize: 16.5,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 24,
  },
  button: {
    width: '100%',
    height: 46,
    borderRadius: THEME.RADIUS.xs,
    overflow: 'hidden',
  },
  gradientButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
