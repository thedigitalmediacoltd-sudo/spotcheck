import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, StyleSheet, Modal, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Swipeable } from 'react-native-gesture-handler';
import { FlashList } from '@shopify/flash-list';
import { useAuth } from '@/context/AuthContext';
import { CategoryIcon } from '@/components/CategoryIcon';
import { NativeIcon } from '@/components/NativeIcon';
import { TabBar } from '@/components/TabBar';
import { SkeletonRow } from '@/components/SkeletonRow';
import { useItems } from '@/hooks/useItems';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useDebounce } from '@/hooks/useDebounce';
import { triggerHaptic } from '@/services/sensory';
import { supabase } from '@/lib/supabase';
import { formatShortDate } from '@/lib/utils/dates';
import { mapCategoryToDisplay, calculateDaysUntilExpiry } from '@/lib/utils/items';

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

type FilterChip = 'All' | 'Urgent' | 'Vehicle' | 'Home' | 'Digital';

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedChip, setSelectedChip] = useState<FilterChip>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const { items, isLoading, refetch, deleteItem } = useItems(user?.id);
  const { isOffline } = useNetworkStatus();

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'No date';
    return formatShortDate(dateString);
  };

  // Calculate next urgent expiry (prioritize this over savings)
  const nextExpiry = useMemo(() => {
    const allItems = [...items].filter(item => item.expiry_date);
    allItems.sort((a, b) => {
      if (!a.expiry_date) return 1;
      if (!b.expiry_date) return -1;
      return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
    });
    return allItems.length > 0 ? allItems[0] : null;
  }, [items]);

  // Filter items based on search query and selected chip
  const filteredItems = useMemo(() => {
    let filtered = items;

    if (debouncedSearchQuery.trim()) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
      );
    }

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
            return category === 'Home/Utilities' || category === 'Insurance';
          case 'Digital':
            return category === 'Subscription';
          default:
            return true;
        }
      });
    }

    return filtered;
  }, [items, debouncedSearchQuery, selectedChip]);

  const handleMarkDone = useCallback(async (itemId: string, currentExpiry: string | null) => {
    if (!currentExpiry) return;

    try {
      const expiryDate = new Date(currentExpiry);
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      await supabase
        .from('items')
        .update({ expiry_date: expiryDate.toISOString().split('T')[0] })
        .eq('id', itemId);

      refetch();
    } catch (error) {
      if (__DEV__) {
        console.error('Mark done error:', error);
      }
    }
  }, [refetch]);

  const handleDelete = useCallback(async (itemId: string) => {
    deleteItem(itemId);
  }, [deleteItem]);

  const handleItemPress = useCallback((itemId: string) => {
    router.push(`/item/${itemId}`);
  }, [router]);

  const handleMarkDoneCallback = useCallback(async (itemId: string, currentExpiry: string | null) => {
    await handleMarkDone(itemId, currentExpiry);
  }, [handleMarkDone]);

  const renderItem = useCallback(({ item }: { item: typeof items[0] }) => {
    const daysUntilExpiry = calculateDaysUntilExpiry(item.expiry_date);
    let swipeableRef: Swipeable | null = null;

    const renderLeftActions = () => (
      <View style={styles.swipeActionLeft}>
        <TouchableOpacity
          onPress={() => {
            swipeableRef?.close();
            handleMarkDoneCallback(item.id, item.expiry_date);
          }}
          style={styles.swipeButton}
          accessibilityRole="button"
          accessibilityLabel={`Renew ${item.title}`}
        >
          <NativeIcon name="check" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );

    const renderRightActions = () => (
      <View style={styles.swipeActionRight}>
        <TouchableOpacity
          onPress={() => {
            swipeableRef?.close();
            handleDelete(item.id);
          }}
          style={styles.swipeButton}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${item.title}`}
        >
          <NativeIcon name="trash" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    );

    const category = mapCategoryToDisplay(item.category);
    const displayDate = formatDate(item.expiry_date);
    const displayCost = item.cost_monthly ? `£${item.cost_monthly.toFixed(2)}/mo` : '';
    const isUrgent = daysUntilExpiry !== null && daysUntilExpiry <= 7;

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
          onPress={() => handleItemPress(item.id)}
          style={styles.itemCard}
          activeOpacity={0.7}
        >
          <View style={styles.itemIconContainer}>
            <CategoryIcon 
              category={category as any}
              size={22}
            />
          </View>
          <View style={styles.itemContent}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View style={styles.itemMetadataRow}>
              <Text style={styles.itemMetadata}>
                {displayDate}
              </Text>
              {displayCost && (
                <>
                  <Text style={styles.itemSeparator}> • </Text>
                  <Text style={styles.itemMetadata}>{displayCost}</Text>
                </>
              )}
            </View>
          </View>
          {isUrgent && (
            <View style={styles.itemStatus}>
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentBadgeText}>
                  {daysUntilExpiry! > 0 ? `${daysUntilExpiry} days` : 'Expired'}
                </Text>
              </View>
            </View>
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  }, [handleItemPress, handleMarkDoneCallback, handleDelete]);

  const filterChips: FilterChip[] = ['All', 'Urgent', 'Vehicle', 'Home', 'Digital'];

  // Render Next Expiry Hero Card (memoized)
  const renderHeroCard = useMemo(() => {
    if (nextExpiry) {
      const days = calculateDaysUntilExpiry(nextExpiry.expiry_date);
      const isUrgent = days !== null && days <= 7;
      
      return (
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Next Expiry</Text>
          <Text style={styles.heroTitle} numberOfLines={2}>
            {nextExpiry.title}
          </Text>
          <View style={styles.heroFooter}>
            {days !== null && (
              <Text style={[
                styles.heroDays,
                isUrgent && styles.heroDaysUrgent
              ]}>
                {days > 0 
                  ? `${days} ${days === 1 ? 'day' : 'days'} remaining`
                  : days === 0 
                    ? 'Expires today'
                    : `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`
                }
              </Text>
            )}
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>All Set</Text>
        <Text style={styles.heroTitle}>No upcoming expiries</Text>
        <Text style={styles.heroDays}>
          Everything is up to date
        </Text>
      </View>
    );
  }, [nextExpiry]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <LinearGradient
        colors={['#F5F5F7', '#FFFFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.gradient}
      >
        {isOffline && (
          <View style={styles.offlineBanner}>
            <NativeIcon name="wifi-off" size={16} color="#FFFFFF" />
            <Text style={styles.offlineText}>
              Not Connected
            </Text>
          </View>
        )}
        
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()}</Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/settings')}
              style={styles.settingsButton}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <NativeIcon name="settings" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Next Expiry Card */}
          {renderHeroCard}

          {/* Search Bar */}
          <View style={styles.searchBar}>
            <NativeIcon name="search" size={16} color="#8E8E93" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              placeholderTextColor="#8E8E93"
              style={styles.searchInput}
              accessibilityLabel="Search documents"
              returnKeyType="search"
            />
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsContainer}
            style={styles.filterChipsScroll}
          >
            {filterChips.map((chip) => {
              const isSelected = selectedChip === chip;
              return (
                <TouchableOpacity
                  key={chip}
                  onPress={() => {
                    triggerHaptic('light');
                    setSelectedChip(chip);
                  }}
                  style={[
                    styles.filterChip,
                    isSelected && styles.filterChipSelected
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter by ${chip}`}
                  accessibilityState={{ selected: isSelected }}
                  activeOpacity={0.7}
                >
                  <Text style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected
                  ]}>
                    {chip}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <NativeIcon name="file-text" size={56} color="#C7C7CC" />
            </View>
            <Text style={styles.emptyTitle}>
              {debouncedSearchQuery.trim() || selectedChip !== 'All' 
                ? 'No Results'
                : 'No Documents'
              }
            </Text>
            <Text style={styles.emptyText}>
              {debouncedSearchQuery.trim() || selectedChip !== 'All' 
                ? 'Try adjusting your search or filters'
                : 'Add your first document to get started'
              }
            </Text>
          </View>
        ) : (
          <View style={styles.listContainer}>
            <FlashList
              data={filteredItems}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              refreshing={isLoading}
              onRefresh={() => refetch()}
              contentContainerStyle={styles.listContent}
              removeClippedSubviews={true}
            />
          </View>
        )}
        
        <TabBar />
        
        {/* Floating Action Button */}
        <TouchableOpacity
          onPress={() => {
            triggerHaptic('light');
            setShowAddModal(true);
          }}
          style={styles.fab}
          accessibilityRole="button"
          accessibilityLabel="Add item"
          activeOpacity={0.8}
        >
          <NativeIcon name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Add Item Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddModal(false)}
        >
          <Pressable
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.modalTitle}>Add Item</Text>
            <Text style={styles.modalSubtitle}>Choose how you want to add an item</Text>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setShowAddModal(false);
                router.push('/(tabs)/scan');
              }}
              style={styles.modalButton}
              activeOpacity={0.7}
            >
              <View style={styles.modalButtonIcon}>
                <NativeIcon name="camera" size={24} color="#007AFF" />
              </View>
              <View style={styles.modalButtonContent}>
                <Text style={styles.modalButtonTitle}>Scan Document</Text>
                <Text style={styles.modalButtonSubtitle}>Take a photo and extract details</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setShowAddModal(false);
                router.push('/upload');
              }}
              style={styles.modalButton}
              activeOpacity={0.7}
            >
              <View style={styles.modalButtonIcon}>
                <NativeIcon name="file-text" size={24} color="#007AFF" />
              </View>
              <View style={styles.modalButtonContent}>
                <Text style={styles.modalButtonTitle}>Upload Document</Text>
                <Text style={styles.modalButtonSubtitle}>Upload PDF or image file</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setShowAddModal(false);
                router.push('/add');
              }}
              style={styles.modalButton}
              activeOpacity={0.7}
            >
              <View style={styles.modalButtonIcon}>
                <NativeIcon name="plus" size={24} color="#007AFF" />
              </View>
              <View style={styles.modalButtonContent}>
                <Text style={styles.modalButtonTitle}>Add Manually</Text>
                <Text style={styles.modalButtonSubtitle}>Enter details yourself</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                triggerHaptic('light');
                setShowAddModal(false);
              }}
              style={styles.modalCancelButton}
              activeOpacity={0.7}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  offlineBanner: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offlineText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.3,
  },
  settingsButton: {
    padding: 8,
    marginLeft: 8,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  heroLabel: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.6,
  },
  heroFooter: {
    marginTop: 4,
  },
  heroDays: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '500',
  },
  heroDaysUrgent: {
    color: '#FF3B30',
    fontWeight: '600',
  },
  searchBar: {
    backgroundColor: '#F2F2F7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
    minHeight: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    fontWeight: '400',
    paddingVertical: 0,
    minHeight: 20,
  },
  filterChipsScroll: {
    marginBottom: 4,
  },
  filterChipsContainer: {
    paddingRight: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 0,
  },
  filterChipSelected: {
    backgroundColor: '#007AFF',
  },
  filterChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  filterChipTextSelected: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 17,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  itemIconContainer: {
    marginRight: 14,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  itemMetadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemMetadata: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  itemSeparator: {
    fontSize: 15,
    color: '#C7C7CC',
    marginHorizontal: 4,
  },
  itemStatus: {
    marginLeft: 12,
  },
  urgentBadge: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  urgentBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  swipeActionLeft: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    borderRadius: 16,
    marginLeft: 20,
    marginBottom: 12,
  },
  swipeActionRight: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    marginRight: 20,
    marginBottom: 12,
  },
  swipeButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '400',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  modalButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  modalButtonContent: {
    flex: 1,
  },
  modalButtonTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  modalButtonSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  modalCancelButton: {
    marginTop: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: -0.2,
  },
});
