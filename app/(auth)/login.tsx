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
    <LinearGradient
      colors={['#F3E8FF', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-6 pt-12 pb-4">
          <Text
            className="text-2xl font-semibold text-slate-900"
            accessibilityRole="header"
          >
            Welcome
          </Text>
        </View>

        <View className="flex-1 justify-center px-6 py-8">
          {/* Hero Section */}
          <View className="items-center mb-10">
            <View className="w-24 h-24 rounded-3xl bg-purple-600 items-center justify-center mb-6 shadow-lg">
              <NativeIcon name="sparkles" size={48} color="#FFFFFF" />
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
                cornerRadius={24}
                style={{ width: '100%', height: 50 }}
                onPress={handleAppleSignIn}
              />
            </View>
          )}

          {/* Google Sign In */}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            disabled={loading}
            className="bg-white border border-purple-100 rounded-3xl py-4 px-6 flex-row items-center justify-center shadow-md mb-4"
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
          <View className="flex-1 h-px bg-purple-100" />
          <Text className="mx-4 text-slate-500 text-sm">or continue with email</Text>
          <View className="flex-1 h-px bg-purple-100" />
        </View>

        {/* Email Form */}
        <View className="mb-6 bg-white rounded-3xl p-6 shadow-md">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#94A3B8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            className="bg-purple-50 border border-purple-100 rounded-2xl px-4 py-4 text-slate-900 mb-4"
            style={{ caretColor: '#9333EA' }}
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
            className="bg-purple-50 border border-purple-100 rounded-2xl px-4 py-4 text-slate-900 mb-4"
            style={{ caretColor: '#9333EA' }}
            accessibilityLabel="Password"
            accessibilityHint="Enter your password"
            editable={!loading}
          />

          <TouchableOpacity
            onPress={handleEmailAuth}
            disabled={loading}
            className={`bg-purple-600 rounded-2xl py-4 items-center shadow-md ${
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
            <Text className="text-purple-600 font-semibold">
              {isSignUp ? 'Sign In' : 'Create Account'}
            </Text>
          </Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </LinearGradient>
  );
}
