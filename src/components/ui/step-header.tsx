import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/icon';
import { C, F, S } from '@/constants/brand';

type Props = {
  step?: number;
  total?: number;
  title?: string;
  onBack?: () => void;
  hideBack?: boolean;
};

/** Back arrow + "Step x of y" + segmented gold progress bar (journey screens). */
export function StepHeader({ step, total = 6, title, onBack, hideBack = false }: Props) {
  const back = onBack ?? (() => (router.canGoBack() ? router.back() : undefined));
  return (
    <View style={s.wrap}>
      <View style={s.row}>
        {hideBack ? <View style={s.side} /> : (
          <Pressable accessibilityRole="button" accessibilityLabel="Go Back" onPress={back} hitSlop={10} style={({ pressed }) => [s.side, s.back, pressed && { backgroundColor: C.subtle }]}>
            <Icon name="arrow-back" size={22} color={C.text} />
          </Pressable>
        )}
        <Text style={s.title} accessibilityRole="header">{title ?? (step ? `Step ${step} Of ${total}` : '')}</Text>
        <View style={s.side} />
      </View>
      {step !== undefined && (
        <View style={s.bar} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: total, now: step }}>
          {Array.from({ length: total }, (_, i) => <View key={i} style={[s.segment, i < step && s.segmentOn]} />)}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: S.margin, paddingTop: S.sm, paddingBottom: S.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  side: { width: 44, height: 44 },
  back: { borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: -10 },
  title: { fontFamily: F.body, fontSize: 15, color: C.muted, fontWeight: '500' },
  bar: { flexDirection: 'row', gap: 6, marginTop: S.sm },
  segment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.border },
  segmentOn: { backgroundColor: C.gold },
});
