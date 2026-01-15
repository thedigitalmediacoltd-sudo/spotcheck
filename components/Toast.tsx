import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, type = 'info', visible, onHide }: ToastProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-100);

  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, { damping: 15 });
      
      const timer = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 300 });
        translateY.value = withTiming(-100, { duration: 300 });
        setTimeout(onHide, 300);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-rose-500' : 'bg-blue-500';

  return (
    <Animated.View
      style={animatedStyle}
      className={`absolute top-12 left-4 right-4 ${bgColor} rounded-2xl px-4 py-3 shadow-lg z-50`}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text className="text-white font-semibold text-center">{message}</Text>
    </Animated.View>
  );
}
