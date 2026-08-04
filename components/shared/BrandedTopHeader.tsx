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
import { THEME } from '../../lib/theme';

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

  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

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
          backgroundColor: colors.background,
          borderBottomColor: isDarkMode ? THEME.COLORS.dark.borderLight : colors.borderLight,
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
                  backgroundColor: isDarkMode ? THEME.COLORS.dark.surfaceElevated : colors.borderLight,
                },
              ]}
            >
              <ArrowLeft size={18} color={colors.textPrimary} />
            </ScalePressable>
          )}

          {title ? (
            <View style={styles.titleContainer}>
              <Text
                style={[
                  styles.titleText,
                  { color: colors.textPrimary },
                ]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[
                    styles.subtitleText,
                    { color: colors.textSecondary },
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
                    backgroundColor: isDarkMode ? THEME.COLORS.dark.surfaceElevated : colors.borderLight,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Logo size={20} />
              </View>
              <View style={styles.brandTextWrap}>
                <Text style={styles.brandTitle}>
                  <Text style={{ color: THEME.COLORS.brand.primary }}>Fast</Text>
                  <Text style={{ color: colors.textPrimary }}>Kirana</Text>
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
                backgroundColor: isDarkMode ? 'rgba(226, 10, 34, 0.1)' : THEME.COLORS.brand.primaryLight,
                borderColor: isDarkMode ? 'rgba(226, 10, 34, 0.25)' : '#fecdd3',
              },
            ]}
          >
            <MapPin size={11} color={THEME.COLORS.brand.primary} style={styles.locationPin} />
            <Text
              numberOfLines={1}
              style={[
                styles.locationText,
                { color: colors.textPrimary },
              ]}
            >
              {formatHeaderAddress(selectedLocation)}
            </Text>
            <ChevronDown size={9} color={colors.textSecondary} />
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
    paddingHorizontal: THEME.SPACING.lg,
    paddingVertical: THEME.SPACING.sm,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: THEME.SPACING.sm,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: THEME.SPACING.sm,
    flex: 1,
    flexShrink: 1,
    paddingRight: THEME.SPACING.xs,
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
    flexShrink: 1,
  },
  logoContainer: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: THEME.RADIUS.xs,
    borderWidth: 1,
    flexShrink: 0,
  },
  brandTextWrap: {
    marginLeft: THEME.SPACING.sm,
    flexShrink: 1,
  },
  brandTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.body,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    letterSpacing: -0.4,
    lineHeight: 17,
  },
  brandSubtitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    color: THEME.COLORS.brand.success,
    letterSpacing: 0.2,
    marginTop: 0,
  },
  titleContainer: {
    flex: 1,
    flexShrink: 1,
  },
  titleText: {
    fontSize: THEME.TYPOGRAPHY.sizes.body,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
    marginTop: 1,
  },
  locationCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: THEME.RADIUS.pill,
    paddingHorizontal: THEME.SPACING.sm,
    paddingVertical: THEME.SPACING.xs + 1,
    maxWidth: '48%',
    flexShrink: 0,
  },
  locationPin: {
    marginRight: 3,
    flexShrink: 0,
  },
  locationText: {
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    marginRight: 2,
    flexShrink: 1,
  },
});
