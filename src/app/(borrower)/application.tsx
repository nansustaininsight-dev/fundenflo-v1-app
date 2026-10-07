import { useCallback, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Redirect, router, useFocusEffect } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { Toggle } from '@/components/ui/toggle';
import { C, F, R, S, shadow } from '@/constants/brand';
import { formatINR } from '@/constants/loan';
import { ApiError } from '@/services/api';
import { requestApplicationUpdates } from '@/services/application';
import { copyText } from '@/services/clipboard';
import { formatMobile } from '@/services/auth';
import { useAppStore } from '@/store/app-store';

export default function ApplicationScreen() {
  const { journey, session, updateJourney } = useAppStore();
  const application = journey.application;
  const [copied, setCopied] = useState(false);
  const [whatsApp, setWhatsApp] = useState(application?.whatsApp === true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goHome = useCallback(() => {
    router.dismissTo('/home');
  }, []);

  useFocusEffect(useCallback(() => {
    if (!application) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      goHome();
      return true;
    });
    return () => sub.remove();
  }, [application, goHome]));

  if (!application) return <Redirect href="/lenders" />;

  async function copyId() {
    const ok = await copyText(application!.id);
    if (!ok) return;
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function toggleUpdates(next: boolean) {
    if (!application) return;
    setWhatsApp(next);
    setError(null);
    if (!next) {
      await updateJourney({ application: { ...application, whatsApp: false } });
      return;
    }
    setUpdating(true);
    try {
      await requestApplicationUpdates(application.id);
      await updateJourney({ application: { ...application, whatsApp: true } });
    } catch (e) {
      setWhatsApp(false);
      setError(e instanceof ApiError ? e.message : 'Could Not Set Up WhatsApp Updates. Please Try Again.');
    } finally {
      setUpdating(false);
    }
  }

  const mobile = session?.user.mobile ? `+91 ${formatMobile(session.user.mobile)}` : 'Your Mobile Number';

  return (
    <Screen
      header={<StepHeader title="Application Status" onBack={goHome} />}
      footer={<Button label="Go To Home" onPress={goHome} />}>
      <Animated.View entering={FadeInDown.duration(400)} style={s.summary}>
        <Text style={s.kicker}>Facility</Text>
        <Text style={s.facility}>{application.product} · {application.lenderName}</Text>
        <Text style={s.amountLabel}>Requested</Text>
        <Text style={s.amount}>{formatINR(application.amount)}</Text>
        <View style={s.idRow}>
          <Text style={s.idLabel} selectable>App ID {application.id}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel={copied ? 'Copied' : 'Copy Application ID'} onPress={() => void copyId()} hitSlop={8} style={s.copy}>
            <Icon name={copied ? 'check' : 'copy'} size={16} color={C.navy} />
            {copied && <Text style={s.copied}>Copied</Text>}
          </Pressable>
        </View>
      </Animated.View>

      {application.pendingDocument && (
        <View style={s.alert}>
          <Icon name="error" size={18} color={C.goldDeep} />
          <View style={s.alertBody}>
            <Text style={s.alertTitle}>Lender Asked For 1 More Document</Text>
            <Text style={s.alertText}>{application.pendingDocument.title}</Text>
            <Text style={s.alertDetail}>{application.pendingDocument.detail}</Text>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.push('/documents')} style={s.upload}>
            <Text style={s.uploadText}>Upload Now</Text>
          </Pressable>
        </View>
      )}

      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={s.timeline}>
        <Text style={s.section}>Status</Text>
        {application.timeline.map((step, index) => (
          <View key={step.id} style={s.step} accessible accessibilityLabel={`${step.title}: ${step.state}`}>
            <View style={s.rail}>
              <View style={[s.dot, step.state === 'done' && s.dotDone, step.state === 'active' && s.dotActive]}>
                {step.state === 'done' && <Icon name="check" size={12} color={C.white} />}
              </View>
              {index < application.timeline.length - 1 && <View style={[s.line, step.state === 'done' && s.lineDone]} />}
            </View>
            <View style={s.stepBody}>
              <View style={s.stepTop}>
                <Text style={[s.stepTitle, step.state === 'pending' && s.stepPending]}>{step.title}</Text>
                {step.state === 'active' && <Text style={s.active}>Active</Text>}
                {step.at && <Text style={s.when}>{step.at}</Text>}
              </View>
              <Text style={s.stepDetail}>{step.detail}</Text>
            </View>
          </View>
        ))}
      </Animated.View>

      <View style={s.whatsapp}>
        <Icon name="chat" size={22} color={C.success} />
        <View style={s.whatsappText}>
          <Text style={s.whatsappTitle}>Get Status Updates On WhatsApp</Text>
          <Text style={s.whatsappSub}>We’ll Message {mobile} When This Status Changes.</Text>
        </View>
        <Toggle value={whatsApp} onChange={next => void toggleUpdates(next)} disabled={updating} accessibilityLabel="WhatsApp Status Updates" />
      </View>
      {error && <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text>}
    </Screen>
  );
}

const s = StyleSheet.create({
  summary: { padding: S.md + 4, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  kicker: { fontFamily: F.body, fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted },
  facility: { fontFamily: F.heading, fontSize: 20, lineHeight: 28, color: C.navy, marginTop: 6 },
  amountLabel: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: S.md },
  amount: { fontFamily: F.heading, fontSize: 32, lineHeight: 40, color: C.text, fontVariant: ['tabular-nums'] },
  idRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.md, padding: 12, borderRadius: R.field, backgroundColor: C.subtle },
  idLabel: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.navy },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  copied: { fontFamily: F.body, fontSize: 12, fontWeight: '600', color: C.success },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: S.md, padding: 14, borderRadius: R.card, backgroundColor: C.goldSoft },
  alertBody: { flex: 1 },
  alertTitle: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.navy },
  alertText: { fontFamily: F.body, fontSize: 13, color: C.text, marginTop: 2 },
  alertDetail: { fontFamily: F.body, fontSize: 12, lineHeight: 17, color: C.muted, marginTop: 2 },
  upload: { minHeight: 36, paddingHorizontal: 12, borderRadius: R.button, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  uploadText: { fontFamily: F.body, fontSize: 12, fontWeight: '600', color: C.white },
  timeline: { marginTop: S.md, padding: S.md, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  section: { fontFamily: F.heading, fontSize: 18, color: C.navy, marginBottom: S.sm },
  step: { flexDirection: 'row', gap: 12 },
  rail: { width: 22, alignItems: 'center' },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: C.success },
  dotActive: { backgroundColor: C.gold },
  line: { width: 2, flex: 1, minHeight: 28, backgroundColor: C.border, marginVertical: 2 },
  lineDone: { backgroundColor: C.success },
  stepBody: { flex: 1, paddingBottom: S.md },
  stepTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepTitle: { flex: 1, fontFamily: F.body, fontSize: 15, fontWeight: '600', color: C.text },
  stepPending: { color: C.muted, fontWeight: '500' },
  active: { fontFamily: F.body, fontSize: 10, fontWeight: '700', letterSpacing: 0.4, color: C.navy, backgroundColor: C.goldSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  when: { fontFamily: F.body, fontSize: 12, color: C.muted },
  stepDetail: { fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.muted, marginTop: 2 },
  whatsapp: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: S.md, padding: 14, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  whatsappText: { flex: 1 },
  whatsappTitle: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.navy },
  whatsappSub: { fontFamily: F.body, fontSize: 12, lineHeight: 17, color: C.muted, marginTop: 2 },
  error: { fontFamily: F.body, fontSize: 12, color: C.error, textAlign: 'center', marginTop: S.sm },
});
