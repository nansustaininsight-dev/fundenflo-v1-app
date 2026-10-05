import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { C, F, R } from '@/constants/brand';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** `card`: white chip, navy when selected (pre-check). `pill`: subtle grey pill (tenure). */
  tone?: 'card' | 'pill';
  style?: StyleProp<ViewStyle>;
};

/** Single-select option used inside a radiogroup. */
export function ChoiceChip({ label, selected, onPress, tone = 'card', style }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [s.base, s[tone], selected && s.on, pressed && s.pressed, style]}>
      <View style={s.row}>
        <Text numberOfLines={1} style={[s.label, tone === 'pill' && s.pillLabel, selected && s.labelOn]}>{label}</Text>
        {selected && tone === 'card' && (
          <Animated.View entering={ZoomIn.duration(180)}><Icon name="check" size={15} color={C.gold} /></Animated.View>
        )}
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  base: { minHeight: 48, borderRadius: R.button, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: '#EEF2F6', boxShadow: '0px 1px 4px rgba(10, 25, 47, 0.06)' },
  pill: { backgroundColor: C.subtle },
  on: { backgroundColor: C.navy, borderColor: C.navy, boxShadow: '0px 4px 10px rgba(10, 25, 47, 0.16)' },
  pressed: { transform: [{ scale: 0.98 }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.text },
  pillLabel: { fontWeight: '500', color: C.muted },
  labelOn: { color: C.white },
});
