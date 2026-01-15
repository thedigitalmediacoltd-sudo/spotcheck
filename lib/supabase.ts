import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Database } from '@/types/supabase';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Secure Storage Adapter for Supabase
 * Uses Expo SecureStore which encrypts data using the device's Keychain (iOS) or Keystore (Android)
 * This is CRITICAL for security - session tokens must be encrypted, not stored in plain text
 */
class SecureStoreAdapter {
  async getItem(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      if (__DEV__) {
        console.error('SecureStore getItem error:', error);
      }
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      if (__DEV__) {
        console.error('SecureStore setItem error:', error);
      }
      throw error;
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      if (__DEV__) {
        console.error('SecureStore removeItem error:', error);
      }
    }
  }
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: new SecureStoreAdapter(), // CRITICAL: Uses encrypted Keychain/Keystore, not unencrypted AsyncStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
