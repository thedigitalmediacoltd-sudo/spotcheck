import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { Database } from '@/types/supabase';
import { CategoryIcon } from '@/components/CategoryIcon';
import { UrgencyBadge } from '@/components/UrgencyBadge';
import { ActionCard } from '@/components/ActionCard';
import { Toast } from '@/components/Toast';
import { addToCalendar } from '@/services/calendar';
import * as Clipboard from 'expo-clipboard';
import { NativeIcon } from '@/components/NativeIcon';

type Item = Database['public']['Tables']['items']['Row'];

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

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

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
      Alert.alert('Error', 'Failed to load item details');
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
        month: 'long',
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

  const calculateSavings = (): number => {
    if (!item?.cost_monthly) return 0;
    // Estimate 30% savings when switching from main dealer to independent
    return item.cost_monthly * 0.3;
  };

  const generateScript = (): string => {
    if (!item) return '';
    
    if (item.category === 'insurance') {
      return `Subject: FCA GIPP Breach Complaint - Insurance Renewal Pricing

Dear ${item.title} Customer Service,

I am writing to formally complain about a potential breach of the Financial Conduct Authority's (FCA) General Insurance Pricing Practices (GIPP) rules.

My current policy renewal quote is significantly higher than what a new customer would pay for the same coverage. This appears to be a "loyalty penalty" that contravenes the FCA's requirement for fair pricing.

Current Renewal: £${item.cost_monthly?.toFixed(2) || 'N/A'}
New Customer Quote: [Please provide equivalent quote]

I request that you:
1. Review my renewal quote in line with GIPP requirements
2. Provide justification for any price difference
3. Offer me the same price as a new customer would receive

I look forward to your response within 14 days as per FCA guidelines.

Yours sincerely,
[Your Name]`;
    } else {
      return `Subject: Consumer Rights Act 2015 - Claim for Faulty Goods

Dear ${item.title} Customer Service,

I am writing to make a claim under the Consumer Rights Act 2015 regarding [product description].

The goods I purchased on [date] have developed a fault that was not apparent at the time of purchase. Under the Consumer Rights Act 2015, goods must be:
- Of satisfactory quality
- Fit for purpose
- As described

The fault indicates that the goods were not of satisfactory quality at the time of sale, regardless of the warranty period.

I request:
1. A full refund or replacement
2. Compensation for any inconvenience caused
3. Confirmation of your response within 14 days

I look forward to resolving this matter amicably.

Yours sincerely,
[Your Name]`;
    }
  };

  const handleResolve = async () => {
    if (!item) return;
    
    const script = generateScript();
    await Clipboard.setStringAsync(script);
    
    // Visual feedback
    setToastMessage('Script copied to clipboard');
    setToastVisible(true);
    
    Alert.alert('Script Copied', 'Legal script has been copied to your clipboard');
  };

  const handleAddToCalendar = async () => {
    if (!item) return;

    try {
      await addToCalendar(item);
      setToastMessage('Reminder Set');
      setToastVisible(true);
      Alert.alert('Success', 'Renewal reminder set in your calendar');
    } catch (error) {
      if (__DEV__) {
        console.error('Calendar error:', error);
      }
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to add to calendar. Please check your calendar permissions.'
      );
    }
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-slate-500 mt-4">Loading...</Text>
      </View>
    );
  }

  if (!item) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <Text className="text-slate-500">Item not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-blue-600 px-6 py-3 rounded-2xl"
        >
          <Text className="text-white font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const daysUntilExpiry = calculateDaysUntilExpiry(item.expiry_date);
  const showMainDealerCard = item.is_main_dealer === true;
  const showLegalScript = item.renewal_status === 'negotiating' || 
    (item.category === 'insurance' && item.cost_monthly && item.cost_monthly > 0);
  const savings = calculateSavings();

  return (
    <ScrollView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white border-b border-slate-100 px-6 py-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex-row items-center mb-4"
          accessibilityRole="button"
          accessibilityLabel="Back"
          accessibilityHint="Returns to the previous screen"
        >
          <NativeIcon name="arrow-left" size={20} color="#0F172A" />
          <Text className="text-slate-900 font-semibold ml-2">Back</Text>
        </TouchableOpacity>
        
        <View className="flex-row items-center">
          <CategoryIcon 
            category={mapCategoryToDisplay(item.category) as any}
            size={32}
          />
          <View className="ml-4 flex-1">
            <Text 
              className="text-3xl font-semibold text-slate-900" 
              numberOfLines={2}
              accessibilityRole="header"
            >
              {item.title}
            </Text>
            <Text 
              className="text-slate-500 text-sm mt-1"
              accessibilityRole="text"
            >
              {mapCategoryToDisplay(item.category)}
            </Text>
          </View>
        </View>
      </View>

      <View className="p-6">
        {/* Insight Section */}
        {showMainDealerCard && (
          <View className="mb-6">
            <ActionCard
              potentialSavings={savings}
              message="Savings Opportunity. You could save £" + savings.toFixed(0)
              onResolve={handleResolve}
            />
          </View>
        )}

        {/* Legal Script Section */}
        {showLegalScript && (
          <View className="mb-6">
            <View className="bg-white rounded-2xl p-4 shadow-sm mb-4">
              <Text className="text-slate-500 text-sm mb-2">Draft Letter</Text>
              <TextInput
                value={generateScript()}
                multiline
                editable={false}
                className="bg-slate-50 rounded-xl p-4 text-slate-700 text-sm min-h-48"
              />
            </View>
            <TouchableOpacity
              onPress={async () => {
                await Clipboard.setStringAsync(generateScript());
                setToastMessage('Letter copied to clipboard');
                setToastVisible(true);
                Alert.alert('Copied', 'Letter copied to clipboard');
              }}
              className="bg-blue-600 py-3 rounded-2xl flex-row items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Copy Draft Letter"
              accessibilityHint="Copies the generated letter to your clipboard"
            >
              <NativeIcon name="share" size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Draft Letter</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Add to Calendar Button */}
        {item.expiry_date && (
          <View className="mb-4 px-4">
            <TouchableOpacity
              onPress={handleAddToCalendar}
              className="bg-blue-600 py-3 rounded-2xl flex-row items-center justify-center"
              accessibilityRole="button"
              accessibilityLabel="Set Reminder"
              accessibilityHint="Sets a renewal reminder in your calendar"
            >
              <NativeIcon name="calendar-plus" size={20} color="#FFFFFF" />
              <Text className="text-white font-semibold ml-2">Set Reminder</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Details Card */}
        <View className="bg-white rounded-2xl p-5 shadow-sm">
          <Text 
            className="text-xl font-semibold text-slate-900 mb-4"
            accessibilityRole="header"
          >
            Details
          </Text>
          
          <View>
            <View className="flex-row justify-between items-center py-3 border-b border-slate-100">
              <Text className="text-slate-500">Cost</Text>
              <Text className="text-slate-900 font-semibold">
                {formatCost(item.cost_monthly)}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-3 border-b border-slate-100">
              <Text className="text-slate-500">Expiry Date</Text>
              <View className="flex-row items-center">
                <Text className="text-slate-900 font-semibold mr-2">
                  {formatDate(item.expiry_date)}
                </Text>
                <UrgencyBadge daysUntilExpiry={daysUntilExpiry} />
              </View>
            </View>

            {item.vehicle_reg && (
              <View className="flex-row justify-between items-center py-3 border-b border-slate-100">
                <Text className="text-slate-500">Registration</Text>
                <Text className="text-slate-900 font-semibold">
                  {item.vehicle_reg}
                </Text>
              </View>
            )}

            {item.vehicle_make && (
              <View className="flex-row justify-between items-center py-3 border-b border-slate-100">
                <Text className="text-slate-500">Vehicle Make</Text>
                <Text className="text-slate-900 font-semibold">
                  {item.vehicle_make}
                </Text>
              </View>
            )}

            <View className="flex-row justify-between items-center py-3">
              <Text className="text-slate-500">Status</Text>
              <Text className="text-slate-900 font-semibold capitalize">
                {item.renewal_status}
              </Text>
            </View>
          </View>
        </View>
      </View>
      <Toast
        message={toastMessage}
        type="success"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </ScrollView>
  );
}
