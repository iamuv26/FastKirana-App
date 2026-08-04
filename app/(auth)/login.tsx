import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, ShieldCheck, Mail, Lock, User as UserIcon, Fingerprint, ScanFace, ShoppingBag, ChevronRight, ChevronDown, MapPin, Sun, Moon, Search } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { API_BASE_URL } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';
import { useTheme } from '../context/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useUIStore } from '../../stores/ui-store';
import Logo from '../../components/shared/Logo';
import { ScalePressable } from '../../components/shared/ScalePressable';
import { formatHeaderAddress } from '../../lib/utils';
import AppFooter from '../../components/home/AppFooter';
import { THEME } from '../../lib/theme';
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
const localAccounts: Record<string, { id: string, role: 'ADMIN' | 'PICKER' | 'CHEF' | 'DELIVERY' | 'RESTAURANT_OWNER', name: string, phone: string, pass: string }> = {
  'admin': { id: 'cmqgzqeud0000vkid7hd6mti4', role: 'ADMIN', name: 'Store Administrator', phone: '+919999900000', pass: 'Yuvraj@26' },
  'admin@fastkirana.com': { id: 'cmqgzqeud0000vkid7hd6mti4', role: 'ADMIN', name: 'Store Administrator', phone: '+919999900000', pass: 'admin123' },
  'picker': { id: 'cmqgzqf2k0002vkid1f3wpwg4', role: 'PICKER', name: 'Warehouse Picker', phone: '+919888811111', pass: 'Yuvraj@26' },
  'chef': { id: 'cmqgzqeyr0001vkiddw6qcuxc', role: 'CHEF', name: 'Kitchen Chef', phone: '+919888822222', pass: 'Yuvraj@26' },
  'restaurant': { id: 'cmqgzqeyr0001vkiddw6qcuxc', role: 'CHEF', name: 'Restaurant Kitchen', phone: '+919888822222', pass: 'Yuvraj@26' },
  'rider': { id: 'cmqgzqf630003vkiderv1r9ur', role: 'DELIVERY', name: 'Delivery Rider', phone: '+919888833333', pass: 'Yuvraj@26' },
};

export default function LoginScreen() {
  const { setAuth } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;
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
        const path = parsed.path ? parsed.path.replace(/^\/|\/$/g, '') : '';

        if (path === 'login-callback' && parsed.queryParams?.user) {
          let userStr = parsed.queryParams.user as string;
          if (userStr.includes('%')) {
            userStr = decodeURIComponent(userStr);
          }
          const userObj = JSON.parse(userStr);

          const token = (parsed.queryParams?.token as string) || userObj.token || 'google-oauth-session-token';

          triggerHaptic('success');
          setAuth(token, userObj);
          toast.success('Successfully logged in with Google!');

          if (userObj.role === 'PICKER') router.replace('/picker');
          else if (userObj.role === 'CHEF' || userObj.role === 'RESTAURANT_OWNER') router.replace('/restaurant-chef');
          else if (userObj.role === 'DELIVERY') router.replace('/rider');
          else if (userObj.role === 'ADMIN') router.replace('/operations');
          else router.replace('/(tabs)');
        }
      } catch (err) {
        console.error('Failed to parse Google OAuth callback user data:', err);
        toast.error('Google login failed. Please try again.');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleGoogleSignIn = async () => {
    triggerHaptic('light');

    let mobileRedirectUrl = Linking.createURL('login-callback');

    if (!__DEV__) {
      mobileRedirectUrl = 'fastkirana://login-callback';
    }

    const domain = API_BASE_URL.replace('/api', '');
    const entryUrl = `${domain}/auth/mobile-login?redirect=${encodeURIComponent(mobileRedirectUrl)}`;

    console.log('Initiating Google sign-in with entry URL:', entryUrl);

    const result = await WebBrowser.openAuthSessionAsync(entryUrl, mobileRedirectUrl);

    if (result.type === 'success' && result.url) {
      try {
        const parsed = Linking.parse(result.url);
        const path = parsed.path ? parsed.path.replace(/^\/|\/$/g, '') : '';

        if (path === 'login-callback' && parsed.queryParams?.user) {
          let userStr = parsed.queryParams.user as string;
          if (userStr.includes('%')) {
            userStr = decodeURIComponent(userStr);
          }
          const userObj = JSON.parse(userStr);
          const token = (parsed.queryParams?.token as string) || userObj.token || 'google-oauth-session-token';

          triggerHaptic('success');
          setAuth(token, userObj);
          toast.success('Successfully logged in with Google!');

          if (userObj.role === 'PICKER') router.replace('/picker');
          else if (userObj.role === 'CHEF' || userObj.role === 'RESTAURANT_OWNER') router.replace('/restaurant-chef');
          else if (userObj.role === 'DELIVERY') router.replace('/rider');
          else if (userObj.role === 'ADMIN') router.replace('/operations');
          else router.replace('/(tabs)');
        }
      } catch (err) {
        console.error('Failed to parse Google OAuth callback:', err);
        toast.error('Google login failed. Please try again.');
      }
    }
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

        if (lastUser.role === 'PICKER') {
          router.replace('/picker');
        } else if (lastUser.role === 'CHEF' || lastUser.role === 'RESTAURANT_OWNER') {
          router.replace('/restaurant-chef');
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

    const lowerEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();

    const mockAccount = localAccounts[lowerEmail]
      || localAccounts[lowerEmail.split('@')[0]]
      || Object.entries(localAccounts).find(([k]) => lowerEmail.includes(k))?.[1];

    if (mockAccount && cleanPassword === mockAccount.pass) {
      const mockUser = {
        id: mockAccount.id,
        email: lowerEmail.includes('@') ? lowerEmail : `${lowerEmail}@fastkirana.com`,
        name: mockAccount.name,
        phone: mockAccount.phone,
        role: mockAccount.role,
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
      else if (mockUser.role === 'CHEF' || mockUser.role === 'RESTAURANT_OWNER') router.replace('/restaurant-chef');
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

        if (loginData.user.role === 'PICKER') router.replace('/picker');
        else if (loginData.user.role === 'CHEF' || loginData.user.role === 'RESTAURANT_OWNER') router.replace('/restaurant-chef');
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
  const handleVerifyOtp = async (otpValue?: string) => {
    const finalOtp = otpValue || otp;
    if (finalOtp.length !== 6) return;

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
        otp: finalOtp,
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
        else if (verifyData.user.role === 'CHEF' || verifyData.user.role === 'RESTAURANT_OWNER') router.replace('/restaurant-chef');
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

  const handleQuickLogin = async (identifier: string, bypassPassword?: string) => {
    setIsLoading(true);
    triggerHaptic('medium');
    try {
      if (bypassPassword) {
        const lowerEmail = identifier.toLowerCase().trim();
        if (localAccounts[lowerEmail]) {
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
          } catch (e) {}
          setAuth('session-token-placeholder', mockUser);
          toast.success(`Logged in as ${mockUser.name}!`);
          if (mockUser.role === 'ADMIN') router.replace('/operations');
          else router.replace('/(tabs)');
          return;
        }
      } else {
        setLoginType('WHATSAPP');
        setEmail(identifier);

        const checkRes = await fetch(`${API_BASE_URL}/auth/email/check`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: normalizePhoneNumber(identifier) }),
        });
        const checkData = await checkRes.json();
        if (!checkRes.ok) {
          throw new Error(checkData.error || 'Failed to check account');
        }

        const finalEmail = checkData.email || normalizePhoneNumber(identifier);
        setEmail(finalEmail);
        setBackendEmail(finalEmail);
        setIsWorker(checkData.isWorker ?? false);
        setHasPassword(checkData.hasPassword ?? false);
        setNeedsProfileSetup(checkData.needsProfileSetup ?? false);
        setUserRole(checkData.role ?? '');

        const otpRes = await fetch(`${API_BASE_URL}/auth/otp/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: finalEmail.toLowerCase().trim() }),
        });
        const otpData = await otpRes.json();
        if (!otpRes.ok) {
          throw new Error(otpData.error || 'Failed to send OTP');
        }

        if (otpData.otp) {
          setOtp(otpData.otp);
          toast.success('Verification code auto-filled! ⚡');
          await handleVerifyOtp(otpData.otp);
        } else {
          setStep('OTP');
          toast.info('Verification code sent. Please enter the OTP to complete login.');
        }
      }
    } catch (err: any) {
      Alert.alert('Quick Login Failed', err.message || 'Verification failed.');
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

  const handleQuickDemo = (role: string) => {
    triggerHaptic('medium');
    setEmail(role);
    setPassword(role === 'admin' ? 'admin123' : `${role}123`);
    toast.success(`Loaded credentials for ${role.toUpperCase()}`);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderColor: isDarkMode ? 'rgba(255,255,255,0.06)' : THEME.COLORS.light.borderLight,
          }
        ]}
      >
        <View style={styles.headerInner}>
          {/* Top Row: Location & Theme */}
          <View style={styles.headerTopRow}>
            {/* Left: Brand Logo & Text */}
            <View style={styles.brandRow}>
              <View style={[
                styles.logoBox,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.borderLight,
                }
              ]}>
                <Logo size={24} />
              </View>
              <View style={styles.brandTextWrap}>
                <Text style={styles.brandTitle}>
                  <Text style={{ color: colors.textPrimary }}>Fast</Text>
                  <Text style={{ color: THEME.COLORS.brand.primary }}>Kirana</Text>
                </Text>
                <Text style={{ color: THEME.COLORS.brand.success, letterSpacing: 0.3, marginTop: 0 }}>
                  DELIVERY APP
                </Text>
              </View>
            </View>
            {/* Right: Location Capsule Picker */}
            <ScalePressable
              onPress={() => {
                router.push('/location-picker');
              }}
              scaleValue={0.96}
              style={styles.locationCapsule}
            >
              <View style={[
                styles.locationInner,
                {
                  backgroundColor: isDarkMode ? `${THEME.COLORS.brand.primary}1A` : '#fff5f5',
                  borderColor: isDarkMode ? `${THEME.COLORS.brand.primary}40` : '#fecdd3',
                }
              ]}>
                <MapPin size={11} color={THEME.COLORS.brand.primary} style={{ flexShrink: 0, marginRight: 3 }} />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.locationText,
                    {
                      color: colors.textPrimary,
                      flexShrink: 1,
                      marginRight: 3
                    }
                  ]}
                >
                  {formatHeaderAddress(selectedLocation)}
                </Text>
                <ChevronDown size={8} color={isDarkMode ? colors.textSecondary : THEME.COLORS.light.textSecondary} style={{ flexShrink: 0 }} />
              </View>
            </ScalePressable>
          </View>

          {/* Bottom Row: Search Box Shortcut */}
          <ScalePressable
            onPress={() => {
              router.push('/search');
            }}
            scaleValue={0.99}
            style={styles.searchShortcutWrap}
          >
            <View style={[
              styles.searchShortcut,
              {
                backgroundColor: isDarkMode ? colors.surfaceElevated : THEME.COLORS.light.surface,
                borderColor: colors.borderLight,
              }
            ]}>
              <Search size={16} color={THEME.COLORS.brand.primary} style={{ marginRight: 10 }} />
              <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500', flex: 1 }}>
                Search for products...
              </Text>
            </View>
          </ScalePressable>
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
          <View style={styles.scrollContent}>
          {/* Decorative ambient blobs in background */}
          <Animated.View
            style={[
              animatedBlob1,
              styles.blob,
              {
                top: 24,
                left: '10%',
                width: 250,
                height: 250,
                borderRadius: 125,
                backgroundColor: isDarkMode ? `${THEME.COLORS.brand.primary}0D` : `${THEME.COLORS.brand.primary}05`,
              }
            ]}
          />
          <Animated.View
            style={[
              animatedBlob2,
              styles.blob,
              {
                bottom: 40,
                right: '10%',
                width: 300,
                height: 300,
                borderRadius: 150,
                backgroundColor: isDarkMode ? `${THEME.COLORS.brand.accent}0D` : `${THEME.COLORS.brand.accent}05`,
              }
            ]}
          />

          <View style={styles.cardOuter}>
            {/* Frosted Glassmorphic Main Card */}
            <LinearGradient
              colors={isDarkMode ? ['#1a1112', '#121214'] : ['#fff5f5', '#ffffff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.mainCard,
                {
                  borderColor: isDarkMode ? '#2d2d30' : '#ffe4e6',
                  shadowColor: THEME.COLORS.brand.primary,
                  shadowOpacity: isDarkMode ? 0.35 : 0.12,
                }
              ]}
            >
              {/* Internal card background design glows */}
              <View style={{ position: 'absolute', top: -60, right: -60, width: 140, height: 140, borderRadius: 70, backgroundColor: `${THEME.COLORS.brand.primary}14`, pointerEvents: 'none' }} />
              <View style={{ position: 'absolute', bottom: -60, left: -60, width: 140, height: 140, borderRadius: 70, backgroundColor: `${THEME.COLORS.brand.accent}14`, pointerEvents: 'none' }} />

              {/* Logo Box exactly like Web App */}
              <View style={styles.logoSection}>
                <View style={[
                  styles.logoSquare,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: isDarkMode ? '#2d2d30' : '#ffe4e6',
                  }
                ]}>
                  <Logo size={40} />
                </View>

                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
                  {step === 'EMAIL' && 'Welcome to FastKirana'}
                  {step === 'PASSWORD' && 'Enter Password'}
                  {step === 'OTP' && (email.startsWith('wa-') || loginType === 'WHATSAPP' ? 'Verify WhatsApp' : 'Verify Email')}
                  {step === 'PROFILE' && 'Complete Profile'}
                </Text>

                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  {step === 'EMAIL' && 'Log in or sign up to shop groceries with fast delivery'}
                  {step === 'PASSWORD' && `Enter password for ${email}`}
                  {step === 'OTP' && `We sent a 6-digit OTP code to ${formatIdentifierDisplay(email)}`}
                  {step === 'PROFILE' && 'Enter your name and phone number to finish setup'}
                </Text>
              </View>

              {/* Biometric Quick Login Card */}
              {hasBiometrics && lastUser && step === 'EMAIL' && (
                <ScalePressable
                  onPress={handleBiometricLogin}
                  scaleValue={0.97}
                  haptic="medium"
                  style={[
                    styles.biometricCard,
                    {
                      borderColor: isDarkMode ? `${THEME.COLORS.brand.primary}26` : `${THEME.COLORS.brand.primary}1F`,
                      shadowColor: THEME.COLORS.brand.primary,
                      shadowOpacity: isDarkMode ? 0.1 : 0.03,
                    }
                  ]}
                >
                  <LinearGradient
                    colors={isDarkMode ? ['#4c0519', '#881337'] : ['#fff1f2', '#ffe4e6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.biometricGradient}
                  >
                    <View style={[
                      styles.biometricIconWrap,
                      {
                        backgroundColor: isDarkMode ? `${THEME.COLORS.brand.primary}1A` : `${THEME.COLORS.brand.primary}0F`,
                        borderColor: isDarkMode ? `${THEME.COLORS.brand.primary}33` : `${THEME.COLORS.brand.primary}26`,
                      }
                    ]}>
                      <Fingerprint size={22} color={isDarkMode ? THEME.COLORS.brand.primaryLight : THEME.COLORS.brand.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: isDarkMode ? THEME.COLORS.brand.primaryLight : THEME.COLORS.brand.primary, fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>Quick Unlock</Text>
                      <Text style={[styles.biometricName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {lastUser.name || lastUser.email}
                      </Text>
                    </View>
                    <ScanFace size={18} color={isDarkMode ? THEME.COLORS.brand.primaryLight : THEME.COLORS.brand.primary} />
                  </LinearGradient>
                </ScalePressable>
              )}

              {/* STEP 1: EMAIL/WHATSAPP INPUT */}
              {step === 'EMAIL' && (
                <View style={{ gap: 12 }}>
                  {/* Input Label & Wrapper */}
                  <View style={{ gap: 6 }}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                      {loginType === 'WHATSAPP' ? 'Mobile Number' : 'Email Address'}
                    </Text>

                    <View style={[
                      styles.fieldInputWrap,
                      {
                        borderColor: focusedField === 'identifier' ? THEME.COLORS.brand.primary : colors.border,
                        backgroundColor: colors.surfaceElevated,
                      }
                    ]}>
                      {loginType === 'WHATSAPP' ? (
                        <Phone size={16} color={focusedField === 'identifier' ? THEME.COLORS.brand.primary : colors.textMuted} />
                      ) : (
                        <Mail size={16} color={focusedField === 'identifier' ? THEME.COLORS.brand.primary : colors.textMuted} />
                      )}

                      <TextInput
                        placeholder={loginType === 'WHATSAPP' ? 'Enter 10-digit mobile number' : 'name@example.com'}
                        placeholderTextColor={colors.textMuted}
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
                        style={[styles.fieldTextInput, { color: colors.textPrimary }]}
                      />
                    </View>
                  </View>

                  {/* Action Button */}
                  <ScalePressable
                    onPress={handleEmailSubmit}
                    disabled={isLoading || !email}
                    scaleValue={0.96}
                    haptic="medium"
                    style={[
                      styles.actionBtnWrap,
                      {
                        shadowColor: THEME.COLORS.brand.primary,
                        shadowOpacity: 0.2,
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={[THEME.COLORS.brand.primary, '#ff2d55']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.actionBtnText}>Continue</Text>
                      )}
                    </LinearGradient>
                  </ScalePressable>

                  {/* OR CONTINUE WITH Divider */}
                  <View style={styles.dividerRow}>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                    <Text style={[styles.dividerText, { color: colors.textMuted }]}>
                      OR CONTINUE WITH
                    </Text>
                    <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                  </View>

                  {/* Google Sign In Button */}
                  <ScalePressable
                    onPress={handleGoogleSignIn}
                    scaleValue={0.96}
                    haptic="medium"
                    style={[
                      styles.googleBtn,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.border,
                        shadowColor: '#000',
                        shadowOpacity: 0.03,
                      }
                    ]}
                  >
                    <View style={[
                      styles.googleIconWrap,
                      {
                        backgroundColor: isDarkMode ? colors.surface : THEME.COLORS.light.borderLight,
                        borderColor: colors.border,
                      }
                    ]}>
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#4285F4' }}>G</Text>
                    </View>
                    <Text style={[styles.googleBtnText, { color: colors.textSecondary }]}>
                      Google Sign In
                    </Text>
                  </ScalePressable>

                  {/* Bottom Tabless Switcher Link */}
                  <Pressable
                    onPress={() => {
                      triggerHaptic('light');
                      setLoginType(loginType === 'WHATSAPP' ? 'EMAIL' : 'WHATSAPP');
                      setEmail('');
                    }}
                    style={{ marginTop: 12, alignSelf: 'center', padding: 6 }}
                  >
                    <Text style={[styles.switcherText, { color: colors.textMuted }]}>
                      {loginType === 'WHATSAPP'
                        ? 'Are you an Admin or Staff? Login with Email'
                        : 'Are you a Customer? Login with Mobile Number'}
                    </Text>
                  </Pressable>

                  {/* Skip and Browse as Guest Link */}
                  <Pressable
                    onPress={() => {
                      triggerHaptic('light');
                      router.replace('/(tabs)');
                    }}
                    style={({ pressed }) => ({
                      marginTop: 8,
                      alignSelf: 'center',
                      padding: 6,
                      opacity: pressed ? 0.65 : 1
                    })}
                  >
                    <Text style={[styles.guestLinkText, { color: THEME.COLORS.brand.primary }]}>
                      Skip & Browse as Guest ➜
                    </Text>
                  </Pressable>

                </View>
              )}

              {/* STEP 2a: WORKER PASSWORD INPUT */}
              {step === 'PASSWORD' && (
                <View style={{ gap: 12 }}>
                  <View style={{ gap: 6 }}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                      Password
                    </Text>

                    <View style={[
                      styles.fieldInputWrap,
                      {
                        borderColor: focusedField === 'password' ? THEME.COLORS.brand.primary : colors.border,
                        backgroundColor: colors.surfaceElevated,
                      }
                    ]}>
                      <Lock size={16} color={focusedField === 'password' ? THEME.COLORS.brand.primary : colors.textMuted} />
                      <TextInput
                        placeholder="••••••••"
                        placeholderTextColor={colors.textMuted}
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        style={[styles.fieldTextInput, { color: colors.textPrimary }]}
                      />
                    </View>
                  </View>

                  {/* Submit Button */}
                  <ScalePressable
                    onPress={handlePasswordSubmit}
                    disabled={isLoading || !password}
                    scaleValue={0.96}
                    haptic="medium"
                    style={[
                      styles.actionBtnWrap,
                      {
                        borderRadius: 99,
                        overflow: 'hidden',
                        shadowColor: THEME.COLORS.brand.primary,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                        elevation: 3
                      }
                    ]}
                  >
                    <LinearGradient
                      colors={[THEME.COLORS.brand.primary, '#ff4d62']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionGradient}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.actionBtnText}>Login with Password</Text>
                      )}
                    </LinearGradient>
                  </ScalePressable>
                </View>
              )}

              {/* STEP 2b: CUSTOMER OTP INPUT */}
              {step === 'OTP' && (
                <View style={{ gap: 12 }}>
                  <View style={{ gap: 6 }}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                      Enter 6-Digit OTP
                    </Text>

                    <View style={[
                      styles.fieldInputWrap,
                      {
                        borderColor: focusedField === 'otp' ? THEME.COLORS.brand.success : colors.border,
                        backgroundColor: colors.surfaceElevated,
                      }
                    ]}>
                      <ShieldCheck size={16} color={focusedField === 'otp' ? THEME.COLORS.brand.success : colors.textMuted} />
                      <TextInput
                        placeholder="123456"
                        placeholderTextColor={isDarkMode ? colors.textMuted : `${THEME.COLORS.light.textSecondary}66`}
                        keyboardType="numeric"
                        maxLength={6}
                        value={otp}
                        onChangeText={(val) => {
                          const cleaned = val.replace(/\D/g, '');
                          setOtp(cleaned);
                          if (cleaned.length === 6) {
                            handleVerifyOtp(cleaned);
                          }
                        }}
                        onFocus={() => setFocusedField('otp')}
                        onBlur={() => setFocusedField(null)}
                        textContentType="oneTimeCode"
                        autoComplete={Platform.OS === 'android' ? 'sms-otp' : 'one-time-code'}
                        style={[styles.otpInput, { color: colors.textPrimary }]}
                      />
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    <ScalePressable
                      onPress={goBackToEmail}
                      scaleValue={0.96}
                      haptic="light"
                      style={[
                        styles.secondaryBtn,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.surfaceElevated,
                        }
                      ]}
                    >
                      <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>
                        Back
                      </Text>
                    </ScalePressable>

                    <ScalePressable
                      onPress={() => handleVerifyOtp()}
                      disabled={isLoading || otp.length !== 6}
                      scaleValue={0.96}
                      haptic="success"
                      style={[
                        styles.verifyBtnWrap,
                        {
                          shadowColor: THEME.COLORS.brand.success,
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.15,
                          shadowRadius: 12,
                          elevation: 3
                        }
                      ]}
                    >
                      <LinearGradient
                        colors={[THEME.COLORS.brand.success, THEME.COLORS.brand.successDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.actionGradient}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.actionBtnText}>Verify Code</Text>
                        )}
                      </LinearGradient>
                    </ScalePressable>
                  </View>

                  <ScalePressable
                    onPress={() => sendOtp(backendEmail || email)}
                    scaleValue={0.95}
                    haptic="light"
                    style={{ marginTop: 8 }}
                  >
                    <Text style={[styles.resendText, { color: THEME.COLORS.brand.success }]}>
                      Resend OTP code
                    </Text>
                  </ScalePressable>
                </View>
              )}

              {/* STEP 3: CONFIGURE PROFILE */}
              {step === 'PROFILE' && (
                <View style={{ gap: 12 }}>
                  <View style={{ gap: 10 }}>
                    {/* Full Name */}
                    <View style={{ gap: 6 }}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        Full Name
                      </Text>
                      <View style={[
                        styles.fieldInputWrap,
                        {
                          borderColor: focusedField === 'name' ? THEME.COLORS.brand.primary : colors.border,
                          backgroundColor: colors.surfaceElevated,
                        }
                      ]}>
                        <UserIcon size={16} color={focusedField === 'name' ? THEME.COLORS.brand.primary : colors.textMuted} />
                        <TextInput
                          placeholder="John Doe"
                          placeholderTextColor={colors.textMuted}
                          value={name}
                          onChangeText={setName}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          textContentType="name"
                          autoComplete="name"
                          style={[styles.fieldTextInput, { color: colors.textPrimary }]}
                        />
                      </View>
                    </View>

                    {/* Mobile Number */}
                    <View style={{ gap: 6 }}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        Mobile Number
                      </Text>
                      <View style={[
                        styles.fieldInputWrap,
                        {
                          borderColor: focusedField === 'phone' ? THEME.COLORS.brand.primary : colors.border,
                          backgroundColor: colors.surfaceElevated,
                        }
                      ]}>
                        <Phone size={16} color={focusedField === 'phone' ? THEME.COLORS.brand.primary : colors.textMuted} />
                        <TextInput
                          placeholder="9876543210"
                          placeholderTextColor={colors.textMuted}
                          keyboardType="numeric"
                          value={phone}
                          onChangeText={(val) => setPhone(val.replace(/\D/g, ''))}
                          onFocus={() => setFocusedField('phone')}
                          textContentType="telephoneNumber"
                          autoComplete="tel"
                          onBlur={() => setFocusedField(null)}
                          style={[styles.fieldTextInput, { color: colors.textPrimary }]}
                        />
                      </View>
                    </View>
                  </View>

                  {/* Actions Row */}
                  <View style={styles.actionsRow}>
                    <ScalePressable
                      onPress={() => setStep('OTP')}
                      scaleValue={0.96}
                      haptic="light"
                      style={[
                        styles.secondaryBtn,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.surfaceElevated,
                        }
                      ]}
                    >
                      <Text style={[styles.secondaryBtnText, { color: colors.textSecondary }]}>
                        Back
                      </Text>
                    </ScalePressable>

                    <ScalePressable
                      onPress={() => handleVerifyOtp()}
                      disabled={isLoading || !name.trim() || !phone.trim()}
                      scaleValue={0.96}
                      haptic="success"
                      style={[
                        styles.actionBtnWrap,
                        {
                          borderRadius: 99,
                          overflow: 'hidden',
                          shadowColor: THEME.COLORS.brand.primary,
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 0.15,
                          shadowRadius: 12,
                          elevation: 3
                        }
                      ]}
                    >
                      <LinearGradient
                        colors={[THEME.COLORS.brand.primary, '#ff4d62']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.actionGradient}
                      >
                        {isLoading ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.actionBtnText}>Save & Sign In</Text>
                        )}
                      </LinearGradient>
                    </ScalePressable>
                  </View>
                </View>
              )}
            </LinearGradient>

            {/* Secure login notice */}
            {step === 'EMAIL' && (
              <View style={styles.noticeRow}>
                <Text style={[styles.noticeText, { color: colors.textMuted }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: '100%',
    zIndex: 50,
    borderBottomWidth: 1,
  },
  headerInner: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBox: {
    padding: 4,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  brandTextWrap: {
    marginLeft: 6,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
    lineHeight: 18,
  },
  locationCapsule: {
    maxWidth: '60%',
  },
  locationInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
    justifyContent: 'center',
  },
  locationText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  searchShortcutWrap: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    width: '100%',
  },
  searchShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 16,
    height: 44,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flex: 1,
  },
  blob: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  cardOuter: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  mainCard: {
    width: '100%',
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
    shadowOffset: { width: 0, height: 12 },
    shadowRadius: 18,
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  logoSquare: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: THEME.COLORS.brand.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    marginTop: 16,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  cardSubtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 18,
    maxWidth: 280,
    alignSelf: 'center',
  },
  biometricCard: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
  },
  biometricGradient: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  biometricIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricName: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  fieldTextInput: {
    flex: 1,
    marginLeft: 0,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  otpInput: {
    flex: 1,
    marginLeft: 0,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 8,
    textAlign: 'center',
    padding: 0,
  },
  actionBtnWrap: {
    width: '100%',
    borderRadius: 99,
    overflow: 'hidden',
    marginTop: 8,
  },
  actionGradient: {
    width: '100%',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: '800',
    marginHorizontal: 12,
    letterSpacing: 0.8,
  },
  googleBtn: {
    width: '100%',
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 99,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 1,
  },
  googleIconWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  googleBtnText: {
    fontWeight: '800',
    fontSize: 12.5,
    letterSpacing: -0.2,
  },
  switcherText: {
    fontSize: 12,
    fontWeight: '700',
    textDecorationLine: 'underline',
    textAlign: 'center',
  },
  guestLinkText: {
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 99,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryBtnText: {
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  verifyBtnWrap: {
    flex: 2,
    borderRadius: 99,
    overflow: 'hidden',
  },
  resendText: {
    width: '100%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 24,
  },
  noticeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
