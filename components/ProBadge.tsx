import React from 'react';
import { View, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ProBadgeProps {
  size?: 'sm' | 'md';
}

export function ProBadge({ size = 'sm' }: ProBadgeProps) {
  const height = size === 'sm' ? 20 : 24;
  const paddingHorizontal = size === 'sm' ? 8 : 10;
  const fontSize = size === 'sm' ? 10 : 12;

  return (
    <LinearGradient
      colors={['#F59E0B', '#D97706']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      className="rounded-full items-center justify-center"
      style={{
        height,
        paddingHorizontal,
      }}
    >
      <Text
        className="text-white font-bold"
        style={{ fontSize }}
        accessibilityLabel="Pro"
        accessibilityRole="text"
      >
        PRO
      </Text>
    </LinearGradient>
  );
}
