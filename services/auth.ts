import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

/**
 * Sign in with Apple ID
 * Uses native Apple Authentication for iOS compliance
 */
export async function signInWithApple() {
  try {
    if (Platform.OS !== 'ios') {
      throw new Error('Apple Sign In is only available on iOS');
    }

    // Request Apple authentication
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Apple Sign In failed: No identity token received');
    }

    // Sign in to Supabase with Apple identity token
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    if (error instanceof AppleAuthentication.AppleAuthenticationError) {
      // User cancelled or error occurred
      if (error.code === AppleAuthentication.AppleAuthenticationErrorCode.CANCELED) {
        throw new Error('Sign in cancelled');
      }
    }
    throw error;
  }
}

/**
 * Sign in with Google
 * Uses Supabase OAuth flow (web-based for simplicity)
 */
export async function signInWithGoogle() {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.EXPO_PUBLIC_SUPABASE_REDIRECT_URL || 'spotcheck://'}`,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}
