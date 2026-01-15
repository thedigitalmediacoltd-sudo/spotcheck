import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

interface ActionCardProps {
  potentialSavings?: number;
  message: string;
  onResolve?: () => void;
}

export function ActionCard({ potentialSavings, message, onResolve }: ActionCardProps) {
  return (
    <View 
      className="bg-white rounded-2xl p-4 shadow-sm"
      accessibilityRole="summary"
    >
      <Text 
        className="text-slate-500 text-sm mb-2"
        accessibilityRole="text"
      >
        Potential Savings
      </Text>
      {potentialSavings !== undefined && (
        <Text 
          className="text-3xl font-semibold text-blue-600 mb-3"
          accessibilityRole="text"
          accessibilityLabel={`Potential savings of £${potentialSavings.toFixed(0)}`}
        >
          £{potentialSavings.toFixed(0)}
        </Text>
      )}
      <Text 
        className="text-slate-700 text-sm mb-4"
        accessibilityRole="text"
      >
        {message}
      </Text>
      {onResolve && (
        <TouchableOpacity
          onPress={onResolve}
          className="bg-blue-600 py-3 rounded-xl"
          accessibilityRole="button"
          accessibilityLabel="View Savings"
          accessibilityHint="Opens details about potential savings and how to achieve them"
        >
          <Text className="text-white font-semibold text-center">
            View Savings
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
