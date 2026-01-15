import React from 'react';
import { Car, Home, Heart, Dumbbell, Shield, FileText } from 'lucide-react-native';
import { View } from 'react-native';

type Category = 'Vehicle' | 'Home/Utilities' | 'Pet' | 'Fitness' | 'Subscription' | 'Insurance' | 'insurance' | 'gov' | 'sub' | 'warranty' | 'contract';

interface CategoryIconProps {
  category: Category;
  size?: number;
  color?: string;
}

export function CategoryIcon({ category, size = 24, color = '#2563EB' }: CategoryIconProps) {
  const iconProps = { size, color };

  const IconComponent = (() => {
    switch (category) {
      case 'Vehicle':
        return Car;
      case 'Home/Utilities':
        return Home;
      case 'Pet':
        return Heart;
      case 'Fitness':
        return Dumbbell;
      case 'Subscription':
      case 'sub':
        return FileText;
      case 'Insurance':
      case 'insurance':
        return Shield;
      case 'gov':
      case 'contract':
      case 'warranty':
      default:
        return FileText;
    }
  })();

  return (
    <View className="w-12 h-12 rounded-full bg-blue-50 items-center justify-center">
      <IconComponent {...iconProps} />
    </View>
  );
}
