import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { NativeIcon } from '@/components/NativeIcon';
import { triggerHaptic } from '@/services/sensory';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Database } from '@/types/supabase';

type Vehicle = {
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
};

type Item = Database['public']['Tables']['items']['Row'];

const calculateDaysUntil = (dateString: string | null): number | null => {
  if (!dateString) return null;

  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
};

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Not set';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [deleteVisible, setDeleteVisible] = useState(false);

  // Fetch vehicle details
  const { data: vehicle, isLoading: vehicleLoading, isError: vehicleError } = useQuery({
    queryKey: ['vehicle', id],
    queryFn: async () => {
      if (!id || !user) return null;

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data as Vehicle;
    },
    enabled: !!id && !!user,
  });

  // Fetch linked documents (items where vehicle_id matches)
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['vehicle-documents', id],
    queryFn: async () => {
      if (!id || !user) return [];

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('vehicle_id', id)
        .neq('category', 'sub') // Documents are items except subscriptions
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Item[];
    },
    enabled: !!id && !!user,
  });

  // Fetch linked subscriptions (items where vehicle_id matches and category is 'sub')
  const { data: subscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['vehicle-subscriptions', id],
    queryFn: async () => {
      if (!id || !user) return [];

      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('vehicle_id', id)
        .eq('category', 'sub')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as Item[];
    },
    enabled: !!id && !!user,
  });

  // Delete vehicle mutation
  const deleteVehicleMutation = useMutation({
    mutationFn: async () => {
      if (!id || !user) throw new Error('No vehicle ID or user');

      // First, unlink all items from this vehicle
      const { error: updateError } = await supabase
        .from('items')
        .update({ vehicle_id: null })
        .eq('vehicle_id', id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Then delete the vehicle
      const { error: deleteError } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles', user?.id] });
      triggerHaptic('success');
      router.replace('/transport');
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message);
      triggerHaptic('error');
    },
  });

  const handleDeleteVehicle = () => {
    Alert.alert(
      'Delete Vehicle',
      'Are you sure you want to delete this vehicle? All linked documents and subscriptions will be unlinked.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteVehicleMutation.mutate(),
        },
      ]
    );
  };

  const handleAddDocument = () => {
    triggerHaptic('light');
    router.push({
      pathname: '/verify',
      params: { vehicle_id: id },
    });
  };

  const handleAddSubscription = () => {
    triggerHaptic('light');
    router.push({
      pathname: '/verify',
      params: { vehicle_id: id, category: 'sub' },
    });
  };

  const handleDocumentPress = (itemId: string) => {
    triggerHaptic('light');
    router.push(`/item/${itemId}`);
  };

  if (vehicleLoading) {
    return (
      <LinearGradient
        colors={['#F3E8FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1 items-center justify-center"
      >
        <ActivityIndicator size="large" color="#9333EA" />
        <Text className="text-slate-500 mt-4">Loading vehicle...</Text>
      </LinearGradient>
    );
  }

  if (vehicleError || !vehicle) {
    return (
      <LinearGradient
        colors={['#F3E8FF', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        className="flex-1 items-center justify-center px-6"
      >
        <NativeIcon name="alert" size={48} color="#ef4444" />
        <Text className="text-slate-900 font-semibold text-lg mt-4">Vehicle not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6 bg-purple-600 px-6 py-3 rounded-3xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const motDays = calculateDaysUntil(vehicle.mot_expiry_date);
  const taxDays = calculateDaysUntil(vehicle.tax_due_date);

  const isMotUrgent = motDays !== null && motDays < 30;
  const isTaxUrgent = taxDays !== null && taxDays < 30;

  return (
    <LinearGradient
      colors={['#F3E8FF', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
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

        <View className="flex-row items-center mb-3">
          <View className="bg-orange-100 rounded-full p-3 mr-4">
            <NativeIcon name="car" size={32} color="#ea580c" />
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-2xl">
              {vehicle.make && vehicle.model
                ? `${vehicle.make} ${vehicle.model}`
                : vehicle.make || vehicle.model || 'Vehicle'}
            </Text>
            {vehicle.year_of_manufacture && (
              <Text className="text-slate-500 text-sm mt-1">{vehicle.year_of_manufacture}</Text>
            )}
          </View>
        </View>

        {/* Number Plate Badge */}
        <View className="bg-yellow-400 rounded-lg px-4 py-3 border-2 border-yellow-500 self-start">
          <Text className="text-slate-900 font-bold text-xl tracking-widest uppercase">
            {vehicle.registration_number}
          </Text>
        </View>
      </View>

      {/* Status Cards */}
      <View className="px-6 py-6">
        {/* MOT Status */}
        <View
          className={`bg-white rounded-3xl p-4 shadow-md border mb-4 ${
            isMotUrgent ? 'border-rose-200 bg-rose-50' : 'border-purple-50'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className={`rounded-full p-2 mr-3 ${isMotUrgent ? 'bg-rose-100' : 'bg-slate-100'}`}>
                <NativeIcon name="alert" size={20} color={isMotUrgent ? '#ef4444' : '#64748b'} />
              </View>
              <Text className="text-slate-900 font-semibold text-base">MOT Status</Text>
            </View>
            {isMotUrgent && (
              <View className="bg-rose-100 px-3 py-1 rounded-full">
                <Text className="text-rose-700 font-semibold text-xs">URGENT</Text>
              </View>
            )}
          </View>
          {vehicle.mot_expiry_date ? (
            <View>
              <Text className={`text-lg font-bold ${isMotUrgent ? 'text-rose-700' : 'text-slate-900'}`}>
                {formatDate(vehicle.mot_expiry_date)}
              </Text>
              {motDays !== null && (
                <Text className={`text-sm mt-1 ${isMotUrgent ? 'text-rose-600' : 'text-slate-500'}`}>
                  {motDays > 0 ? `${motDays} days remaining` : motDays === 0 ? 'Expires today' : `Expired ${Math.abs(motDays)} days ago`}
                </Text>
              )}
            </View>
          ) : (
            <Text className="text-slate-500">No MOT date set</Text>
          )}
        </View>

        {/* Tax Status */}
        <View
          className={`bg-white rounded-3xl p-4 shadow-md border mb-4 ${
            isTaxUrgent ? 'border-rose-200 bg-rose-50' : 'border-purple-50'
          }`}
        >
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <View className={`rounded-full p-2 mr-3 ${isTaxUrgent ? 'bg-rose-100' : 'bg-slate-100'}`}>
                <NativeIcon name="alert" size={20} color={isTaxUrgent ? '#ef4444' : '#64748b'} />
              </View>
              <Text className="text-slate-900 font-semibold text-base">Tax Status</Text>
            </View>
            {isTaxUrgent && (
              <View className="bg-rose-100 px-3 py-1 rounded-full">
                <Text className="text-rose-700 font-semibold text-xs">URGENT</Text>
              </View>
            )}
          </View>
          {vehicle.tax_due_date ? (
            <View>
              <Text className={`text-lg font-bold ${isTaxUrgent ? 'text-rose-700' : 'text-slate-900'}`}>
                {formatDate(vehicle.tax_due_date)}
              </Text>
              {taxDays !== null && (
                <Text className={`text-sm mt-1 ${isTaxUrgent ? 'text-rose-600' : 'text-slate-500'}`}>
                  {taxDays > 0 ? `${taxDays} days remaining` : taxDays === 0 ? 'Due today' : `Overdue ${Math.abs(taxDays)} days`}
                </Text>
              )}
            </View>
          ) : (
            <Text className="text-slate-500">No tax date set</Text>
          )}
        </View>

        {/* Linked Documents Section */}
        <View className="bg-white rounded-3xl p-4 shadow-md border border-purple-50 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-900 font-semibold text-lg">Linked Documents</Text>
            <TouchableOpacity
              onPress={handleAddDocument}
              className="bg-purple-100 px-3 py-1.5 rounded-full flex-row items-center"
              accessibilityLabel="Add document"
            >
              <NativeIcon name="plus" size={16} color="#9333EA" />
              <Text className="text-purple-600 font-medium text-sm ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          {documentsLoading ? (
            <ActivityIndicator size="small" color="#9333EA" />
          ) : !documents || documents.length === 0 ? (
            <Text className="text-slate-500 text-sm">No documents linked</Text>
          ) : (
            <View>
              {documents.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => handleDocumentPress(doc.id)}
                  className="flex-row items-center py-3 border-b border-slate-100 last:border-0"
                  accessibilityLabel={`${doc.title} document`}
                >
                  <CategoryIcon category={doc.category} size={32} />
                  <View className="flex-1 ml-3">
                    <Text className="text-slate-900 font-medium">{doc.title}</Text>
                    {doc.expiry_date && (
                      <Text className="text-slate-500 text-xs mt-1">
                        Expires: {formatDate(doc.expiry_date)}
                      </Text>
                    )}
                  </View>
                  <NativeIcon name="arrow-right" size={20} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Linked Subscriptions Section */}
        <View className="bg-white rounded-3xl p-4 shadow-md border border-purple-50 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-slate-900 font-semibold text-lg">Linked Subscriptions</Text>
            <TouchableOpacity
              onPress={handleAddSubscription}
              className="bg-purple-100 px-3 py-1.5 rounded-full flex-row items-center"
              accessibilityLabel="Add subscription"
            >
              <NativeIcon name="plus" size={16} color="#9333EA" />
              <Text className="text-purple-600 font-medium text-sm ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          {subscriptionsLoading ? (
            <ActivityIndicator size="small" color="#9333EA" />
          ) : !subscriptions || subscriptions.length === 0 ? (
            <Text className="text-slate-500 text-sm">No subscriptions linked</Text>
          ) : (
            <View>
              {subscriptions.map((sub) => (
                <TouchableOpacity
                  key={sub.id}
                  onPress={() => handleDocumentPress(sub.id)}
                  className="flex-row items-center py-3 border-b border-slate-100 last:border-0"
                  accessibilityLabel={`${sub.title} subscription`}
                >
                  <CategoryIcon category={sub.category} size={32} />
                  <View className="flex-1 ml-3">
                    <Text className="text-slate-900 font-medium">{sub.title}</Text>
                    {sub.expiry_date && (
                      <Text className="text-slate-500 text-xs mt-1">
                        Expires: {formatDate(sub.expiry_date)}
                      </Text>
                    )}
                    {sub.cost_monthly && (
                      <Text className="text-slate-500 text-xs mt-1">
                        £{sub.cost_monthly.toFixed(2)}/month
                      </Text>
                    )}
                  </View>
                  <NativeIcon name="arrow-right" size={20} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Delete Vehicle Button */}
        <TouchableOpacity
          onPress={handleDeleteVehicle}
          disabled={deleteVehicleMutation.isPending}
          className="bg-rose-600 rounded-3xl py-4 px-6 mt-4 flex-row items-center justify-center shadow-md"
          accessibilityLabel="Delete vehicle"
          accessibilityHint="Removes this vehicle and unlinks all associated documents"
        >
          {deleteVehicleMutation.isPending ? (
            <>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Deleting...</Text>
            </>
          ) : (
            <>
              <NativeIcon name="trash" size={20} color="#ffffff" />
              <Text className="text-white font-semibold ml-2">Delete Vehicle</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
    </LinearGradient>
  );
}
