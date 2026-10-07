import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Redirect, router } from 'expo-router';

import { JourneyFooter } from '@/components/journey/journey-footer';
import { PrivacySheet } from '@/components/journey/privacy-sheet';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { Toggle } from '@/components/ui/toggle';
import { C, F, R, S, shadow } from '@/constants/brand';
import { CONSENT_ITEMS, CONSENT_VERSION, type ConsentId } from '@/constants/consent';
import { ApiError, delay } from '@/services/api';
import { submitConsent } from '@/services/consent';
import { useAppStore, type ConsentRecord } from '@/store/app-store';

type Choices = Record<ConsentId, boolean>;

/** Step 4 — explicit, per-purpose consent. Every toggle starts off: consent must be an affirmative action. */
export default function ConsentScreen() {
  const { journey, updateJourney } = useAppStore();
  // A record for an older consent version doesn't count — the borrower is asked again.
  const saved = journey.consent?.version === CONSENT_VERSION ? journey.consent : undefined;

  const [choices, setChoices] = useState<Choices>(() => {
    const base = Object.fromEntries(CONSENT_ITEMS.map(i => [i.id, saved?.items[i.id]?.granted ?? false])) as Choices;
    return { ...base, ...journey.consentDraft };
  });
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [policyOpen, setPolicyOpen] = useState(false);

  if (!journey.preCheck) return <Redirect href="/pre-check" />;

  const missing = CONSENT_ITEMS.filter(i => i.required && !choices[i.id]);
  const hint = missing.length ? `Turn On “${missing[0].title}” To Continue — It’s Needed To Calculate Your Financial Health Score.` : null;

  function toggle(id: ConsentId, value: boolean) {
    const next = { ...choices, [id]: value };
    setChoices(next);
    setError(null);
    // Draft only (survives back/forward); nothing counts as consent until "I agree".
    void updateJourney({ consentDraft: next });
  }

  async function agree() {
    if (missing.length || submitting) return;
    const now = new Date().toISOString();
    const unchanged = saved && CONSENT_ITEMS.every(i => saved.items[i.id]?.granted === choices[i.id]);
    if (unchanged) {
      router.push('/documents');
      return;
    }
    const record: ConsentRecord = {
      version: CONSENT_VERSION,
      submittedAt: now,
      items: Object.fromEntries(CONSENT_ITEMS.map(i => {
        const prev = saved?.items[i.id];
        // Keep the original timestamp when a choice did not change (audit trail).
        return [i.id, { granted: choices[i.id], at: prev && prev.granted === choices[i.id] ? prev.at : now }];
      })) as ConsentRecord['items'],
    };
    setSubmitting(true);
    setError(null);
    try {
      await submitConsent(record);
      await updateJourney({ consent: record, consentDraft: undefined });
      setSubmitting(false);
      setConfirmed(true);
      await delay(700);
      setConfirmed(false);
      router.push('/documents');
    } catch (e) {
      setSubmitting(false);
      setError(e instanceof ApiError ? e.message : 'Could Not Save Your Consent. Please Try Again.');
    }
  }

  return (
    <Screen
      header={<StepHeader step={4} />}
      footer={
        <JourneyFooter
          onContinue={() => void agree()}
          disabled={missing.length > 0 || confirmed}
          loading={submitting}
          hint={confirmed ? null : hint}
          error={error}
          label={confirmed ? 'Preferences Confirmed' : 'I Agree & Continue'}
          icon={confirmed ? 'check' : 'arrow-forward'}
          note="256-Bit Encrypted"
        />
      }>
      <Animated.View entering={FadeInDown.duration(400)}>
        <View style={s.badge}><Icon name="shield" size={22} color={C.navy} /></View>
        <Text style={s.title} accessibilityRole="header">You Stay In Control</Text>
        <Text style={s.sub}>We Respect Your Data. Choose How FundenFlo Processes Your Documents And Matches Lenders.</Text>
      </Animated.View>

      <View style={s.list}>
        {CONSENT_ITEMS.map((item, i) => (
          <Animated.View key={item.id} entering={FadeInDown.delay(80 + i * 60).duration(360)}>
            <Pressable
              onPress={() => toggle(item.id, !choices[item.id])}
              style={({ pressed }) => [s.card, pressed && s.pressed]}
              accessible={false}>
              <View style={s.cardText}>
                <Text style={s.cardTitle}>{item.title}</Text>
                <Text style={s.cardSub}>{item.sub}</Text>
              </View>
              <Toggle value={choices[item.id]} onChange={v => toggle(item.id, v)} accessibilityLabel={`${item.title}. ${item.sub}`} disabled={submitting || confirmed} />
            </Pressable>
          </Animated.View>
        ))}
      </View>

      <View style={s.info}>
        <Icon name="info" size={15} color={C.muted} />
        <Text style={s.infoText}>You Can Change Or Withdraw Consent Anytime.</Text>
      </View>
      <Pressable onPress={() => setPolicyOpen(true)} hitSlop={8} style={s.policy} accessibilityRole="button">
        <Text style={s.policyText}>Read Full Privacy Policy</Text>
        <Icon name="arrow-forward" size={14} color={C.goldDeep} />
      </Pressable>

      <PrivacySheet visible={policyOpen} onClose={() => setPolicyOpen(false)} />
    </Screen>
  );
}

const s = StyleSheet.create({
  badge: { width: 48, height: 48, borderRadius: 24, backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center', marginBottom: S.md },
  title: { fontFamily: F.heading, fontSize: 26, lineHeight: 34, letterSpacing: -0.3, color: C.navy },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.muted, marginTop: 4 },
  list: { gap: 14, marginTop: S.lg },
  card: { flexDirection: 'row', alignItems: 'center', gap: S.md, padding: S.md + 4, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  pressed: { transform: [{ scale: 0.99 }] },
  cardText: { flex: 1 },
  cardTitle: { fontFamily: F.body, fontSize: 15, fontWeight: '600', color: C.text },
  cardSub: { fontFamily: F.body, fontSize: 12, lineHeight: 18, color: C.muted, marginTop: 2 },
  info: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: S.lg },
  infoText: { fontFamily: F.body, fontSize: 12, color: C.muted },
  policy: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, alignSelf: 'center', minHeight: 40, marginTop: 4 },
  policyText: { fontFamily: F.body, fontSize: 12, fontWeight: '600', color: C.goldDeep },
});
