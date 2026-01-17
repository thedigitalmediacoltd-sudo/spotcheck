import React from 'react';
import { View, ViewProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';

interface ModernCardProps extends ViewProps {
  children: React.ReactNode;
  onPress?: () => void;
  touchableProps?: Omit<TouchableOpacityProps, 'onPress' | 'className' | 'children'>;
}

export function ModernCard({ 
  children, 
  onPress, 
  className = '', 
  touchableProps,
  ...props 
}: ModernCardProps) {
  const baseClassName = 'bg-white rounded-[32px] p-5 shadow-sm border border-gray-100';
  
  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        className={`${baseClassName} ${className}`}
        activeOpacity={0.7}
        {...touchableProps}
        {...props}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View className={`${baseClassName} ${className}`} {...props}>
      {children}
    </View>
  );
}
