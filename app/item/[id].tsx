import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Database } from '@/types/supabase';
import { CategoryIcon } from '@/components/CategoryIcon';
import { Toast } from '@/components/Toast';
import { addToCalendar } from '@/services/calendar';
import { NativeIcon } from '@/components/NativeIcon';
import { mapCategoryToDisplay, calculateDaysUntilExpiry, getCategoryLabel } from '@/lib/utils/items';

type Item = Database['public']['Tables']['items']['Row'];

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (id && user) {
      fetchItem();
    }
  }, [id, user]);

  const fetchItem = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setItem(data);
    } catch (error) {
      if (__DEV__) {
        console.error('Error fetching item:', error);
      }
      Alert.alert('Unable to Load', 'This document couldn\'t be loaded. Please try again.');
      router.back();
    } finally {
      setLoading(false);
    }
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

  const formatCost = (cost: number | null): string => {
    if (cost === null) return 'Not set';
    return `£${cost.toFixed(2)}`;
  };

  const handleDelete = async () => {
    if (!item) return;

    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', item.id);

              if (error) throw error;
              router.back();
            } catch (error) {
              if (__DEV__) {
                console.error('Delete error:', error);
              }
              Alert.alert('Unable to Delete', 'This document couldn\'t be deleted. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleAddToCalendar = async () => {
    if (!item) return;

    try {
      await addToCalendar(item);
      setToastMessage('Reminder added');
      setToastVisible(true);
      Alert.alert('Reminder Added', 'A reminder has been added to your calendar');
    } catch (error) {
      if (__DEV__) {
        console.error('Calendar error:', error);
      }
      Alert.alert(
        'Unable to Add Reminder',
        error instanceof Error
          ? error.message
          : 'Check your calendar permissions in Settings'
      );
    }
  };

  if (loading) {
    return (
      <LinearGradient
        colors={['#F5F5F7', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (!item) {
    return (
      <LinearGradient
        colors={['#F5F5F7', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Document not found</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const daysUntilExpiry = calculateDaysUntilExpiry(item.expiry_date);
  const category = mapCategoryToDisplay(item.category);
  const categoryLabel = getCategoryLabel(item.category);
  const isUrgent = daysUntilExpiry !== null && daysUntilExpiry <= 7;

  return (
    <LinearGradient
      colors={['#F5F5F7', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
          activeOpacity={0.7}
        >
          <NativeIcon name="arrow-left" size={22} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Details</Text>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          style={styles.deleteButton}
          accessibilityRole="button"
          accessibilityLabel="Delete document"
          activeOpacity={0.7}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#FF3B30" />
          ) : (
            <NativeIcon name="trash" size={22} color="#FF3B30" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Category Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <CategoryIcon 
              category={category as any}
              size={56}
            />
          </View>
        </View>

        {/* Title and Category */}
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.categoryLabel}>
            {categoryLabel}
          </Text>
        </View>

        {/* Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Expiry Date</Text>
            <Text style={styles.infoValue}>
              {formatDate(item.expiry_date)}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Days Remaining</Text>
            <Text style={[
              styles.infoValue,
              isUrgent && styles.infoValueUrgent
            ]}>
              {daysUntilExpiry !== null 
                ? daysUntilExpiry > 0
                  ? `${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'}`
                  : daysUntilExpiry === 0
                    ? 'Expires today'
                    : `Expired ${Math.abs(daysUntilExpiry)} ${Math.abs(daysUntilExpiry) === 1 ? 'day' : 'days'} ago`
                : 'Not set'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Monthly Cost</Text>
            <Text style={styles.infoValue}>
              {formatCost(item.cost_monthly)}
            </Text>
          </View>

          {item.cost_monthly && (
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Renewal Price</Text>
              <Text style={styles.infoValue}>
                {formatCost(item.cost_monthly * 1.2)}
              </Text>
            </View>
          )}
        </View>

        {/* Cancellation Terms Card (if applicable) */}
        {item.cost_monthly && item.cost_monthly > 50 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Cancellation Terms</Text>
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.infoLabel}>Early termination fee</Text>
              <Text style={styles.infoValue}>
                {formatCost(item.cost_monthly * 4.3)}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Set Reminder Button */}
      {item.expiry_date && (
        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleAddToCalendar}
            style={styles.reminderButton}
            accessibilityRole="button"
            accessibilityLabel="Add reminder"
            activeOpacity={0.8}
          >
            <NativeIcon name="calendar-plus" size={18} color="#FFFFFF" />
            <Text style={styles.reminderButtonText}>Add Reminder</Text>
          </TouchableOpacity>
        </View>
      )}

      <Toast
        message={toastMessage}
        type="success"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
  },
  errorText: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 24,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.6,
  },
  deleteButton: {
    padding: 8,
    marginRight: -8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  titleContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
    letterSpacing: -0.4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  infoLabel: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
  },
  infoValue: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'right',
  },
  infoValueUrgent: {
    color: '#FF3B30',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E5E5EA',
  },
  reminderButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  reminderButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
});
