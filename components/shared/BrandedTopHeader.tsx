import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { MapPin, ChevronDown, ArrowLeft } from 'lucide-react-native';
import Logo from './Logo';
import { ScalePressable } from './ScalePressable';
import { useUIStore } from '../../stores/ui-store';
import { useTheme } from '../../app/context/ThemeContext';
import { formatHeaderAddress } from '../../lib/utils';
import { triggerHaptic } from '../../lib/haptic';

interface BrandedTopHeaderProps {
  showBack?: boolean;
  onBackPress?: () => void;
  title?: string;
  subtitle?: string;
  showLocation?: boolean;
  onLocationPress?: () => void;
  rightElement?: React.ReactNode;
  style?: any;
}

export default function BrandedTopHeader({
  showBack = false,
  onBackPress,
  title,
  subtitle,
  showLocation = true,
  onLocationPress,
  rightElement,
  style,
}: BrandedTopHeaderProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const selectedLocation = useUIStore((s) => s.selectedLocation);

  const handleBack = () => {
    triggerHaptic('light');
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const handleLocationClick = () => {
    triggerHaptic('light');
    if (onLocationPress) {
      onLocationPress();
    } else {
      router.push('/location-picker');
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
          borderBottomColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Section: Back Button + Brand Logo & Title */}
        <View style={styles.leftSection}>
          {showBack && (
            <ScalePressable
              onPress={handleBack}
              scaleValue={0.9}
              hitSlop={12}
              style={[
                styles.backBtn,
                {
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                },
              ]}
            >
              <ArrowLeft size={18} color={isDarkMode ? '#ffffff' : '#0f172a'} />
            </ScalePressable>
          )}

          {title ? (
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.titleText,
                  { color: isDarkMode ? '#fafafa' : '#0f172a' },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitleText,
                    { color: isDarkMode ? '#a1a1aa' : '#64748b' },
                  ]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>
          ) : (
            <ScalePressable
              onPress={() => {
                triggerHaptic('light');
                router.push('/(tabs)');
              }}
              scaleValue={0.97}
              style={styles.brandRow}
            >
              <View
                style={[
                  styles.logoContainer,
                  {
                    backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9',
                    borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                  },
                ]}
              >
                <Logo size={20} />
              </View>
              <View style={styles.brandTextWrap}>
                <Text style={styles.brandTitle}>
                  <Text style={{ color: '#e20a22' }}>Fast</Text>
                  <Text style={{ color: isDarkMode ? '#e4e4e7' : '#7c0617' }}>Kirana</Text>
                </Text>
                <Text style={styles.brandSubtitle}>DELIVERY APP</Text>
              </View>
            </ScalePressable>
          )}
        </View>

        {/* Right Section: Location Capsule Picker or Custom Right Element */}
        {rightElement ? (
          rightElement
        ) : showLocation ? (
          <ScalePressable
            onPress={handleLocationClick}
            scaleValue={0.96}
            style={[
              styles.locationCapsule,
              {
                backgroundColor: isDarkMode ? 'rgba(225, 29, 72, 0.1)' : '#fff5f5',
                borderColor: isDarkMode ? 'rgba(225, 29, 72, 0.3)' : '#fecdd3',
              },
            ]}
          >
            <MapPin size={11} color="#e20a22" style={styles.locationPin} />
            <Text
              numberOfLines={1}
              style={[
                styles.locationText,
                { color: isDarkMode ? '#fafafa' : '#0f172a' },
              ]}
            >
              {formatHeaderAddress(selectedLocation)}
            </Text>
            <ChevronDown size={9} color={isDarkMode ? '#cbd5e1' : '#64748b'} />
          </ScalePressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    zIndex: 50,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    paddingRight: 4,
  },
  backBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  brandTextWrap: {
    marginLeft: 5,
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: -0.4,
    lineHeight: 17,
  },
  brandSubtitle: {
    fontSize: 6.5,
    fontWeight: '900',
    color: '#16a34a',
    letterSpacing: 0.2,
    marginTop: 0,
  },
  titleContainer: {
    flex: 1,
    flexShrink: 1,
  },
  titleText: {
    fontSize: 14.5,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 9.5,
    fontWeight: '600',
    marginTop: 1,
  },
  locationCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    maxWidth: '66%',
    flex: 1,
    justifyContent: 'flex-end',
    flexShrink: 1,
  },
  locationPin: {
    marginRight: 3,
    flexShrink: 0,
  },
  locationText: {
    fontSize: 9.5,
    fontWeight: '800',
    marginRight: 2,
    flexShrink: 1,
  },
});
