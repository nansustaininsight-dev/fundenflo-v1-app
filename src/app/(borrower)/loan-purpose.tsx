import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { Redirect, router } from 'expo-router';

import { Eyebrow } from '@/components/journey/eyebrow';
import { JourneyFooter } from '@/components/journey/journey-footer';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { CATEGORIES, formatINR, formatTenure, PURPOSE_NOTE_MAX, PURPOSE_NOTE_MIN } from '@/constants/loan';
import { ApiError } from '@/services/api';
import { submitLoanRequirement } from '@/services/loan';
import { useAppStore } from '@/store/app-store';

export default function LoanPurposeScreen() {
  const { journey, updateJourney } = useAppStore();
  const cat = journey.loanCategory ? CATEGORIES[journey.loanCategory] : undefined;

  const [purpose, setPurpose] = useState(() => (cat?.purposes.some(p => p.id === journey.purpose) ? journey.purpose : undefined));
  const [note, setNote] = useState(journey.purposeNote ?? '');
  const [focused, setFocused] = useState(false);
  const [noteTouched, setNoteTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { entityType, amount, tenureYears, location } = journey;
  if (!cat || !entityType || !amount || !tenureYears || !location) return <Redirect href="/loan-amount" />;

  const isOther = purpose === 'other';
  const trimmed = note.trim();
  const noteValid = isOther ? trimmed.length >= PURPOSE_NOTE_MIN : true;
  const valid = !!purpose && noteValid;
  const showNoteError = isOther && !noteValid && noteTouched && !focused;
  const hint = !purpose ? 'Select What The Funds Are For.' : !noteValid ? `Describe Your Purpose In At Least ${PURPOSE_NOTE_MIN} Characters.` : null;

  function pick(id: string) {
    setPurpose(id);
    setError(null);
    void updateJourney({ purpose: id });
  }

  async function next() {
    if (!valid || !purpose || !entityType || !cat || !amount || !tenureYears || !location) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateJourney({ purpose, purposeNote: trimmed || undefined });
      await submitLoanRequirement({ entityType, loanCategory: cat.id, amount, tenureYears, location, purpose, purposeNote: trimmed || undefined });
      router.push('/pre-check');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could Not Save Your Loan Details. Please Try Again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      header={<StepHeader step={2} />}
      footer={<JourneyFooter onContinue={() => void next()} disabled={!valid} loading={submitting} hint={hint} error={error} />}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Eyebrow label="Loan Requirement • 3 Of 3" />
        <Text style={s.title} accessibilityRole="header">What Will You Use The Funds For?</Text>
        <Text style={s.sub}>This Helps Us Match Lenders Who Fund Your Exact Need.</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(400)} style={s.summary}>
        <View style={s.summaryBody}>
          <Text style={s.summaryTitle} numberOfLines={1}>{cat.title}</Text>
          <Text style={s.summaryMeta} numberOfLines={2}>{formatINR(amount)} · {formatTenure(tenureYears)} · {location}</Text>
        </View>
        <Pressable onPress={() => router.dismissTo('/loan-amount')} hitSlop={8} style={s.edit} accessibilityRole="button" accessibilityLabel="Edit Amount, Tenure And Location">
          <Icon name="edit" size={14} color={C.goldDeep} />
          <Text style={s.editText}>Edit</Text>
        </Pressable>
      </Animated.View>

      <View style={s.list} accessibilityRole="radiogroup" accessibilityLabel="Loan Purpose">
        {cat.purposes.map((p, i) => {
          const on = purpose === p.id;
          return (
            <Animated.View key={p.id} entering={FadeInDown.delay(100 + i * 40).duration(320)}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                aria-checked={on}
                accessibilityLabel={p.label}
                onPress={() => pick(p.id)}
                style={({ pressed }) => [s.row, on && s.rowOn, pressed && s.pressed]}>
                <Text style={[s.rowText, on && s.rowTextOn]}>{p.label}</Text>
                {on ? (
                  <Animated.View entering={ZoomIn.duration(180)} style={s.radioOn}><Icon name="check" size={13} color={C.white} /></Animated.View>
                ) : <View style={s.radio} />}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      {purpose && (
        <Animated.View entering={FadeInDown.duration(300)} style={s.noteWrap}>
          <Text style={s.label}>{isOther ? 'Describe Your Purpose' : 'Anything Else Lenders Should Know? (Optional)'}</Text>
          <TextInput
            value={note}
            onChangeText={t => setNote(t.slice(0, PURPOSE_NOTE_MAX))}
            onFocus={() => setFocused(true)}
            onBlur={() => { setFocused(false); setNoteTouched(true); void updateJourney({ purposeNote: note.trim() || undefined }); }}
            placeholder={isOther ? 'E.G. Setting Up A Second Outlet In My City' : 'E.G. Timeline, Collateral Available, Existing Lender'}
            placeholderTextColor={C.slate}
            multiline
            maxLength={PURPOSE_NOTE_MAX}
            textAlignVertical="top"
            style={[s.note, focused && s.noteFocused, showNoteError && s.noteError]}
            accessibilityLabel={isOther ? 'Describe Your Purpose' : 'Additional Notes, Optional'}
          />
          <View style={s.noteFoot}>
            <Text style={[s.noteHelp, showNoteError && s.noteHelpError]}>
              {showNoteError ? `Please Add At Least ${PURPOSE_NOTE_MIN} Characters.` : isOther ? 'Required' : ''}
            </Text>
            <Text style={s.counter}>{note.length}/{PURPOSE_NOTE_MAX}</Text>
          </View>
        </Animated.View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 24, lineHeight: 32, letterSpacing: -0.3, color: C.text },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.muted, marginTop: S.sm },
  summary: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: S.md, padding: 14, borderRadius: R.field, backgroundColor: C.subtle, borderWidth: 1, borderColor: C.border },
  summaryBody: { flex: 1 },
  summaryTitle: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.navy },
  summaryMeta: { fontFamily: F.body, fontSize: 12, lineHeight: 18, color: C.muted, marginTop: 2 },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  editText: { fontFamily: F.body, fontSize: 12, fontWeight: '600', color: C.goldDeep },
  list: { gap: 10, marginTop: S.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingHorizontal: 16, borderRadius: R.field, backgroundColor: C.card, borderWidth: 1.5, borderColor: 'transparent', ...shadow.card },
  rowOn: { backgroundColor: C.canvas, borderColor: C.navy },
  pressed: { transform: [{ scale: 0.99 }] },
  rowText: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.text },
  rowTextOn: { fontWeight: '600', color: C.navy },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, borderColor: C.border },
  radioOn: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.goldDeep, alignItems: 'center', justifyContent: 'center' },
  noteWrap: { marginTop: S.lg },
  label: { fontFamily: F.body, fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted, marginBottom: S.sm },
  note: { minHeight: 104, padding: 14, borderRadius: R.field, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.text },
  noteFocused: { borderColor: C.navy },
  noteError: { borderColor: C.error, backgroundColor: '#FFF8F7' },
  noteFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  noteHelp: { fontFamily: F.body, fontSize: 12, color: C.muted, flexShrink: 1 },
  noteHelpError: { color: C.error },
  counter: { fontFamily: F.body, fontSize: 12, color: C.slate },
});
