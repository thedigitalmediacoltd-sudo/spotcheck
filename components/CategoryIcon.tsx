import React from 'react';
import { Car, Home, Heart, Dumbbell, Shield, FileText } from 'lucide-react-native';
import { View } from 'react-native';

type Category = 'Vehicle' | 'Home/Utilities' | 'Pet' | 'Fitness' | 'Subscription' | 'Insurance' | 'insurance' | 'gov' | 'sub' | 'warranty' | 'contract';

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
          Icon: Car,
          bgColor: 'bg-orange-100',
          textColor: 'text-orange-600',
          iconColor: '#EA580C',
        };
      case 'Home/Utilities':
        return {
          Icon: Home,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          iconColor: '#2563EB',
        };
      case 'Subscription':
      case 'sub':
        return {
          Icon: FileText,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-600',
          iconColor: '#9333EA',
        };
      case 'Pet':
      case 'Fitness':
        return {
          Icon: category === 'Pet' ? Heart : Dumbbell,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-600',
          iconColor: '#059669',
        };
      case 'Health':
        return {
          Icon: Heart,
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-600',
          iconColor: '#059669',
        };
      case 'Insurance':
      case 'insurance':
        return {
          Icon: Shield,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-600',
          iconColor: '#2563EB',
        };
      case 'contract':
      case 'warranty':
      default:
        return {
          Icon: FileText,
          bgColor: 'bg-slate-100',
          textColor: 'text-slate-600',
          iconColor: '#475569',
        };
    }
  };

  const config = getCategoryConfig();
  const IconComponent = config.Icon;
  const iconProps = { size, color: config.iconColor };

  return (
    <View className={`w-12 h-12 rounded-full ${config.bgColor} items-center justify-center`}>
      <IconComponent {...iconProps} />
    </View>
  );
}
