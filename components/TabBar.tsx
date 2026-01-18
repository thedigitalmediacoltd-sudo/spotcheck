import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { NativeIcon } from './NativeIcon';
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

  const isOverviewActive = isActive('/(tabs)/') || isActive('/(tabs)/index');
  const isSpotActive = isActive('/(tabs)/chat');

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.push('/(tabs)/');
          }}
          style={styles.tab}
          accessibilityRole="tab"
          accessibilityLabel="Overview"
          accessibilityState={{ selected: isOverviewActive }}
          activeOpacity={0.7}
        >
          <NativeIcon 
            name="home" 
            size={22} 
            color={isOverviewActive ? '#007AFF' : '#8E8E93'} 
          />
          <Text style={[
            styles.tabLabel,
            isOverviewActive && styles.tabLabelActive
          ]}>
            Overview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.push('/(tabs)/scan');
          }}
          style={styles.tab}
          accessibilityRole="tab"
          accessibilityLabel="Capture"
          accessibilityState={{ selected: isActive('/(tabs)/scan') }}
          activeOpacity={0.7}
        >
          <NativeIcon 
            name="camera" 
            size={22} 
            color={isActive('/(tabs)/scan') ? '#007AFF' : '#8E8E93'} 
          />
          <Text style={[
            styles.tabLabel,
            isActive('/(tabs)/scan') && styles.tabLabelActive
          ]}>
            Capture
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            router.push('/(tabs)/chat');
          }}
          style={styles.tab}
          accessibilityRole="tab"
          accessibilityLabel="Spot"
          accessibilityState={{ selected: isSpotActive }}
          activeOpacity={0.7}
        >
          <NativeIcon 
            name="sparkles" 
            size={22} 
            color={isSpotActive ? '#007AFF' : '#8E8E93'} 
          />
          <Text style={[
            styles.tabLabel,
            isSpotActive && styles.tabLabelActive
          ]}>
            Spot
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#000000',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    color: '#8E8E93',
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: -0.1,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
