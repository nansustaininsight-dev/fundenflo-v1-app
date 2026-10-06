import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';

import { HomeTabs } from '@/components/journey/home-tabs';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S } from '@/constants/brand';
import { ApiError } from '@/services/api';
import { dobError, formatDobInput, formatMobile, isValidPan, nameError, normalizePan, saveProfile } from '@/services/auth';
import { useAppStore } from '@/store/app-store';

type FocusField = 'name' | 'pan' | 'dob';

export default function ProfileScreen() {
  const { session, updateUser } = useAppStore();
  const saved = session?.user;
  const [fullName, setFullName] = useState(saved?.fullName ?? '');
  const [pan, setPan] = useState(saved?.pan ?? '');
  const [dob, setDob] = useState(saved?.dob ?? '');
  const [focus, setFocus] = useState<FocusField | null>(null);
  const [touched, setTouched] = useState({ name: false, pan: false, dob: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);

  const nameMsg = nameError(fullName);
  const panOk = isValidPan(pan);
  const dobMsg = dobError(dob);
  const valid = !nameMsg && panOk && !dobMsg;
  const mobile = saved?.mobile ? `+91 ${formatMobile(saved.mobile)}` : '';

  async function save() {
    if (!valid || saving) return;
    const profile = { fullName: fullName.trim().replace(/\s+/g, ' '), pan, dob };
    setSaving(true);
    setError(null);
    setSavedNote(false);
    try {
      if (saved?.fullName !== profile.fullName || saved?.pan !== profile.pan || saved?.dob !== profile.dob) {
        const next = await saveProfile(profile);
        await updateUser(next);
      }
      setSavedNote(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save your profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      edges={['top']}
      flushFooter
      header={<StepHeader title="Profile" onBack={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />}
      footer={<HomeTabs active="profile" />}>
      <Text style={s.title} accessibilityRole="header">Profile</Text>
      <Text style={s.sub}>Update the name, PAN and date of birth on your account. Your mobile number stays the one you signed in with.</Text>
      {mobile ? <Text style={s.mobile}>{mobile}</Text> : null}

      <View style={s.form}>
        <Field
          label="Full name"
          value={fullName}
          placeholder="As printed on your PAN"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          maxLength={80}
          focused={focus === 'name'}
          valid={!nameMsg && fullName.trim().length > 0}
          error={touched.name && focus !== 'name' ? nameMsg : null}
          onFocus={() => setFocus('name')}
          onBlur={() => { setFocus(null); setTouched(t => ({ ...t, name: true })); }}
          onChangeText={text => { setSavedNote(false); setFullName(text.replace(/[^A-Za-z .'-]/g, '').slice(0, 80)); }}
        />
        <Field
          label="PAN"
          value={pan}
          placeholder="ABCDE1234F"
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          maxLength={10}
          focused={focus === 'pan'}
          valid={panOk}
          error={touched.pan && focus !== 'pan' ? (pan.length === 0 ? 'Enter your PAN.' : !panOk ? 'Enter a valid PAN, like ABCDE1234F.' : null) : null}
          onFocus={() => setFocus('pan')}
          onBlur={() => { setFocus(null); setTouched(t => ({ ...t, pan: true })); }}
          onChangeText={text => { setSavedNote(false); setPan(normalizePan(text)); }}
        />
        <Field
          label="Date of birth"
          value={dob}
          placeholder="DD/MM/YYYY"
          autoCapitalize="none"
          keyboardType="number-pad"
          autoComplete="birthdate-full"
          maxLength={10}
          focused={focus === 'dob'}
          valid={!dobMsg && dob.length === 10}
          error={touched.dob && focus !== 'dob' ? dobMsg : null}
          onFocus={() => setFocus('dob')}
          onBlur={() => { setFocus(null); setTouched(t => ({ ...t, dob: true })); }}
          onChangeText={text => { setSavedNote(false); setDob(formatDobInput(text)); }}
        />
      </View>

      {error ? <Text style={s.formError} accessibilityLiveRegion="polite">{error}</Text> : null}
      {savedNote ? <Text style={s.saved} accessibilityLiveRegion="polite">Profile saved.</Text> : null}
      <Button label="Save profile" loading={saving} disabled={!valid} onPress={() => void save()} style={s.save} />
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
  title: { fontFamily: F.heading, fontSize: 28, lineHeight: 36, color: C.navy },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.muted, marginTop: S.sm },
  mobile: { fontFamily: F.body, fontSize: 15, fontWeight: '600', color: C.navy, marginTop: S.md },
  form: { gap: S.md, marginTop: S.lg },
  label: { fontFamily: F.body, fontSize: 13, fontWeight: '500', color: C.muted, marginBottom: 6 },
  field: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, borderRadius: R.field, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  fieldFocused: { borderWidth: 1.5, borderColor: C.navyPressed },
  fieldError: { borderColor: C.error, backgroundColor: '#FFF8F7' },
  input: { flex: 1, fontFamily: F.body, fontSize: 16, color: C.text, paddingVertical: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  errorText: { flex: 1, fontFamily: F.body, fontSize: 12, lineHeight: 17, color: C.error },
  formError: { fontFamily: F.body, fontSize: 13, color: C.error, textAlign: 'center', marginTop: S.md },
  saved: { fontFamily: F.body, fontSize: 13, fontWeight: '600', color: C.success, textAlign: 'center', marginTop: S.md },
  save: { marginTop: S.lg },
});
