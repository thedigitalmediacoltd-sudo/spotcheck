import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeIcon } from './NativeIcon';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
}

export function Paywall({ visible, onClose }: PaywallProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);
      // TODO: Implement RevenueCat purchase flow
      // For now, show success message
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Pro features unlocked!');
      onClose();
    } catch (error) {
      if (__DEV__) {
        console.error('Purchase error:', error);
      }
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsPurchasing(true);
      // TODO: Implement RevenueCat restore purchases
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Restore Purchases', 'No previous purchases found.');
    } catch (error) {
      if (__DEV__) {
        console.error('Restore error:', error);
      }
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setIsPurchasing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-black/50">
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl max-h-[90%]">
            {/* Header */}
            <View className="flex-row items-center justify-between p-6 border-b border-slate-100">
              <View className="flex-row items-center">
                <View className="w-12 h-12 rounded-2xl bg-amber-100 items-center justify-center mr-3">
                  <NativeIcon name="sparkles" size={24} color="#F59E0B" />
                </View>
                <Text
                  className="text-2xl font-bold text-slate-900 tracking-tight"
                  accessibilityRole="header"
                >
                  Unlock SpotCheck Pro
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <NativeIcon name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
              {/* Comparison Table */}
              <View className="mb-6">
                <View className="bg-slate-50 rounded-2xl overflow-hidden">
                  {/* Header Row */}
                  <View className="flex-row bg-slate-100 px-4 py-3 border-b border-slate-200">
                    <View className="flex-1">
                      <Text className="text-slate-500 text-xs font-semibold uppercase">
                        Feature
                      </Text>
                    </View>
                    <View className="w-20 items-center">
                      <Text className="text-slate-500 text-xs font-semibold uppercase">
                        Free
                      </Text>
                    </View>
                    <View className="w-20 items-center">
                      <Text className="text-amber-600 text-xs font-semibold uppercase">
                        Pro
                      </Text>
                    </View>
                  </View>

                  {/* Smart Scan Row */}
                  <View className="flex-row px-4 py-4 border-b border-slate-200">
                    <View className="flex-1">
                      <Text className="text-slate-900 font-semibold text-sm">
                        Smart Scan
                      </Text>
                    </View>
                    <View className="w-20 items-center">
                      <Text className="text-slate-600 text-sm">1/Month</Text>
                    </View>
                    <View className="w-20 items-center">
                      <Text className="text-amber-600 font-semibold text-sm">
                        Unlimited
                      </Text>
                    </View>
                  </View>

                  {/* Spot Coach Row */}
                  <View className="flex-row px-4 py-4 border-b border-slate-200">
                    <View className="flex-1">
                      <Text className="text-slate-900 font-semibold text-sm">
                        Spot Coach
                      </Text>
                    </View>
                    <View className="w-20 items-center">
                      <Text className="text-slate-400 text-lg">❌</Text>
                    </View>
                    <View className="w-20 items-center">
                      <NativeIcon name="check" size={20} color="#059669" />
                    </View>
                  </View>

                  {/* Document Upload Row */}
                  <View className="flex-row px-4 py-4 border-b border-slate-200">
                    <View className="flex-1">
                      <Text className="text-slate-900 font-semibold text-sm">
                        Document Upload
                      </Text>
                    </View>
                    <View className="w-20 items-center">
                      <Text className="text-slate-400 text-lg">❌</Text>
                    </View>
                    <View className="w-20 items-center">
                      <NativeIcon name="check" size={20} color="#059669" />
                    </View>
                  </View>

                  {/* App Lock Row - Available for all */}
                  <View className="flex-row px-4 py-4">
                    <View className="flex-1">
                      <Text className="text-slate-900 font-semibold text-sm">
                        App Lock
                      </Text>
                    </View>
                    <View className="w-20 items-center">
                      <NativeIcon name="check" size={20} color="#059669" />
                    </View>
                    <View className="w-20 items-center">
                      <NativeIcon name="check" size={20} color="#059669" />
                    </View>
                  </View>
                </View>
              </View>

              {/* Price */}
              <View className="items-center mb-6">
                <Text className="text-slate-500 text-sm mb-1">One-time purchase.</Text>
                <Text className="text-4xl font-bold text-slate-900">£24.99</Text>
                <Text className="text-slate-500 text-sm mt-1">Lifetime Access</Text>
              </View>

              {/* Actions */}
              <View className="mb-4">
                <TouchableOpacity
                  onPress={handlePurchase}
                  disabled={isPurchasing}
                  className={`bg-blue-600 rounded-2xl py-4 items-center shadow-lg mb-3 ${
                    isPurchasing ? 'opacity-50' : ''
                  }`}
                  accessibilityRole="button"
                  accessibilityLabel="Unlock Forever"
                  accessibilityState={{ disabled: isPurchasing }}
                >
                  {isPurchasing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold text-lg">Unlock Forever</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleRestore}
                  disabled={isPurchasing}
                  className="items-center py-3"
                  accessibilityRole="button"
                  accessibilityLabel="Restore Purchases"
                  accessibilityState={{ disabled: isPurchasing }}
                >
                  <Text className="text-slate-500 font-semibold text-sm">
                    Restore Purchases
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}
