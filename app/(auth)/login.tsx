import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithApple, signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/services/auth';
import { NativeIcon } from '@/components/NativeIcon';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  React.useEffect(() => {
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
    } catch (error) {
      if (__DEV__) {
        console.error('Apple sign in error:', error);
      }
      if (error instanceof Error && error.message !== 'Sign in cancelled') {
        Alert.alert('Error', error.message || 'Failed to sign in with Apple');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithGoogle();
    } catch (error) {
      if (__DEV__) {
        console.error('Google sign in error:', error);
      }
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        await signUpWithEmail(email.trim(), password);
        Alert.alert('Success', 'Account created! Please check your email to verify your account.');
      } else {
        await signInWithEmail(email.trim(), password);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Email auth error:', error);
      }
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : `Failed to ${isSignUp ? 'sign up' : 'sign in'}`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#F3F4F6', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Welcome
          </Text>
        </View>

        <View style={styles.content}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <NativeIcon name="sparkles" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.title} accessibilityRole="header">
              SpotCheck
            </Text>
            <Text style={styles.subtitle}>
              Track your important documents
            </Text>
          </View>

          {/* Social Buttons */}
          <View style={styles.socialSection}>
            {/* Apple Sign In */}
            {appleAvailable && (
              <View style={styles.appleButton}>
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                  buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={14}
                  style={{ width: '100%', height: 50 }}
                  onPress={handleAppleSignIn}
                />
              </View>
            )}

            {/* Google Sign In */}
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={loading}
              style={[
                styles.googleButton,
                loading && styles.buttonDisabled
              ]}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              activeOpacity={0.7}
            >
              <NativeIcon name="mail" size={20} color="#000000" />
              <Text style={styles.googleButtonLabel}>
                Continue with Google
              </Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Email Form */}
          <View style={styles.formCard}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.textInput}
              editable={!loading}
              accessibilityLabel="Email"
            />

            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              autoCapitalize="none"
              autoComplete={isSignUp ? 'password-new' : 'password'}
              style={styles.textInput}
              editable={!loading}
              accessibilityLabel="Password"
            />

            <TouchableOpacity
              onPress={handleEmailAuth}
              disabled={loading}
              style={[
                styles.emailButton,
                loading && styles.buttonDisabled
              ]}
              accessibilityRole="button"
              accessibilityLabel={isSignUp ? 'Create Account' : 'Sign In'}
              accessibilityState={{ disabled: loading }}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.emailButtonText}>
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Toggle */}
          <TouchableOpacity
            onPress={() => setIsSignUp(!isSignUp)}
            disabled={loading}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Switch to Sign In' : 'Switch to Create Account'}
          >
            <Text style={styles.toggleText}>
              {isSignUp ? 'Already have an account? ' : 'New here? '}
              <Text style={styles.toggleLink}>
                {isSignUp ? 'Sign In' : 'Create Account'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 17,
    textAlign: 'center',
    fontWeight: '400',
  },
  socialSection: {
    marginBottom: 24,
  },
  appleButton: {
    marginBottom: 12,
  },
  googleButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleButtonLabel: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: '400',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: '#000000',
    marginBottom: 16,
    fontWeight: '400',
  },
  emailButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  emailButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  toggle: {
    alignItems: 'center',
  },
  toggleText: {
    color: '#8E8E93',
    fontSize: 17,
    fontWeight: '400',
  },
  toggleLink: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
