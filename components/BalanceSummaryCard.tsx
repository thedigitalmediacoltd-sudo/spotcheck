import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { formatCurrency, Currency } from '@/lib/utils/currency';

export interface BalanceSummaryCardProps {
  totalBalance: number;
  currency?: Currency;
  trend?: 'up' | 'down' | 'neutral';
  trendAmount?: number;
  label?: string;
  onPress?: () => void;
}

export function BalanceSummaryCard({
  totalBalance,
  currency = 'TK',
  trend,
  trendAmount,
  label = 'Total Balance',
  onPress,
}: BalanceSummaryCardProps) {
  const formattedBalance = formatCurrency(totalBalance, currency, { showDecimals: false });

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return '#10B981'; // success green
      case 'down':
        return '#EF4444'; // red
      default:
        return '#6B7280'; // gray
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↑';
      case 'down':
        return '↓';
      default:
        return '';
    }
  };

  const content = (
    <View className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
      <Text className="text-gray-500 text-sm mb-2" accessibilityRole="text">
        {label}
      </Text>
      <View className="flex-row items-baseline justify-between">
        <Text 
          className="text-4xl font-semibold text-gray-900" 
          accessibilityRole="text"
          accessibilityLabel={`${label}: ${formattedBalance}`}
        >
          {formattedBalance}
        </Text>
        {trend && trendAmount !== undefined && (
          <View className="flex-row items-center ml-3">
            <Text 
              className="text-sm font-medium"
              style={{ color: getTrendColor() }}
              accessibilityRole="text"
            >
              {getTrendIcon()} {formatCurrency(Math.abs(trendAmount), currency, { compact: true })}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${formattedBalance}`}
        accessibilityHint="Tap to view balance details"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
