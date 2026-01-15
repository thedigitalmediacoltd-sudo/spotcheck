import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Alert, AccessibilityInfo } from 'react-native';
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
    // Check if reduce transparency is enabled
    AccessibilityInfo.isReduceTransparencyEnabled().then(setReduceTransparency);
  }, []);

  if (!permission) {
    return <View className="flex-1 items-center justify-center bg-white" />;
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Text className="text-lg font-semibold text-slate-800 mb-2 text-center">
          Camera permission required
        </Text>
        <Text className="text-sm text-slate-500 mb-4 text-center">
          SpotCheck needs camera access to scan your documents.
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-blue-600 px-6 py-3 rounded-xl"
          accessibilityRole="button"
          accessibilityLabel="Grant Camera Permission"
          accessibilityHint="Allows SpotCheck to access your camera to scan documents"
        >
          <Text className="text-white font-semibold">Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    if (isOffline) {
      setToastMessage('No Internet Connection. Reconnect to scan.');
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
          'Could not extract text from the image. Please try again with better lighting.',
          [{ text: 'OK' }]
        );
        setIsAnalyzing(false);
        return;
      }

      const analysisResult = await analyzeText(extractedText);

      // Trigger success feedback
      triggerHaptic('success');
      triggerSound('success');
      
      // Visual feedback for deaf users
      setToastMessage('Document scanned successfully');
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
        // Show paywall for scan limit
        setIsAnalyzing(false);
        showPaywall();
        return;
      }

      if (__DEV__) {
        console.error('Scan error:', error);
      }
      Alert.alert(
        'Scan Failed',
        error instanceof Error ? error.message : 'An error occurred while scanning. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <View className="flex-1 bg-black">
      <CameraView
        ref={cameraRef}
        className="flex-1"
        facing={facing}
      >
        {/* Overlay Frame */}
        <View className="absolute inset-0 items-center justify-center">
          <View className="w-80 h-96 border-2 border-white/50 rounded-2xl" />
          <View className="absolute top-0 left-0 right-0 h-40 bg-black/40" />
          <View className="absolute bottom-0 left-0 right-0 h-40 bg-black/40" />
          <View className="absolute top-40 left-0 w-20 h-96 bg-black/40" />
          <View className="absolute top-40 right-0 w-20 h-96 bg-black/40" />
        </View>

        {/* Loading Overlay */}
        {isAnalyzing && (
          <View 
            className={`absolute inset-0 items-center justify-center ${
              reduceTransparency ? 'bg-black/90' : ''
            }`}
            accessibilityRole="progressbar"
            accessibilityLabel="Reading document"
            accessibilityLiveRegion="polite"
          >
            {reduceTransparency ? (
              <View className="bg-white rounded-3xl p-8 items-center shadow-lg">
                <ActivityIndicator size="large" color="#2563EB" />
                <Text className="text-slate-900 font-semibold mt-4 text-lg">
                  Reading...
                </Text>
                <Text className="text-slate-500 text-sm mt-2 text-center">
                  This may take a few seconds
                </Text>
              </View>
            ) : (
              <BlurView intensity={20} className="absolute inset-0 items-center justify-center">
                <View className="bg-white/95 rounded-3xl p-8 items-center shadow-lg">
                  <ActivityIndicator size="large" color="#2563EB" />
                  <Text className="text-slate-900 font-semibold mt-4 text-lg">
                    Reading...
                  </Text>
                  <Text className="text-slate-500 text-sm mt-2 text-center">
                    This may take a few seconds
                  </Text>
                </View>
              </BlurView>
            )}
          </View>
        )}

        {/* Bottom Controls */}
        <View className="absolute bottom-0 left-0 right-0 p-6 pb-10">
          <View className="items-center">
            <TouchableOpacity
              onPress={handleCapture}
              disabled={isAnalyzing || isOffline}
              className={`w-20 h-20 rounded-full bg-white shadow-lg items-center justify-center ${
                isOffline ? 'opacity-50' : ''
              }`}
              accessibilityRole="button"
              accessibilityLabel="Capture Photo"
              accessibilityHint={isOffline ? "Requires internet connection. You are currently offline." : "Takes a photo of the document for scanning"}
              accessibilityState={{ disabled: isAnalyzing || isOffline }}
            >
              <View className="w-16 h-16 rounded-full border-4 border-slate-300" />
            </TouchableOpacity>
            <Text 
              className="text-white text-sm mt-4 text-center"
              accessibilityRole="text"
            >
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
