import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { formatCurrency, Currency } from '@/lib/utils/currency';

export interface ProgressBarProps {
  current: number;
  limit: number;
  label?: string;
  message?: string;
  colorScheme?: 'default' | 'warning' | 'danger';
  showChangeButton?: boolean;
  onLimitChange?: () => void;
  currency?: Currency;
}

export function ProgressBar({
  current,
  limit,
  label,
  message,
  colorScheme = 'default',
  showChangeButton = false,
  onLimitChange,
  currency = 'TK',
}: ProgressBarProps) {
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;

  const getColorScheme = () => {
    if (colorScheme === 'danger' || percentage >= 100) {
      return {
        bg: 'bg-red-100',
        fill: 'bg-red-500',
        text: 'text-red-700',
      };
    }
    if (colorScheme === 'warning' || percentage >= 75) {
      return {
        bg: 'bg-amber-100',
        fill: 'bg-amber-500',
        text: 'text-amber-700',
      };
    }
    return {
      bg: 'bg-green-100',
      fill: 'bg-green-500',
      text: 'text-green-700',
    };
  };

  const colors = getColorScheme();

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      {(label || showChangeButton) && (
        <View className="flex-row items-center justify-between mb-3">
          {label && (
            <Text className="text-gray-700 font-medium text-sm" accessibilityRole="text">
              {label}
            </Text>
          )}
          {showChangeButton && onLimitChange && (
            <TouchableOpacity
              onPress={onLimitChange}
              accessibilityRole="button"
              accessibilityLabel="Change limit"
              accessibilityHint="Tap to modify your limit"
            >
              <Text className="text-purple-600 font-medium text-sm">Change</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View className="flex-row items-center justify-between mb-2">
        <Text 
          className={`text-lg font-semibold ${colors.text}`}
          accessibilityRole="text"
          accessibilityLabel={`Spent ${formatCurrency(current, currency)} out of ${formatCurrency(limit, currency)}`}
        >
          {formatCurrency(current, currency, { showDecimals: false })}
        </Text>
        <Text className="text-gray-500 text-sm" accessibilityRole="text">
          Your Limit: {formatCurrency(limit, currency, { showDecimals: false })}
        </Text>
      </View>

      <View className={`h-2 ${colors.bg} rounded-full overflow-hidden mb-2`}>
        <View
          className={`h-full ${colors.fill} rounded-full`}
          style={{ width: `${percentage}%` }}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: limit,
            now: current,
            text: `${Math.round(percentage)}%`,
          }}
        />
      </View>

      {message && (
        <Text 
          className={`text-sm ${colors.text} mt-1`}
          accessibilityRole="text"
        >
          {message}
        </Text>
      )}
    </View>
  );
}
