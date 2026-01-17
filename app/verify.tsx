import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { AnalysisResult } from '@/services/analysis';
import { CategoryIcon } from '@/components/CategoryIcon';
import { useItems } from '@/hooks/useItems';
import { triggerHaptic } from '@/services/sensory';
import { Toast } from '@/components/Toast';
import { NativeIcon } from '@/components/NativeIcon';

const CATEGORIES = [
  'Vehicle',
  'Home/Utilities',
  'Pet',
  'Fitness',
  'Subscription',
  'Insurance',
] as const;

type Category = typeof CATEGORIES[number];

const mapCategoryToDb = (category: Category): 'insurance' | 'gov' | 'sub' | 'warranty' | 'contract' => {
  switch (category) {
    case 'Insurance':
      return 'insurance';
    case 'Vehicle':
    case 'Home/Utilities':
      return 'gov';
    case 'Subscription':
    case 'Fitness':
    case 'Pet':
      return 'sub';
    default:
      return 'contract';
  }
};

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { addItem, isAdding } = useItems(user?.id);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('Subscription');
  const [expiryDate, setExpiryDate] = useState('');
  const [cost, setCost] = useState('');
  const [vehicleReg, setVehicleReg] = useState('');
  const [ocrText, setOcrText] = useState('');

  useEffect(() => {
    try {
      const data = params.data as string;
      const ocr = params.ocrText as string;
      
      if (data) {
        const analysisResult: AnalysisResult = JSON.parse(data);
        setTitle(analysisResult.title || '');
        setExpiryDate(analysisResult.expiry_date || '');
        setCost(analysisResult.cost_amount?.toString() || '');
        setVehicleReg(analysisResult.vehicle_reg || '');
        
        if (analysisResult.category === 'insurance') {
          setCategory('Insurance');
        } else if (analysisResult.category === 'gov') {
          setCategory('Vehicle');
        } else {
          setCategory('Subscription');
        }
      }
      
      if (ocr) {
        setOcrText(ocr);
      }
    } catch (error) {
      if (__DEV__) {
        console.error('Error parsing params:', error);
      }
      Alert.alert('Error', 'Failed to load analysis data');
      router.back();
    }
  }, [params]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to save items');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    try {
      let expiryDateFormatted: string | null = null;
      if (expiryDate.trim()) {
        const [day, month, year] = expiryDate.split('/');
        if (day && month && year) {
          expiryDateFormatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }

      const costValue = cost ? parseFloat(cost) : null;

      const insertData: any = {
        user_id: user.id,
        title: title.trim(),
        category: mapCategoryToDb(category),
        expiry_date: expiryDateFormatted,
        cost_monthly: costValue,
        ocr_raw_text: ocrText,
        is_scanned: true,
        renewal_status: 'active',
      };

      if (category === 'Vehicle' && vehicleReg.trim()) {
        insertData.vehicle_reg = vehicleReg.trim().toUpperCase();
      }

      await addItem(insertData);

      // Trigger success feedback
      triggerHaptic('success');
      
      // Visual feedback for deaf users
      setToastMessage('Item saved successfully');
      setToastVisible(true);

      Alert.alert('Success', 'Item saved successfully', [
        {
          text: 'OK',
          onPress: () => router.replace('/(tabs)/'),
        },
      ]);
    } catch (error) {
      if (__DEV__) {
        console.error('Save error:', error);
      }
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save item'
      );
    }
  };

  return (
    <LinearGradient
      colors={['#F3E8FF', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      className="flex-1"
    >
      <View className="bg-white rounded-t-3xl flex-1 mt-20 shadow-lg border border-purple-50">
        {/* Header */}
        <View className="flex-row items-center justify-between p-6 border-b border-purple-100">
          <Text 
            className="text-2xl font-semibold text-slate-900"
            accessibilityRole="header"
          >
            Verify Details
          </Text>
          <TouchableOpacity 
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Close"
            accessibilityHint="Closes the verification screen and returns to previous screen"
          >
            <NativeIcon name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
          {/* Category Picker - Horizontal Scroll */}
          <View className="mb-6">
            <Text 
              className="text-sm font-semibold text-slate-700 mb-3"
              accessibilityRole="text"
            >
              Category
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              className="flex-row"
              accessibilityRole="radiogroup"
            >
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setCategory(cat)}
                  className={`mr-3 items-center ${
                    category === cat ? 'opacity-100' : 'opacity-50'
                  }`}
                  accessibilityRole="radio"
                  accessibilityLabel={cat}
                  accessibilityHint={`Select ${cat} as the category`}
                  accessibilityState={{ selected: category === cat }}
                >
                  <View className={`mb-2 ${
                    category === cat ? 'border-2 border-purple-600 rounded-full' : ''
                  }`}>
                    <CategoryIcon category={cat} size={24} />
                  </View>
                  <Text className={`text-xs font-medium ${
                    category === cat ? 'text-purple-600' : 'text-slate-500'
                  }`}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title */}
          <View className="mb-4">
            <Text 
              className="text-sm font-semibold text-slate-700 mb-2"
              accessibilityRole="text"
            >
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Document title"
              className="bg-white border border-purple-100 rounded-2xl px-4 py-4 text-slate-900 shadow-sm"
              placeholderTextColor="#94A3B8"
              style={{ caretColor: '#9333EA' }}
              accessibilityLabel="Document title"
              accessibilityHint="Enter the title for this document"
            />
          </View>

          {/* Vehicle Reg Plate - Only for Vehicle category */}
          {category === 'Vehicle' && (
            <View className="mb-4">
              <Text 
                className="text-sm font-semibold text-slate-700 mb-2"
                accessibilityRole="text"
              >
                Registration Plate
              </Text>
              <TextInput
                value={vehicleReg}
                onChangeText={setVehicleReg}
                placeholder="AB12 CDE"
                autoCapitalize="characters"
                className="bg-white border border-purple-100 rounded-2xl px-4 py-4 text-slate-900 shadow-sm"
                placeholderTextColor="#94A3B8"
                style={{ caretColor: '#9333EA' }}
                accessibilityLabel="Vehicle registration plate"
                accessibilityHint="Enter the vehicle registration number"
              />
            </View>
          )}

          {/* Expiry Date */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-slate-700 mb-2">Expiry Date</Text>
            <TextInput
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="DD/MM/YYYY"
              className="bg-white border border-purple-100 rounded-2xl px-4 py-4 text-slate-900 shadow-sm"
              placeholderTextColor="#94A3B8"
              style={{ caretColor: '#9333EA' }}
            />
          </View>

          {/* Cost */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-slate-700 mb-2">Cost (£)</Text>
            <TextInput
              value={cost}
              onChangeText={setCost}
              placeholder="45.99"
              keyboardType="decimal-pad"
              className="bg-white border border-purple-100 rounded-2xl px-4 py-4 text-slate-900 shadow-sm"
              placeholderTextColor="#94A3B8"
              style={{ caretColor: '#9333EA' }}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isAdding}
            className={`bg-purple-600 py-4 rounded-3xl shadow-md ${isAdding ? 'opacity-50' : ''}`}
            accessibilityRole="button"
            accessibilityLabel={isAdding ? 'Saving item' : 'Save Item'}
            accessibilityHint="Saves the item to your list"
            accessibilityState={{ disabled: isAdding }}
          >
            <Text className="text-white font-semibold text-center text-lg">
              {isAdding ? 'Saving...' : 'Save Item'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <Toast
        message={toastMessage}
        type="success"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
    </LinearGradient>
  );
}
