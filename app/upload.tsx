import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { pickImage, pickDocument, processUploadedFile } from '@/services/upload';
import { analyzeText } from '@/services/analysis';
import { triggerHaptic, triggerSound } from '@/services/sensory';
import { useAuth } from '@/context/AuthContext';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePaywall } from '@/context/PaywallContext';
import { PaywallError } from '@/services/paywall';
import { Toast } from '@/components/Toast';
import { NativeIcon } from '@/components/NativeIcon';

export default function UploadScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isOffline } = useNetworkStatus();
  const { showPaywall } = usePaywall();
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [selectedOption, setSelectedOption] = useState<'image' | 'document' | null>(null);

  const handlePickImage = async () => {
    if (isOffline) {
      setToastMessage('Connect to the internet to upload documents');
      setToastVisible(true);
      return;
    }

    try {
      setSelectedOption('image');
      setIsProcessing(true);

      const file = await pickImage();
      if (!file) {
        setIsProcessing(false);
        setSelectedOption(null);
        return;
      }

      await processFile(file);
    } catch (error) {
      if (__DEV__) {
        console.error('Upload error:', error);
      }
      Alert.alert(
        'Unable to Upload',
        error instanceof Error ? error.message : 'This file couldn\'t be uploaded. Please try again.'
      );
      setIsProcessing(false);
      setSelectedOption(null);
    }
  };

  const handlePickDocument = async () => {
    if (isOffline) {
      setToastMessage('Connect to the internet to upload documents');
      setToastVisible(true);
      return;
    }

    try {
      setSelectedOption('document');
      setIsProcessing(true);

      const file = await pickDocument(user?.id);
      if (!file) {
        setIsProcessing(false);
        setSelectedOption(null);
        return;
      }

      await processFile(file);
    } catch (error) {
      if (error instanceof PaywallError) {
        setIsProcessing(false);
        setSelectedOption(null);
        showPaywall();
        return;
      }

      if (__DEV__) {
        console.error('Upload error:', error);
      }
      
      if (error instanceof Error && error.message.includes('PDF')) {
        Alert.alert(
          'PDF Not Supported',
          'PDF files are currently not supported. Please convert your PDF to an image or use the camera to scan the document.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Unable to Upload',
          error instanceof Error ? error.message : 'This file couldn\'t be uploaded. Please try again.'
        );
      }
      setIsProcessing(false);
      setSelectedOption(null);
    }
  };

  const processFile = async (file: any) => {
    try {
      const extractedText = await processUploadedFile(file, user?.id);

      if (!extractedText || extractedText.trim().length === 0) {
        Alert.alert(
          'No Text Found',
          'Couldn\'t find any text in this image. Try a different file or use the camera to scan.',
          [{ text: 'OK' }]
        );
        setIsProcessing(false);
        setSelectedOption(null);
        return;
      }

      const analysisResult = await analyzeText(extractedText);

      triggerHaptic('success');
      triggerSound('success');
      
      setToastMessage('Document processed');
      setToastVisible(true);

      router.push({
        pathname: '/verify',
        params: {
          data: JSON.stringify(analysisResult),
          ocrText: extractedText,
        },
      });
    } catch (error) {
      if (error instanceof PaywallError) {
        setIsProcessing(false);
        setSelectedOption(null);
        showPaywall();
        return;
      }

      throw error;
    } finally {
      setIsProcessing(false);
      setSelectedOption(null);
    }
  };

  return (
    <LinearGradient
      colors={['#F5F5F7', '#FFFFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Close"
            activeOpacity={0.7}
          >
            <NativeIcon name="close" size={22} color="#8E8E93" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} accessibilityRole="header">
            Upload Document
          </Text>
          <View style={styles.closeButtonPlaceholder} />
        </View>

        <View style={styles.content}>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
              <Text style={styles.processingTitle}>
                {selectedOption === 'image' ? 'Processing Image...' : 'Processing Document...'}
              </Text>
              <Text style={styles.processingText}>
                Extracting text from your file
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Choose where to upload from
              </Text>

              {/* Pick Image Button */}
              <TouchableOpacity
                onPress={handlePickImage}
                disabled={isOffline}
                style={[
                  styles.uploadButton,
                  isOffline && styles.uploadButtonDisabled
                ]}
                activeOpacity={0.7}
              >
              <View style={styles.uploadButtonIcon}>
                <NativeIcon name="file" size={28} color="#007AFF" />
              </View>
                <View style={styles.uploadButtonContent}>
                  <Text style={styles.uploadButtonTitle}>Choose Photo</Text>
                  <Text style={styles.uploadButtonSubtitle}>
                    Select an image from your gallery
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Pick Document Button */}
              <TouchableOpacity
                onPress={handlePickDocument}
                disabled={isOffline}
                style={[
                  styles.uploadButton,
                  isOffline && styles.uploadButtonDisabled
                ]}
                activeOpacity={0.7}
              >
                <View style={styles.uploadButtonIcon}>
                  <NativeIcon name="file-text" size={28} color="#007AFF" />
                </View>
                <View style={styles.uploadButtonContent}>
                  <Text style={styles.uploadButtonTitle}>Choose File</Text>
                  <Text style={styles.uploadButtonSubtitle}>
                    Select a PDF or image file
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={styles.infoContainer}>
                <NativeIcon name="file-text" size={16} color="#8E8E93" />
                <Text style={styles.infoText}>
                  Supported formats: Images (JPG, PNG) and PDFs. Screenshots work great too!
                </Text>
              </View>
            </>
          )}
        </View>
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

const styles = StyleSheet.create({
  gradient: {
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
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  closeButtonPlaceholder: {
    width: 38,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 32,
  },
  subtitle: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
    fontWeight: '400',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: '#E5E5EA',
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  uploadButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  uploadButtonContent: {
    flex: 1,
  },
  uploadButtonTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  uploadButtonSubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    fontWeight: '400',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '400',
    lineHeight: 18,
  },
  processingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginTop: 24,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  processingText: {
    fontSize: 17,
    color: '#8E8E93',
    fontWeight: '400',
    textAlign: 'center',
  },
});
