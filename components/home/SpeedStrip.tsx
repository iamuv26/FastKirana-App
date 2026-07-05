import { View, Text } from 'react-native';
import { Zap, Eye, Heart } from 'lucide-react-native';

export default function SpeedStrip() {
  return (
    <View className="card-base mx-4 mb-4 p-3 rounded-2xl flex-row justify-around items-center">
      <View className="items-center flex-row gap-2">
        <Zap size={15} color="#e20a22" fill="#e20a22" />
        <View>
          <Text className="text-title text-xs">8 Min Delivery</Text>
          <Text className="text-subtitle text-[8px] uppercase tracking-wider">Average Speed</Text>
        </View>
      </View>
      <View className="h-6 w-[1px] bg-slate-200/50 dark:bg-zinc-800/80" />
      
      <View className="items-center flex-row gap-2">
        <Eye size={15} color="#0284c7" />
        <View>
          <Text className="text-title text-xs">1,231+ Buyers</Text>
          <Text className="text-subtitle text-[8px] uppercase tracking-wider">Online Now</Text>
        </View>
      </View>
      <View className="h-6 w-[1px] bg-slate-200/50 dark:bg-zinc-800/80" />

      <View className="items-center flex-row gap-2">
        <Heart size={14} color="#e20a22" fill="#e20a22" />
        <View>
          <Text className="text-title text-xs">5,000+ Orders</Text>
          <Text className="text-subtitle text-[8px] uppercase tracking-wider">Delivered</Text>
        </View>
      </View>
    </View>
  );
}
