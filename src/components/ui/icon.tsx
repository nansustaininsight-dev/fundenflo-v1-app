import { SymbolView } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

import { C } from '@/constants/brand';

/**
 * One icon set for the whole app: SF Symbols on iOS, Material Symbols on Android/web
 * (both shipped with expo-symbols, no extra dependency).
 */
const ICONS = {
  'arrow-forward': { ios: 'arrow.right', android: 'arrow_forward' },
  'arrow-back': { ios: 'arrow.left', android: 'arrow_back' },
  'chevron-left': { ios: 'chevron.left', android: 'chevron_left' },
  'expand-more': { ios: 'chevron.down', android: 'expand_more' },
  'check-circle': { ios: 'checkmark.circle.fill', android: 'check_circle' },
  check: { ios: 'checkmark', android: 'check' },
  lock: { ios: 'lock.fill', android: 'lock' },
  business: { ios: 'building.2', android: 'domain' },
  person: { ios: 'person', android: 'person' },
  info: { ios: 'info.circle', android: 'info' },
  shield: { ios: 'checkmark.shield', android: 'verified_user' },
  error: { ios: 'exclamationmark.circle', android: 'error' },
  sms: { ios: 'message', android: 'sms' },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color = C.navy, style }: { name: IconName; size?: number; color?: ColorValue; style?: StyleProp<ViewStyle> }) {
  const icon = ICONS[name];
  return <SymbolView name={{ ios: icon.ios, android: icon.android, web: icon.android }} size={size} tintColor={color} style={style} />;
}
