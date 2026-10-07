import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Eyebrow } from '@/components/journey/eyebrow';
import { JourneyFooter } from '@/components/journey/journey-footer';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { ApiError } from '@/services/api';
import { dobError, formatDobInput, isValidPan, nameError, saveProfile } from '@/services/auth';
import { useAppStore } from '@/store/app-store';

type FocusField = 'name' | 'dob';

export default function VerifyDetailsScreen() {
  const { journey, session, updateUser, updateJourney } = useAppStore();
  const saved = session?.user;
  const draft = journey.profileDraft;

  const [fullName, setFullName] = useState(draft?.fullName ?? saved?.fullName ?? '');
  const [dob, setDob] = useState(draft?.dob ?? saved?.dob ?? '');
  const [focus, setFocus] = useState<FocusField | null>(null);
  const [touched, setTouched] = useState({ name: false, dob: false });
  const [submitting, setSubmitting] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (journey.analysis?.status !== 'done') return <Redirect href={journey.analysis ? '/analysing' : '/documents'} />;

  const nameMsg = nameError(fullName);
  const nameShown = nameMsg?.includes('PAN') ? 'Use Letters Only.' : nameMsg;
  const dobMsg = dobError(dob);
  const valid = !nameMsg && !dobMsg;
  const hint = nameMsg
    ? ''
    : dobMsg
      ? (dob.length < 10 ? 'Enter Your Date Of Birth As DD/MM/YYYY.' : dobMsg)
      : null;

  function remember(patch: { fullName?: string; dob?: string }) {
    setError(null);
    void updateJourney(prev => ({ profileDraft: { ...prev.profileDraft, ...patch } }));
  }

  async function confirm() {
    if (!valid || submitting || verified) return;
    const profile = { fullName: fullName.trim().replace(/\s+/g, ' '), dob };
    setSubmitting(true);
    setError(null);
    try {
      if (saved?.fullName !== profile.fullName || saved?.dob !== profile.dob) {
        if (saved?.pan && isValidPan(saved.pan)) {
          const next = await saveProfile({ ...profile, pan: saved.pan });
          await updateUser(next);
        } else {
          await updateUser({ fullName: profile.fullName, dob: profile.dob });
        }
      }
      await updateJourney({ profileDraft: undefined });
      setVerified(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could Not Save Your Details. Please Try Again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen
      header={<StepHeader title="Verify Your Identity" />}
      footer={
        verified ? (
          <JourneyFooter onContinue={() => router.push('/score')} label="Continue" note="Private • Never Shared Without Your Consent" />
        ) : (
          <JourneyFooter
            onContinue={() => void confirm()}
            disabled={!valid}
            loading={submitting}
            hint={hint}
            error={error}
            label="Start Verification"
            note="Private • Never Shared Without Your Consent"
          />
        )
      }>
      {verified ? (
        <Animated.View entering={FadeInDown.duration(420)} style={s.verified} accessibilityRole="summary">
          <Animated.View entering={ZoomIn.duration(420).springify()} style={s.badge}>
            <Icon name="verified" size={42} color={C.success} />
          </Animated.View>
          <Text style={s.verifiedTitle} accessibilityRole="header" accessibilityLiveRegion="polite">Verified</Text>
          <Text style={s.sub}>Your Details Are Verified. You Can Continue To Your Financial Health Score.</Text>
          <Animated.View entering={FadeInDown.delay(180).duration(360)} style={s.summary}>
            <SummaryRow label="Full Name" value={fullName.trim().replace(/\s+/g, ' ')} />
            <SummaryRow label="Date Of Birth" value={dob} />
          </Animated.View>
        </Animated.View>
      ) : (
        <>
          <Animated.View entering={FadeInDown.duration(400)}>
            <Eyebrow label="Identity" />
            <Text style={s.title} accessibilityRole="header">Let Us Verify Your Identity</Text>
            <Text style={s.sub}>Confirm Your Name And Date Of Birth To Start Verification.</Text>
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
              error={touched.name && focus !== 'name' ? nameShown : null}
              onFocus={() => setFocus('name')}
              onBlur={() => { setFocus(null); setTouched(t => ({ ...t, name: true })); }}
              onChangeText={text => {
                const next = text.replace(/[^A-Za-z .'-]/g, '').slice(0, 80);
                setFullName(next);
                remember({ fullName: next });
              }}
            />
            <Field
              label="Date Of Birth"
              value={dob}
              placeholder="DD/MM/YYYY"
              keyboardType="number-pad"
              autoComplete="birthdate-full"
              maxLength={10}
              focused={focus === 'dob'}
              valid={!dobMsg && dob.length === 10}
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
        </>
      )}

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

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.summaryRow}>
      <Icon name="check-circle" size={18} color={C.success} />
      <View style={s.summaryText}>
        <Text style={s.summaryLabel}>{label}</Text>
        <Text style={s.summaryValue}>{value}</Text>
      </View>
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
  verified: { alignItems: 'center', paddingTop: S.xl },
  badge: {
    width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.successSoft, marginBottom: S.lg,
  },
  verifiedTitle: { fontFamily: F.heading, fontSize: 28, lineHeight: 36, color: C.navy },
  summary: {
    alignSelf: 'stretch', marginTop: S.lg, padding: S.md, gap: S.md,
    borderRadius: R.card, backgroundColor: C.card, ...shadow.card,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  summaryText: { flex: 1 },
  summaryLabel: { fontFamily: F.body, fontSize: 12, color: C.muted },
  summaryValue: { fontFamily: F.body, fontSize: 16, fontWeight: '600', color: C.navy, marginTop: 2 },
});
