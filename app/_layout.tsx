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
      <View className="flex-1 items-center justify-center bg-white">
        <View className="items-center">
          <View className="w-20 h-20 rounded-3xl bg-blue-600 items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">SC</Text>
          </View>
          <ActivityIndicator size="large" color="#2563EB" className="mt-4" />
        </View>
      </View>
    );
  }

  // If authenticated, wrap with BiometricGate and Privacy Curtain
  if (session) {
    return (
      <BiometricGate>
        {showPrivacyCurtain ? (
          <View className="absolute inset-0 bg-blue-600 items-center justify-center z-50">
            <View className="items-center">
              <View className="w-20 h-20 rounded-2xl bg-white/20 items-center justify-center mb-4">
                <Text className="text-white text-2xl font-bold">SC</Text>
              </View>
              <Text className="text-white text-lg font-semibold">SpotCheck</Text>
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
