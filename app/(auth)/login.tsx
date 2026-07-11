import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, ShieldCheck, Mail, Lock, User as UserIcon, Fingerprint, ScanFace, ShoppingBag, ChevronRight, ChevronDown, MapPin, Sun, Moon, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import * as Linking from 'expo-linking';
import { API_BASE_URL } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useUIStore } from '../../stores/ui-store';
import Logo from '../../components/shared/Logo';
import { formatHeaderAddress } from '../../lib/utils';
import AppFooter from '../../components/home/AppFooter';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';

// Pre-configured Local Mock Accounts for testing/demo
const localAccounts: Record<string, { id: string, role: 'ADMIN' | 'PICKER' | 'CHEF' | 'DELIVERY', name: string, phone: string, pass: string }> = {
  'admin': { id: 'cmqgzqeud0000vkid7hd6mti4', role: 'ADMIN', name: 'Store Administrator', phone: '+919999900000', pass: 'Yuvraj@26' },
  'picker': { id: 'cmqgzqf2k0002vkid1f3wpwg4', role: 'PICKER', name: 'Warehouse Picker', phone: '+919888811111', pass: 'Yuvraj@26' },
  'chef': { id: 'cmqgzqeyr0001vkiddw6qcuxc', role: 'CHEF', name: 'Kitchen Chef', phone: '+919888822222', pass: 'Yuvraj@26' },
  'rider': { id: 'cmqgzqf630003vkiderv1r9ur', role: 'DELIVERY', name: 'Delivery Rider', phone: '+919888833333', pass: 'Yuvraj@26' },
};

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const selectedLocation = useUIStore((s) => s.selectedLocation);

  // Shifting ambient blobs shared values
  const blob1X = useSharedValue(0);
  const blob1Y = useSharedValue(0);
  const blob2X = useSharedValue(0);
  const blob2Y = useSharedValue(0);

  useEffect(() => {
    blob1X.value = withRepeat(
      withSequence(
        withTiming(45, { duration: 7500, easing: Easing.inOut(Easing.ease) }),
        withTiming(-35, { duration: 7500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob1Y.value = withRepeat(
      withSequence(
        withTiming(-35, { duration: 6500, easing: Easing.inOut(Easing.ease) }),
        withTiming(45, { duration: 6500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob2X.value = withRepeat(
      withSequence(
        withTiming(-45, { duration: 8500, easing: Easing.inOut(Easing.ease) }),
        withTiming(35, { duration: 8500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    blob2Y.value = withRepeat(
      withSequence(
        withTiming(35, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
        withTiming(-35, { duration: 8000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(blob1X);
      cancelAnimation(blob1Y);
      cancelAnimation(blob2X);
      cancelAnimation(blob2Y);
    };
  }, []);

  // Handle incoming deep links for OAuth login callback
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      try {
        console.log('Incoming deep link:', event.url);
        const parsed = Linking.parse(event.url);
        // Normalize path by removing leading/trailing slashes
        const path = parsed.path ? parsed.path.replace(/^\/|\/$/g, '') : '';
        
        if (path === 'login-callback' && parsed.queryParams?.user) {
          let userStr = parsed.queryParams.user as string;
          if (userStr.includes('%')) {
            userStr = decodeURIComponent(userStr);
          }
          const userObj = JSON.parse(userStr);
          
          // Extract the token dynamically from query params or user object
          const token = (parsed.queryParams?.token as string) || userObj.token || 'google-oauth-session-token';
          
          triggerHaptic('success');
          setAuth(token, userObj);
          toast.success('Successfully logged in with Google!');
          
          // Redirect to appropriate console or homepage based on role
          if (userObj.role === 'PICKER') router.replace('/picker');
          else if (userObj.role === 'CHEF') router.replace('/chef');
          else if (userObj.role === 'DELIVERY') router.replace('/rider');
          else if (userObj.role === 'ADMIN') router.replace('/operations');
          else router.replace('/(tabs)');
        }
      } catch (err) {
        console.error('Failed to parse Google OAuth callback user data:', err);
        toast.error('Google login failed. Please try again.');
      }
    };

    // Listen for deep links when the app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if the app was opened from a deep link (cold start)
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleGoogleSignIn = () => {
    triggerHaptic('light');
    
    // Generate redirect URL for mobile callback dynamically using Linking.createURL
    let mobileRedirectUrl = Linking.createURL('login-callback');
    
    // For standalone production builds (APK), force the custom scheme so it works over 5G/cellular data
    if (!__DEV__) {
      mobileRedirectUrl = 'fastkirana://login-callback';
    }
    
    // Format Next.js custom entry URL
    const domain = API_BASE_URL.replace('/api', ''); // e.g. https://www.fastkirana.in
    const entryUrl = `${domain}/auth/mobile-login?redirect=${encodeURIComponent(mobileRedirectUrl)}`;
    
    console.log('Initiating Google sign-in with entry URL:', entryUrl);
    Linking.openURL(entryUrl);
  };

  const animatedBlob1 = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob1X.value },
      { translateY: blob1Y.value }
    ]
  }));

  const animatedBlob2 = useAnimatedStyle(() => ({
    transform: [
      { translateX: blob2X.value },
      { translateY: blob2Y.value }
    ]
  }));
  
  // Auth steps: 'EMAIL' | 'PASSWORD' | 'OTP' | 'PROFILE'
  const [step, setStep] = useState<'EMAIL' | 'PASSWORD' | 'OTP' | 'PROFILE'>('EMAIL');
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');

  // Input states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Backend response states
  const [isWorker, setIsWorker] = useState(false);
  const [hasPassword, setHasPassword] = useState(true);
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [backendEmail, setBackendEmail] = useState('');

  // Biometrics
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [lastUser, setLastUser] = useState<any>(null);
  
  // Focus borders
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    async function checkBiometrics() {
      try {
        const { mmkvStorage } = require('../../lib/storage');
        const LocalAuthentication = require('expo-local-authentication');
        
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (hasHardware && isEnrolled) {
          const savedUserRaw = mmkvStorage.getItem('last_logged_in_user');
          if (savedUserRaw) {
            setHasBiometrics(true);
            setLastUser(JSON.parse(savedUserRaw));
          }
        }
      } catch (e) {
        console.warn('Biometrics check failed:', e);
      }
    }
    checkBiometrics();
  }, []);

  const handleBiometricLogin = async () => {
    if (!lastUser) return;
    triggerHaptic('light');
    
    try {
      const LocalAuthentication = require('expo-local-authentication');
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Log in as ${lastUser.name || lastUser.email}`,
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
      });
      
      if (result.success) {
        triggerHaptic('success');
        setAuth('session-token-placeholder', lastUser);
        toast.success(`Welcome back, ${lastUser.name || 'User'}!`);
        
        // Route according to role
        if (lastUser.role === 'PICKER') {
          router.replace('/picker');
        } else if (lastUser.role === 'CHEF') {
          router.replace('/chef');
        } else if (lastUser.role === 'DELIVERY') {
          router.replace('/rider');
        } else if (lastUser.role === 'ADMIN') {
          router.replace('/operations');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (e) {
      console.warn('Biometric authentication failed:', e);
    }
  };

  const isPhoneNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.length === 10;
  };

  const normalizePhoneNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, '');
    if (cleaned.length === 10) return `+91${cleaned}`;
    return val;
  };

  const formatIdentifierDisplay = (val: string): string => {
    if (val.startsWith('wa-') && val.includes('@')) {
      const phoneDigits = val.split('@')[0].replace('wa-', '');
      return `+91 ${phoneDigits}`;
    }
    return val;
  };

  // Step 1: Submit Email/WhatsApp
  const handleEmailSubmit = async () => {
    const trimmedInput = email.trim();
    if (!trimmedInput) {
      Alert.alert('Required', loginType === 'WHATSAPP' ? 'WhatsApp number is required' : 'Email is required');
      return;
    }

    if (loginType === 'WHATSAPP' && !isPhoneNumber(trimmedInput)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    triggerHaptic('light');

    const normalizedInput = loginType === 'WHATSAPP' ? normalizePhoneNumber(trimmedInput) : trimmedInput.toLowerCase();
    setPhoneNumber(loginType === 'WHATSAPP' ? trimmedInput : '');
    if (loginType === 'WHATSAPP') {
      setPhone(trimmedInput);
    }

    try {
      const res = await fetch(`${API_BASE_URL}/auth/email/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedInput }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to check account status');
      }

      setIsWorker(data.isWorker ?? false);
      setHasPassword(data.hasPassword ?? false);
      setNeedsProfileSetup(data.needsProfileSetup ?? false);
      setUserRole(data.role ?? '');

      let finalEmail = normalizedInput;
      if (data.email) {
        finalEmail = data.email;
        setEmail(data.email);
        if (data.email.startsWith('wa-')) {
          const phoneDigits = data.email.split('@')[0].replace('wa-', '');
          setPhone(`+91${phoneDigits}`);
        }
      }

      if (data.isWorker) {
        if (!data.hasPassword) {
          throw new Error('Your admin hasn\'t set your password yet. Please contact your admin.');
        }
        setStep('PASSWORD');
      } else {
        await sendOtp(finalEmail);
      }
    } catch (err: any) {
      Alert.alert('Login Error', err.message || 'Unable to contact backend.');
    } finally {
      setIsLoading(false);
    }
  };

  // Send OTP Helper
  const sendOtp = async (targetEmail: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail.toLowerCase().trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP code');
      }

      setBackendEmail(targetEmail);
      toast.success('OTP verification code sent!');
      setStep('OTP');
    } catch (err: any) {
      Alert.alert('OTP Error', err.message || 'Failed to dispatch verification OTP.');
    }
  };

  // Step 2a: Password Login for staff
  const handlePasswordSubmit = async () => {
    if (!password) return;
    setIsLoading(true);
    triggerHaptic('light');

    // Pre-configured demo check
    const lowerEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    if (localAccounts[lowerEmail] && cleanPassword === localAccounts[lowerEmail].pass) {
      const mockUser = {
        id: localAccounts[lowerEmail].id,
        email: lowerEmail.includes('@') ? lowerEmail : `${lowerEmail}@fastkirana.com`,
        name: localAccounts[lowerEmail].name,
        phone: localAccounts[lowerEmail].phone,
        role: localAccounts[lowerEmail].role,
      };

      try {
        const { mmkvStorage } = require('../../lib/storage');
        mmkvStorage.setItem('last_logged_in_user', JSON.stringify(mockUser));
      } catch (e) {
        console.warn('Failed to save last logged in user:', e);
      }

      setAuth('session-token-placeholder', mockUser);
      toast.success(`Logged in as ${mockUser.name}!`);
      setIsLoading(false);

      if (mockUser.role === 'PICKER') router.replace('/picker');
      else if (mockUser.role === 'CHEF') router.replace('/chef');
      else if (mockUser.role === 'DELIVERY') router.replace('/rider');
      else if (mockUser.role === 'ADMIN') router.replace('/operations');
      else router.replace('/(tabs)');
      return;
    }

    try {
      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: lowerEmail, password }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) {
        throw new Error(loginData.error || 'Login failed');
      }

      if (loginData.success && loginData.user) {
        try {
          const { mmkvStorage } = require('../../lib/storage');
          mmkvStorage.setItem('last_logged_in_user', JSON.stringify(loginData.user));
        } catch (e) {
          console.warn('Failed to save last logged in user:', e);
        }
        setAuth('session-token-placeholder', loginData.user);
        toast.success('Logged in successfully!');
        
        // Route according to role
        if (loginData.user.role === 'PICKER') router.replace('/picker');
        else if (loginData.user.role === 'CHEF') router.replace('/chef');
        else if (loginData.user.role === 'DELIVERY') router.replace('/rider');
        else if (loginData.user.role === 'ADMIN') router.replace('/operations');
        else router.replace('/(tabs)');
      } else {
        throw new Error('Invalid password or username');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2b: Customer OTP verification
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    
    // If it's a new registration and we haven't completed name entry yet, transition to profile setup
    if (needsProfileSetup && step !== 'PROFILE') {
      triggerHaptic('medium');
      toast.info('New account detected! Please enter your name to continue.');
      setStep('PROFILE');
      return;
    }

    setIsLoading(true);
    triggerHaptic('light');

    try {
      const loginPayload: any = {
        email: backendEmail || email,
        otp,
      };

      if (needsProfileSetup && name.trim()) {
        loginPayload.name = name.trim();
        loginPayload.phone = phone.trim() || phoneNumber;
      }

      const verifyRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginPayload),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Verification failed');
      }

      if (verifyData.success && verifyData.user) {
        try {
          const { mmkvStorage } = require('../../lib/storage');
          mmkvStorage.setItem('last_logged_in_user', JSON.stringify(verifyData.user));
        } catch (e) {
          console.warn('Failed to save last logged in user:', e);
        }
        setAuth('session-token-placeholder', verifyData.user);
        toast.success('Logged in successfully!');
        
        if (verifyData.user.role === 'PICKER') router.replace('/picker');
        else if (verifyData.user.role === 'CHEF') router.replace('/chef');
        else if (verifyData.user.role === 'DELIVERY') router.replace('/rider');
        else if (verifyData.user.role === 'ADMIN') router.replace('/operations');
        else router.replace('/(tabs)');
      } else {
        throw new Error('Invalid authentication response');
      }
    } catch (err: any) {
      Alert.alert('Verification Failed', err.message || 'OTP verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset to email step
  const goBackToEmail = () => {
    setStep('EMAIL');
    setPassword('');
    setOtp('');
    setName('');
    setPhone('');
    setIsWorker(false);
    setHasPassword(true);
    setNeedsProfileSetup(false);
    setUserRole('');

    if (email.startsWith('wa-') && email.includes('@')) {
      const phoneDigits = email.split('@')[0].replace('wa-', '');
      setEmail(phoneDigits);
      setLoginType('WHATSAPP');
    }
  };

  // Helper to trigger demo login automatically
  const handleQuickDemo = (role: string) => {
    triggerHaptic('medium');
    setEmail(role);
    setPassword(role === 'admin' ? 'admin123' : `${role}123`);
    toast.success(`Loaded credentials for ${role.toUpperCase()}`);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? '#09090b' : '#f8fafc' }}>
      {/* Premium Header */}
      <View 
        style={{
          width: '100%',
          backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
          zIndex: 50,
          borderBottomWidth: 1,
          borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 }}>
          {/* Top Row: Location & Theme */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            {/* Left: Brand Logo & Text */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ 
                backgroundColor: isDarkMode ? '#18181b' : '#f1f5f9', 
                padding: 4, 
                borderRadius: 8, 
                borderWidth: 1, 
                borderColor: isDarkMode ? '#27272a' : '#e2e8f0',
                flexShrink: 0
              }}>
                <Logo size={24} />
              </View>
              <View style={{ marginLeft: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '900', letterSpacing: -0.5, lineHeight: 18 }}>
                  <Text style={{ color: isDarkMode ? '#fafafa' : '#0f172a' }}>Fast</Text>
                  <Text style={{ color: '#e20a22' }}>Kirana</Text>
                </Text>
                <Text style={{ fontSize: 7, fontWeight: '900', color: '#16a34a', letterSpacing: 0.3, marginTop: 0 }}>
                  DELIVERY APP
                </Text>
              </View>
            </View>

            {/* Right: Location Capsule Picker */}
            <Pressable 
              onPress={() => {
                triggerHaptic('light');
                router.push('/location-picker');
              }}
              style={({ pressed }) => ({
                opacity: pressed ? 0.85 : 1,
                maxWidth: '60%'
              })}
            >
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: isDarkMode ? 'rgba(226,10,34,0.1)' : '#fff5f5', 
                borderWidth: 1, 
                borderColor: isDarkMode ? 'rgba(226,10,34,0.25)' : '#fecdd3', 
                borderRadius: 20, 
                paddingHorizontal: 8, 
                paddingVertical: 5,
                justifyContent: 'center',
              }}>
                <MapPin size={11} color="#e20a22" style={{ flexShrink: 0, marginRight: 3 }} />
                <Text 
                  numberOfLines={1} 
                  style={{ 
                    fontSize: 10, 
                    fontWeight: 'bold', 
                    color: isDarkMode ? '#fafafa' : '#0f172a',
                    flexShrink: 1,
                    marginRight: 3
                  }}
                >
                  {formatHeaderAddress(selectedLocation)}
                </Text>
                <ChevronDown size={8} color={isDarkMode ? '#cbd5e1' : '#64748b'} style={{ flexShrink: 0 }} />
              </View>
            </Pressable>
          </View>

          {/* Bottom Row: Search Box Shortcut */}
          <Pressable 
            onPress={() => {
              triggerHaptic('light');
              router.push('/search');
            }}
            className="flex-row items-center bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-full px-4 h-11 w-full active:scale-[0.99]"
            style={Platform.OS === 'ios' ? {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.02,
              shadowRadius: 4,
            } : Platform.OS === 'android' ? {
              elevation: 1,
            } : undefined}
          >
            <Search size={16} color="#e20a22" style={{ marginRight: 10 }} />
            <Text style={{ fontSize: 13, color: '#94a3b8', fontWeight: '500', flex: 1 }}>
              Search for products...
            </Text>
          </Pressable>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          style={{ flex: 1 }} 
          showsVerticalScrollIndicator={false}
        >
          <View style={{ paddingHorizontal: 20, flex: 1 }}>
          {/* Decorative ambient blobs in background */}
          <Animated.View 
            style={[
              animatedBlob1,
              {
                position: 'absolute',
                top: 24,
                left: '10%',
                width: 250,
                height: 250,
                borderRadius: 125,
                backgroundColor: isDarkMode ? 'rgba(226, 10, 34, 0.05)' : 'rgba(226, 10, 34, 0.02)',
                pointerEvents: 'none'
              }
            ]}
          />
          <Animated.View 
            style={[
              animatedBlob2,
              {
                position: 'absolute',
                bottom: 40,
                right: '10%',
                width: 300,
                height: 300,
                borderRadius: 150,
                backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.05)' : 'rgba(99, 102, 241, 0.02)',
                pointerEvents: 'none'
              }
            ]}
          />

          <View style={{ flex: 1, justifyContent: 'center', paddingVertical: 24 }}>
            {/* Frosted Glassmorphic Main Card */}
            <LinearGradient
              colors={isDarkMode ? ['#1a1112', '#121214'] : ['#fff5f5', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: '100%',
                borderRadius: 32,
                borderWidth: 1,
                borderColor: isDarkMode ? '#2d2d30' : '#ffe4e6',
                padding: 24,
                shadowColor: '#e20a22',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: isDarkMode ? 0.35 : 0.12,
                shadowRadius: 18,
                elevation: 4,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Internal card background design glows */}
              <View style={{ position: 'absolute', top: -60, right: -60, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(226, 10, 34, 0.08)', pointerEvents: 'none' }} />
              <View style={{ position: 'absolute', bottom: -60, left: -60, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(99, 102, 241, 0.08)', pointerEvents: 'none' }} />

              {/* Logo Box exactly like Web App */}
              <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 24 }}>
                <View style={{
                  width: 64,
                  height: 64,
                  borderRadius: 32,
                  backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: isDarkMode ? '#2d2d30' : '#ffe4e6',
                  shadowColor: '#e20a22',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.12,
                  shadowRadius: 12,
                  elevation: 3
                }}>
                  <Logo size={40} />
                </View>

                <Text style={{
                  marginTop: 16,
                  textAlign: 'center',
                  color: isDarkMode ? '#ffffff' : '#0f172a',
                  fontSize: 22,
                  fontWeight: '800',
                  letterSpacing: -0.4
                }}>
                  {step === 'EMAIL' && 'Welcome to FastKirana'}
                  {step === 'PASSWORD' && 'Enter Password'}
                  {step === 'OTP' && (email.startsWith('wa-') || loginType === 'WHATSAPP' ? 'Verify WhatsApp' : 'Verify Email')}
                  {step === 'PROFILE' && 'Complete Profile'}
                </Text>
                
                <Text style={{
                  marginTop: 6,
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#64748b',
                  fontWeight: '500',
                  lineHeight: 18,
                  maxWidth: 280,
                  alignSelf: 'center'
                }}>
                  {step === 'EMAIL' && 'Log in or sign up to shop groceries with fast delivery'}
                  {step === 'PASSWORD' && `Enter password for ${email}`}
                  {step === 'OTP' && `We sent a 6-digit OTP code to ${formatIdentifierDisplay(email)}`}
                  {step === 'PROFILE' && 'Enter your name and phone number to finish setup'}
                </Text>
              </View>

              {/* Biometric Quick Login Card */}
              {hasBiometrics && lastUser && step === 'EMAIL' && (
                <TouchableOpacity
                  onPress={handleBiometricLogin}
                  activeOpacity={0.85}
                  style={{
                    marginBottom: 20,
                    borderRadius: 16,
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: isDarkMode ? 'rgba(253, 164, 175, 0.15)' : 'rgba(226, 10, 34, 0.12)',
                    shadowColor: '#e20a22',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDarkMode ? 0.1 : 0.03,
                    shadowRadius: 8,
                    elevation: 2
                  }}
                >
                  <LinearGradient
                    colors={isDarkMode ? ['#4c0519', '#881337'] : ['#fff1f2', '#ffe4e6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                  >
                    <View style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: isDarkMode ? 'rgba(253, 164, 175, 0.1)' : 'rgba(226, 10, 34, 0.06)',
                      borderWidth: 1,
                      borderColor: isDarkMode ? 'rgba(253, 164, 175, 0.2)' : 'rgba(226, 10, 34, 0.15)',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Fingerprint size={22} color={isDarkMode ? '#fda4af' : '#e20a22'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: isDarkMode ? '#fda4af' : '#e20a22', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>Quick Unlock</Text>
                      <Text style={{ color: isDarkMode ? '#ffffff' : '#0f172a', fontSize: 13, fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
                        {lastUser.name || lastUser.email}
                      </Text>
                    </View>
                    <ScanFace size={18} color={isDarkMode ? '#fda4af' : '#e20a22'} />
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* STEP 1: TAB-LESS FLOW (WhatsApp default, Bottom Link switcher) */}
              {step === 'EMAIL' && (
                <View style={{ gap: 12 }}>
                  {/* Input Label & Wrapper */}
                  <View style={{ gap: 6 }}>
                    <Text style={{
                      color: isDarkMode ? '#cbd5e1' : '#4b5563',
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6
                    }}>
                      {loginType === 'WHATSAPP' ? 'Mobile Number' : 'Email Address'}
                    </Text>
                    
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: focusedField === 'identifier' ? '#e20a22' : (isDarkMode ? '#2c2c2e' : '#e2e8f0'),
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.01,
                      shadowRadius: 2
                    }}>
                      {loginType === 'WHATSAPP' ? (
                        <Phone size={16} color={focusedField === 'identifier' ? '#e20a22' : '#94a3b8'} />
                      ) : (
                        <Mail size={16} color={focusedField === 'identifier' ? '#e20a22' : '#94a3b8'} />
                      )}
                      
                      <TextInput
                        placeholder={loginType === 'WHATSAPP' ? 'Enter 10-digit mobile number' : 'name@example.com'}
                        placeholderTextColor={isDarkMode ? '#52525b' : '#94a3b8'}
                        keyboardType={loginType === 'WHATSAPP' ? 'numeric' : 'email-address'}
                        autoCapitalize="none"
                        maxLength={loginType === 'WHATSAPP' ? 10 : undefined}
                        value={email}
                        onChangeText={(val) => {
                          if (loginType === 'WHATSAPP') {
                            setEmail(val.replace(/\D/g, '').slice(0, 10));
                          } else {
                            setEmail(val);
                          }
                        }}
                        onFocus={() => setFocusedField('identifier')}
                        onBlur={() => setFocusedField(null)}
                        textContentType={loginType === 'WHATSAPP' ? 'telephoneNumber' : 'emailAddress'}
                        autoComplete={loginType === 'WHATSAPP' ? 'tel' : 'email'}
                        style={{
                          flex: 1,
                          marginLeft: 10,
                          color: isDarkMode ? '#ffffff' : '#0f172a',
                          fontSize: 13,
                          fontWeight: '600',
                          padding: 0
                        }}
                      />
                    </View>
                  </View>

                  {/* Action Button */}
                  <TouchableOpacity
                    onPress={handleEmailSubmit}
                    disabled={isLoading || !email}
                    activeOpacity={0.9}
                    style={{
                      borderRadius: 99,
                      overflow: 'hidden',
                      marginTop: 8,
                      shadowColor: '#e20a22',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.2,
                      shadowRadius: 12,
                      elevation: 3
                    }}
                  >
                    <LinearGradient
                      colors={['#e20a22', '#ff2d55']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 14,
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexDirection: 'row',
                        gap: 8
                      }}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={{ color: '#ffffff', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                          Continue
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* OR CONTINUE WITH Divider */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
                    <View style={{ flex: 1, height: 1, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0' }} />
                    <Text style={{
                      color: '#94a3b8',
                      fontSize: 10,
                      fontWeight: '800',
                      marginHorizontal: 12,
                      letterSpacing: 0.8
                    }}>
                      OR CONTINUE WITH
                    </Text>
                    <View style={{ flex: 1, height: 1, backgroundColor: isDarkMode ? '#27272a' : '#e2e8f0' }} />
                  </View>

                  {/* Google Sign In Button */}
                  <TouchableOpacity
                    onPress={handleGoogleSignIn}
                    activeOpacity={0.8}
                    style={{
                      width: '100%',
                      paddingVertical: 12,
                      backgroundColor: isDarkMode ? '#27272a' : '#ffffff',
                      borderWidth: 1,
                      borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0',
                      borderRadius: 99,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 8,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.03,
                      shadowRadius: 4,
                      elevation: 1,
                    }}
                  >
                    <View style={{ 
                      width: 18, 
                      height: 18, 
                      borderRadius: 9, 
                      backgroundColor: isDarkMode ? '#1e1e24' : '#f1f5f9', 
                      justifyContent: 'center', 
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDarkMode ? '#3f3f46' : '#e2e8f0'
                    }}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#4285F4' }}>G</Text>
                    </View>
                    <Text style={{ color: isDarkMode ? '#cbd5e1' : '#334155', fontWeight: '800', fontSize: 12.5, letterSpacing: -0.2 }}>
                      Google Sign In
                    </Text>
                  </TouchableOpacity>

                  {/* Bottom Tabless Switcher Link */}
                  <Pressable
                    onPress={() => {
                      triggerHaptic('light');
                      setLoginType(loginType === 'WHATSAPP' ? 'EMAIL' : 'WHATSAPP');
                      setEmail('');
                    }}
                    style={{ marginTop: 12, alignSelf: 'center', padding: 6 }}
                  >
                    <Text style={{
                      color: '#64748b',
                      fontSize: 12,
                      fontWeight: '700',
                      textDecorationLine: 'underline',
                      textAlign: 'center'
                    }}>
                      {loginType === 'WHATSAPP' 
                        ? 'Are you an Admin or Staff? Login with Email' 
                        : 'Are you a Customer? Login with Mobile Number'}
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* STEP 2a: WORKER PASSWORD INPUT */}
              {step === 'PASSWORD' && (
                <View style={{ gap: 12 }}>
                  <View style={{ gap: 6 }}>
                    <Text style={{
                      color: isDarkMode ? '#cbd5e1' : '#4b5563',
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6
                    }}>
                      Password
                    </Text>
                    
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: focusedField === 'password' ? '#e20a22' : (isDarkMode ? '#2c2c2e' : '#e2e8f0'),
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: isDarkMode ? '#09090b' : '#ffffff',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.01,
                      shadowRadius: 2
                    }}>
                      <Lock size={16} color={focusedField === 'password' ? '#e20a22' : '#94a3b8'} />
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor={isDarkMode ? '#52525b' : '#94a3b8'}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        style={{
                          flex: 1,
                          marginLeft: 10,
                          color: isDarkMode ? '#ffffff' : '#0f172a',
                          fontSize: 13,
                          fontWeight: '600',
                          padding: 0
                        }}
                      />
                    </View>
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    onPress={handlePasswordSubmit}
                    disabled={isLoading || !password}
                    activeOpacity={0.9}
                    style={{
                      borderRadius: 99,
                      overflow: 'hidden',
                      marginTop: 8,
                      shadowColor: '#e20a22',
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.15,
                      shadowRadius: 12,
                      elevation: 3
                    }}
                  >
                    <LinearGradient
                      colors={['#e20a22', '#ff4d62']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        paddingVertical: 14,
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          Login with Password
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Dev selectors removed */}
                </View>
              )}

              {/* STEP 2b: CUSTOMER OTP INPUT */}
              {step === 'OTP' && (
                <View style={{ gap: 12 }}>
                  <View style={{ gap: 6 }}>
                    <Text style={{
                      color: isDarkMode ? '#cbd5e1' : '#4b5563',
                      fontSize: 11,
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: 0.6
                    }}>
                      Enter 6-Digit OTP
                    </Text>
                    
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: focusedField === 'otp' ? '#10b981' : (isDarkMode ? '#2c2c2e' : '#e2e8f0'),
                      borderRadius: 14,
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      backgroundColor: isDarkMode ? '#09090b' : '#ffffff'
                    }}>
                      <ShieldCheck size={16} color={focusedField === 'otp' ? '#10b981' : '#94a3b8'} />
                      <TextInput
                        placeholder="123456"
                        placeholderTextColor={isDarkMode ? '#52525b' : 'rgba(148,163,184,0.4)'}
                        keyboardType="numeric"
                        maxLength={6}
                        value={otp}
                        onChangeText={(val) => setOtp(val.replace(/\D/g, ''))}
                        onFocus={() => setFocusedField('otp')}
                        onBlur={() => setFocusedField(null)}
                        textContentType="oneTimeCode"
                        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                        style={{
                          flex: 1,
                          color: isDarkMode ? '#ffffff' : '#0f172a',
                          fontSize: 14,
                          fontWeight: '800',
                          letterSpacing: 8,
                          textAlign: 'center',
                          padding: 0
                        }}
                      />
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={goBackToEmail}
                      activeOpacity={0.85}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: isDarkMode ? '#2c2c2e' : '#e2e8f0',
                        borderRadius: 99,
                        paddingVertical: 14,
                        alignItems: 'center',
                        backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff'
                      }}
                    >
                      <Text style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        Back
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleVerifyOtp}
                      disabled={isLoading || otp.length !== 6}
                      activeOpacity={0.85}
                      style={{
                        flex: 2,
                        borderRadius: 99,
                        overflow: 'hidden',
                        shadowColor: '#10b981',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                        elevation: 3
                      }}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
                            Verify Code
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  <Pressable onPress={() => sendOtp(backendEmail || email)} style={{ marginTop: 8 }}>
                    <Text style={{
                      width: '100%',
                      textAlign: 'center',
                      fontSize: 12,
                      fontWeight: '800',
                      color: '#059669',
                      textDecorationLine: 'underline'
                    }}>
                      Resend OTP code
                    </Text>
                  </Pressable>
                </View>
              )}

              {/* STEP 3: CONFIGURE PROFILE */}
              {step === 'PROFILE' && (
                <View style={{ gap: 12 }}>
                  <View style={{ gap: 10 }}>
                    {/* Full Name */}
                    <View style={{ gap: 6 }}>
                      <Text style={{
                        color: isDarkMode ? '#cbd5e1' : '#4b5563',
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 0.6
                      }}>
                        Full Name
                      </Text>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: focusedField === 'name' ? '#e20a22' : (isDarkMode ? '#2c2c2e' : '#e2e8f0'),
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: isDarkMode ? '#09090b' : '#ffffff'
                      }}>
                        <UserIcon size={16} color={focusedField === 'name' ? '#e20a22' : '#94a3b8'} />
                        <TextInput
                          placeholder="John Doe"
                          placeholderTextColor={isDarkMode ? '#52525b' : '#94a3b8'}
                          value={name}
                          onChangeText={setName}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          textContentType="name"
                          autoComplete="name"
                          style={{
                            flex: 1,
                            marginLeft: 10,
                            color: isDarkMode ? '#ffffff' : '#0f172a',
                            fontSize: 13,
                            fontWeight: '600',
                            padding: 0
                          }}
                        />
                      </View>
                    </View>

                    {/* Mobile Number */}
                    <View style={{ gap: 6 }}>
                      <Text style={{
                        color: isDarkMode ? '#cbd5e1' : '#4b5563',
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 0.6
                      }}>
                        Mobile Number
                      </Text>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: focusedField === 'phone' ? '#e20a22' : (isDarkMode ? '#2c2c2e' : '#e2e8f0'),
                        borderRadius: 14,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        backgroundColor: isDarkMode ? '#09090b' : '#ffffff'
                      }}>
                        <Phone size={16} color={focusedField === 'phone' ? '#e20a22' : '#94a3b8'} />
                        <TextInput
                          placeholder="9876543210"
                          placeholderTextColor={isDarkMode ? '#52525b' : '#94a3b8'}
                          keyboardType="numeric"
                          value={phone}
                          onChangeText={(val) => setPhone(val.replace(/\D/g, ''))}
                          onFocus={() => setFocusedField('phone')}
                          textContentType="telephoneNumber"
                          autoComplete="tel"
                          onBlur={() => setFocusedField(null)}
                          style={{
                            flex: 1,
                            marginLeft: 10,
                            color: isDarkMode ? '#ffffff' : '#0f172a',
                            fontSize: 13,
                            fontWeight: '600',
                            padding: 0
                          }}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={() => setStep('OTP')}
                      activeOpacity={0.85}
                      style={{
                        flex: 1,
                        borderWidth: 1,
                        borderColor: isDarkMode ? '#2c2c2e' : '#e2e8f0',
                        borderRadius: 99,
                        paddingVertical: 14,
                        alignItems: 'center',
                        backgroundColor: isDarkMode ? '#1c1c1e' : '#ffffff'
                      }}
                    >
                      <Text style={{ color: isDarkMode ? '#cbd5e1' : '#475569', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'PlusJakartaSans_700Bold' }}>
                        Back
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handleVerifyOtp}
                      disabled={isLoading || !name.trim() || !phone.trim()}
                      activeOpacity={0.85}
                      style={{
                        flex: 2,
                        borderRadius: 99,
                        overflow: 'hidden',
                        shadowColor: '#e20a22',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                        elevation: 3
                      }}
                    >
                      <LinearGradient
                        colors={['#e20a22', '#ff4d62']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={{ paddingVertical: 14, alignItems: 'center', justifyContent: 'center' }}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={{ color: '#ffffff', fontWeight: '800', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'PlusJakartaSans_800ExtraBold' }}>
                            Save & Sign In
                          </Text>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </LinearGradient>
            
            {/* Secure login notice */}
            {step === 'EMAIL' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 24 }}>
                <Text style={{ color: isDarkMode ? '#52525b' : '#94a3b8', fontSize: 11, fontWeight: '600' }}>
                  🔒 Secure verification. First-time users will be auto-registered.
                </Text>
              </View>
            )}
          </View>
          </View>
          <View style={{ marginTop: 40 }}>
            <AppFooter />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
