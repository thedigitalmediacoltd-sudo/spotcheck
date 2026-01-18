import React from 'react';
import { Platform } from 'react-native';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { MaterialIcons } from '@expo/vector-icons';

// Type-safe icon name mapping
type IconName =
  | 'settings'
  | 'camera'
  | 'scan'
  | 'home'
  | 'overview'
  | 'alert'
  | 'warning'
  | 'check'
  | 'check-circle'
  | 'lock'
  | 'faceid'
  | 'fingerprint'
  | 'share'
  | 'bell'
  | 'notification'
  | 'search'
  | 'trash'
  | 'delete'
  | 'send'
  | 'message'
  | 'chat'
  | 'sparkles'
  | 'car'
  | 'vehicle'
  | 'house'
  | 'home-icon'
  | 'heart'
  | 'pet'
  | 'dumbbell'
  | 'fitness'
  | 'shield'
  | 'insurance'
  | 'file'
  | 'document'
  | 'file-text'
  | 'crown'
  | 'pro'
  | 'mail'
  | 'email'
  | 'x'
  | 'close'
  | 'calendar'
  | 'calendar-plus'
  | 'wifi-off'
  | 'offline'
  | 'arrow-left'
  | 'arrow-right'
  | 'back'
  | 'person-circle'
  | 'plus';

// Platform-specific icon mapping
const ICON_MAP: Record<IconName, { ios: string; android: string }> = {
  settings: { ios: 'gearshape.fill', android: 'settings' },
  camera: { ios: 'camera.fill', android: 'camera-alt' },
  scan: { ios: 'doc.text.viewfinder', android: 'document-scanner' },
  home: { ios: 'house.fill', android: 'home' },
  'home-icon': { ios: 'house.fill', android: 'home' },
  camera: { ios: 'camera.viewfinder', android: 'camera' },
  overview: { ios: 'chart.bar.fill', android: 'dashboard' },
  alert: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  warning: { ios: 'exclamationmark.triangle.fill', android: 'warning' },
  check: { ios: 'checkmark.circle.fill', android: 'check-circle' },
  'check-circle': { ios: 'checkmark.circle.fill', android: 'check-circle' },
  lock: { ios: 'faceid', android: 'fingerprint' },
  faceid: { ios: 'faceid', android: 'fingerprint' },
  fingerprint: { ios: 'faceid', android: 'fingerprint' },
  share: { ios: 'square.and.arrow.up', android: 'share' },
  bell: { ios: 'bell.fill', android: 'notifications' },
  notification: { ios: 'bell.fill', android: 'notifications' },
  search: { ios: 'magnifyingglass', android: 'search' },
  trash: { ios: 'trash.fill', android: 'delete' },
  delete: { ios: 'trash.fill', android: 'delete' },
  send: { ios: 'paperplane.fill', android: 'send' },
  message: { ios: 'message.fill', android: 'message' },
  chat: { ios: 'message.fill', android: 'chat' },
  sparkles: { ios: 'sparkles', android: 'auto-awesome' },
  car: { ios: 'car.fill', android: 'directions-car' },
  vehicle: { ios: 'car.fill', android: 'directions-car' },
  house: { ios: 'house.fill', android: 'home' },
  heart: { ios: 'heart.fill', android: 'favorite' },
  pet: { ios: 'heart.fill', android: 'pets' },
  dumbbell: { ios: 'figure.strengthtraining.traditional', android: 'fitness-center' },
  fitness: { ios: 'figure.strengthtraining.traditional', android: 'fitness-center' },
  shield: { ios: 'shield.fill', android: 'shield' },
  insurance: { ios: 'shield.fill', android: 'security' },
  file: { ios: 'doc.fill', android: 'description' },
  document: { ios: 'doc.fill', android: 'description' },
  'file-text': { ios: 'doc.text.fill', android: 'article' },
  crown: { ios: 'crown.fill', android: 'workspace-premium' },
  pro: { ios: 'crown.fill', android: 'workspace-premium' },
  mail: { ios: 'envelope.fill', android: 'mail' },
  email: { ios: 'envelope.fill', android: 'email' },
  x: { ios: 'xmark', android: 'close' },
  close: { ios: 'xmark', android: 'close' },
  calendar: { ios: 'calendar', android: 'calendar-today' },
  'calendar-plus': { ios: 'calendar.badge.plus', android: 'event-note' },
  'wifi-off': { ios: 'wifi.slash', android: 'wifi-off' },
  offline: { ios: 'wifi.slash', android: 'wifi-off' },
  'arrow-left': { ios: 'chevron.left', android: 'arrow-back' },
  'arrow-right': { ios: 'chevron.right', android: 'arrow-forward' },
  back: { ios: 'chevron.left', android: 'arrow-back' },
  'person-circle': { ios: 'person.circle.fill', android: 'account-circle' },
  plus: { ios: 'plus', android: 'add' },
};

interface NativeIconProps {
  name: IconName;
  size?: number;
  color?: string;
  style?: any;
}

export function NativeIcon({ name, size = 24, color = '#000000', style }: NativeIconProps) {
  const iconMapping = ICON_MAP[name];

  if (!iconMapping) {
    if (__DEV__) {
      console.warn(`Icon "${name}" not found in mapping. Falling back to default.`);
    }
    // Fallback to a default icon
    return Platform.OS === 'ios' ? (
      <SymbolView name="questionmark.circle" tintColor={color} style={[{ width: size, height: size }, style]} />
    ) : (
      <MaterialIcons name="help-outline" size={size} color={color} style={style} />
    );
  }

  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={iconMapping.ios as any}
        tintColor={color}
        style={[{ width: size, height: size }, style]}
      />
    );
  } else {
    return (
      <MaterialIcons
        name={iconMapping.android as any}
        size={size}
        color={color}
        style={style}
      />
    );
  }
}
