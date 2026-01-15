import React from 'react';
import { View } from 'react-native';
import { NativeIcon } from './NativeIcon';

type Category = 'Vehicle' | 'Home' | 'Home/Utilities' | 'Pet' | 'Fitness' | 'Subscription' | 'Insurance' | 'insurance' | 'gov' | 'sub' | 'warranty' | 'contract' | 'Health' | 'Digital';

interface CategoryIconProps {
  category: Category;
  size?: number;
  color?: string;
}

export function CategoryIcon({ category, size = 24 }: CategoryIconProps) {
  const getCategoryConfig = () => {
    switch (category) {
      case 'Vehicle':
      case 'gov':
        return {
          iconName: 'car' as const,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-600',
          iconColor: '#EA580C',
        };
      case 'Home':
      case 'Home/Utilities':
        return {
          iconName: 'house' as const,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          iconColor: '#2563EB',
        };
      case 'Digital':
      case 'Subscription':
      case 'sub':
        return {
          iconName: 'file-text' as const,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-600',
          iconColor: '#9333EA',
        };
      case 'Pet':
        return {
          iconName: 'pet' as const,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-600',
          iconColor: '#059669',
        };
      case 'Fitness':
        return {
          iconName: 'fitness' as const,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-600',
          iconColor: '#059669',
        };
      case 'Health':
        return {
          iconName: 'heart' as const,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-600',
          iconColor: '#059669',
        };
      case 'Insurance':
      case 'insurance':
        return {
          iconName: 'shield' as const,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          iconColor: '#2563EB',
        };
      case 'contract':
      case 'warranty':
      default:
        return {
          iconName: 'file-text' as const,
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-600',
          iconColor: '#475569',
        };
    }
  };

  const config = getCategoryConfig();

  return (
    <View className={`w-12 h-12 rounded-full ${config.bgColor} items-center justify-center`}>
      <NativeIcon name={config.iconName} size={size} color={config.iconColor} />
    </View>
  );
}
