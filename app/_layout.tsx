import { useEffect, useState } from 'react';
import { AppState, AppStateStatus, View, Text, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { queryClient } from '@/lib/queryClient';
import { initializeAudio } from '@/services/sensory';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { BiometricGate } from '@/components/BiometricGate';
import { PaywallProvider } from '@/context/PaywallContext';
import '../global.css';

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [showPrivacyCurtain, setShowPrivacyCurtain] = useState(false);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to overview if authenticated
      router.replace('/(tabs)/');
    }
  }, [session, loading, segments]);

  useEffect(() => {
    // Listen to app state changes for Privacy Curtain (only when authenticated)
    if (!session) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.match(/active/) && nextAppState.match(/inactive|background/)) {
        setShowPrivacyCurtain(true);
      } else if (appState.match(/inactive|background/) && nextAppState.match(/active/)) {
        setShowPrivacyCurtain(false);
      }
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, [appState, session]);

  // Show loading splash while checking session
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={{ width: 80, height: 80, borderRadius: 24, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }}>SC</Text>
          </View>
          <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 16 }} />
        </View>
      </View>
    );
  }

  // If authenticated, wrap with BiometricGate and Privacy Curtain
  if (session) {
    return (
      <BiometricGate>
        {showPrivacyCurtain ? (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <View style={{ alignItems: 'center' }}>
              <View style={{ width: 80, height: 80, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Text style={{ color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' }}>SC</Text>
              </View>
              <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '600' }}>SpotCheck</Text>
            </View>
          </View>
        ) : null}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="settings/index"
            options={{
              presentation: 'modal',
              headerShown: false,
            }}
          />
        </Stack>
      </BiometricGate>
    );
  }

  // Not authenticated, show auth stack
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings/index"
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Initialize audio mode on app start
    initializeAudio();

    // Suppress non-critical keep-awake errors (expo-keep-awake compatibility issue with RN 0.81.5)
    // This is a known issue that doesn't affect app functionality
    const errorHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
      // Filter out specific non-critical keep-awake errors (log for debugging)
      const keepAwakeErrorPattern = /^Unable to activate keep awake/;
      if (error?.message && keepAwakeErrorPattern.test(error.message) && !isFatal) {
        // Log in dev mode for debugging, but don't crash the app
        if (__DEV__) {
          console.warn('[Non-critical] Keep-awake error suppressed:', error.message);
        }
        return;
      }
      // Call original error handler for all other errors
      if (errorHandler) {
        errorHandler(error, isFatal);
      }
    });

    return () => {
      // Restore original error handler on unmount
      ErrorUtils.setGlobalHandler(errorHandler);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PaywallProvider>
            <RootLayoutNav />
          </PaywallProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
