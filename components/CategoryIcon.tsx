import React from 'react';
import { View } from 'react-native';
import { NativeIcon } from './NativeIcon';

type Category = 
  | 'Vehicle' | 'Home' | 'Home/Utilities' | 'Pet' | 'Fitness' | 'Subscription' | 'Insurance' | 'insurance' | 'gov' | 'sub' | 'warranty' | 'contract' | 'Health' | 'Digital'
  // Finance categories
  | 'Food' | 'Transport' | 'Shopping' | 'Bills' | 'Entertainment' | 'Education' | 'Income' | 'Salary' | 'Commission' | 'Rent' | 'Furniture' | 'Electronics' | 'Books' | 'Smoking' | 'Soft Drinks';

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
        return {
          iconName: 'file-text' as const,
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-600',
          iconColor: '#475569',
        };
      // Finance categories
      case 'Food':
        return {
          iconName: 'heart' as const, // Using heart as food icon (will need custom icon later)
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-600',
          iconColor: '#EA580C',
        };
      case 'Transport':
        return {
          iconName: 'car' as const,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          iconColor: '#2563EB',
        };
      case 'Shopping':
        return {
          iconName: 'file' as const, // Using file as shopping bag (will need custom icon later)
          bgColor: 'bg-pink-100',
          textColor: 'text-pink-600',
          iconColor: '#DB2777',
        };
      case 'Bills':
      case 'Rent':
        return {
          iconName: 'house' as const,
          bgColor: 'bg-indigo-100',
          textColor: 'text-indigo-600',
          iconColor: '#4F46E5',
        };
      case 'Entertainment':
        return {
          iconName: 'heart' as const, // Using heart as entertainment icon
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-600',
          iconColor: '#9333EA',
        };
      case 'Education':
      case 'Books':
        return {
          iconName: 'file-text' as const,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-600',
          iconColor: '#059669',
        };
      case 'Income':
      case 'Salary':
      case 'Commission':
        return {
          iconName: 'check-circle' as const, // Using check-circle as money bag icon
          bgColor: 'bg-green-100',
          textColor: 'text-green-600',
          iconColor: '#10B981',
        };
      case 'Furniture':
        return {
          iconName: 'house' as const, // Using house as furniture icon
          bgColor: 'bg-amber-100',
          textColor: 'text-amber-600',
          iconColor: '#F59E0B',
        };
      case 'Electronics':
        return {
          iconName: 'file' as const, // Using file as electronics icon
          bgColor: 'bg-cyan-100',
          textColor: 'text-cyan-600',
          iconColor: '#06B6D4',
        };
      case 'Smoking':
        return {
          iconName: 'alert' as const,
          bgColor: 'bg-red-100',
          textColor: 'text-red-600',
          iconColor: '#EF4444',
        };
      case 'Soft Drinks':
        return {
          iconName: 'heart' as const,
          bgColor: 'bg-rose-100',
          textColor: 'text-rose-600',
          iconColor: '#F43F5E',
        };
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
