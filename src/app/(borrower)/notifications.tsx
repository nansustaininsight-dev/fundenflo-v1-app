import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { useAppStore } from '@/store/app-store';

export default function NotificationsScreen() {
  const { journey } = useAppStore();
  const items = journey.application?.timeline.filter(step => step.state === 'done' || step.state === 'active') ?? [];

  return (
    <Screen header={<StepHeader title="Notifications" />}>
      <Text style={s.title} accessibilityRole="header">Notifications</Text>
      {items.length === 0 ? (
        <Text style={s.empty}>No notifications yet.</Text>
      ) : (
        items.map(step => (
          <View key={step.id} style={s.card}>
            <Text style={s.cardTitle}>{step.title}</Text>
            <Text style={s.detail}>{step.detail}</Text>
            {step.at ? <Text style={s.when}>{step.at}</Text> : null}
          </View>
        ))
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 28, lineHeight: 36, color: C.navy },
  empty: { fontFamily: F.body, fontSize: 15, color: C.muted, marginTop: S.lg },
  card: { marginTop: S.md, padding: S.md, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  cardTitle: { fontFamily: F.body, fontSize: 15, fontWeight: '600', color: C.navy },
  detail: { fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.muted, marginTop: 4 },
  when: { fontFamily: F.body, fontSize: 12, color: C.slate, marginTop: 6 },
});
