import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeIcon } from './NativeIcon';

interface PaywallProps {
  visible: boolean;
  onClose: () => void;
}

export function Paywall({ visible, onClose }: PaywallProps) {
  const [isPurchasing, setIsPurchasing] = useState(false);

  const handlePurchase = async () => {
    try {
      setIsPurchasing(true);
      // TODO: Implement RevenueCat purchase flow
      // For now, show success message
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert('Success', 'Pro features unlocked!');
      onClose();
    } catch (error) {
      if (__DEV__) {
        console.error('Purchase error:', error);
      }
      Alert.alert('Error', 'Failed to complete purchase. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsPurchasing(true);
      // TODO: Implement RevenueCat restore purchases
      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Restore Purchases', 'No previous purchases found.');
    } catch (error) {
      if (__DEV__) {
        console.error('Restore error:', error);
      }
      Alert.alert('Error', 'Failed to restore purchases.');
    } finally {
      setIsPurchasing(false);
    }
  };

  const features = [
    { name: 'Smart Scan', free: '1/Month', pro: 'Unlimited', icon: 'camera' },
    { name: 'Spot Coach', free: null, pro: true, icon: 'message-circle' },
    { name: 'Document Upload', free: null, pro: true, icon: 'file-text' },
    { name: 'App Lock', free: true, pro: true, icon: 'lock' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={styles.overlay}>
        <Pressable 
          style={styles.overlayPressable} 
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close modal"
        />
        <View style={styles.modalContainer}>
          {/* Handle Bar */}
          {Platform.OS === 'ios' && (
            <View style={styles.handleBar}>
              <View style={styles.handle} />
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                <NativeIcon name="sparkles" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.title} accessibilityRole="header">
                  SpotCheck Pro
                </Text>
                <Text style={styles.subtitle}>Unlock all features</Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close"
              activeOpacity={0.7}
            >
              <NativeIcon name="close" size={22} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Features List */}
            <View style={styles.featuresContainer}>
              {features.map((feature, index) => (
                <View
                  key={feature.name}
                  style={[
                    styles.featureRow,
                    index === features.length - 1 && styles.featureRowLast,
                  ]}
                >
                  <View style={styles.featureIcon}>
                    <NativeIcon
                      name={feature.icon as any}
                      size={20}
                      color="#007AFF"
                    />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureName}>{feature.name}</Text>
                  </View>
                  <View style={styles.featureStatus}>
                    {feature.free === true || feature.pro === true ? (
                      <NativeIcon name="check" size={20} color="#34C759" />
                    ) : feature.free ? (
                      <Text style={styles.featureLimit}>{feature.free}</Text>
                    ) : (
                      <Text style={styles.featureCross}>—</Text>
                    )}
                  </View>
                  <View style={styles.featureStatus}>
                    {feature.pro === true ? (
                      <NativeIcon name="check" size={20} color="#34C759" />
                    ) : feature.pro ? (
                      <Text style={styles.featureUnlimited}>{feature.pro}</Text>
                    ) : (
                      <Text style={styles.featureCross}>—</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>

            {/* Price Section */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceLabel}>One-time purchase</Text>
              <Text style={styles.price}>£24.99</Text>
              <Text style={styles.priceSubtitle}>Lifetime access</Text>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
              onPress={handlePurchase}
              disabled={isPurchasing}
              style={[
                styles.purchaseButton,
                isPurchasing && styles.purchaseButtonDisabled,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Purchase Pro"
              accessibilityState={{ disabled: isPurchasing }}
              activeOpacity={0.8}
            >
              {isPurchasing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.purchaseButtonText}>Unlock Pro</Text>
              )}
            </TouchableOpacity>

            {/* Restore Button */}
            <TouchableOpacity
              onPress={handleRestore}
              disabled={isPurchasing}
              style={styles.restoreButton}
              accessibilityRole="button"
              accessibilityLabel="Restore Purchases"
              accessibilityState={{ disabled: isPurchasing }}
              activeOpacity={0.7}
            >
              <Text style={styles.restoreButtonText}>Restore Purchases</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  overlayPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    width: '100%',
    zIndex: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D1D6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.6,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
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
    paddingBottom: 20,
  },
  featuresContainer: {
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  featureRowLast: {
    borderBottomWidth: 0,
  },
  featureIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  featureContent: {
    flex: 1,
  },
  featureName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: -0.2,
  },
  featureStatus: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLimit: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8E8E93',
  },
  featureUnlimited: {
    fontSize: 15,
    fontWeight: '600',
    color: '#007AFF',
  },
  featureCross: {
    fontSize: 17,
    fontWeight: '400',
    color: '#C7C7CC',
  },
  priceContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 20,
  },
  priceLabel: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    marginBottom: 8,
  },
  price: {
    fontSize: 44,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  priceSubtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
  },
  purchaseButton: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  purchaseButtonDisabled: {
    opacity: 0.5,
  },
  purchaseButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  restoreButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  restoreButtonText: {
    fontSize: 17,
    fontWeight: '400',
    color: '#007AFF',
  },
});
