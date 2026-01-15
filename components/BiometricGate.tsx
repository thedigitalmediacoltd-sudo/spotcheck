import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { usePreferences } from '@/hooks/usePreferences';
import { Lock, FaceId, Fingerprint } from 'lucide-react-native';

interface BiometricGateProps {
  children: React.ReactNode;
}

export function BiometricGate({ children }: BiometricGateProps) {
  const { preferences } = usePreferences();
  const [isLocked, setIsLocked] = useState(true);
  const [hasHardware, setHasHardware] = useState(false);
  const [biometricType, setBiometricType] = useState<'face' | 'fingerprint' | null>(null);
  const [backgroundTime, setBackgroundTime] = useState<number | null>(null);
  const LOCK_TIMEOUT = 60000; // 1 minute in milliseconds

  useEffect(() => {
    checkBiometricAvailability();
  }, [preferences.requireFaceID]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const checkBiometricAvailability = async () => {
    try {
      // Check if Face ID is required in preferences
      if (!preferences.requireFaceID) {
        setIsLocked(false);
        return;
      }

      const compatible = await LocalAuthentication.hasHardwareAsync();
      setHasHardware(compatible);

      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('face');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('fingerprint');
        }

        // Authenticate on app start
        await authenticate();
      } else {
        // No biometric hardware, allow access
        setIsLocked(false);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Biometric check error:', error);
      }
      // If check fails, allow access (graceful degradation)
      setIsLocked(false);
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      // App went to background, record the time
      setBackgroundTime(Date.now());
    } else if (nextAppState === 'active' && backgroundTime !== null) {
      // App came back to foreground
      const timeInBackground = Date.now() - backgroundTime;
      
      if (timeInBackground > LOCK_TIMEOUT && hasHardware && preferences.requireFaceID) {
        // More than 1 minute passed, lock the app (only if Face ID is enabled)
        setIsLocked(true);
        authenticate();
      }
      
      setBackgroundTime(null);
    }
  };

  const authenticate = async () => {
    if (!hasHardware) {
      setIsLocked(false);
      return;
    }

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock SpotCheck',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false, // Allow device passcode as fallback
      });

      if (result.success) {
        setIsLocked(false);
      } else {
        // Authentication failed or was cancelled, keep locked
        setIsLocked(true);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Authentication error:', error);
      }
      // On error, keep locked for security
      setIsLocked(true);
    }
  };

  // If Face ID is disabled in preferences, don't show lock screen
  if (!preferences.requireFaceID) {
    return <>{children}</>;
  }

  // If no biometric hardware, don't show lock screen
  if (!hasHardware) {
    return <>{children}</>;
  }

  // If locked, show lock screen
  if (isLocked) {
    return (
      <View className="flex-1 bg-blue-600 items-center justify-center p-6">
        <View className="items-center">
          <View className="w-24 h-24 rounded-full bg-white/20 items-center justify-center mb-8">
            {biometricType === 'face' ? (
              <FaceId size={48} color="#FFFFFF" />
            ) : biometricType === 'fingerprint' ? (
              <Fingerprint size={48} color="#FFFFFF" />
            ) : (
              <Lock size={48} color="#FFFFFF" />
            )}
          </View>
          
          <Text 
            className="text-white text-3xl font-semibold mb-4 text-center"
            accessibilityRole="header"
          >
            SpotCheck is Locked
          </Text>
          
          <Text 
            className="text-white/80 text-base text-center mb-8 max-w-sm"
            accessibilityRole="text"
          >
            Use {biometricType === 'face' ? 'Face ID' : biometricType === 'fingerprint' ? 'Touch ID' : 'biometric authentication'} to unlock
          </Text>

          <TouchableOpacity
            onPress={authenticate}
            className="bg-white px-8 py-4 rounded-2xl shadow-lg"
            accessibilityRole="button"
            accessibilityLabel="Unlock with biometric authentication"
            accessibilityHint="Authenticates using Face ID or Touch ID to unlock the app"
          >
            <Text className="text-blue-600 font-semibold text-lg">
              Unlock
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Unlocked, show children
  return <>{children}</>;
}
