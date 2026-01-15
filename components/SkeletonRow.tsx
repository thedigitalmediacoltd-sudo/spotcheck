import React, { useEffect, useRef } from 'react';
import { View, Animated } from 'react-native';

export function SkeletonRow() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View className="bg-white rounded-2xl p-4 mb-3 mx-4 shadow-sm flex-row items-center">
      <Animated.View
        className="w-12 h-12 rounded-full bg-slate-200"
        style={{ opacity }}
      />
      <View className="flex-1 ml-4">
        <Animated.View
          className="h-4 bg-slate-200 rounded mb-2"
          style={{ opacity, width: '70%' }}
        />
        <Animated.View
          className="h-3 bg-slate-200 rounded"
          style={{ opacity, width: '50%' }}
        />
      </View>
      <Animated.View
        className="w-16 h-6 bg-slate-200 rounded-full"
        style={{ opacity }}
      />
    </View>
  );
}
