import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
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
      Alert.alert('Unable to Load', 'This document couldn\'t be loaded. Please try again.');
      router.back();
    }
  }, [params]);

  const handleSave = async () => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to save documents');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a title for this document');
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

      triggerHaptic('success');
      
      setToastMessage('Document saved');
      setToastVisible(true);

      Alert.alert('Saved', 'Your document has been saved', [
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
        'Unable to Save',
        error instanceof Error ? error.message : 'This document couldn\'t be saved. Please try again.'
      );
    }
  };

  return (
    <LinearGradient
      colors={['#F5F5F7', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle} accessibilityRole="header">
              Verify Details
            </Text>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
              activeOpacity={0.7}
            >
              <NativeIcon name="close" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          {/* Category Picker - Horizontal Scroll */}
          <View style={styles.categorySection}>
            <Text style={styles.label} accessibilityRole="text">
              Category
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={styles.categoryItem}
                    accessibilityRole="radio"
                    accessibilityLabel={cat}
                    accessibilityState={{ selected: isSelected }}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.categoryIconWrapper,
                      isSelected && styles.categoryIconSelected
                    ]}>
                      <CategoryIcon category={cat} size={24} />
                    </View>
                    <Text style={[
                      styles.categoryLabel,
                      isSelected && styles.categoryLabelSelected
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Title */}
          <View style={styles.inputSection}>
            <Text style={styles.label} accessibilityRole="text">
              Title
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Document name"
              style={styles.textInput}
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Vehicle Reg Plate - Only for Vehicle category */}
          {category === 'Vehicle' && (
            <View style={styles.inputSection}>
              <Text style={styles.label} accessibilityRole="text">
                Registration Number
              </Text>
              <TextInput
                value={vehicleReg}
                onChangeText={setVehicleReg}
                placeholder="AB12 CDE"
                autoCapitalize="characters"
                style={styles.textInput}
                placeholderTextColor="#8E8E93"
                accessibilityLabel="Vehicle registration number"
              />
            </View>
          )}

          {/* Expiry Date */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Expiry Date</Text>
            <TextInput
              value={expiryDate}
              onChangeText={setExpiryDate}
              placeholder="DD/MM/YYYY"
              style={styles.textInput}
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Cost */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Monthly Cost</Text>
            <TextInput
              value={cost}
              onChangeText={setCost}
              placeholder="45.99"
              keyboardType="decimal-pad"
              style={styles.textInput}
              placeholderTextColor="#8E8E93"
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={isAdding}
            style={[
              styles.saveButton,
              isAdding && styles.saveButtonDisabled
            ]}
            accessibilityRole="button"
            accessibilityLabel={isAdding ? 'Saving...' : 'Save document'}
            accessibilityState={{ disabled: isAdding }}
            activeOpacity={0.8}
          >
            <Text style={styles.saveButtonText}>
              {isAdding ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 1,
    marginTop: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.6,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  categorySection: {
    marginBottom: 28,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  categoryScroll: {
    gap: 16,
  },
  categoryItem: {
    alignItems: 'center',
    marginRight: 16,
  },
  categoryIconWrapper: {
    marginBottom: 10,
    borderRadius: 20,
  },
  categoryIconSelected: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
  },
  categoryLabelSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  inputSection: {
    marginBottom: 24,
  },
  textInput: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 17,
    color: '#000000',
    fontWeight: '400',
    borderWidth: 0,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
