import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Redirect } from 'expo-router';

import { Eyebrow } from '@/components/journey/eyebrow';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { CONSENT_ITEMS, CONSENT_VERSION } from '@/constants/consent';
import { useAppStore } from '@/store/app-store';

/**
 * Step 5 — Documents. PLACEHOLDER so Phase 3's consent can navigate here;
 * the real checklist + upload (upload_3_documents_step_5_of_6 design) is built in Phase 4.
 */
export default function DocumentsScreen() {
  const { journey } = useAppStore();
  const consent = journey.consent?.version === CONSENT_VERSION ? journey.consent : undefined;
  if (!consent) return <Redirect href="/consent" />;

  return (
    <Screen header={<StepHeader step={5} />}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Eyebrow label="Documents • Step 5 of 6" />
        <Text style={s.title} accessibilityRole="header">Upload documents</Text>
      </Animated.View>

      <View style={s.notice}>
        <Icon name="check-circle" size={18} color={C.success} />
        <Text style={s.noticeText}>Consent saved. Document upload arrives in the next build.</Text>
      </View>

      <View style={s.card}>
        {CONSENT_ITEMS.map(item => (
          <View key={item.id} style={s.row}>
            <Text style={s.key}>{item.title}</Text>
            <Text style={[s.value, !consent.items[item.id]?.granted && s.off]}>{consent.items[item.id]?.granted ? 'Allowed' : 'Not allowed'}</Text>
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
  key: { flex: 1, fontFamily: F.body, fontSize: 13, color: C.muted },
  value: { fontFamily: F.body, fontSize: 13, fontWeight: '600', color: C.success },
  off: { color: C.muted },
});
