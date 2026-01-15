import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, AccessibilityInfo, TextInput } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swipeable } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import { useAuth } from '@/context/AuthContext';
import { CategoryIcon } from '@/components/CategoryIcon';
import { TabBar } from '@/components/TabBar';
import { SkeletonRow } from '@/components/SkeletonRow';
import { useItems } from '@/hooks/useItems';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useDebounce } from '@/hooks/useDebounce';
import { triggerHaptic } from '@/services/sensory';
import { supabase } from '@/lib/supabase';

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

type FilterChip = 'All' | 'Urgent' | 'Vehicle' | 'Home' | 'Digital';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<'active' | 'urgent'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedChip, setSelectedChip] = useState<FilterChip>('All');
  const { items, isLoading, refetch, deleteItem } = useItems(user?.id);
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

  // Filter items based on search query and selected chip
  const filteredItems = useMemo(() => {
    let filtered = filter === 'urgent' 
      ? items.filter(item => {
          const days = calculateDaysUntilExpiry(item.expiry_date);
          return days !== null && days <= 30;
        })
      : items;

    // Apply search filter (using debounced value for performance)
    if (debouncedSearchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

    // Apply chip filter
    if (selectedChip !== 'All') {
      filtered = filtered.filter(item => {
        const category = mapCategoryToDisplay(item.category);
        switch (selectedChip) {
          case 'Urgent':
            const days = calculateDaysUntilExpiry(item.expiry_date);
            return days !== null && days <= 7;
          case 'Vehicle':
            return category === 'Vehicle';
          case 'Home':
            return category === 'Home/Utilities';
          case 'Digital':
            return category === 'Subscription';
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [items, filter, debouncedSearchQuery, selectedChip]);

  const handleMarkDone = async (itemId: string, currentExpiry: string | null) => {
    if (!currentExpiry) return;

    try {
      const expiryDate = new Date(currentExpiry);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Add 1 year

      await supabase
        .from('items')
        .update({ expiry_date: expiryDate.toISOString().split('T')[0] })
        .eq('id', itemId);

      // Refetch to update UI
      refetch();
    } catch (error) {
      if (__DEV__) {
        console.error('Mark done error:', error);
      }
    }
  };

  const handleDelete = async (itemId: string) => {
    deleteItem(itemId);
  };

  const renderItem = ({ item }: { item: typeof items[0] }) => {
    const daysUntilExpiry = calculateDaysUntilExpiry(item.expiry_date);
    const expiryText = item.expiry_date ? `Expires ${formatDate(item.expiry_date)}` : 'No expiry date';
    const categoryText = mapCategoryToDisplay(item.category);
    let swipeableRef: Swipeable | null = null;

    const renderLeftActions = () => (
      <View className="flex-1 items-center justify-center bg-green-500 rounded-2xl ml-4 mb-3">
        <TouchableOpacity
          onPress={() => {
            swipeableRef?.close();
            handleMarkDone(item.id, item.expiry_date);
          }}
          className="flex-1 items-center justify-center w-full"
          accessibilityRole="button"
          accessibilityLabel={`Complete ${item.title}`}
          accessibilityHint="Marks this item as complete and sets its expiry to next year"
        >
          <NativeIcon name="check" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );

    const renderRightActions = () => (
      <View className="flex-1 items-center justify-center bg-rose-500 rounded-2xl mr-4 mb-3">
        <TouchableOpacity
          onPress={() => {
            swipeableRef?.close();
            handleDelete(item.id);
          }}
          className="flex-1 items-center justify-center w-full"
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.title}`}
          accessibilityHint="Removes this item permanently"
        >
          <NativeIcon name="trash" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );

    return (
      <Swipeable
        ref={(ref) => { swipeableRef = ref; }}
        renderLeftActions={renderLeftActions}
        renderRightActions={renderRightActions}
        onSwipeableWillOpen={() => triggerHaptic('light')}
        overshootLeft={false}
        overshootRight={false}
      >
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
              {daysUntilExpiry !== null && daysUntilExpiry < 0 ? (
                <NativeIcon 
                  name="alert" 
                  size={20} 
                  color="#DC2626"
                  accessibilityLabel={`Expired ${Math.abs(daysUntilExpiry)} days ago`}
                />
              ) : daysUntilExpiry !== null && daysUntilExpiry < 30 ? (
                <NativeIcon 
                  name="warning" 
                  size={20} 
                  color="#F59E0B"
                  accessibilityLabel={`Expires in ${daysUntilExpiry} days`}
                />
              ) : null}
            </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const nextExpiry = getNextExpiry();
  const totalSavings = calculateTotalSavings();

  return (
    <GestureHandlerRootView className="flex-1">
    <View className="flex-1 bg-slate-50">
      {/* Offline Banner */}
      {isOffline && (
        <View 
          className="bg-orange-500 px-6 py-3 flex-row items-center"
          accessibilityRole="alert"
          accessibilityLabel="No Internet Connection"
          accessibilityLiveRegion="polite"
        >
          <NativeIcon name="wifi-off" size={18} color="#FFFFFF" />
          <Text className="text-white font-medium ml-2 text-sm">
            No Internet Connection - Some features may be unavailable
          </Text>
        </View>
      )}
      
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-slate-100">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center flex-1">
              <TouchableOpacity
                className="mr-3"
                accessibilityRole="button"
                accessibilityLabel="Profile"
                accessibilityHint="View your profile"
              >
                <NativeIcon name="person-circle" size={24} color="#64748B" />
              </TouchableOpacity>
              <Text 
                className="text-2xl font-semibold text-slate-900"
                accessibilityRole="header"
              >
                {getGreeting()}
              </Text>
            </View>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={() => router.push('/settings')}
                accessibilityRole="button"
                accessibilityLabel="Settings"
                accessibilityHint="Open app settings"
              >
                <NativeIcon name="settings" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          <View className="bg-slate-100 rounded-xl px-4 py-3 flex-row items-center mb-3">
            <NativeIcon name="search" size={20} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Items"
              placeholderTextColor="#94A3B8"
              className="flex-1 ml-3 text-slate-900"
              style={{ caretColor: '#2563EB' }}
              accessibilityLabel="Search Items"
              accessibilityHint="Type to search for items by name"
            />
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {(['All', 'Urgent', 'Vehicle', 'Home', 'Digital'] as FilterChip[]).map((chip) => (
              <TouchableOpacity
                key={chip}
                onPress={() => setSelectedChip(chip)}
                className={`px-4 py-2 rounded-full mr-2 ${
                  selectedChip === chip ? 'bg-blue-600' : 'bg-slate-200'
                }`}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${chip}`}
                accessibilityState={{ selected: selectedChip === chip }}
              >
                <Text
                  className={`font-semibold text-sm ${
                    selectedChip === chip ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {chip}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
          <View className="px-4 pt-4">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </View>
        ) : filteredItems.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6 py-20">
            {debouncedSearchQuery.trim() || selectedChip !== 'All' ? (
              <>
                <View className="mb-4">
                  <NativeIcon name="search" size={48} color="#94A3B8" />
                </View>
                <Text className="text-slate-900 font-semibold text-lg mb-2">No Results</Text>
                <Text className="text-slate-500 text-sm text-center">
                  Check the spelling or try a new category
                </Text>
              </>
            ) : (
              <>
                <Text className="text-slate-900 font-bold text-lg mb-2">No Items</Text>
                <Text className="text-slate-500 text-sm text-center">
                  Tap + to scan your first bill.
                </Text>
              </>
            )}
          </View>
        ) : (
          <FlashList
            data={filteredItems}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            estimatedItemSize={80}
            drawDistance={200}
            refreshing={isLoading}
            onRefresh={() => refetch()}
            contentContainerStyle={{ paddingVertical: 8, paddingBottom: 100 }}
          />
        )}
      <TabBar />
      
      {/* Floating Action Button - Add Item */}
      <TouchableOpacity
        onPress={() => router.push('/(tabs)/scan')}
        className="absolute bottom-24 right-6 w-14 h-14 rounded-full bg-blue-600 items-center justify-center shadow-lg"
        accessibilityRole="button"
        accessibilityLabel="Add Item"
        accessibilityHint="Opens the camera to scan a new bill or document"
      >
        <NativeIcon name="plus" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
    </GestureHandlerRootView>
  );
}
