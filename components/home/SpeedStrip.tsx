import { View, Text, Platform } from 'react-native';
import { Zap, Eye, Heart } from 'lucide-react-native';
import { useTheme } from '../../app/context/ThemeContext';

export default function SpeedStrip() {
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';

  return (
    <View 
      className="mx-4 mb-5 p-3 rounded-2xl flex-row justify-around items-center border"
      style={{
        backgroundColor: isDarkMode ? 'rgba(28,28,30,0.85)' : 'rgba(255,255,255,0.85)',
        borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        ...Platform.select({
          ios: {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: isDarkMode ? 0.15 : 0.02,
            shadowRadius: 6,
          },
          android: {
            elevation: 1,
          },
        }),
      }}
    >
      <View className="items-center flex-row gap-2">
        <Zap size={15} color="#e20a22" fill="#e20a22" />
        <View>
          <Text className="text-xs font-black" style={{ color: isDarkMode ? '#fafafa' : '#1e293b' }}>8 Min Delivery</Text>
          <Text className="text-[8px] uppercase tracking-wider font-bold" style={{ color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Average Speed</Text>
        </View>
      </View>
      <View className="h-6 w-[1px] bg-slate-200/50 dark:bg-zinc-800/80" />
      
      <View className="items-center flex-row gap-2">
        <Eye size={15} color="#0284c7" />
        <View>
          <Text className="text-xs font-black" style={{ color: isDarkMode ? '#fafafa' : '#1e293b' }}>1,231+ Buyers</Text>
          <Text className="text-[8px] uppercase tracking-wider font-bold" style={{ color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Online Now</Text>
        </View>
      </View>
      <View className="h-6 w-[1px] bg-slate-200/50 dark:bg-zinc-800/80" />

      <View className="items-center flex-row gap-2">
        <Heart size={14} color="#e20a22" fill="#e20a22" />
        <View>
          <Text className="text-xs font-black" style={{ color: isDarkMode ? '#fafafa' : '#1e293b' }}>5,000+ Orders</Text>
          <Text className="text-[8px] uppercase tracking-wider font-bold" style={{ color: isDarkMode ? '#a1a1aa' : '#64748b' }}>Delivered</Text>
        </View>
      </View>
    </View>
  );
}
