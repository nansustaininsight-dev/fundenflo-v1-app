import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Eyebrow } from '@/components/journey/eyebrow';
import { JourneyFooter } from '@/components/journey/journey-footer';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S } from '@/constants/brand';
import { ApiError } from '@/services/api';
import { dobError, formatDobInput, isValidPan, nameError, saveProfile } from '@/services/auth';
import { useAppStore } from '@/store/app-store';

type FocusField = 'name' | 'pan' | 'dob';

export default function VerifyDetailsScreen() {
  const { journey, session, updateUser, updateJourney } = useAppStore();
  const saved = session?.user;
  const draft = journey.profileDraft;

  const [fullName, setFullName] = useState(draft?.fullName ?? saved?.fullName ?? '');
  const [pan, setPan] = useState(draft?.pan ?? saved?.pan ?? '');
  const [dob, setDob] = useState(draft?.dob ?? saved?.dob ?? '');
  const [focus, setFocus] = useState<FocusField | null>(null);
  const [touched, setTouched] = useState({ name: false, pan: false, dob: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (journey.analysis?.status !== 'done') return <Redirect href={journey.analysis ? '/analysing' : '/documents'} />;

  const nameMsg = nameError(fullName);
  const panOk = isValidPan(pan);
  const dobMsg = dobError(dob);
  const valid = !nameMsg && panOk && !dobMsg;
  const hint = nameMsg
    ? 'Enter Your Full Name.'
    : !panOk
      ? (pan.length === 0 ? 'Enter Your PAN.' : 'PAN Should Look Like ABCDE1234F.')
      : dobMsg
        ? (dob.length < 10 ? 'Enter Your Date Of Birth As DD/MM/YYYY.' : dobMsg)
        : null;

  function remember(patch: { fullName?: string; pan?: string; dob?: string }) {
    setError(null);
    void updateJourney(prev => ({ profileDraft: { ...prev.profileDraft, ...patch } }));
  }

  async function confirm() {
    if (!valid || submitting) return;
    const profile = { fullName: fullName.trim().replace(/\s+/g, ' '), pan, dob };
    setSubmitting(true);
    setError(null);
    try {
      if (saved?.fullName !== profile.fullName || saved.pan !== profile.pan || saved.dob !== profile.dob) {
        const savedProfile = await saveProfile(profile);
        await updateUser(savedProfile);
      }
      await updateJourney({ profileDraft: undefined });
      router.push('/score');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could Not Save Your Details. Please Try Again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      header={<StepHeader title="Verify Your Details" />}
      footer={
        <JourneyFooter
          onContinue={() => void confirm()}
          disabled={!valid}
          loading={submitting}
          hint={hint}
          error={error}
          label="Confirm & Continue"
          note="Private • Never Shared Without Your Consent"
        />
      }>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Eyebrow label="Identity" />
        <Text style={s.title} accessibilityRole="header">Confirm The Details On Your PAN</Text>
        <Text style={s.sub}>Check Your Name,  And Date Of Birth Before We Use Them For Your Financial Health Score.</Text>
      </Animated.View>

      <View style={s.form}>
        <Field
          label="Full Name"
          value={fullName}
          placeholder="Enter Your Full Name"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          maxLength={80}
          focused={focus === 'name'}
          valid={!nameMsg && fullName.trim().length > 0}
          error={touched.name && focus !== 'name' ? nameMsg : null}
          onFocus={() => setFocus('name')}
          onBlur={() => { setFocus(null); setTouched(t => ({ ...t, name: true })); }}
          onChangeText={text => {
            const next = text.replace(/[^A-Za-z .'-]/g, '').slice(0, 80);
            setFullName(next);
            remember({ fullName: next });
          }}
        />
        {/* <Field
          label="PAN"
          value={pan}
          placeholder="ABCDE1234F"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          maxLength={10}
          focused={focus === 'pan'}
          valid={panOk}
          error={touched.pan && focus !== 'pan' ? (pan.length === 0 ? 'Enter Your PAN.' : !panOk ? 'Enter A Valid PAN, Like ABCDE1234F.' : null) : null}
          onFocus={() => setFocus('pan')}
          onBlur={() => { setFocus(null); setTouched(t => ({ ...t, pan: true })); }}
          onChangeText={text => {
            const next = normalizePan(text);
            setPan(next);
            remember({ pan: next });
          }}
        /> */}
        <Field
          label="Date Of Birth"
          value={dob}
          placeholder="DD/MM/YYYY"
          keyboardType="number-pad"
          autoComplete="birthdate-full"
          maxLength={10}
          focused={focus === 'dob'}
          valid={!dobMsg}
          error={touched.dob && focus !== 'dob' ? dobMsg : null}
          onFocus={() => setFocus('dob')}
          onBlur={() => { setFocus(null); setTouched(t => ({ ...t, dob: true })); }}
          onChangeText={text => {
            const next = formatDobInput(text);
            setDob(next);
            remember({ dob: next });
          }}
        />
      </View>

    </Screen>
  );
}

function Field({
  label, value, placeholder, focused, valid, error, onChangeText, onFocus, onBlur,
  autoCapitalize, autoCorrect, autoComplete, textContentType, keyboardType, maxLength,
}: {
  label: string;
  value: string;
  placeholder: string;
  focused: boolean;
  valid: boolean;
  error: string | null;
  onChangeText: (text: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  autoCapitalize?: 'words' | 'characters' | 'none';
  autoCorrect?: boolean;
  autoComplete?: 'name' | 'off' | 'birthdate-full';
  textContentType?: 'name';
  keyboardType?: 'number-pad';
  maxLength: number;
}) {
  return (
    <View>
      <Text style={s.label}>{label}</Text>
      <View style={[s.field, focused && s.fieldFocused, !!error && s.fieldError]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder={placeholder}
          placeholderTextColor={C.slate}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          textContentType={textContentType}
          keyboardType={keyboardType}
          maxLength={maxLength}
          accessibilityLabel={label}
          style={s.input}
        />
        {valid && <Icon name="check-circle" size={20} color={C.success} />}
      </View>
      {error && (
        <Animated.View entering={FadeIn} style={s.errorRow} accessibilityLiveRegion="polite">
          <Icon name="error" size={14} color={C.error} />
          <Text style={s.errorText}>{error}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 26, lineHeight: 34, letterSpacing: -0.3, color: C.navy },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.muted, marginTop: S.sm },
  form: { gap: S.md, marginTop: S.lg },
  label: { fontFamily: F.body, fontSize: 13, fontWeight: '500', color: C.muted, marginBottom: 6 },
  field: {
    minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, borderRadius: R.field, borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  fieldFocused: { borderWidth: 1.5, borderColor: C.navyPressed },
  fieldError: { borderColor: C.error, backgroundColor: '#FFF8F7' },
  input: { flex: 1, fontFamily: F.body, fontSize: 16, color: C.text, paddingVertical: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  errorText: { flex: 1, fontFamily: F.body, fontSize: 12, lineHeight: 17, color: C.error },
});
