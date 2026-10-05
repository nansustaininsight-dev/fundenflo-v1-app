import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Redirect } from 'expo-router';

import { Eyebrow } from '@/components/journey/eyebrow';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { CATEGORIES, formatINR, formatTenure } from '@/constants/loan';
import { useAppStore } from '@/store/app-store';

/**
 * Step 4 — Consent. PLACEHOLDER so Phase 2's pre-check can navigate here;
 * the real consent screen (your_consent_step_4_of_6 design) is built in Phase 3.
 */
export default function ConsentScreen() {
  const { journey } = useAppStore();
  const cat = journey.loanCategory ? CATEGORIES[journey.loanCategory] : undefined;
  if (!cat || !journey.amount || !journey.tenureYears || !journey.preCheck) return <Redirect href="/pre-check" />;

  const purpose = cat.purposes.find(p => p.id === journey.purpose)?.label;
  const rows: [string, string][] = [
    ['Category', cat.title],
    ['Amount', formatINR(journey.amount)],
    ['Tenure', formatTenure(journey.tenureYears)],
    ['Location', journey.location ?? '—'],
    ['Purpose', purpose ?? '—'],
  ];

  return (
    <Screen header={<StepHeader step={4} />}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Eyebrow label="Consent • Step 4 of 6" />
        <Text style={s.title} accessibilityRole="header">Your consent</Text>
      </Animated.View>

      <View style={s.notice}>
        <Icon name="check-circle" size={18} color={C.success} />
        <Text style={s.noticeText}>Loan requirement and pre-check saved. The consent screen arrives in the next build.</Text>
      </View>

      <View style={s.card}>
        {rows.map(([k, v]) => (
          <View key={k} style={s.row}>
            <Text style={s.key}>{k}</Text>
            <Text style={s.value}>{v}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 24, lineHeight: 32, letterSpacing: -0.3, color: C.text },
  notice: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.md, padding: 12, borderRadius: R.chip, backgroundColor: C.successSoft },
  noticeText: { flex: 1, fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.success },
  card: { marginTop: S.md, padding: S.md, borderRadius: R.card, backgroundColor: C.card, gap: 12, ...shadow.card },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  key: { fontFamily: F.body, fontSize: 13, color: C.muted },
  value: { flexShrink: 1, fontFamily: F.body, fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'right' },
});
