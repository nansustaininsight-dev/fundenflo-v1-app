import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Redirect, router } from 'expo-router';

import { ChoiceChip } from '@/components/journey/choice-chip';
import { Eyebrow } from '@/components/journey/eyebrow';
import { JourneyFooter } from '@/components/journey/journey-footer';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { PRE_CHECK_QUESTIONS } from '@/constants/loan';
import { ApiError } from '@/services/api';
import { submitPreCheck } from '@/services/loan';
import { useAppStore } from '@/store/app-store';

export default function PreCheckScreen() {
  const { journey, updateJourney } = useAppStore();
  const { entityType } = journey;
  const questions = entityType ? PRE_CHECK_QUESTIONS[entityType] : [];

  // Restore only answers given for the same entity type and still-valid options.
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const saved = journey.preCheck?.entityType === entityType ? journey.preCheck?.answers ?? {} : {};
    return Object.fromEntries(questions.filter(q => q.options.some(o => o.id === saved[q.id])).map(q => [q.id, saved[q.id]]));
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!entityType || !journey.purpose) return <Redirect href="/loan-purpose" />;

  const remaining = questions.filter(q => !answers[q.id]).length;
  const hint = remaining ? `Answer ${remaining === questions.length ? 'all' : 'The Remaining'} ${remaining} Question${remaining > 1 ? 's' : ''} To Continue.` : null;

  function answer(questionId: string, optionId: string) {
    const next = { ...answers, [questionId]: optionId };
    setAnswers(next);
    setError(null);
    if (entityType) void updateJourney({ preCheck: { entityType, answers: next } });
  }

  async function next() {
    if (remaining || !entityType) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitPreCheck(entityType, answers);
      router.push('/consent');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could Not Save Your Answers. Please Try Again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      header={<StepHeader step={3} />}
      footer={<JourneyFooter onContinue={() => void next()} disabled={remaining > 0} loading={submitting} hint={hint} error={error} />}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Eyebrow label="Assessment • Step 3 Of 6" />
        <Text style={s.title} accessibilityRole="header">Quick Pre-Check</Text>
        <Text style={s.sub}>{questions.length} Quick Questions. No Impact On Your Credit Score.</Text>
      </Animated.View>

      <View style={s.list}>
        {questions.map((q, qi) => (
          <Animated.View key={q.id} entering={FadeInDown.delay(80 + qi * 60).duration(360)} style={s.card}>
            <View style={s.cardHead}>
              <Text style={s.question} accessibilityRole="header">{q.title}</Text>
              <Text style={s.count}>{qi + 1} Of {questions.length}</Text>
            </View>
            <View style={s.grid} accessibilityRole="radiogroup" accessibilityLabel={q.title}>
              {q.options.map(o => (
                <ChoiceChip key={o.id} label={o.label} selected={answers[q.id] === o.id} onPress={() => answer(q.id, o.id)} style={s.cell} />
              ))}
            </View>
          </Animated.View>
        ))}
      </View>

      <View style={s.note}>
        <Icon name="shield-person" size={18} color={C.navy} />
        <Text style={s.noteText}>We Use These Details Only To Filter Lenders With Matching Eligibility Criteria. Never Shared Without Consent.</Text>
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 28, lineHeight: 36, letterSpacing: -0.3, color: C.navy },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.muted, marginTop: 4 },
  list: { gap: 14, marginTop: S.lg },
  card: { padding: S.md + 2, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 },
  question: { flex: 1, fontFamily: F.body, fontSize: 15, fontWeight: '600', color: C.text },
  count: { fontFamily: F.body, fontSize: 12, fontWeight: '500', color: C.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: { flexBasis: '40%', flexGrow: 1 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: S.lg, padding: S.md, borderRadius: R.field, backgroundColor: C.subtle },
  noteText: { flex: 1, fontFamily: F.body, fontSize: 13, lineHeight: 20, color: C.muted },
});
