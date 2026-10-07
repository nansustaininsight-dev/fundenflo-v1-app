import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Redirect, router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { documentsFor } from '@/constants/documents';
import { ApiError } from '@/services/api';
import { assessedLabel, getAssessment, type HealthScore, type ImprovementItem, type ScoreFactor } from '@/services/score';
import { useAppStore } from '@/store/app-store';

export default function ScoreScreen() {
  const { journey, session, updateJourney } = useAppStore();
  const analysisId = journey.analysis?.status === 'done' ? journey.analysis.id : undefined;
  const entityType = journey.entityType;
  const profileReady = !!(session?.user.fullName && session.user.pan && session.user.dob);
  const cached = journey.score && journey.score.analysisId === analysisId ? journey.score : null;

  const [score, setScore] = useState<HealthScore | null>(cached);
  const [items, setItems] = useState<ImprovementItem[]>(cached ? journey.improvement ?? [] : []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (score || !analysisId || !entityType || !profileReady) return;
    let cancelled = false;
    const titles = documentsFor(entityType, journey.loanCategory, journey.preCheck)
      .filter(doc => journey.documents?.[doc.id])
      .map(doc => doc.title);
    (async () => {
      try {
        const res = await getAssessment({
          analysisId,
          entityType,
          creditBureau: journey.consent?.items.creditBureau.granted === true,
          existingEmis: journey.preCheck?.entityType === entityType && journey.preCheck.answers.existingEmis === 'yes',
          documentTitles: titles,
        });
        if (cancelled) return;
        setScore(res.score);
        setItems(res.improvement);
        setLoading(false);
        await updateJourney({ score: res.score, improvement: res.improvement });
      } catch (e) {
        if (cancelled) return;
        setLoading(false);
        setError(e instanceof ApiError ? e.message : 'Could Not Load Your Score. Please Try Again.');
      }
    })();
    return () => { cancelled = true; };
  }, [score, analysisId, entityType, profileReady, attempt, updateJourney, journey.loanCategory, journey.preCheck, journey.documents, journey.consent]);

  if (!profileReady) return <Redirect href="/verify-details" />;
  if (!analysisId || !entityType) return <Redirect href={journey.analysis ? '/analysing' : '/documents'} />;

  function retry() {
    setError(null);
    setLoading(true);
    setScore(null);
    setAttempt(n => n + 1);
  }

  const footer = score ? (
    <Button label="See Matching Lenders" icon="arrow-forward" onPress={() => router.push('/lenders')} />
  ) : error ? (
    <Button label="Try Again" icon="refresh" onPress={retry} />
  ) : undefined;

  return (
    <Screen header={<StepHeader step={6} />} footer={footer}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={s.title} accessibilityRole="header">Financial Health Score</Text>
        <Text style={s.sub}>An Explainable Score Based On Your Documents.</Text>
      </Animated.View>

      {loading && !score && (
        <View style={s.loading} accessibilityLabel="Calculating Your Score">
          <ActivityIndicator color={C.gold} />
        </View>
      )}

      {error && !score && <Text style={s.error} accessibilityLiveRegion="polite">{error}</Text>}

      {score && (
        <>
          <Animated.View entering={FadeInDown.delay(60).duration(400)} style={s.hero}>
            <ProgressRing progress={score.value / 100} size={176} stroke={10} color={C.gold} track="rgba(255,255,255,0.16)">
              <Text style={s.value} accessibilityLabel={`Score ${score.value} Out Of 100`}>{score.value}<Text style={s.valueMax}>/100</Text></Text>
            </ProgressRing>
            <Text style={s.band}>{score.band}</Text>
            <View style={s.badge}>
              <Icon name="shield" size={14} color="#9AABC4" />
              <Text style={s.badgeText}>Not A CIBIL Or Bureau Score</Text>
            </View>
            <Text style={s.assessed}>{assessedLabel(score.assessedAt)}</Text>
          </Animated.View>

          <Text style={s.section}>What Makes Up Your Score</Text>
          <View style={s.card}>
            {score.factors.map(factor => (
              <FactorRow key={factor.id} factor={factor} onPress={factor.attention && items.length > 0 ? () => router.push('/improvement') : undefined} />
            ))}
          </View>
          <Text style={s.based}>{score.basedOn}</Text>
        </>
      )}
    </Screen>
  );
}

function FactorRow({ factor, onPress }: { factor: ScoreFactor; onPress?: () => void }) {
  const width = `${factor.max > 0 ? Math.round((factor.score / factor.max) * 100) : 0}%` as const;
  const body = (
    <>
      <View style={s.factorTop}>
        <View style={s.factorLabel}>
          <Text style={s.factorName}>{factor.label}</Text>
          {factor.attention && <Text style={s.chip}>Needs Attention</Text>}
        </View>
        <View style={s.factorScore}>
          <Text style={s.factorValue}>{factor.score}<Text style={s.factorMax}>/{factor.max}</Text></Text>
          {onPress && <Icon name="chevron-right" size={18} color={C.muted} />}
        </View>
      </View>
      <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: factor.max, now: factor.score }}>
        <View style={[s.fill, { width }, factor.attention && s.fillAttention]} />
      </View>
    </>
  );
  if (!onPress) return <View style={s.factor}>{body}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${factor.label}, Needs Attention`} onPress={onPress} style={s.factor}>
      {body}
    </Pressable>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 28, lineHeight: 36, letterSpacing: -0.3, color: C.text },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.muted, marginTop: 4 },
  loading: { marginTop: S.xl, minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  error: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.error, marginTop: S.lg, textAlign: 'center' },
  hero: { marginTop: S.lg, paddingVertical: S.lg, paddingHorizontal: S.md, borderRadius: R.card, backgroundColor: C.navy, alignItems: 'center' },
  value: { fontFamily: F.heading, fontSize: 40, lineHeight: 48, color: C.white, fontVariant: ['tabular-nums'] },
  valueMax: { fontFamily: F.body, fontSize: 16, color: '#9AABC4' },
  band: { fontFamily: F.heading, fontSize: 18, lineHeight: 26, color: C.white, marginTop: S.md, textAlign: 'center' },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: S.sm, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.1)' },
  badgeText: { fontFamily: F.body, fontSize: 10, fontWeight: '600', letterSpacing: 0.3, color: '#9AABC4' },
  assessed: { fontFamily: F.body, fontSize: 10, fontWeight: '600', letterSpacing: 0.3, color: 'rgba(154,171,196,0.8)', marginTop: S.sm },
  section: { fontFamily: F.heading, fontSize: 18, lineHeight: 26, color: C.text, marginTop: S.xl, marginBottom: S.sm },
  card: { padding: S.md, borderRadius: R.card, backgroundColor: C.card, gap: S.md, ...shadow.card },
  factor: { gap: 8 },
  factorTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  factorLabel: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  factorName: { fontFamily: F.body, fontSize: 14, fontWeight: '500', color: C.text },
  chip: { fontFamily: F.body, fontSize: 10, fontWeight: '600', color: '#5D4200', backgroundColor: '#FFDEA5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: 'hidden' },
  factorScore: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  factorValue: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.text, fontVariant: ['tabular-nums'] },
  factorMax: { color: C.muted, fontWeight: '400' },
  track: { height: 6, borderRadius: 3, backgroundColor: C.subtle, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: C.navy },
  fillAttention: { backgroundColor: C.goldDeep },
  based: { fontFamily: F.body, fontSize: 12, lineHeight: 18, color: C.muted, textAlign: 'center', marginTop: S.md },
});
