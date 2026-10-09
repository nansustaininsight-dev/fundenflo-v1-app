import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { C, F, MAX_WIDTH, R, S, shadow } from '@/constants/brand';
import { ApiError } from '@/services/api';
import { isValidMobile, requestOtp } from '@/services/auth';

const ROLES: { id: 'borrower' | 'dsa' | 'ca' | 'lender'; label: string; hint: string; icon: IconName; ready: boolean }[] = [
  { id: 'borrower', label: 'Loan Borrower', hint: 'Available Now', icon: 'person', ready: true },
  { id: 'dsa', label: 'DSA', hint: 'Coming Soon', icon: 'store', ready: false },
  { id: 'ca', label: 'CA', hint: 'Coming Soon', icon: 'receipt', ready: false },
  { id: 'lender', label: 'Lender', hint: 'Coming Soon', icon: 'bank', ready: false },
];

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
  const [role, setRole] = useState<(typeof ROLES)[number]['id']>('borrower');
  const [roleOpen, setRoleOpen] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const selectedRole = ROLES.find(item => item.id === role) ?? ROLES[0];
  const valid = isValidMobile(mobile);
  const showInvalid = touched && mobile.length > 0 && !valid && !focused;

  function onChange(text: string) {
    setMobile(text.replace(/\D/g, '').slice(0, 10));
    setError(null);
  }

  function applyReferral() {
    const code = referral.trim().toUpperCase();
    if (!/^[A-Z0-9]{4,12}$/.test(code)) {
      setReferralError('Use 4–12 Letters Or Numbers.');
      return;
    }
    setReferralError(null);
    setAppliedReferral(code);
  }

  function chooseRole(id: (typeof ROLES)[number]['id']) {
    setRole(id);
    setRoleOpen(false);
  }

  async function submit() {
    setTouched(true);
    if (!selectedRole.ready || !valid || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { resendIn } = await requestOtp(mobile, appliedReferral ?? undefined);
      router.push({ pathname: '/verify-otp', params: { mobile, resendIn: String(resendIn) } });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could Not Send OTP. Please Try Again.');
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
                <Animated.Text entering={FadeIn} exiting={FadeOut} style={s.langNote}>हिंदी जल्द उपलब्ध होगी · Hindi Is Coming Soon</Animated.Text>
              )}
              <Animated.View entering={FadeInDown.duration(500)}>
                <Image source={require('../../../assets/brand/logo-white.png')} style={s.logo} resizeMode="contain" accessibilityLabel="FundenFlo — The Right Funding, At The Right Time" />
                <Text style={s.headline} accessibilityRole="header">Know Who Can Fund You — In Minutes</Text>
                <Text style={s.sub}>Upload A Few Documents. See Matching Lenders. Track Till Disbursal.</Text>
              </Animated.View>
            </View>
          </View>

          {/* Bottom sheet */}
          <Animated.View entering={FadeInDown.delay(120).duration(500)} style={[s.sheet, { paddingBottom: Math.max(insets.bottom, S.md) + S.sm }]}>
            <View style={s.column}>
              <View style={s.pullBar} />
              <Text style={s.label} nativeID="roleLabel">Login As</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Login As"
                accessibilityState={{ expanded: roleOpen }}
                onPress={() => setRoleOpen(open => !open)}
                style={[s.field, roleOpen && s.fieldFocused]}
              >
                <View style={s.roleIcon}>
                  <Icon name={selectedRole.icon} size={18} color={C.navy} />
                </View>
                <Text style={s.roleValue}>{selectedRole.label}</Text>
                {!selectedRole.ready && <View style={s.soon}><Text style={s.soonText}>Soon</Text></View>}
                <Icon name="expand-more" size={20} color={C.muted} style={{ transform: [{ rotate: roleOpen ? '180deg' : '0deg' }] }} />
              </Pressable>
              {roleOpen && (
                <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(120)} style={s.menu} accessibilityRole="radiogroup">
                  {ROLES.map(item => {
                    const on = item.id === role;
                    return (
                      <Pressable
                        key={item.id}
                        accessibilityRole="radio"
                        accessibilityLabel={`${item.label}. ${item.hint}`}
                        accessibilityState={{ checked: on }}
                        aria-checked={on}
                        onPress={() => chooseRole(item.id)}
                        style={({ pressed }) => [s.menuRow, on && s.menuOn, pressed && { opacity: 0.85 }]}
                      >
                        <View style={[s.roleIcon, on && s.roleIconOn]}>
                          <Icon name={item.icon} size={18} color={C.navy} />
                        </View>
                        <View style={s.menuCopy}>
                          <Text style={[s.menuLabel, on && s.menuLabelOn]}>{item.label}</Text>
                          <Text style={s.menuHint}>{item.hint}</Text>
                        </View>
                        {!item.ready && <View style={s.soon}><Text style={s.soonText}>Soon</Text></View>}
                        {on && (
                          <Animated.View entering={ZoomIn.duration(180)}>
                            <Icon name="check" size={16} color={C.goldDeep} />
                          </Animated.View>
                        )}
                      </Pressable>
                    );
                  })}
                </Animated.View>
              )}
              {!selectedRole.ready && (
                <Animated.View entering={FadeIn} style={s.soonNote} accessibilityLiveRegion="polite">
                  <Icon name="info" size={14} color={C.goldDeep} />
                  <Text style={s.soonNoteText}>{selectedRole.label} Login Is Coming Soon. Version 1 Continues As Loan Borrower.</Text>
                </Animated.View>
              )}

              <Text style={[s.label, s.mobileLabel]} nativeID="mobileLabel">Mobile Number</Text>
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
                  accessibilityLabel="Mobile Number"
                  style={s.input}
                />
                {valid && <Animated.View entering={FadeIn}><Icon name="check-circle" size={20} color={C.success} /></Animated.View>}
              </Pressable>
              {(showInvalid || error) && (
                <Animated.View entering={FadeIn} style={s.errorRow} accessibilityLiveRegion="polite">
                  <Icon name="error" size={14} color={C.error} />
                  <Text style={s.errorText}>{error ?? 'Enter A Valid 10-Digit Mobile Number Starting With 6–9.'}</Text>
                </Animated.View>
              )}

              <Button label="Get OTP" icon="arrow-forward" onPress={() => void submit()} loading={loading} disabled={!valid || !selectedRole.ready} style={s.cta} />

              <Pressable accessibilityRole="button" accessibilityState={{ expanded: referralOpen }} onPress={() => setReferralOpen(o => !o)} hitSlop={8} style={s.referralToggle}>
                <Text style={s.referralText}>{appliedReferral ? `Referral Applied · ${appliedReferral}` : 'Have A Referral Code?'}</Text>
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
                      accessibilityLabel="Referral Code"
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
                <Text style={s.secureText}>256-Bit Encrypted · Your Data Is Shared Only With Your Consent</Text>
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
  logo: { width: 310, maxWidth: '90%', height: 100, marginTop: S.lg, marginLeft: -8 },
  headline: { fontFamily: F.heading, fontSize: 30, lineHeight: 38, letterSpacing: -0.3, color: C.white, marginTop: S.lg },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.slate, marginTop: S.sm, maxWidth: 340 },
  sheet: { flexGrow: 1, marginTop: -24, backgroundColor: C.card, borderTopLeftRadius: R.sheet, borderTopRightRadius: R.sheet, paddingHorizontal: S.margin, paddingTop: 12, ...shadow.sheet },
  pullBar: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#E7E8EB', alignSelf: 'center', marginBottom: S.lg },
  label: { fontFamily: F.body, fontSize: 14, fontWeight: '500', color: C.text, marginBottom: S.sm },
  mobileLabel: { marginTop: S.md },
  roleIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  roleIconOn: { backgroundColor: C.goldSoft },
  roleValue: { flex: 1, fontFamily: F.body, fontSize: 16, fontWeight: '600', color: C.text },
  soon: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: C.goldSoft, marginRight: 8 },
  soonText: { fontFamily: F.body, fontSize: 10, fontWeight: '700', letterSpacing: 0.4, color: C.goldDeep },
  menu: { marginTop: S.sm, borderRadius: R.card, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, overflow: 'hidden', ...shadow.card },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12 },
  menuOn: { backgroundColor: C.canvas },
  menuCopy: { flex: 1 },
  menuLabel: { fontFamily: F.body, fontSize: 15, fontWeight: '600', color: C.text },
  menuLabelOn: { color: C.navy },
  menuHint: { fontFamily: F.body, fontSize: 12, color: C.muted, marginTop: 2 },
  soonNote: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: S.sm },
  soonNoteText: { fontFamily: F.body, fontSize: 12, color: C.goldDeep, flexShrink: 1 },
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
