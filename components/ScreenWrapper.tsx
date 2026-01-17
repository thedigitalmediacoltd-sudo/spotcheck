import React from 'react';
import { View, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ScreenWrapperProps extends ViewProps {
  children: React.ReactNode;
}

export function ScreenWrapper({ children, className, ...props }: ScreenWrapperProps) {
  return (
    <LinearGradient
      colors={['#F1F3FF', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className={`flex-1 ${className || ''}`}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}
