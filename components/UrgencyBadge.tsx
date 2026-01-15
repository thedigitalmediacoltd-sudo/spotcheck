import React from 'react';
import { View, Text } from 'react-native';

interface UrgencyBadgeProps {
  daysUntilExpiry: number | null;
}

export function UrgencyBadge({ daysUntilExpiry }: UrgencyBadgeProps) {
  if (daysUntilExpiry === null) {
    return (
      <View 
        className="px-3 py-1.5 rounded-full bg-slate-200"
        accessibilityLabel="No expiry date set"
        accessibilityRole="text"
      >
        <Text className="text-xs font-medium text-slate-600">No date</Text>
      </View>
    );
  }

  // Red if < 30 days, Green if safe (>= 30 days)
  const isUrgent = daysUntilExpiry < 30;
  const bgColor = isUrgent ? 'bg-rose-100' : 'bg-green-100';
  const textColor = isUrgent ? 'text-rose-700' : 'text-green-700';
  
  let label = 'Safe';
  let accessibilityLabel = 'Expires in more than 30 days';
  
  if (daysUntilExpiry < 0) {
    label = 'Expired';
    accessibilityLabel = `Expired ${Math.abs(daysUntilExpiry)} days ago`;
  } else if (daysUntilExpiry <= 7) {
    label = 'Urgent';
    accessibilityLabel = `Expires in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}`;
  } else if (daysUntilExpiry <= 30) {
    label = 'Soon';
    accessibilityLabel = `Expires in ${daysUntilExpiry} days`;
  }

  return (
    <View 
      className={`px-3 py-1.5 rounded-full ${bgColor}`}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="text"
    >
      <Text className={`text-xs font-medium ${textColor}`}>{label}</Text>
    </View>
  );
}
