import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S } from '@/constants/brand';
import { ApiError, USE_MOCK } from '@/services/api';
import { formatMobile, MOCK_OTP, requestOtp, verifyOtp } from '@/services/auth';
import { useAppStore } from '@/store/app-store';

const LENGTH = 6;

function Cursor() {
  const opacity = useSharedValue(1);
  useEffect(() => { opacity.set(withRepeat(withSequence(withTiming(0, { duration: 450 }), withTiming(1, { duration: 450 })), -1)); }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[s.cursor, style]} />;
}

export default function VerifyOtpScreen() {
  const params = useLocalSearchParams<{ mobile: string; resendIn?: string }>();
  const mobile = params.mobile ?? '';
  const { signIn } = useAppStore();
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(Number(params.resendIn) || 30);
  const inputRef = useRef<TextInput>(null);
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  // Guard against deep links without a number.
  useEffect(() => { if (!mobile) router.replace('/login'); }, [mobile]);

  async function verify(value = code) {
    if (value.length !== LENGTH || loading) return;
    setLoading(true);
    setError(null);
    try {
      const session = await verifyOtp(mobile, value);
      await signIn(session);
      router.dismissAll();
      router.replace('/entity-type');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Verification failed. Please try again.');
      shake.set(withSequence(withTiming(-8, { duration: 50 }), withRepeat(withTiming(8, { duration: 80 }), 3, true), withTiming(0, { duration: 50 })));
      setCode('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  }

  function onChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, LENGTH);
    setCode(digits);
    setError(null);
    if (digits.length === LENGTH) void verify(digits);
  }

  async function resend() {
    if (seconds > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const { resendIn } = await requestOtp(mobile);
      setSeconds(resendIn);
      setNotice('A new code has been sent.');
      setTimeout(() => setNotice(null), 3000);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not resend code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  const timer = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  return (
    <Screen
      background={C.card}
      header={<StepHeader onBack={() => router.back()} />}
      footer={<>
        <Button label="Verify & continue" onPress={() => void verify()} loading={loading} disabled={code.length !== LENGTH} />
        <Text style={s.terms}>By continuing you agree to the <Text style={s.termsLink}>Terms</Text> and <Text style={s.termsLink}>Privacy Policy</Text></Text>
      </>}>
      <Text style={s.title} accessibilityRole="header">Enter the 6-digit code</Text>
      <View style={s.sentRow}>
        <Text style={s.sent}>Sent to +91 {formatMobile(mobile)}</Text>
        <Text style={s.sent}>·</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit mobile number" onPress={() => router.back()} hitSlop={10}>
          <Text style={s.edit}>Edit</Text>
        </Pressable>
      </View>

      <Pressable onPress={() => inputRef.current?.focus()} accessibilityLabel={`One-time code, ${code.length} of ${LENGTH} digits entered`}>
        <Animated.View style={[s.boxes, shakeStyle]}>
          {Array.from({ length: LENGTH }, (_, i) => {
            const digit = code[i];
            const active = focused && i === Math.min(code.length, LENGTH - 1) && !loading;
            return (
              <View key={i} style={[s.box, digit ? s.boxFilled : null, active && s.boxActive, !!error && s.boxError]}>
                {digit ? <Animated.Text entering={FadeIn.duration(120)} style={s.digit}>{digit}</Animated.Text> : active ? <Cursor /> : null}
              </View>
            );
          })}
        </Animated.View>
        {/* Single hidden input drives all boxes: supports paste and SMS autofill. */}
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={LENGTH}
          autoFocus
          caretHidden
          editable={!loading}
          style={s.hiddenInput}
        />
      </Pressable>

      {error && (
        <Animated.View entering={FadeIn} style={s.msgRow} accessibilityLiveRegion="assertive">
          <Icon name="error" size={15} color={C.error} />
          <Text style={s.errorText}>{error}</Text>
        </Animated.View>
      )}
      {notice && !error && (
        <Animated.View entering={FadeIn} style={s.msgRow}>
          <Icon name="check-circle" size={15} color={C.success} />
          <Text style={[s.errorText, { color: C.success }]}>{notice}</Text>
        </Animated.View>
      )}

      <View style={s.resendRow}>
        {seconds > 0 ? (
          <Text style={s.resend}>Resend code in <Text style={s.tabular}>{timer}</Text></Text>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => void resend()} disabled={resending} hitSlop={10}>
            <Text style={s.resendLink}>{resending ? 'Sending…' : 'Resend code'}</Text>
          </Pressable>
        )}
      </View>

      {USE_MOCK && (
        <View style={s.demo}>
          <Icon name="info" size={15} color={C.goldDeep} />
          <Text style={s.demoText}>Demo mode (no backend): use code {MOCK_OTP}</Text>
        </View>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 24, lineHeight: 32, letterSpacing: -0.3, color: C.text, marginTop: S.sm },
  sentRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: S.sm, marginBottom: S.xl },
  sent: { fontFamily: F.body, fontSize: 14, color: C.muted },
  edit: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.navy, textDecorationLine: 'underline' },
  boxes: { flexDirection: 'row', gap: 8 },
  box: { flex: 1, maxWidth: 56, aspectRatio: 0.86, borderRadius: R.field, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', boxShadow: '0px 1px 2px rgba(10,25,47,0.05)' },
  boxFilled: { backgroundColor: C.canvas },
  boxActive: { borderWidth: 2, borderColor: C.navy, backgroundColor: C.card },
  boxError: { borderColor: C.error, backgroundColor: '#FFF8F7' },
  digit: { fontFamily: F.body, fontSize: 20, fontWeight: '600', color: C.navy },
  cursor: { width: 2, height: 24, borderRadius: 1, backgroundColor: C.navy },
  hiddenInput: { position: 'absolute', width: 1, height: 1, opacity: 0 },
  msgRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: S.md },
  errorText: { fontFamily: F.body, fontSize: 13, color: C.error, flexShrink: 1 },
  resendRow: { marginTop: S.lg, minHeight: 24 },
  resend: { fontFamily: F.body, fontSize: 14, color: C.muted },
  tabular: { fontVariant: ['tabular-nums'] },
  resendLink: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.navy },
  demo: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.xl, padding: 12, borderRadius: R.chip, backgroundColor: C.goldSoft },
  demoText: { fontFamily: F.body, fontSize: 12, color: '#5D4200', flexShrink: 1 },
  terms: { fontFamily: F.body, fontSize: 12, lineHeight: 18, color: C.muted, textAlign: 'center', marginTop: 12, paddingHorizontal: S.md },
  termsLink: { textDecorationLine: 'underline' },
});
