import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, AccessibilityInfo, StyleSheet } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { scanDocument } from '@/services/ocr';
import { analyzeText } from '@/services/analysis';
import { triggerHaptic, triggerSound } from '@/services/sensory';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePaywall } from '@/context/PaywallContext';
import { useAuth } from '@/context/AuthContext';
import { PaywallError } from '@/services/paywall';
import { TabBar } from '@/components/TabBar';
import { Toast } from '@/components/Toast';

export default function ScanScreen() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reduceTransparency, setReduceTransparency] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();
  const { isOffline } = useNetworkStatus();
  const { showPaywall } = usePaywall();
  const { user } = useAuth();

  useEffect(() => {
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
  }, []);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, styles.permissionContainer]}>
        <Text style={styles.permissionTitle}>
          Camera Access Required
        </Text>
        <Text style={styles.permissionText}>
          SpotCheck needs access to your camera to scan documents.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionButton}
          accessibilityRole="button"
          accessibilityLabel="Allow Camera Access"
          activeOpacity={0.8}
        >
          <Text style={styles.permissionButtonText}>Allow Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    if (isOffline) {
      setToastMessage('Connect to the internet to scan documents');
      setToastVisible(true);
      return;
    }

    try {
      setIsAnalyzing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (!photo?.uri) {
        throw new Error('Failed to capture photo');
      }

      const extractedText = await scanDocument(photo.uri, user?.id);

      if (!extractedText || extractedText.trim().length === 0) {
        Alert.alert(
          'No Text Found',
          'Couldn\'t find any text in this image. Try again with better lighting.',
          [{ text: 'OK' }]
        );
        setIsAnalyzing(false);
        return;
      }

      const analysisResult = await analyzeText(extractedText);

      triggerHaptic('success');
      triggerSound('success');
      
      setToastMessage('Document scanned');
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
        setIsAnalyzing(false);
        showPaywall();
        return;
      }

      if (__DEV__) {
        console.error('Scan error:', error);
      }
      Alert.alert(
        'Unable to Scan',
        error instanceof Error ? error.message : 'This document couldn\'t be scanned. Please try again.'
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View style={styles.cameraContainer}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
      >
        {/* Overlay Frame */}
        <View style={styles.overlayContainer}>
          <View style={styles.overlayFrame} />
          <View style={styles.overlayTop} />
          <View style={styles.overlayBottom} />
          <View style={styles.overlayLeft} />
          <View style={styles.overlayRight} />
        </View>

        {/* Loading Overlay */}
        {isAnalyzing && (
          <View 
            style={[
              styles.loadingOverlay,
              reduceTransparency && styles.loadingOverlaySolid
            ]}
            accessibilityRole="progressbar"
            accessibilityLabel="Analyzing document"
          >
            {reduceTransparency ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingTitle}>Analyzing...</Text>
                <Text style={styles.loadingText}>
                  This may take a moment
                </Text>
              </View>
            ) : (
              <BlurView intensity={20} style={styles.blurContainer}>
                <View style={styles.loadingCard}>
                  <ActivityIndicator size="large" color="#007AFF" />
                  <Text style={styles.loadingTitle}>Analyzing...</Text>
                  <Text style={styles.loadingText}>
                    This may take a moment
                  </Text>
                </View>
              </BlurView>
            )}
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.controlsContainer}>
          <View style={styles.controls}>
            <TouchableOpacity
              onPress={handleCapture}
              disabled={isAnalyzing || isOffline}
              style={[
                styles.captureButton,
                (isAnalyzing || isOffline) && styles.captureButtonDisabled
              ]}
              accessibilityRole="button"
              accessibilityLabel="Capture photo"
              accessibilityState={{ disabled: isAnalyzing || isOffline }}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            <Text style={styles.captureHint}>
              Position document in frame
            </Text>
          </View>
        </View>
      </CameraView>
      <Toast
        message={toastMessage}
        type="success"
        visible={toastVisible}
        onHide={() => setToastVisible(false)}
      />
      <TabBar />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  permissionContainer: {
    padding: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  permissionText: {
    fontSize: 17,
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 17,
    letterSpacing: -0.2,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayFrame: {
    width: 320,
    height: 384,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 16,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 160,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayLeft: {
    position: 'absolute',
    top: 160,
    left: 0,
    width: 80,
    height: 384,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayRight: {
    position: 'absolute',
    top: 160,
    right: 0,
    width: 80,
    height: 384,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlaySolid: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  loadingTitle: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 17,
    marginTop: 20,
    letterSpacing: -0.2,
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  controls: {
    alignItems: 'center',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#000000',
  },
  captureHint: {
    color: '#FFFFFF',
    fontSize: 15,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '400',
  },
});
