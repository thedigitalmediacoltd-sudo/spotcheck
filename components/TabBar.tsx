import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { ChartPie, ScanLine, Sparkles } from 'lucide-react-native';
import { triggerHaptic } from '@/services/sensory';

export function TabBar() {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/(tabs)/' || path === '/(tabs)/index') {
      return pathname === '/(tabs)/' || pathname === '/(tabs)/index';
    }
    return pathname === path;
  };

  return (
    <View className="absolute bottom-5 left-5 right-5">
      <View className="flex-row items-center justify-around bg-black rounded-full py-3 px-4 shadow-lg">
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.push('/(tabs)/');
          }}
          className={`flex-1 items-center ${isActive('/(tabs)/') || isActive('/(tabs)/index') ? 'opacity-100' : 'opacity-50'}`}
          accessibilityRole="tab"
          accessibilityLabel="Overview"
          accessibilityHint="View your items and savings overview"
          accessibilityState={{ selected: isActive('/(tabs)/') || isActive('/(tabs)/index') }}
        >
          <ChartPie size={24} color="#FFFFFF" />
          <Text 
            className="text-white text-xs mt-1"
            maxFontSizeMultiplier={1.2}
          >
            Overview
          </Text>
        </TouchableOpacity>

        {/* Center Capture Button - Overlaps slightly */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.push('/(tabs)/scan');
          }}
          className="absolute -top-6 bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-lg"
          accessibilityRole="button"
          accessibilityLabel="Scan Document"
          accessibilityHint="Opens the camera to capture a bill or document"
        >
          <ScanLine size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.push('/(tabs)/chat');
          }}
          className={`flex-1 items-center ${isActive('/(tabs)/chat') ? 'opacity-100' : 'opacity-50'}`}
          accessibilityRole="tab"
          accessibilityLabel="Spot"
          accessibilityHint="Chat with Spot, your financial assistant"
          accessibilityState={{ selected: isActive('/(tabs)/chat') }}
        >
          <Sparkles size={24} color="#FFFFFF" />
          <Text 
            className="text-white text-xs mt-1"
            maxFontSizeMultiplier={1.2}
          >
            Spot
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
