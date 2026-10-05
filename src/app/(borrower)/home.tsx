import { useCallback, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { router, useFocusEffect, useNavigation } from 'expo-router';

import { Icon } from '@/components/ui/icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { C, F, R, S, shadow } from '@/constants/brand';
import { formatINR } from '@/constants/loan';
import { assessedLabel } from '@/services/score';
import { firstName, useAppStore } from '@/store/app-store';

export default function HomeScreen() {
  const navigation = useNavigation();
  const clearedStack = useRef(false);
  const { session, journey, resetJourney } = useAppStore();
  const name = firstName(session?.user);

  useFocusEffect(useCallback(() => {
    if (clearedStack.current) return;
    const state = navigation.getState();
    if (!state || state.index === 0 || state.routes[state.index]?.name !== 'home') return;
    clearedStack.current = true;
    (navigation as unknown as { reset: (state: { index: number; routes: { name: string }[] }) => void }).reset({
      index: 0,
      routes: [{ name: 'home' }],
    });
  }, [navigation]));
  const application = journey.application;
  const score = journey.score;
  const pending = application?.pendingDocument;
  const status = application?.timeline.find(step => step.state === 'active')?.title ?? 'In progress';

  function startNew() {
    Alert.alert(
      'Start a new application?',
      'This clears the current application, documents and score on this device. Your login stays.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start new',
          onPress: () => { void resetJourney().then(() => router.replace('/entity-type')); },
        },
      ],
    );
  }

  return (
    <Screen>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={s.greeting} accessibilityRole="header">{name ? `Namaste, ${name} 👋` : 'Namaste 👋'}</Text>
      </Animated.View>

      {application && (
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={s.navy}>
          <View style={s.navyTop}>
            <Text style={s.kicker}>Active application</Text>
            <Text style={s.badge}>{status}</Text>
          </View>
          <Text style={s.facility}>{application.product} · {application.lenderName}</Text>
          <Text style={s.amount}>{formatINR(application.amount)}</Text>
          <View style={s.navyFoot}>
            <Text style={s.ref}>Ref: {application.id}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Track application" onPress={() => router.push('/application')} hitSlop={8} style={s.track}>
              <Text style={s.trackText}>Track</Text>
              <Icon name="arrow-forward" size={16} color={C.gold} />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {score && (
        <View style={s.scoreCard}>
          <View style={s.scoreText}>
            <Pressable accessibilityRole="button" accessibilityLabel={`Financial Health Score ${score.value} out of 100`} onPress={() => router.push('/score')}>
              <Text style={s.scoreTitle}>Financial Health Score</Text>
              <Text style={s.scoreWhen}>{assessedLabel(score.assessedAt)}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push('/documents')} hitSlop={6} style={s.reassess}>
              <Text style={s.reassessText}>Reassess</Text>
              <Icon name="arrow-forward" size={14} color={C.goldDeep} />
            </Pressable>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Open score" onPress={() => router.push('/score')}>
            <ProgressRing progress={score.value / 100} size={72} stroke={6} color={C.goldDeep} track={C.subtle}>
              <Text style={s.scoreValue}>{score.value}<Text style={s.scoreMax}>/100</Text></Text>
            </ProgressRing>
          </Pressable>
        </View>
      )}

      {pending && (
        <Pressable accessibilityRole="button" onPress={() => router.push('/documents')} style={s.task}>
          <View style={s.taskIcon}><Icon name="error" size={18} color={C.goldDeep} /></View>
          <View style={s.taskBody}>
            <Text style={s.taskTitle}>1 pending task</Text>
            <Text style={s.taskText}>{pending.title}</Text>
          </View>
          <Icon name="chevron-right" size={18} color={C.muted} />
        </Pressable>
      )}

      <Pressable accessibilityRole="button" onPress={startNew} style={s.newApp}>
        <Icon name="add" size={20} color={C.navy} />
        <Text style={s.newAppText}>Start a new application</Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  greeting: { fontFamily: F.heading, fontSize: 28, lineHeight: 36, color: C.navy },
  navy: { marginTop: S.lg, padding: S.md + 4, borderRadius: R.card, backgroundColor: C.navy },
  navyTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kicker: { fontFamily: F.body, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: C.gold },
  badge: { fontFamily: F.body, fontSize: 12, fontWeight: '600', color: C.gold, backgroundColor: 'rgba(253,185,1,0.16)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
  facility: { fontFamily: F.heading, fontSize: 20, lineHeight: 28, color: C.white, marginTop: S.md },
  amount: { fontFamily: F.heading, fontSize: 28, lineHeight: 36, color: C.white, marginTop: 4, fontVariant: ['tabular-nums'] },
  navyFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.lg },
  ref: { fontFamily: F.body, fontSize: 13, color: '#9AABC4' },
  track: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  trackText: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.gold },
  scoreCard: { flexDirection: 'row', alignItems: 'center', gap: S.md, marginTop: S.md, padding: S.md, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  scoreText: { flex: 1 },
  scoreTitle: { fontFamily: F.heading, fontSize: 18, lineHeight: 24, color: C.navy },
  scoreWhen: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: 4 },
  reassess: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: S.sm, minHeight: 32, alignSelf: 'flex-start' },
  reassessText: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.goldDeep },
  scoreValue: { fontFamily: F.heading, fontSize: 16, color: C.navy, fontVariant: ['tabular-nums'] },
  scoreMax: { fontFamily: F.body, fontSize: 11, color: C.muted },
  task: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: S.md, padding: 14, borderRadius: R.card, backgroundColor: C.goldSoft },
  taskIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  taskBody: { flex: 1 },
  taskTitle: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.navy },
  taskText: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: 2 },
  newApp: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 52, marginTop: S.md, borderRadius: R.button, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  newAppText: { fontFamily: F.body, fontSize: 15, fontWeight: '600', color: C.navy },
});
