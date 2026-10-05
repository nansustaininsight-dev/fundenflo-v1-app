import { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { C, F, MAX_WIDTH, R, S, shadow } from '@/constants/brand';
import { ApiError } from '@/services/api';
import { isValidMobile, requestOtp } from '@/services/auth';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const [mobile, setMobile] = useState('');
  const [focused, setFocused] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'hi'>('en');
  const [referralOpen, setReferralOpen] = useState(false);
  const [referral, setReferral] = useState('');
  const [appliedReferral, setAppliedReferral] = useState<string | null>(null);
  const [referralError, setReferralError] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  const valid = isValidMobile(mobile);
  const showInvalid = touched && mobile.length > 0 && !valid && !focused;

  function onChange(text: string) {
    setMobile(text.replace(/\D/g, '').slice(0, 10));
    setError(null);
  }

  function applyReferral() {
    const code = referral.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) {
      setReferralError('Use 4–12 letters or numbers.');
      return;
    }
    setReferralError(null);
    setAppliedReferral(code);
  }

  async function submit() {
    setTouched(true);
    if (!valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { resendIn } = await requestOtp(mobile, appliedReferral ?? undefined);
      router.push({ pathname: '/verify-otp', params: { mobile, resendIn: String(resendIn) } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView edges={['top']} style={s.root}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={s.flex} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
          {/* Hero */}
          <View style={s.hero}>
            <View pointerEvents="none" style={s.glowBlue} />
            <View pointerEvents="none" style={s.glowGold} />
            <View style={s.column}>
              <View style={s.topBar}>
                <View style={s.pill}>
                  <View style={s.pillDot} />
                  <Text style={s.pillText}>MSME & PERSONAL FUNDING</Text>
                </View>
                <View style={s.lang} accessibilityRole="radiogroup" accessibilityLabel="Language">
                  {(['en', 'hi'] as const).map(l => (
                    <Pressable key={l} accessibilityRole="radio" accessibilityState={{ selected: lang === l }} onPress={() => setLang(l)} hitSlop={6} style={[s.langBtn, lang === l && s.langOn]}>
                      <Text style={[s.langText, lang === l && s.langTextOn]}>{l === 'en' ? 'EN' : 'हिं'}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
              {lang === 'hi' && (
                <Animated.Text entering={FadeIn} exiting={FadeOut} style={s.langNote}>हिंदी जल्द उपलब्ध होगी · Hindi is coming soon</Animated.Text>
              )}
              <Animated.View entering={FadeInDown.duration(500)}>
                <Image source={require('../../../assets/brand/logo-white.png')} style={s.logo} resizeMode="contain" accessibilityLabel="FundenFlo — The Right Funding, At the Right Time" />
                <Text style={s.headline} accessibilityRole="header">Know who can fund you — in minutes</Text>
                <Text style={s.sub}>Upload a few documents. See matching lenders. Track till disbursal.</Text>
              </Animated.View>
            </View>
          </View>

          {/* Bottom sheet */}
          <Animated.View entering={FadeInDown.delay(120).duration(500)} style={[s.sheet, { paddingBottom: Math.max(insets.bottom, S.md) + S.sm }]}>
            <View style={s.column}>
              <View style={s.pullBar} />
              <Text style={s.label} nativeID="mobileLabel">Mobile number</Text>
              <Pressable onPress={() => inputRef.current?.focus()} style={[s.field, focused && s.fieldFocused, (showInvalid || !!error) && s.fieldError]}>
                <View style={s.flag} accessibilityLabel="India">
                  <View style={[s.flagBand, { backgroundColor: '#FF9933' }]} />
                  <View style={[s.flagBand, s.flagMid]}><View style={s.chakra} /></View>
                  <View style={[s.flagBand, { backgroundColor: '#128807' }]} />
                </View>
                <Text style={s.code}>+91</Text>
                <View style={s.divider} />
                <TextInput
                  ref={inputRef}
                  value={mobile.length > 5 ? `${mobile.slice(0, 5)} ${mobile.slice(5)}` : mobile}
                  onChangeText={onChange}
                  onFocus={() => setFocused(true)}
                  onBlur={() => { setFocused(false); setTouched(true); }}
                  onSubmitEditing={() => void submit()}
                  placeholder="98765 43210"
                  placeholderTextColor="#64748B80"
                  keyboardType="number-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  maxLength={11}
                  returnKeyType="done"
                  accessibilityLabelledBy="mobileLabel"
                  accessibilityLabel="Mobile number"
                  style={s.input}
                />
                {valid && <Animated.View entering={FadeIn}><Icon name="check-circle" size={20} color={C.success} /></Animated.View>}
              </Pressable>
              {(showInvalid || error) && (
                <Animated.View entering={FadeIn} style={s.errorRow} accessibilityLiveRegion="polite">
                  <Icon name="error" size={14} color={C.error} />
                  <Text style={s.errorText}>{error ?? 'Enter a valid 10-digit mobile number starting with 6–9.'}</Text>
                </Animated.View>
              )}

              <Button label="Get OTP" icon="arrow-forward" onPress={() => void submit()} loading={loading} disabled={!valid} style={s.cta} />

              <Pressable accessibilityRole="button" accessibilityState={{ expanded: referralOpen }} onPress={() => setReferralOpen(o => !o)} hitSlop={8} style={s.referralToggle}>
                <Text style={s.referralText}>{appliedReferral ? `Referral applied · ${appliedReferral}` : 'Have a referral code?'}</Text>
                <Icon name="expand-more" size={16} color={C.goldDeep} style={{ transform: [{ rotate: referralOpen ? '180deg' : '0deg' }] }} />
              </Pressable>
              {referralOpen && (
                <Animated.View entering={FadeInDown.duration(250)} exiting={FadeOut.duration(150)}>
                  <View style={[s.referralField, !!referralError && s.fieldError]}>
                    <TextInput
                      value={referral}
                      onChangeText={t => { setReferral(t.replace(/[^a-zA-Z0-9]/g, '')); setReferralError(null); }}
                      placeholder="Enter Advisor / Enterprise Code"
                      placeholderTextColor="#64748B99"
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={12}
                      onSubmitEditing={applyReferral}
                      accessibilityLabel="Referral code"
                      style={s.referralInput}
                    />
                    <Pressable accessibilityRole="button" onPress={applyReferral} disabled={!referral} style={({ pressed }) => [s.apply, (!referral || pressed) && { opacity: 0.6 }]}>
                      <Text style={s.applyText}>{appliedReferral && appliedReferral === referral.toUpperCase() ? 'Applied' : 'Apply'}</Text>
                    </Pressable>
                  </View>
                  {referralError && <Text style={[s.errorText, s.referralErr]}>{referralError}</Text>}
                </Animated.View>
              )}

              <View style={s.flexSpacer} />
              <View style={s.secure}>
                <Icon name="lock" size={14} color={C.muted} />
                <Text style={s.secureText}>256-bit encrypted · Your data is shared only with your consent</Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.navy },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, backgroundColor: C.card },
  column: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  hero: { backgroundColor: C.navy, paddingHorizontal: S.margin, paddingTop: S.lg, paddingBottom: 52, overflow: 'hidden' },
  glowBlue: { position: 'absolute', top: -90, right: -60, width: 280, height: 280, borderRadius: 140, backgroundColor: '#1B365D', opacity: 0.45, filter: [{ blur: 40 }] },
  glowGold: { position: 'absolute', bottom: -10, left: -50, width: 190, height: 190, borderRadius: 95, backgroundColor: C.goldDeep, opacity: 0.1, filter: [{ blur: 30 }] },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: S.sm },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.06)', flexShrink: 1 },
  pillDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold, boxShadow: '0px 0px 8px #FDB901' },
  pillText: { fontFamily: F.body, fontSize: 10, fontWeight: '600', letterSpacing: 0.6, color: '#ECEEF0' },
  lang: { flexDirection: 'row', padding: 2, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  langBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, minWidth: 34, alignItems: 'center' },
  langOn: { backgroundColor: C.goldDeep },
  langText: { fontFamily: F.body, fontSize: 11, fontWeight: '600', color: 'rgba(236,238,240,0.7)' },
  langTextOn: { color: C.navy },
  langNote: { fontFamily: F.body, fontSize: 11, color: C.gold, textAlign: 'right', marginTop: 6 },
  logo: { width: 210, maxWidth: '70%', height: 70, marginTop: S.lg, marginLeft: -6 },
  headline: { fontFamily: F.heading, fontSize: 30, lineHeight: 38, letterSpacing: -0.3, color: C.white, marginTop: S.lg },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.slate, marginTop: S.sm, maxWidth: 340 },
  sheet: { flexGrow: 1, marginTop: -24, backgroundColor: C.card, borderTopLeftRadius: R.sheet, borderTopRightRadius: R.sheet, paddingHorizontal: S.margin, paddingTop: 12, ...shadow.sheet },
  pullBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E7E8EB', alignSelf: 'center', marginBottom: S.lg },
  label: { fontFamily: F.body, fontSize: 14, fontWeight: '500', color: C.text, marginBottom: S.sm },
  field: { flexDirection: 'row', alignItems: 'center', minHeight: 54, borderRadius: R.field, backgroundColor: C.fieldBg, paddingHorizontal: 14, borderWidth: 2, borderColor: 'transparent' },
  fieldFocused: { backgroundColor: C.card, borderColor: C.navy },
  fieldError: { borderColor: C.error, backgroundColor: '#FFF8F7' },
  flag: { width: 20, height: 14, borderRadius: 2, overflow: 'hidden', marginRight: 8 },
  flagBand: { flex: 1 },
  flagMid: { backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
  chakra: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#000080' },
  code: { fontFamily: F.body, fontSize: 15, fontWeight: '600', color: C.text },
  divider: { width: 1, height: 20, backgroundColor: C.border, marginHorizontal: 12 },
  input: { flex: 1, fontFamily: F.body, fontSize: 17, fontWeight: '500', letterSpacing: 1, color: C.text, paddingVertical: 12 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: S.sm },
  errorText: { fontFamily: F.body, fontSize: 12, color: C.error, flexShrink: 1 },
  cta: { marginTop: 20 },
  referralToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, alignSelf: 'center', minHeight: 44, marginTop: S.sm },
  referralText: { fontFamily: F.body, fontSize: 14, fontWeight: '500', color: C.goldDeep },
  referralField: { flexDirection: 'row', alignItems: 'center', minHeight: 48, borderRadius: R.field, backgroundColor: C.fieldBg, paddingLeft: 14, paddingRight: 6, borderWidth: 1.5, borderColor: 'transparent' },
  referralInput: { flex: 1, fontFamily: F.body, fontSize: 14, letterSpacing: 1, color: C.text, paddingVertical: 10 },
  apply: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, backgroundColor: '#E7E8EB' },
  applyText: { fontFamily: F.body, fontSize: 12, fontWeight: '600', color: C.navy },
  referralErr: { marginTop: 6 },
  flexSpacer: { flexGrow: 1, minHeight: S.xl },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: S.sm },
  secureText: { fontFamily: F.body, fontSize: 11, color: C.muted, textAlign: 'center', flexShrink: 1 },
});
