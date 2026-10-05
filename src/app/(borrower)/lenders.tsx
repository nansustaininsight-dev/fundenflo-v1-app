import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Redirect, router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { CONSENT_VERSION } from '@/constants/consent';
import { applyToLender } from '@/services/application';
import { ApiError } from '@/services/api';
import { submitConsent } from '@/services/consent';
import { getLenders, type LenderOffer } from '@/services/lenders';
import { useAppStore, type ConsentRecord } from '@/store/app-store';

export default function LendersScreen() {
  const { journey, updateJourney } = useAppStore();
  const analysisId = journey.score?.analysisId;
  const entityType = journey.entityType;
  const consent = journey.consent?.version === CONSENT_VERSION ? journey.consent : undefined;
  const match = journey.lenderMatch;
  const cached = match && analysisId && match.analysisId === analysisId ? match.items : null;

  const [items, setItems] = useState<LenderOffer[] | null>(cached);
  const [selectedId, setSelectedId] = useState(journey.selectedLenderId ?? cached?.[0]?.id);
  const [openId, setOpenId] = useState(cached?.[0]?.id);
  const [loading, setLoading] = useState(!cached);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (items || !analysisId || !entityType || !consent?.items.aiDocuments.granted) return;
    let cancelled = false;
    (async () => {
      try {
        const match = await getLenders({
          analysisId,
          entityType,
          categoryId: journey.loanCategory,
          location: journey.location,
          existingEmis: journey.preCheck?.entityType === entityType && journey.preCheck.answers.existingEmis === 'yes',
        });
        if (cancelled) return;
        setItems(match.items);
        setSelectedId(prev => (prev && match.items.some(lender => lender.id === prev) ? prev : match.items[0]?.id));
        setOpenId(match.items[0]?.id);
        setLoading(false);
        await updateJourney({ lenderMatch: match });
      } catch (e) {
        if (cancelled) return;
        setLoading(false);
        setError(e instanceof ApiError ? e.message : 'Could not load lenders. Please try again.');
      }
    })();
    return () => { cancelled = true; };
  }, [items, analysisId, entityType, consent, attempt, updateJourney, journey.loanCategory, journey.location, journey.preCheck]);

  if (!journey.score || !analysisId || !entityType) return <Redirect href="/score" />;
  if (!consent?.items.aiDocuments.granted) return <Redirect href="/consent" />;

  const selected = items?.find(lender => lender.id === selectedId);
  const sharing = consent.items.lenderSharing.granted === true;

  function choose(id: string) {
    setSelectedId(id);
    setOpenId(id);
    setError(null);
    void updateJourney({ selectedLenderId: id });
  }

  async function apply() {
    if (!selected || submitting || journey.amount == null || !consent) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!sharing) {
        const record = grantSharing(consent);
        await submitConsent(record);
        await updateJourney({ consent: record });
      }
      const application = await applyToLender({
        lenderId: selected.id,
        lenderName: selected.name,
        product: selected.product,
        amount: journey.amount,
      });
      await updateJourney({ application, selectedLenderId: selected.id });
      router.replace('/home');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not send your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const footer = selected ? (
    <View style={s.footer}>
      {!sharing && <Text style={s.shareNote}>Your file is sent only to {selected.name}, and only after you confirm.</Text>}
      {error && <Text style={s.error}>{error}</Text>}
      <Button
        label={sharing ? `Apply with ${selected.name}` : `Share and apply with ${selected.name}`}
        icon="arrow-forward"
        loading={submitting}
        onPress={() => void apply()}
      />
    </View>
  ) : error ? (
    <Button label="Try again" icon="refresh" onPress={() => { setError(null); setLoading(true); setItems(null); setAttempt(n => n + 1); }} />
  ) : undefined;

  return (
    <Screen header={<StepHeader title="Matched lenders" />} footer={footer}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={s.title} accessibilityRole="header">Lenders that fit you</Text>
        <Text style={s.sub}>Based on your documents and each lender’s published criteria.</Text>
      </Animated.View>

      {loading && !items && (
        <View style={s.loading} accessibilityLabel="Finding lenders">
          <ActivityIndicator color={C.gold} />
        </View>
      )}

      {items && items.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>No verified lender matches this profile yet</Text>
          <Text style={s.emptyBody}>You still have your score and improvement plan. Lenders make the final credit decision.</Text>
          {(journey.improvement?.length ?? 0) > 0 && (
            <Pressable accessibilityRole="button" onPress={() => router.push('/improvement')} style={s.emptyLink}>
              <Text style={s.emptyLinkText}>See your improvement plan</Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={s.list}>
        {items?.map((lender, index) => (
          <LenderCard
            key={lender.id}
            lender={lender}
            index={index}
            selected={lender.id === selectedId}
            open={lender.id === openId}
            onSelect={() => choose(lender.id)}
            onToggle={() => setOpenId(open => (open === lender.id ? undefined : lender.id))}
          />
        ))}
      </View>

      {!!items?.length && (
        <View style={s.decision}>
          <Icon name="lock" size={14} color={C.muted} />
          <Text style={s.decisionText}>Final credit decision is always made by the lender.</Text>
        </View>
      )}
    </Screen>
  );
}

function grantSharing(consent: ConsentRecord): ConsentRecord {
  const now = new Date().toISOString();
  const prev = consent.items.lenderSharing;
  return {
    version: consent.version,
    submittedAt: now,
    items: { ...consent.items, lenderSharing: { granted: true, at: prev?.granted ? prev.at : now } },
  };
}

function LenderCard({
  lender, index, selected, open, onSelect, onToggle,
}: {
  lender: LenderOffer;
  index: number;
  selected: boolean;
  open: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(70 + index * 50).duration(360)} style={[s.card, selected && s.cardOn]}>
      <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} aria-checked={selected} onPress={onSelect}>
        <View style={s.cardTop}>
          <View style={s.avatar}><Text style={s.avatarText}>{lender.name.replace('Lender ', '').slice(0, 1)}</Text></View>
          <View style={s.cardTitle}>
            <Text style={s.name}>{lender.name} · {lender.kind}</Text>
            <Text style={s.product}>{lender.product}</Text>
          </View>
          {lender.verified && (
            <View style={s.verified}>
              <Icon name="verified" size={14} color={C.success} />
              <Text style={s.verifiedText}>Verified</Text>
            </View>
          )}
          {selected && (
            <View style={s.tick}><Icon name="check" size={14} color={C.navy} /></View>
          )}
        </View>
        <View style={s.meta}>
          <Text style={s.metaLabel}>Interest</Text>
          <Text style={s.metaValue}>{lender.interest}</Text>
        </View>
        {lender.indicative && (
          <View style={s.meta}>
            <Text style={s.metaLabel}>Eligible amount (indicative)</Text>
            <Text style={s.metaValue}>{lender.indicative}</Text>
          </View>
        )}
        {lender.documentsStillNeeded != null && lender.documentsStillNeeded > 0 && (
          <View style={s.docs}>
            <Icon name="document" size={14} color={C.muted} />
            <Text style={s.docsText}>Documents still needed: {lender.documentsStillNeeded}</Text>
          </View>
        )}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={onToggle} style={s.why}>
        <Text style={s.whyText}>Why this lender?</Text>
        <Icon name="expand-more" size={18} color={C.muted} style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }} />
      </Pressable>
      {open && lender.reasons.map(reason => (
        <View key={reason} style={s.reason}>
          <Icon name="check-circle" size={16} color={C.success} />
          <Text style={s.reasonText}>{reason}</Text>
        </View>
      ))}
    </Animated.View>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 28, lineHeight: 36, letterSpacing: -0.3, color: C.navy },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.muted, marginTop: 6 },
  loading: { marginTop: S.xl, minHeight: 180, alignItems: 'center', justifyContent: 'center' },
  empty: { marginTop: S.lg, padding: S.md, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  emptyTitle: { fontFamily: F.heading, fontSize: 18, lineHeight: 26, color: C.navy },
  emptyBody: { fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.muted, marginTop: 6 },
  emptyLink: { minHeight: 44, justifyContent: 'center', marginTop: 4 },
  emptyLinkText: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.goldDeep },
  list: { gap: 14, marginTop: S.lg },
  card: { padding: S.md, borderRadius: R.card, backgroundColor: C.card, borderWidth: 1.5, borderColor: 'transparent', ...shadow.card },
  cardOn: { borderColor: C.navy },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: F.heading, fontSize: 16, color: C.white },
  cardTitle: { flex: 1 },
  name: { fontFamily: F.heading, fontSize: 16, lineHeight: 22, color: C.navy },
  product: { fontFamily: F.body, fontSize: 13, color: C.muted, marginTop: 2 },
  verified: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: C.successSoft },
  verifiedText: { fontFamily: F.body, fontSize: 11, fontWeight: '600', color: C.success },
  tick: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 12 },
  metaLabel: { fontFamily: F.body, fontSize: 13, color: C.muted },
  metaValue: { fontFamily: F.body, fontSize: 13, fontWeight: '600', color: C.navy, textAlign: 'right', flexShrink: 1 },
  docs: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  docsText: { fontFamily: F.body, fontSize: 13, color: C.muted },
  why: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.subtle },
  whyText: { fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.navy },
  reason: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginTop: 8 },
  reasonText: { flex: 1, fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.text },
  decision: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: S.lg },
  decisionText: { fontFamily: F.body, fontSize: 12, color: C.muted, flexShrink: 1 },
  footer: { gap: 8 },
  shareNote: { fontFamily: F.body, fontSize: 12, lineHeight: 18, color: C.muted, textAlign: 'center' },
  error: { fontFamily: F.body, fontSize: 12, lineHeight: 18, color: C.error, textAlign: 'center' },
});
