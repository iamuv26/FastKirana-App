import { View, Text, TextInput, Pressable,  KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ArrowLeft, User, Phone, Mail, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { API_BASE_URL } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';
import { useTheme } from '../context/ThemeContext';

export default function SignupScreen() {
  const { setAuth } = useAuthStore();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || phoneNumber.length !== 10 || !email || !password) return;
    setIsLoading(true);
    triggerHaptic('light');

    try {
      // 1. Sign up request
      const formattedPhone = `+91${phoneNumber}`;
      const signupRes = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: formattedPhone,
        }),
      });

      const signupData = await signupRes.json();
      if (!signupRes.ok) {
        throw new Error(signupData.error || 'Registration failed');
      }

      toast.success('Account created! Logging in...');

      // 2. Immediate log in request
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData.error || 'Initial login failed');
      }

      if (loginData.success && loginData.user) {
        setAuth('session-token-placeholder', loginData.user);
        toast.success('Logged in successfully!');
        router.replace('/(tabs)');
      } else {
        throw new Error('Authentication issue');
      }
    } catch (err: any) {
      Alert.alert('Signup Error', err.message || 'Unable to register account.');
    } finally {
      setIsLoading(false);
    }
  };

  const placeholderColor = isDarkMode ? '#52525b' : '#94a3b8';
  const iconColor = isDarkMode ? '#a1a1aa' : '#64748b';

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-zinc-950">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6 py-4" showsVerticalScrollIndicator={false}>

 
          {/* Heading */}
          <View className="mt-6 mb-6">
            <Text className="text-slate-800 dark:text-zinc-100 font-black text-3xl leading-tight">Create Account</Text>
            <Text className="text-slate-500 dark:text-zinc-400 text-sm mt-2">Sign up to get fresh groceries and fast-food in minutes.</Text>
          </View>
 
          <View className="flex-1 justify-between pb-8">
            <View className="gap-4">
              {/* Full Name Input */}
              <View className="gap-1.5">
                <Text className="text-slate-700 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider">Full Name</Text>
                <View className="flex-row items-center border border-slate-200 dark:border-zinc-850 focus:border-rose-500 px-3 py-3 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30">
                  <User size={18} color={iconColor} />
                  <TextInput
                    placeholder="Enter your full name"
                    placeholderTextColor={placeholderColor}
                    value={name}
                    onChangeText={setName}
                    className="flex-1 ml-2.5 text-slate-800 dark:text-zinc-100 font-semibold text-sm p-0"
                  />
                </View>
              </View>
 
              {/* Phone Number Input */}
              <View className="gap-1.5">
                <Text className="text-slate-700 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider">Phone Number</Text>
                <View className="flex-row items-center border border-slate-200 dark:border-zinc-850 focus:border-rose-500 px-3 py-3 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30">
                  <Phone size={18} color={iconColor} />
                  <Text className="text-slate-800 dark:text-zinc-100 font-bold ml-2 text-sm">+91</Text>
                  <TextInput
                    placeholder="Enter mobile number"
                    placeholderTextColor={placeholderColor}
                    keyboardType="numeric"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    className="flex-1 ml-2 text-slate-800 dark:text-zinc-100 font-bold text-sm p-0"
                  />
                </View>
              </View>
 
              {/* Email Input */}
              <View className="gap-1.5">
                <Text className="text-slate-700 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider">Email Address</Text>
                <View className="flex-row items-center border border-slate-200 dark:border-zinc-850 focus:border-rose-500 px-3 py-3 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30">
                  <Mail size={18} color={iconColor} />
                  <TextInput
                    placeholder="Enter your email address"
                    placeholderTextColor={placeholderColor}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    className="flex-1 ml-2.5 text-slate-800 dark:text-zinc-100 font-semibold text-sm p-0"
                  />
                </View>
              </View>
 
              {/* Password Input */}
              <View className="gap-1.5">
                <Text className="text-slate-700 dark:text-zinc-300 font-extrabold text-xs uppercase tracking-wider">Password</Text>
                <View className="flex-row items-center border border-slate-200 dark:border-zinc-850 focus:border-rose-500 px-3 py-3 rounded-xl bg-slate-50/50 dark:bg-zinc-900/30">
                  <Lock size={18} color={iconColor} />
                  <TextInput
                    placeholder="Create a strong password"
                    placeholderTextColor={placeholderColor}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    className="flex-1 ml-2.5 text-slate-800 dark:text-zinc-100 font-semibold text-sm p-0"
                  />
                </View>
              </View>
 
              {/* Submit Button */}
              <Pressable
                onPress={handleSignup}
                disabled={isLoading || !name || phoneNumber.length !== 10 || !email || !password}
                className={`py-4 rounded-xl items-center justify-center shadow-xs mt-3 ${
                  isLoading 
                    ? 'bg-slate-350 dark:bg-zinc-800'
                    : (name && phoneNumber.length === 10 && email && password)
                      ? 'bg-rose-600 active:bg-rose-700'
                      : 'bg-slate-200 dark:bg-zinc-800/80'
                }`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className={`font-extrabold text-sm ${
                    (name && phoneNumber.length === 10 && email && password) ? 'text-white' : 'text-slate-400 dark:text-zinc-500'
                  }`}>
                    Create Account
                  </Text>
                )}
              </Pressable>
            </View>
 
            {/* Link back to login */}
            <View className="flex-row items-center justify-center gap-1 mt-6">
              <Text className="text-slate-400 dark:text-zinc-500 text-xs font-semibold">Already have an account?</Text>
              <Pressable onPress={() => router.push('/(auth)/login')}>
                <Text className="text-rose-600 dark:text-rose-500 font-bold text-xs underline">Log In</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
