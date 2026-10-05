import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, Easing, FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Redirect, router } from 'expo-router';

import { JourneyFooter } from '@/components/journey/journey-footer';
import { Icon } from '@/components/ui/icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { C, F, R, S, shadow } from '@/constants/brand';
import { ApiError } from '@/services/api';
import { formatMobile } from '@/services/auth';
import { getAnalysis, requestWhatsAppUpdate, startAnalysis, type AnalysisStatus } from '@/services/documents';
import { useAppStore } from '@/store/app-store';

/** Document Verification — polls the analysis job the documents screen started. */
export default function AnalysingScreen() {
  const { journey, session, updateJourney } = useAppStore();
  const analysis = journey.analysis;
  const entityType = journey.entityType;
  const [status, setStatus] = useState<AnalysisStatus | null>(null);
  const [offline, setOffline] = useState(false);
  const [polledId, setPolledId] = useState(analysis?.id);
  if (polledId !== analysis?.id) {
    setPolledId(analysis?.id);
    setStatus(null);
    setOffline(false);
  }
  const [notifying, setNotifying] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const analysisId = analysis?.id;
  useEffect(() => {
    if (!analysisId || !entityType) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;
    const tick = async () => {
      try {
        const res = await getAnalysis(analysisId, entityType);
        if (cancelled) return;
        failures = 0;
        setOffline(false);
        setStatus(res);
        if (res.status !== 'running') {
          void updateJourney(prev => (prev.analysis?.id === analysisId ? { analysis: { ...prev.analysis, status: res.status } } : {}));
          return;
        }
      } catch {
        if (cancelled) return;
        failures += 1;
        if (failures >= 3) setOffline(true);
      }
      timer = setTimeout(() => void tick(), failures ? 3000 : 1500);
    };
    void tick();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [analysisId, entityType, updateJourney]);

  if (!analysis || !entityType) return <Redirect href="/documents" />;

  const state = status?.status ?? (analysis.status === 'done' ? 'done' : 'running');
  const done = state === 'done';
  const failed = state === 'failed';

  async function notify() {
    if (!analysisId) return;
    setNotifying(true);
    setNotifyError(null);
    try {
      await requestWhatsAppUpdate(analysisId);
      await updateJourney(prev => (prev.analysis ? { analysis: { ...prev.analysis, notifyWhatsApp: true } } : {}));
    } catch (e) {
      setNotifyError(e instanceof ApiError ? e.message : 'Could not set up WhatsApp updates. Please try again.');
    } finally {
      setNotifying(false);
    }
  }

  async function retry() {
    if (!analysis || !entityType) return;
    setRetrying(true);
    try {
      const { id } = await startAnalysis(analysis.fingerprint.split(','), entityType);
      await updateJourney({ analysis: { ...analysis, id, startedAt: new Date().toISOString(), status: 'running' } });
    } catch {
      setStatus(prev => (prev ? { ...prev, message: 'Could not restart. Check your connection and try again.' } : prev));
    } finally {
      setRetrying(false);
    }
  }

  const backToDocuments = () => (router.canGoBack() ? router.back() : router.replace('/documents'));

  const footer = done ? (
    <JourneyFooter onContinue={() => router.replace('/verify-details')} label="Continue" note="Private • Never shared without your consent" />
  ) : failed ? (
    <JourneyFooter onContinue={() => void retry()} loading={retrying} label="Try again" icon="refresh" note="Your uploaded documents are kept" />
  ) : undefined;

  return (
    <Screen footer={footer} contentStyle={s.content}>
      <Animated.View entering={FadeIn.duration(500)} style={s.hero}>
        <Spinner done={done} failed={failed} />
        <Text style={s.title} accessibilityRole="header" accessibilityLiveRegion="polite">
          {done ? 'Your documents are read' : failed ? 'We couldn’t finish reading' : 'Reading your documents'}
        </Text>
        {done && <Text style={s.sub}>Next, confirm a few details so your score is accurate.</Text>}
        {failed && <Text style={[s.sub, s.errorText]}>{status?.message ?? 'Something went wrong while reading your documents.'}</Text>}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(400)} style={s.card}>
        {status ? status.steps.map((step, i) => (
          <View key={step.id} style={[s.step, i > 0 && s.stepBorder]} accessible accessibilityLabel={`${step.label}: ${step.state === 'done' ? 'done' : step.state === 'active' ? 'in progress' : 'waiting'}`}>
            <View style={[s.dot, step.state === 'done' && s.dotDone]}>
              {step.state === 'done' ? <Icon name="check-circle" size={20} color={C.success} />
                : step.state === 'active' && !failed ? <ActivityIndicator size="small" color={C.gold} />
                  : step.state === 'active' ? <Icon name="error" size={18} color={C.error} /> : null}
            </View>
            <Text style={[s.stepText, step.state === 'active' && s.stepActive, step.state === 'pending' && s.stepPending]}>{step.label}</Text>
          </View>
        )) : (
          <View style={s.loading}><ActivityIndicator color={C.gold} /></View>
        )}
      </Animated.View>

      {offline && (
        <Animated.View entering={FadeIn} style={s.offline} accessibilityLiveRegion="polite">
          <Icon name="refresh" size={14} color={C.muted} />
          <Text style={s.offlineText}>Connection lost — retrying…</Text>
        </Animated.View>
      )}

      {!done && !failed && (
        <Animated.View entering={FadeInDown.delay(250).duration(400)}>
          {analysis.notifyWhatsApp ? (
            <View style={s.notified}>
              <Icon name="check-circle" size={16} color={C.success} />
              <Text style={s.notifiedText}>
                We’ll message you on WhatsApp{session?.user.mobile ? ` at +91 ${formatMobile(session.user.mobile)}` : ''} when it’s ready. You can safely leave.
              </Text>
            </View>
          ) : (
            <>
              <Text style={s.note}>Usually takes under 2 minutes. You can safely leave — we’ll let you know on WhatsApp.</Text>
              <Pressable onPress={() => void notify()} disabled={notifying} hitSlop={6} accessibilityRole="button" style={({ pressed }) => [s.whatsapp, pressed && s.pressed]}>
                {notifying ? <ActivityIndicator size="small" color={C.success} /> : <Icon name="chat" size={20} color={C.success} />}
                <Text style={s.whatsappText}>Notify me on WhatsApp</Text>
              </Pressable>
              {notifyError && <Text style={[s.note, s.errorText]}>{notifyError}</Text>}
            </>
          )}
        </Animated.View>
      )}

      {failed && (
        <Pressable onPress={backToDocuments} hitSlop={6} accessibilityRole="button" style={s.backLink}>
          <Text style={s.backText}>Back to documents</Text>
        </Pressable>
      )}
    </Screen>
  );
}

/** Rotating gold arc around a document badge; settles into a full ring when finished. */
function Spinner({ done, failed }: { done: boolean; failed: boolean }) {
  const spin = useSharedValue(0);
  const glow = useSharedValue(0.6);
  const still = done || failed;
  useEffect(() => {
    if (still) {
      cancelAnimation(spin);
      cancelAnimation(glow);
      spin.value = withTiming(0, { duration: 300 });
      return;
    }
    spin.value = 0;
    spin.value = withRepeat(withTiming(360, { duration: 1400, easing: Easing.linear }), -1, false);
    glow.value = withRepeat(withTiming(1, { duration: 1200 }), -1, true);
  }, [still, spin, glow]);

  const rotate = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  const pulse = useAnimatedStyle(() => ({ opacity: glow.value, transform: [{ scale: 0.92 + glow.value * 0.08 }] }));

  return (
    <View style={s.spinner} accessible accessibilityRole="progressbar" accessibilityLabel={done ? 'Finished' : failed ? 'Stopped' : 'Reading documents'}>
      <Animated.View style={[s.glow, pulse]} />
      <Animated.View style={rotate}>
        <ProgressRing progress={still ? 1 : 0.72} size={150} stroke={4} color={failed ? C.error : done ? C.success : C.gold} track="#EDE6D3" />
      </Animated.View>
      <View style={s.badge}>
        <Icon name={done ? 'check' : failed ? 'error' : 'document'} size={40} color={done ? C.success : failed ? C.error : C.navy} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  content: { paddingTop: S.xl },
  hero: { alignItems: 'center' },
  spinner: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: C.goldSoft },
  badge: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  title: { fontFamily: F.heading, fontSize: 24, lineHeight: 32, color: C.navy, textAlign: 'center', marginTop: S.md },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.muted, textAlign: 'center', marginTop: 6 },
  errorText: { color: C.error },
  card: { marginTop: S.lg, paddingHorizontal: S.md + 4, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  loading: { paddingVertical: S.lg },
  step: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 18 },
  stepBorder: { borderTopWidth: 1, borderTopColor: C.subtle },
  dot: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: C.successSoft },
  stepText: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.text },
  stepActive: { fontWeight: '600', color: C.navy },
  stepPending: { color: C.muted },
  offline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: S.md },
  offlineText: { fontFamily: F.body, fontSize: 12, color: C.muted },
  note: { fontFamily: F.body, fontSize: 13, lineHeight: 20, color: C.muted, textAlign: 'center', marginTop: S.lg },
  whatsapp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'center', minHeight: 48, paddingHorizontal: S.md, marginTop: S.sm, borderRadius: R.button },
  pressed: { backgroundColor: C.subtle },
  whatsappText: { fontFamily: F.body, fontSize: 15, fontWeight: '600', color: C.navy },
  notified: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: S.lg, padding: 12, borderRadius: R.field, backgroundColor: C.successSoft },
  notifiedText: { flex: 1, fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.success },
  backLink: { alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: S.md },
  backText: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.goldDeep },
});
