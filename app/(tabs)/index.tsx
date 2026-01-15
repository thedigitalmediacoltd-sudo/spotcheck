import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, AccessibilityInfo } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { CategoryIcon } from '@/components/CategoryIcon';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import { TabBar } from '@/components/TabBar';
import { SkeletonRow } from '@/components/SkeletonRow';
import { useItems } from '@/hooks/useItems';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Bell, User, WifiOff, Settings } from 'lucide-react-native';

const mapCategoryToDisplay = (category: string): string => {
  switch (category) {
    case 'insurance':
      return 'Insurance';
    case 'gov':
      return 'Vehicle';
    case 'sub':
      return 'Subscription';
    case 'warranty':
      return 'Warranty';
    case 'contract':
      return 'Contract';
    default:
      return category;
  }
};

const calculateDaysUntilExpiry = (expiryDate: string | null): number | null => {
  if (!expiryDate) return null;
  
  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'active' | 'urgent'>('active');
  const { items, isLoading, refetch } = useItems(user?.id);
  const { isOffline } = useNetworkStatus();

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'No date';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return dateString;
    }
  };

  const getNextExpiry = () => {
    const urgentItems = items.filter(item => {
      const days = calculateDaysUntilExpiry(item.expiry_date);
      return days !== null && days <= 30;
    });
    return urgentItems.length > 0 ? urgentItems[0] : null;
  };

  const calculateTotalSavings = (): number => {
    return items
      .filter(item => item.is_main_dealer === true)
      .reduce((sum, item) => {
        return sum + (item.cost_monthly || 0) * 0.3;
      }, 0);
  };

  const filteredItems = filter === 'urgent' 
    ? items.filter(item => {
        const days = calculateDaysUntilExpiry(item.expiry_date);
        return days !== null && days <= 30;
      })
    : items;

  const renderItem = ({ item }: { item: typeof items[0] }) => {
    const daysUntilExpiry = calculateDaysUntilExpiry(item.expiry_date);
    const expiryText = item.expiry_date ? `Expires ${formatDate(item.expiry_date)}` : 'No expiry date';
    const categoryText = mapCategoryToDisplay(item.category);

    return (
      <TouchableOpacity
        onPress={() => router.push(`/item/${item.id}`)}
        className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-sm flex-row items-center flex-wrap"
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${categoryText}, ${expiryText}`}
        accessibilityHint={`Opens details for ${item.title}`}
      >
        <View className="mr-3">
          <CategoryIcon 
            category={mapCategoryToDisplay(item.category) as any}
            size={20}
          />
        </View>
        <View className="flex-1 ml-1 min-w-0">
          <Text 
            className="text-slate-900 font-semibold text-base" 
            numberOfLines={2}
            accessibilityRole="text"
          >
            {item.title}
          </Text>
          <Text 
            className="text-slate-500 text-sm mt-0.5"
            accessibilityRole="text"
          >
            Expires {formatDate(item.expiry_date)}
          </Text>
        </View>
        <View className="ml-2">
          <UrgencyBadge daysUntilExpiry={daysUntilExpiry} />
        </View>
      </TouchableOpacity>
    );
  };

  const nextExpiry = getNextExpiry();
  const totalSavings = calculateTotalSavings();

  return (
    <View className="flex-1 bg-slate-50">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Offline Banner */}
        {isOffline && (
          <View 
            className="bg-orange-500 px-6 py-3 flex-row items-center"
            accessibilityRole="alert"
            accessibilityLabel="Offline Mode"
            accessibilityLiveRegion="polite"
          >
            <WifiOff size={18} color="#FFFFFF" />
            <Text className="text-white font-medium ml-2 text-sm">
              Offline Mode - Some features may be unavailable
            </Text>
          </View>
        )}
        
        {/* Header */}
        <View className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-slate-100">
          <View>
            <Text 
              className="text-2xl font-semibold text-slate-900"
              accessibilityRole="header"
            >
              {getGreeting()}
            </Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity 
              className="mr-4"
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              accessibilityHint="View your notifications"
            >
              <Bell size={24} color="#64748B" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              accessibilityRole="button"
              accessibilityLabel="Settings"
              accessibilityHint="Open app settings"
            >
              <Settings size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View className="px-6 py-6">
          {totalSavings > 0 ? (
            <LinearGradient
              colors={['#F8FAFC', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="rounded-3xl p-6 shadow-md"
            >
              <Text className="text-slate-500 text-sm mb-2">Total Potential Savings</Text>
              <Text className="text-4xl font-semibold text-blue-600 mb-1">
                £{totalSavings.toFixed(0)}
              </Text>
              <Text className="text-slate-500 text-sm">
                Switch to independent services
              </Text>
            </LinearGradient>
          ) : nextExpiry ? (
            <LinearGradient
              colors={['#F8FAFC', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="rounded-3xl p-6 shadow-md"
            >
              <Text className="text-slate-500 text-sm mb-2">Next Expiry</Text>
              <Text className="text-2xl font-semibold text-slate-900 mb-1">
                {nextExpiry.title}
              </Text>
              <Text className="text-slate-500 text-sm">
                {formatDate(nextExpiry.expiry_date)}
              </Text>
            </LinearGradient>
          ) : (
            <LinearGradient
              colors={['#F8FAFC', '#FFFFFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              className="rounded-3xl p-6 shadow-md"
            >
              <Text className="text-slate-500 text-sm mb-2">All Set</Text>
              <Text className="text-2xl font-semibold text-slate-900">
                No urgent items
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* Toggle */}
        <View className="px-6 mb-4">
          <View className="bg-slate-100 rounded-full p-1 flex-row">
            <TouchableOpacity
              onPress={() => setFilter('active')}
              className={`flex-1 py-2 rounded-full ${
                filter === 'active' ? 'bg-white shadow-sm' : ''
              }`}
              accessibilityRole="button"
              accessibilityLabel="Active items"
              accessibilityHint="Shows all active items"
              accessibilityState={{ selected: filter === 'active' }}
            >
              <Text className={`text-center font-semibold ${
                filter === 'active' ? 'text-blue-600' : 'text-slate-500'
              }`}>
                Active
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFilter('urgent')}
              className={`flex-1 py-2 rounded-full ${
                filter === 'urgent' ? 'bg-white shadow-sm' : ''
              }`}
              accessibilityRole="button"
              accessibilityLabel="Urgent items"
              accessibilityHint="Shows only urgent items expiring within 30 days"
              accessibilityState={{ selected: filter === 'urgent' }}
            >
              <Text className={`text-center font-semibold ${
                filter === 'urgent' ? 'text-rose-500' : 'text-slate-500'
              }`}>
                Urgent
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* List */}
        {isLoading ? (
          <View>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </View>
        ) : filteredItems.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-20">
            <Text className="text-slate-900 font-semibold text-lg mb-2">No Active Items</Text>
            <Text className="text-slate-500 text-sm text-center">
              Tap + to add your first bill
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            refreshing={isLoading}
            onRefresh={() => refetch()}
          />
        )}
      </ScrollView>
      <TabBar />
    </View>
  );
}
