import React from 'react';
import { Modal, View, Text, StyleSheet, Platform, Pressable } from 'react-native';
import { ScalePressable } from './ScalePressable';
import { Bell, Check, X, Sparkles } from 'lucide-react-native';
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

  if (!visible) return null;

  // Clean title if emoji was passed in title prop
  const cleanTitle = title.replace(/[🔔🎉✨]/g, '').trim();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={[
          styles.alertContainer,
          { 
            backgroundColor: isDarkMode ? '#18181b' : '#ffffff', 
            borderColor: isDarkMode ? '#27272a' : '#f1f5f9' 
          }
        ]}>
          {/* Top Right Close X Button */}
          <Pressable 
            onPress={onClose}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: isDarkMode ? '#27272a' : '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 10,
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={15} color={isDarkMode ? '#a1a1aa' : '#64748b'} strokeWidth={2.5} />
          </Pressable>

          {/* Glowing Bell Badge Circle */}
          <View style={styles.iconCircleOuter}>
            <LinearGradient
              colors={isDarkMode ? ['#451a03', '#291002'] : ['#fff7ed', '#ffedd5']}
              style={styles.iconCircle}
            >
              <Bell size={30} color="#ea580c" strokeWidth={2.5} />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: isDarkMode ? '#fafafa' : '#0f172a' }]}>
            {cleanTitle}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: isDarkMode ? '#a1a1aa' : '#64748b' }]}>
            {message}
          </Text>

          {/* Got it Button */}
          <ScalePressable
            onPress={onClose}
            scaleValue={0.96}
            haptic="medium"
            style={styles.buttonWrapper}
          >
            <View style={{
              borderRadius: 16,
              backgroundColor: '#9f1239',
              paddingBottom: 3,
              shadowColor: '#e20a22',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}>
              <LinearGradient
                colors={['#e20a22', '#be123c', '#9f1239']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientButton}
              >
                <Check size={16} color="#ffffff" strokeWidth={3} />
                <Text style={styles.buttonText}>GOT IT</Text>
              </LinearGradient>
            </View>
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
    borderRadius: 24,
    width: '100%',
    maxWidth: 320,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 22,
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      }
    })
  },
  iconCircleOuter: {
    padding: 4,
    borderRadius: 40,
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    marginBottom: 16,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(234, 88, 12, 0.25)',
  },
  title: {
    fontWeight: '900',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  buttonWrapper: {
    width: '100%',
  },
  gradientButton: {
    borderRadius: 16,
    paddingVertical: 13,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  buttonText: {
    color: '#ffffff',
    fontWeight: '900',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
