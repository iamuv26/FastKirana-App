import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { ArrowLeft, User, Phone, Mail, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { API_BASE_URL } from '../../lib/constants';
import { triggerHaptic } from '../../lib/haptic';
import { toast } from '../../lib/toast';
import { useTheme } from '../context/ThemeContext';
import { ScalePressable } from '../../components/shared/ScalePressable';
import { THEME } from '../../lib/theme';

export default function SignupScreen() {
  const { setAuth } = useAuthStore();
  const { theme } = useTheme();
  const isDarkMode = theme === 'dark';
  const colors = isDarkMode ? THEME.COLORS.dark : THEME.COLORS.light;

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isFormValid = name && phoneNumber.length === 10 && email && password;

  const handleSignup = async () => {
    if (!name || phoneNumber.length !== 10 || !email || !password) return;
    setIsLoading(true);
    triggerHaptic('light');

    try {
      const formattedPhone = `+91${phoneNumber}`;
      const signupRes = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone: formattedPhone }),
      });

      const signupData = await signupRes.json();
      if (!signupRes.ok) {
        throw new Error(signupData.error || 'Registration failed');
      }

      toast.success('Account created! Logging in...');

      const loginRes = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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

  const inputBg = isDarkMode ? 'rgba(39,39,42,0.35)' : THEME.COLORS.light.borderLight;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Heading */}
          <View style={styles.headingWrap}>
            <Text style={[styles.headingTitle, { color: colors.textPrimary }]}>Create Account</Text>
            <Text style={[styles.headingSub, { color: colors.textSecondary }]}>
              Sign up to get fresh groceries and fast-food in minutes.
            </Text>
          </View>

          <View style={styles.formWrap}>
            <View style={styles.fieldsContainer}>
              {/* Full Name Input */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: inputBg }]}>
                  <User size={18} color={colors.textSecondary} />
                  <TextInput
                    placeholder="Enter your full name"
                    placeholderTextColor={colors.textMuted}
                    value={name}
                    onChangeText={setName}
                    style={[styles.textInput, { color: colors.textPrimary }]}
                  />
                </View>
              </View>

              {/* Phone Number Input */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone Number</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: inputBg }]}>
                  <Phone size={18} color={colors.textSecondary} />
                  <Text style={[styles.countryCode, { color: colors.textPrimary }]}>+91</Text>
                  <TextInput
                    placeholder="Enter mobile number"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    style={[styles.textInput, { color: colors.textPrimary }]}
                  />
                </View>
              </View>

              {/* Email Input */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: inputBg }]}>
                  <Mail size={18} color={colors.textSecondary} />
                  <TextInput
                    placeholder="Enter your email address"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    style={[styles.textInput, { color: colors.textPrimary }]}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Password</Text>
                <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: inputBg }]}>
                  <Lock size={18} color={colors.textSecondary} />
                  <TextInput
                    placeholder="Create a strong password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    style={[styles.textInput, { color: colors.textPrimary }]}
                  />
                </View>
              </View>

              {/* Submit Button */}
              <ScalePressable
                onPress={handleSignup}
                disabled={isLoading || !isFormValid}
                scaleValue={0.96}
                haptic="success"
                style={[
                  styles.submitBtn,
                  {
                    backgroundColor: isLoading
                      ? colors.surfaceElevated
                      : isFormValid
                        ? THEME.COLORS.brand.primary
                        : colors.border,
                  },
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[
                    styles.submitBtnText,
                    { color: isFormValid ? '#ffffff' : colors.textMuted }
                  ]}>
                    Create Account
                  </Text>
                )}
              </ScalePressable>
            </View>

            {/* Link back to login */}
            <View style={styles.loginLinkWrap}>
              <Text style={[styles.loginLinkText, { color: colors.textMuted }]}>Already have an account?</Text>
              <ScalePressable
                onPress={() => router.push('/(auth)/login')}
                scaleValue={0.95}
                haptic="light"
              >
                <Text style={[styles.loginLinkBtn, { color: THEME.COLORS.brand.primary }]}>Log In</Text>
              </ScalePressable>
            </View>
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
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  headingWrap: {
    marginTop: THEME.SPACING.xxl,
    marginBottom: THEME.SPACING.xxl,
  },
  headingTitle: {
    fontSize: THEME.TYPOGRAPHY.sizes.title,
    fontWeight: THEME.TYPOGRAPHY.weights.black,
    lineHeight: 34,
  },
  headingSub: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    marginTop: THEME.SPACING.sm,
  },
  formWrap: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: THEME.SPACING.xxl,
  },
  fieldsContainer: {
    gap: THEME.SPACING.md,
  },
  fieldGroup: {
    gap: THEME.SPACING.xs + 2,
  },
  fieldLabel: {
    fontSize: THEME.TYPOGRAPHY.sizes.caption,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: THEME.RADIUS.lg,
    paddingHorizontal: THEME.SPACING.md,
    paddingVertical: THEME.SPACING.sm + 2,
    gap: THEME.SPACING.sm + 2,
  },
  textInput: {
    flex: 1,
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
    padding: 0,
  },
  countryCode: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
    marginRight: THEME.SPACING.sm,
  },
  submitBtn: {
    paddingVertical: THEME.SPACING.md + 4,
    borderRadius: THEME.RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: THEME.SPACING.md + 4,
  },
  submitBtnText: {
    fontSize: THEME.TYPOGRAPHY.sizes.bodySm,
    fontWeight: THEME.TYPOGRAPHY.weights.extrabold,
  },
  loginLinkWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: THEME.SPACING.xs,
    marginTop: THEME.SPACING.xxl,
  },
  loginLinkText: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.semibold,
  },
  loginLinkBtn: {
    fontSize: THEME.TYPOGRAPHY.sizes.micro,
    fontWeight: THEME.TYPOGRAPHY.weights.bold,
    textDecorationLine: 'underline',
  },
});
