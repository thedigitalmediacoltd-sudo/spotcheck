import React from 'react';
import { TouchableOpacity, TouchableOpacityProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useReducedMotion,
} from 'react-native-reanimated';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface BouncyButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
}

export function BouncyButton({ children, onPress, ...props }: BouncyButtonProps) {
  const scale = useSharedValue(1);
  const reducedMotion = useReducedMotion();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (!reducedMotion) {
      scale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePressOut = () => {
    if (!reducedMotion) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePress = (e: any) => {
    if (!reducedMotion) {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
    onPress?.(e);
  };

  return (
    <AnimatedTouchableOpacity
      {...props}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[props.style, animatedStyle]}
      activeOpacity={reducedMotion ? 0.7 : 1}
    >
      {children}
    </AnimatedTouchableOpacity>
  );
}
