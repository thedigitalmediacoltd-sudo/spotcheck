import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NativeIcon } from './NativeIcon';
import { formatMonthYear } from '@/lib/utils/dates';
import { triggerHaptic } from '@/services/sensory';

export interface MonthNavigatorProps {
  currentMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  format?: 'short' | 'long';
}

export function MonthNavigator({
  currentMonth,
  onPrev,
  onNext,
  format = 'long',
}: MonthNavigatorProps) {
  const monthYearText = formatMonthYear(currentMonth, format);

  const handlePrev = () => {
    triggerHaptic('light');
    onPrev();
  };

  const handleNext = () => {
    triggerHaptic('light');
    onNext();
  };

  return (
    <View 
      className="flex-row items-center justify-between px-2 py-2"
      accessibilityRole="toolbar"
      accessibilityLabel={`Month navigator: ${monthYearText}`}
    >
      <TouchableOpacity
        onPress={handlePrev}
        className="p-2 -ml-2"
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        accessibilityHint="Navigate to the previous month"
      >
        <NativeIcon name="arrow-left" size={20} color="#6B7280" />
      </TouchableOpacity>

      <Text 
        className="text-lg font-semibold text-gray-900 mx-4"
        accessibilityRole="text"
        accessibilityLabel={`Current month: ${monthYearText}`}
      >
        {monthYearText}
      </Text>

      <TouchableOpacity
        onPress={handleNext}
        className="p-2 -mr-2"
        accessibilityRole="button"
        accessibilityLabel="Next month"
        accessibilityHint="Navigate to the next month"
      >
        <NativeIcon name="arrow-right" size={20} color="#6B7280" />
      </TouchableOpacity>
    </View>
  );
}
