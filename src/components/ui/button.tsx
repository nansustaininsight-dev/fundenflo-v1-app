import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { C, F, R, shadow } from '@/constants/brand';

type Variant = 'primary' | 'gold' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** Primary / advisory (gold) / ghost CTA — 52px, 12px radius, per design system. */
export function Button({ label, onPress, variant = 'primary', icon, loading = false, disabled = false, style }: Props) {
  const inactive = disabled || loading;
  const fg = variant === 'primary' ? C.white : C.navy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        s.base,
        s[variant],
        variant === 'primary' && !inactive && shadow.button,
        pressed && (variant === 'primary' ? s.primaryPressed : s.pressed),
        disabled && !loading && s.disabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <View style={s.row}>
          <Text style={[s.label, { color: fg }]}>{label}</Text>
          {icon && <Icon name={icon} size={18} color={fg} />}
        </View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: { minHeight: 52, borderRadius: R.button, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: F.body, fontWeight: '600', fontSize: 15 },
  primary: { backgroundColor: C.navy },
  primaryPressed: { backgroundColor: C.navyPressed, transform: [{ scale: 0.99 }] },
  gold: { backgroundColor: C.gold },
  ghost: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { backgroundColor: '#B8C0CC', boxShadow: 'none' },
});
