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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { signInWithApple, signInWithGoogle, signInWithEmail, signUpWithEmail } from '@/services/auth';
import { Sparkles } from 'lucide-react-native';

export default function LoginScreen() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  React.useEffect(() => {
    // Check if Apple Authentication is available
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable);
    }
  }, []);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      await signInWithApple();
      // Navigation will happen automatically via auth state change
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
      // OAuth will redirect back to app
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
        // Navigation will happen automatically via auth state change
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
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center px-6 py-12">
        {/* Hero Section */}
        <View className="items-center mb-12">
          <View className="w-24 h-24 rounded-3xl bg-blue-600 items-center justify-center mb-6 shadow-lg">
            <Sparkles size={48} color="#FFFFFF" />
          </View>
          <Text
            className="text-4xl font-bold text-slate-900 mb-2"
            accessibilityRole="header"
          >
            SpotCheck
          </Text>
          <Text className="text-slate-500 text-base text-center">
            Your privacy-first admin automation
          </Text>
        </View>

        {/* Social Buttons */}
        <View className="mb-6">
          {/* Apple Sign In */}
          {appleAvailable && (
            <View className="mb-4">
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                cornerRadius={12}
                style={{ width: '100%', height: 50 }}
                onPress={handleAppleSignIn}
              />
            </View>
          )}

          {/* Google Sign In */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={loading}
            className="bg-white border border-slate-200 rounded-xl py-4 px-6 flex-row items-center justify-center shadow-sm mb-4"
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            accessibilityHint="Signs in using your Google account"
          >
            <Text className="text-slate-900 font-semibold text-base mr-2">G</Text>
            <Text className="text-slate-900 font-semibold text-base">
              Continue with Google
            </Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-slate-200" />
          <Text className="mx-4 text-slate-500 text-sm">or continue with email</Text>
          <View className="flex-1 h-px bg-slate-200" />
        </View>

        {/* Email Form */}
        <View className="mb-6">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="bg-slate-100 rounded-xl px-4 py-4 text-slate-900 mb-4"
            style={{ caretColor: '#2563EB' }}
            accessibilityLabel="Email"
            accessibilityHint="Enter your email address"
            editable={!loading}
          />

          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#94A3B8"
            secureTextEntry
            autoCapitalize="none"
            autoComplete={isSignUp ? 'password-new' : 'password'}
            className="bg-slate-100 rounded-xl px-4 py-4 text-slate-900 mb-4"
            style={{ caretColor: '#2563EB' }}
            accessibilityLabel="Password"
            accessibilityHint="Enter your password"
            editable={!loading}
          />

          <TouchableOpacity
            onPress={handleEmailAuth}
            disabled={loading}
            className={`bg-blue-600 rounded-xl py-4 items-center shadow-md ${
              loading ? 'opacity-50' : ''
            }`}
            accessibilityRole="button"
            accessibilityLabel={isSignUp ? 'Create Account' : 'Sign In'}
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text className="text-white font-semibold text-base">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Toggle */}
        <TouchableOpacity
          onPress={() => setIsSignUp(!isSignUp)}
          disabled={loading}
          className="items-center"
          accessibilityRole="button"
          accessibilityLabel={isSignUp ? 'Switch to Sign In' : 'Switch to Create Account'}
        >
          <Text className="text-slate-500 text-sm">
            {isSignUp ? 'Already have an account? ' : 'New here? '}
            <Text className="text-blue-600 font-semibold">
              {isSignUp ? 'Sign In' : 'Create Account'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
