import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Redirect, router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { useAppStore } from '@/store/app-store';

export default function ImprovementScreen() {
  const { journey } = useAppStore();
  const items = journey.score ? journey.improvement ?? [] : [];

  if (!journey.score) return <Redirect href="/score" />;
  if (items.length === 0) return <Redirect href="/score" />;

  return (
    <Screen
      header={<StepHeader title="Improvement Plan" />}
      footer={
        <View style={s.footer}>
          <Button label="Continue with matched lenders" onPress={() => router.push('/lenders')} />
          <Pressable accessibilityRole="button" onPress={() => router.push('/documents')} hitSlop={6} style={s.link}>
            <Text style={s.linkText}>Upload new statement</Text>
          </Pressable>
        </View>
      }>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={s.title} accessibilityRole="header">{items.length === 1 ? 'One thing can widen your options' : 'A few things can widen your options'}</Text>
        <Text style={s.sub}>You can still apply with your matched lenders now.</Text>
      </Animated.View>

      {items.map((item, index) => (
        <Animated.View key={item.id} entering={FadeInDown.delay(80 + index * 50).duration(360)} style={s.card}>
          <View style={s.cardTitle}>
            <Icon name="error" size={18} color={C.goldDeep} />
            <Text style={s.cardHeading}>{item.title}</Text>
          </View>
          <Block label="What we found" body={item.found} />
          <Block label="Why it matters" body={item.why} />
          <Block label="What you can do" body={item.action} />
          <Block label="Evidence needed" body={item.evidence} last />
        </Animated.View>
      ))}

      <View style={s.note}>
        <Icon name="sync-alt" size={16} color={C.muted} />
        <Text style={s.noteText}>We will reassess your score when you upload a new bank statement.</Text>
      </View>
    </Screen>
  );
}

function Block({ label, body, last }: { label: string; body: string; last?: boolean }) {
  return (
    <View style={[s.block, !last && s.blockBorder]}>
      <Text style={s.blockLabel}>{label}</Text>
      <Text style={s.blockBody}>{body}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 26, lineHeight: 34, letterSpacing: -0.3, color: C.navy },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.muted, marginTop: 8 },
  card: { marginTop: S.lg, padding: S.md, paddingLeft: S.md + 4, borderRadius: R.card, backgroundColor: C.card, borderLeftWidth: 3, borderLeftColor: C.goldDeep, ...shadow.card },
  cardTitle: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  cardHeading: { flex: 1, fontFamily: F.heading, fontSize: 17, lineHeight: 24, color: C.navy },
  block: { paddingVertical: 12 },
  blockBorder: { borderBottomWidth: 1, borderBottomColor: C.subtle },
  blockLabel: { fontFamily: F.body, fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted },
  blockBody: { fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.text, marginTop: 4 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: S.md, padding: 14, borderRadius: R.field, backgroundColor: C.subtle },
  noteText: { flex: 1, fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.muted },
  footer: { gap: 4 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: { fontFamily: F.body, fontSize: 15, fontWeight: '600', color: C.goldDeep },
});
