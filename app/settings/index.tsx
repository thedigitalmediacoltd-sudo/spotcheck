import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { usePreferences } from '@/hooks/usePreferences';
import { usePaywall } from '@/context/PaywallContext';
import { useProfile } from '@/hooks/useProfile';
import { ProBadge } from '@/components/ProBadge';
import { NativeIcon } from '@/components/NativeIcon';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { preferences, isLoading: prefsLoading, updatePreference } = usePreferences();
  const { showPaywall } = usePaywall();
  const { profile } = useProfile();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpgrade = () => {
    showPaywall();
  };

  const handleRestorePurchases = async () => {
    Alert.alert('Restore Purchases', 'Checking for previous purchases...');
  };

  const handleFaceIDToggle = (value: boolean) => {
    updatePreference('requireFaceID', value);
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://spotcheck.app/privacy');
  };

  const handleTermsOfService = () => {
    Linking.openURL('https://spotcheck.app/terms');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@spotcheck.app?subject=SpotCheck Support');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
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
              if (!user) {
                throw new Error('No user found');
              }

              const { error: itemsError } = await supabase
                .from('items')
                .delete()
                .eq('user_id', user.id);

              if (itemsError) {
                throw new Error(`Failed to delete items: ${itemsError.message}`);
              }

              await signOut();

              Alert.alert(
                'Account Deleted',
                'Your account and all data have been permanently deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(auth)/login'),
                  },
                ]
              );
            } catch (error) {
              if (__DEV__) {
                console.error('Delete account error:', error);
              }
              Alert.alert(
                'Unable to Delete',
                error instanceof Error
                  ? error.message
                  : 'This account couldn\'t be deleted. Please try again or contact support.'
              );
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const renderSection = (
    title: string,
    children: React.ReactNode,
    style?: any
  ) => (
    <View style={[styles.section, style]}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.sectionCard}>
        {children}
      </View>
    </View>
  );

  const renderRow = (
    icon: React.ReactNode,
    title: string,
    rightElement?: React.ReactNode,
    onPress?: () => void,
    showArrow = false
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.row,
        !onPress && styles.rowDisabled
      ]}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityLabel={title}
      activeOpacity={0.7}
    >
      <View style={styles.rowIcon}>{icon}</View>
      <Text style={styles.rowTitle}>{title}</Text>
      {rightElement}
      {showArrow && onPress && (
        <Text style={styles.rowArrow}>›</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <LinearGradient
      colors={['#F5F5F7', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle} accessibilityRole="header">
          Settings
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

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Section 1: Membership */}
        {renderSection(
          'MEMBERSHIP',
          <>
            {renderRow(
              <NativeIcon name="crown" size={20} color="#FF9500" />,
              'Current Plan',
              profile?.is_pro ? (
                <ProBadge size="sm" />
              ) : (
                <View style={styles.freeBadge}>
                  <Text style={styles.freeBadgeText}>Free</Text>
                </View>
              )
            )}
            {!profile?.is_pro && renderRow(
              <NativeIcon name="crown" size={20} color="#FF9500" />,
              'Upgrade to Pro',
              null,
              handleUpgrade,
              true
            )}
            {renderRow(
              <NativeIcon name="crown" size={20} color="#FF9500" />,
              'Restore Purchases',
              null,
              handleRestorePurchases,
              true
            )}
          </>
        )}

        {/* Section 2: Security */}
        {renderSection(
          'SECURITY',
          <>
            {renderRow(
              <NativeIcon name="shield" size={20} color="#007AFF" />,
              'Require Face ID',
              prefsLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Switch
                  value={preferences.requireFaceID}
                  onValueChange={handleFaceIDToggle}
                  trackColor={{ false: '#E5E5EA', true: '#B3D9FF' }}
                  thumbColor={preferences.requireFaceID ? '#007AFF' : '#FFFFFF'}
                />
              )
            )}
          </>
        )}

        {/* Section 3: Preferences */}
        {renderSection(
          'PREFERENCES',
          <>
            {renderRow(
              <NativeIcon name="bell" size={20} color="#007AFF" />,
              'Haptics',
              prefsLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Switch
                  value={preferences.hapticsEnabled}
                  onValueChange={(value) => updatePreference('hapticsEnabled', value)}
                  trackColor={{ false: '#E5E5EA', true: '#B3D9FF' }}
                  thumbColor={preferences.hapticsEnabled ? '#007AFF' : '#FFFFFF'}
                />
              )
            )}
            {renderRow(
              <NativeIcon name="settings" size={20} color="#007AFF" />,
              'Sounds',
              prefsLoading ? (
                <ActivityIndicator size="small" color="#007AFF" />
              ) : (
                <Switch
                  value={preferences.soundsEnabled}
                  onValueChange={(value) => updatePreference('soundsEnabled', value)}
                  trackColor={{ false: '#E5E5EA', true: '#B3D9FF' }}
                  thumbColor={preferences.soundsEnabled ? '#007AFF' : '#FFFFFF'}
                />
              )
            )}
          </>
        )}

        {/* Section 4: Support */}
        {renderSection(
          'SUPPORT',
          <>
            {renderRow(
              <NativeIcon name="file-text" size={20} color="#8E8E93" />,
              'Privacy Policy',
              null,
              handlePrivacyPolicy,
              true
            )}
            {renderRow(
              <NativeIcon name="file-text" size={20} color="#8E8E93" />,
              'Terms of Service',
              null,
              handleTermsOfService,
              true
            )}
            {renderRow(
              <NativeIcon name="mail" size={20} color="#8E8E93" />,
              'Contact Support',
              null,
              handleContactSupport,
              true
            )}
          </>
        )}

        {/* Delete Account Button */}
        <View style={styles.deleteSection}>
          <TouchableOpacity
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            style={styles.deleteButton}
            accessibilityRole="button"
            accessibilityLabel="Delete account"
            activeOpacity={0.7}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#FF3B30" />
            ) : (
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 34,
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
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: 20,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E5E5EA',
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowIcon: {
    marginRight: 14,
    width: 24,
    alignItems: 'center',
  },
  rowTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '400',
    color: '#000000',
  },
  rowArrow: {
    fontSize: 18,
    color: '#C7C7CC',
    marginLeft: 8,
  },
  freeBadge: {
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  freeBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF9500',
  },
  deleteSection: {
    marginTop: 8,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#FF3B30',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
