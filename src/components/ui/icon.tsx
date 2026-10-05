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
  store: { ios: 'storefront', android: 'store' },
  'sync-alt': { ios: 'arrow.left.arrow.right', android: 'sync_alt' },
  machinery: { ios: 'gearshape.2', android: 'precision_manufacturing' },
  receipt: { ios: 'doc.text', android: 'receipt_long' },
  wallet: { ios: 'creditcard', android: 'account_balance_wallet' },
  home: { ios: 'house', android: 'cottage' },
  car: { ios: 'car', android: 'directions_car' },
  location: { ios: 'mappin.and.ellipse', android: 'location_on' },
  verified: { ios: 'checkmark.seal', android: 'verified' },
  'shield-person': { ios: 'lock.shield', android: 'shield_person' },
  search: { ios: 'magnifyingglass', android: 'search' },
  close: { ios: 'xmark', android: 'close' },
  refresh: { ios: 'arrow.clockwise', android: 'refresh' },
  edit: { ios: 'pencil', android: 'edit' },
  'id-card': { ios: 'person.text.rectangle', android: 'badge' },
  bank: { ios: 'building.columns', android: 'account_balance' },
  upload: { ios: 'doc.badge.plus', android: 'upload_file' },
  scan: { ios: 'doc.viewfinder', android: 'document_scanner' },
  document: { ios: 'doc.text.fill', android: 'description' },
  chat: { ios: 'message', android: 'chat' },
  delete: { ios: 'trash', android: 'delete' },
  payments: { ios: 'banknote', android: 'payments' },
  quote: { ios: 'doc.plaintext', android: 'request_quote' },
} as const;

export type IconName = keyof typeof ICONS;

export function Icon({ name, size = 20, color = C.navy, style }: { name: IconName; size?: number; color?: ColorValue; style?: StyleProp<ViewStyle> }) {
  const icon = ICONS[name];
  return <SymbolView name={{ ios: icon.ios, android: icon.android, web: icon.android }} size={size} tintColor={color} style={style} />;
}
