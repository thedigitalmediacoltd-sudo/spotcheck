import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { triggerHaptic } from '@/services/sensory';

export interface Tab {
  id: string;
  label: string;
}

export interface TabSwitcherProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'loans';
}

export function TabSwitcher({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
}: TabSwitcherProps) {
  const handleTabPress = (tabId: string) => {
    triggerHaptic('light');
    onTabChange(tabId);
  };

  if (variant === 'loans') {
    return (
      <View 
        className="flex-row bg-gray-100 rounded-full p-1 mb-4"
        accessibilityRole="tablist"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleTabPress(tab.id)}
              className={`flex-1 py-2 px-4 rounded-full ${
                isActive ? 'bg-purple-600' : 'bg-transparent'
              }`}
              accessibilityRole="tab"
              accessibilityLabel={tab.label}
              accessibilityState={{ selected: isActive }}
              accessibilityHint={`Switch to ${tab.label} tab`}
            >
              <Text
                className={`text-center font-semibold text-sm ${
                  isActive ? 'text-white' : 'text-gray-600'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  // Default variant - horizontal tabs with underline
  return (
    <View 
      className="flex-row border-b border-gray-200 mb-4"
      accessibilityRole="tablist"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <TouchableOpacity
            key={tab.id}
            onPress={() => handleTabPress(tab.id)}
            className={`flex-1 py-3 px-4 border-b-2 ${
              isActive 
                ? 'border-purple-600' 
                : 'border-transparent'
            }`}
            accessibilityRole="tab"
            accessibilityLabel={tab.label}
            accessibilityState={{ selected: isActive }}
            accessibilityHint={`Switch to ${tab.label} tab`}
          >
            <Text
              className={`text-center font-semibold text-sm ${
                isActive ? 'text-purple-600' : 'text-gray-500'
              }`}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
