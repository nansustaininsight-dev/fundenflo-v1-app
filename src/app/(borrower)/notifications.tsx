import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { ApiError, USE_MOCK } from '@/services/api';
import { listBorrowerNotifications, markNotificationRead, type BorrowerNotice } from '@/services/notifications';
import { useAppStore } from '@/store/app-store';

export default function NotificationsScreen() {
  const { journey } = useAppStore();
  const local = journey.application?.timeline.filter(step => step.state === 'done' || step.state === 'active') ?? [];
  const [items, setItems] = useState<BorrowerNotice[] | null>(USE_MOCK ? [] : null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (USE_MOCK) return;
    let active = true;
    listBorrowerNotifications().then(
      notices => { if (active) setItems(notices); },
      e => { if (active) setError(e instanceof ApiError ? e.message : 'Could Not Load Notifications.'); },
    );
    return () => { active = false; };
  }, [attempt]);

  async function open(item: BorrowerNotice) {
    if (item.read) return;
    setItems(list => list?.map(row => row.id === item.id ? { ...row, read: true } : row) ?? list);
    try {
      await markNotificationRead(item.id);
    } catch {
      setItems(list => list?.map(row => row.id === item.id ? { ...row, read: false } : row) ?? list);
    }
  }

  return (
    <Screen header={<StepHeader title="Notifications" />}>
      <Text style={s.title} accessibilityRole="header">Notifications</Text>
      {USE_MOCK ? (
        local.length === 0 ? (
          <Text style={s.empty}>No Notifications Yet.</Text>
        ) : (
          local.map(step => (
            <View key={step.id} style={s.card}>
              <Text style={s.cardTitle}>{step.title}</Text>
              <Text style={s.detail}>{step.detail}</Text>
              {step.at ? <Text style={s.when}>{step.at}</Text> : null}
            </View>
          ))
        )
      ) : error ? (
        <View style={s.card}>
          <Text style={s.detail}>{error}</Text>
          <Button label="Try Again" variant="ghost" icon="refresh" onPress={() => { setError(null); setItems(null); setAttempt(value => value + 1); }} style={s.retry} />
        </View>
      ) : !items ? (
        <Text style={s.empty}>Loading Notifications.</Text>
      ) : items.length === 0 ? (
        <Text style={s.empty}>No Notifications Yet.</Text>
      ) : (
        items.map(item => (
          <Pressable key={item.id} accessibilityRole="button" onPress={() => void open(item)} style={s.card}>
            <Text style={[s.cardTitle, item.read && s.read]}>{item.text}</Text>
            <Text style={s.detail}>{item.read ? 'Read' : 'Unread'}</Text>
          </Pressable>
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
  read: { color: C.muted },
  detail: { fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.muted, marginTop: 4 },
  when: { fontFamily: F.body, fontSize: 12, color: C.slate, marginTop: 6 },
  retry: { marginTop: S.sm, alignSelf: 'flex-start' },
});
