import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { NativeIcon } from '@/components/NativeIcon';
import { triggerHaptic } from '@/services/sensory';
import { ScreenWrapper } from '@/components/ScreenWrapper';
import { ModernCard } from '@/components/ModernCard';

interface Vehicle {
  id: string;
  user_id: string;
  registration_number: string;
  make: string | null;
  model: string | null;
  color: string | null;
  year_of_manufacture: number | null;
  mot_expiry_date: string | null;
  tax_due_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function TransportScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: vehicles, isLoading, isError } = useQuery({
    queryKey: ['vehicles', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as Vehicle[];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleVehiclePress = (vehicleId: string) => {
    triggerHaptic('light');
    router.push(`/transport/${vehicleId}`);
  };

  const handleAddVehicle = () => {
    triggerHaptic('light');
    router.push('/transport/add-vehicle');
  };

  if (isLoading) {
    return (
      <ScreenWrapper className="items-center justify-center">
        <ActivityIndicator size="large" color="#7F3DFF" />
        <Text className="text-slate-500 mt-4">Loading vehicles...</Text>
      </ScreenWrapper>
    );
  }

  if (isError) {
    return (
      <ScreenWrapper className="items-center justify-center px-6">
        <NativeIcon name="alert" size={48} color="#ef4444" />
        <Text className="text-slate-900 font-semibold text-lg mt-4">Something went wrong</Text>
        <Text className="text-slate-500 text-center mt-2">
          Unable to load your vehicles. Please try again.
        </Text>
      </ScreenWrapper>
    );
  }

  const isEmpty = !vehicles || vehicles.length === 0;

  return (
    <ScreenWrapper>
      {/* Header */}
      <View className="px-6 pt-12 pb-6">
        <Text className="text-slate-900 font-bold text-3xl">My Garage</Text>
        <Text className="text-slate-500 mt-1">Manage your vehicles</Text>
      </View>

      {isEmpty ? (
        /* Empty State */
        <View className="flex-1 items-center justify-center px-6">
          <View className="bg-yellow-100 rounded-full p-6 mb-6">
            <NativeIcon name="car" size={64} color="#ca8a04" />
          </View>
          <Text className="text-slate-900 font-bold text-2xl text-center mb-2">
            No Vehicles
          </Text>
          <Text className="text-slate-500 text-center mb-8">
            Add your first car to track MOT and tax expiry dates.
          </Text>
          <TouchableOpacity
            onPress={handleAddVehicle}
            className="bg-brand-primary px-8 py-4 rounded-full shadow-lg"
            accessibilityLabel="Add your first car"
            accessibilityHint="Navigates to the add vehicle screen"
          >
            <Text className="text-white font-semibold text-base">Add your first car</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Vehicles List */
        <ScrollView className="flex-1 px-6 py-4" showsVerticalScrollIndicator={false}>
          {vehicles.map((vehicle) => (
            <ModernCard
              key={vehicle.id}
              onPress={() => handleVehiclePress(vehicle.id)}
              className="mb-4"
              touchableProps={{
                accessibilityLabel: `${vehicle.make || 'Vehicle'} ${vehicle.model || ''} ${vehicle.registration_number}`,
                accessibilityHint: 'Opens vehicle details',
              }}
            >
              <View className="flex-row items-center">
                {/* Icon Container */}
                <View className="bg-violet-100 rounded-2xl p-3 mr-4">
                  <NativeIcon name="car" size={24} color="#7F3DFF" />
                </View>

                {/* Vehicle Info */}
                <View className="flex-1">
                  <Text className="text-slate-900 font-bold text-base">
                    {vehicle.make && vehicle.model
                      ? `${vehicle.make} ${vehicle.model}`
                      : vehicle.make || vehicle.model || 'Vehicle'}
                  </Text>
                  <View className="flex-row items-center mt-2">
                    <View className="bg-gray-100 rounded-lg px-2 py-1">
                      <Text className="text-gray-600 text-xs font-medium">
                        {vehicle.registration_number}
                      </Text>
                    </View>
                    {vehicle.year_of_manufacture && (
                      <Text className="text-slate-400 text-xs ml-2">
                        {vehicle.year_of_manufacture}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Arrow */}
                <NativeIcon name="arrow-right" size={20} color="#94a3b8" />
              </View>
            </ModernCard>
          ))}
        </ScrollView>
      )}

      {/* Floating Action Button */}
      {!isEmpty && (
        <TouchableOpacity
          onPress={handleAddVehicle}
          className="absolute bottom-6 right-6 w-14 h-14 bg-brand-primary rounded-full items-center justify-center shadow-lg"
          accessibilityLabel="Add vehicle"
          accessibilityHint="Opens the add vehicle screen"
        >
          <NativeIcon name="plus" size={28} color="#ffffff" />
        </TouchableOpacity>
      )}
    </ScreenWrapper>
  );
}
