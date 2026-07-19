import { View, Text, Platform } from 'react-native';
import { Zap, Eye, Heart } from 'lucide-react-native';
import { useTheme } from '../../app/context/ThemeContext';
import { THEME } from '../../lib/theme';

export default function SpeedStrip() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <View 
      style={{
        marginHorizontal: THEME.SPACING.lg,
        marginBottom: THEME.SPACING.lg,
        padding: THEME.SPACING.md,
        borderRadius: THEME.RADIUS.lg,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        borderWidth: 1,
        backgroundColor: isDarkMode ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.85)',
        borderColor: isDarkMode ? THEME.COLORS.dark.borderLight : 'rgba(0,0,0,0.04)',
        ...Platform.select<any>({
          ios: THEME.SHADOWS.sm,
          android: {
            elevation: 2,
          },
        }),
      }}
    >
      <View className="items-center flex-row gap-2">
        <Zap size={14} color={THEME.COLORS.brand.primary} fill={THEME.COLORS.brand.primary} />
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }}>8 Min Delivery</Text>
          <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '500', color: isDarkMode ? THEME.COLORS.dark.textSecondary : THEME.COLORS.light.textSecondary }} className="uppercase tracking-wider">Average Speed</Text>
        </View>
      </View>
      <View style={{ width: 1, height: 24, backgroundColor: isDarkMode ? THEME.COLORS.dark.border : THEME.COLORS.light.border }} />
      
      <View className="items-center flex-row gap-2">
        <Eye size={14} color="#0284c7" />
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }}>1,231+ Buyers</Text>
          <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '500', color: isDarkMode ? THEME.COLORS.dark.textSecondary : THEME.COLORS.light.textSecondary }} className="uppercase tracking-wider">Online Now</Text>
        </View>
      </View>
      <View style={{ width: 1, height: 24, backgroundColor: isDarkMode ? THEME.COLORS.dark.border : THEME.COLORS.light.border }} />

      <View className="items-center flex-row gap-2">
        <Heart size={13} color={THEME.COLORS.brand.primary} fill={THEME.COLORS.brand.primary} />
        <View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: isDarkMode ? THEME.COLORS.dark.textPrimary : THEME.COLORS.light.textPrimary }}>5,000+ Orders</Text>
          <Text style={{ fontSize: THEME.TYPOGRAPHY.sizes.micro, fontWeight: '500', color: isDarkMode ? THEME.COLORS.dark.textSecondary : THEME.COLORS.light.textSecondary }} className="uppercase tracking-wider">Delivered</Text>
        </View>
      </View>
    </View>
  );
}
