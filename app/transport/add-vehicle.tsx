import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { NativeIcon } from '@/components/NativeIcon';
import { triggerHaptic } from '@/services/sensory';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface VehicleData {
  registrationNumber: string;
  make?: string;
  model?: string;
  color?: string;
  yearOfManufacture?: number;
  motExpiryDate?: string | null;
  taxDueDate?: string | null;
}

export default function AddVehicleScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [vehicleData, setVehicleData] = useState<VehicleData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const saveVehicleMutation = useMutation({
    mutationFn: async (data: VehicleData) => {
      if (!user) throw new Error('No user');

      const { data: savedVehicle, error: insertError } = await supabase
        .from('vehicles')
        .insert({
          user_id: user.id,
          registration_number: data.registrationNumber,
          make: data.make || null,
          model: data.model || null,
          color: data.color || null,
          year_of_manufacture: data.yearOfManufacture || null,
          mot_expiry_date: data.motExpiryDate || null,
          tax_due_date: data.taxDueDate || null,
        })
        .select()
        .single();

      if (insertError) {
        // Handle duplicate registration number
        if (insertError.code === '23505') {
          throw new Error('This vehicle is already in your garage');
        }
        throw insertError;
      }

      return savedVehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.id] });
      triggerHaptic('success');
      router.back();
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
      triggerHaptic('error');
    },
  });

  const handleFindVehicle = async () => {
    if (!registrationNumber.trim()) {
      setError('Please enter a registration number');
      return;
    }

    setIsSearching(true);
    setError(null);
    setVehicleData(null);

    try {
      const { data, error: fetchError } = await supabase.functions.invoke('fetch-vehicle', {
        body: { registration_number: registrationNumber.trim() },
      });

      if (fetchError) {
        throw new Error(fetchError.message || 'Failed to fetch vehicle data');
      }

      if (!data || !data.success) {
        throw new Error(data?.error || 'Vehicle not found');
      }

      setVehicleData(data.data);
      triggerHaptic('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch vehicle data';
      setError(message);
      triggerHaptic('error');
    } finally {
      setIsSearching(false);
    }
  };

  const handleConfirmAndSave = () => {
    if (!vehicleData) return;

    Alert.alert(
      'Confirm Vehicle',
      `Add ${vehicleData.make || ''} ${vehicleData.model || ''} (${vehicleData.registrationNumber}) to your garage?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => saveVehicleMutation.mutate(vehicleData),
        },
      ]
    );
  };

  const formatRegistrationNumber = (text: string): string => {
    // Remove all spaces and convert to uppercase
    const cleaned = text.replace(/\s+/g, '').toUpperCase();
    
    // Format as UK number plate: XX## XXX or similar patterns
    // This is a simple formatter - UK plates have complex formats
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 7) return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4)}`;
  };

  return (
    <LinearGradient
      colors={['#F3E8FF', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-12 pb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4"
            accessibilityLabel="Go back"
          >
            <NativeIcon name="arrow-left" size={24} color="#0f172a" />
          </TouchableOpacity>
          <Text className="text-slate-900 font-bold text-3xl">Add Vehicle</Text>
          <Text className="text-slate-500 mt-1">Enter your vehicle registration</Text>
        </View>

        <View className="px-6 py-6">
          {/* Registration Number Input */}
          <View className="mb-6">
            <Text className="text-slate-900 font-semibold text-base mb-2">
              Registration Number
            </Text>
            <View
              className="bg-yellow-400 rounded-lg px-4 py-4 border-2 border-yellow-500"
              style={{
                // UK number plate styling
                borderStyle: 'solid',
              }}
            >
              <TextInput
                value={registrationNumber}
                onChangeText={(text) => {
                  const formatted = formatRegistrationNumber(text);
                  setRegistrationNumber(formatted);
                  setError(null);
                  setVehicleData(null);
                }}
                placeholder="AB12 CDE"
                placeholderTextColor="#ca8a04"
                className="text-slate-900 font-bold text-2xl text-center tracking-widest uppercase"
                autoCapitalize="characters"
                maxLength={8}
                autoFocus
                accessibilityLabel="Vehicle registration number"
                accessibilityHint="Enter your UK vehicle registration number"
              />
            </View>
            <Text className="text-slate-400 text-xs mt-2 text-center">
              Enter your UK vehicle registration
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="bg-rose-50 rounded-xl p-4 mb-6 border border-rose-200">
              <View className="flex-row items-center">
                <NativeIcon name="alert" size={20} color="#ef4444" />
                <Text className="text-rose-700 ml-2 flex-1">{error}</Text>
              </View>
            </View>
          )}

          {/* Find Vehicle Button */}
          <TouchableOpacity
            onPress={handleFindVehicle}
            disabled={isSearching || !registrationNumber.trim()}
            className={`bg-purple-600 rounded-3xl py-4 px-6 mb-6 shadow-md ${
              isSearching || !registrationNumber.trim() ? 'opacity-50' : ''
            }`}
            accessibilityLabel="Find vehicle"
            accessibilityHint="Searches for vehicle details using the registration number"
          >
            {isSearching ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator size="small" color="#ffffff" />
                <Text className="text-white font-semibold ml-2">Searching...</Text>
              </View>
            ) : (
              <Text className="text-white font-semibold text-center">Find Vehicle</Text>
            )}
          </TouchableOpacity>

          {/* Vehicle Details Card */}
          {vehicleData && (
            <View className="bg-white rounded-3xl p-6 shadow-md border border-purple-50">
              <View className="flex-row items-center mb-4">
                <View className="bg-orange-100 rounded-full p-3 mr-3">
                  <NativeIcon name="car" size={24} color="#ea580c" />
                </View>
                <Text className="text-slate-900 font-bold text-xl flex-1">
                  {vehicleData.make && vehicleData.model
                    ? `${vehicleData.make} ${vehicleData.model}`
                    : vehicleData.make || vehicleData.model || 'Vehicle'}
                </Text>
              </View>

              {/* Registration Number Display */}
              <View className="bg-yellow-400 rounded-lg px-4 py-3 mb-4 border-2 border-yellow-500">
                <Text className="text-slate-900 font-bold text-xl text-center tracking-widest uppercase">
                  {vehicleData.registrationNumber}
                </Text>
              </View>

              {/* Vehicle Details */}
              <View>
                {vehicleData.color && (
                  <View className="flex-row items-center py-2 border-b border-slate-100 mb-1">
                    <Text className="text-slate-500 text-sm w-24">Color</Text>
                    <Text className="text-slate-900 font-medium flex-1">{vehicleData.color}</Text>
                  </View>
                )}

                {vehicleData.yearOfManufacture && (
                  <View className="flex-row items-center py-2 border-b border-slate-100 mb-1">
                    <Text className="text-slate-500 text-sm w-24">Year</Text>
                    <Text className="text-slate-900 font-medium flex-1">
                      {vehicleData.yearOfManufacture}
                    </Text>
                  </View>
                )}

                {vehicleData.motExpiryDate && (
                  <View className="flex-row items-center py-2 border-b border-slate-100 mb-1">
                    <Text className="text-slate-500 text-sm w-24">MOT</Text>
                    <Text className="text-slate-900 font-medium flex-1">
                      {new Date(vehicleData.motExpiryDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                )}

                {vehicleData.taxDueDate && (
                  <View className="flex-row items-center py-2">
                    <Text className="text-slate-500 text-sm w-24">Tax</Text>
                    <Text className="text-slate-900 font-medium flex-1">
                      {new Date(vehicleData.taxDueDate).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                )}
              </View>

              {/* Confirm & Save Button */}
              <TouchableOpacity
                onPress={handleConfirmAndSave}
                disabled={saveVehicleMutation.isPending}
                className={`bg-green-600 rounded-xl py-4 px-6 mt-6 ${
                  saveVehicleMutation.isPending ? 'opacity-50' : ''
                }`}
                accessibilityLabel="Confirm and save vehicle"
                accessibilityHint="Saves the vehicle to your garage"
              >
                {saveVehicleMutation.isPending ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator size="small" color="#ffffff" />
                    <Text className="text-white font-semibold ml-2">Saving...</Text>
                  </View>
                ) : (
                  <Text className="text-white font-semibold text-center">Confirm & Save</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
    </LinearGradient>
  );
}
