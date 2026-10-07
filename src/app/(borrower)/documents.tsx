import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Redirect, router } from 'expo-router';

import { DocumentCard, type Slot } from '@/components/journey/document-card';
import { JourneyFooter } from '@/components/journey/journey-footer';
import { Icon } from '@/components/ui/icon';
import { ProgressRing } from '@/components/ui/progress-ring';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { CONSENT_VERSION } from '@/constants/consent';
import { ACCEPTED_LABEL, documentsFor, type DocumentId, type DocumentSource, type DocumentSpec } from '@/constants/documents';
import { ApiError } from '@/services/api';
import { deleteDocument, startAnalysis, uploadDocument, validateFile, waitForDocument } from '@/services/documents';
import { pickFile, scanWithCamera } from '@/services/file-pick';
import { useAppStore } from '@/store/app-store';

/** Step 5 — upload the documents the Financial Health Score is calculated from. */
export default function DocumentsScreen() {
  const { journey, updateJourney } = useAppStore();
  // In-flight states (uploading / reading / failed). Verified documents live in the journey.
  const [transient, setTransient] = useState<Partial<Record<DocumentId, Slot>>>({});
  const jobs = useRef<Partial<Record<DocumentId, AbortController>>>({});
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Leaving the screen cancels uploads that have not finished.
  useEffect(() => {
    const running = jobs.current;
    return () => Object.values(running).forEach(c => c?.abort());
  }, []);

  const consent = journey.consent?.version === CONSENT_VERSION ? journey.consent : undefined;
  // AI reading is only allowed with the required consent on record.
  if (!consent?.items.aiDocuments?.granted) return <Redirect href="/consent" />;
  if (!journey.entityType) return <Redirect href="/entity-type" />;

  const specs = documentsFor(journey.entityType, journey.loanCategory, journey.preCheck);
  const required = specs.filter(d => d.required);
  const optional = specs.filter(d => !d.required);

  const slotFor = (id: DocumentId): Slot => {
    const doc = journey.documents?.[id];
    return transient[id] ?? (doc ? { kind: 'verified', doc } : { kind: 'empty' });
  };
  const setSlot = (id: DocumentId, slot: Slot | undefined) =>
    setTransient(prev => {
      const next = { ...prev };
      if (slot) next[id] = slot;
      else delete next[id];
      return next;
    });

  const ready = required.filter(d => slotFor(d.id).kind === 'verified').length;
  const busy = specs.some(d => ['uploading', 'reading'].includes(slotFor(d.id).kind));
  const missing = required.filter(d => slotFor(d.id).kind !== 'verified');
  const hint = busy
    ? 'Hang On — We’re Still Reading Your Documents.'
    : missing.length
      ? `Add Your ${joinTitles(missing.map(d => d.title))} To Continue.`
      : null;

  async function pick(spec: DocumentSpec, source: DocumentSource) {
    if (source === 'digilocker') return;
    setError(null);
    let file;
    try {
      file = source === 'scan' ? await scanWithCamera() : await pickFile();
    } catch (e) {
      setSlot(spec.id, { kind: 'failed', error: e instanceof ApiError ? e.message : 'Could Not Open The Picker. Please Try Again.' });
      return;
    }
    if (!file) return;
    const invalid = validateFile(file);
    if (invalid) {
      setSlot(spec.id, { kind: 'failed', error: invalid });
      return;
    }

    const ctrl = new AbortController();
    jobs.current[spec.id] = ctrl;
    setSlot(spec.id, { kind: 'uploading', fileName: file.name, progress: 0 });
    try {
      const { id } = await uploadDocument(spec.id, file, progress => {
        if (!ctrl.signal.aborted) setSlot(spec.id, { kind: 'uploading', fileName: file.name, progress });
      }, ctrl.signal);
      setSlot(spec.id, { kind: 'reading', fileName: file.name });
      const res = await waitForDocument(id, ctrl.signal);
      if (res.status === 'rejected') {
        setSlot(spec.id, { kind: 'failed', error: res.reason });
        return;
      }
      const doc = { id, fileName: file.name, size: file.size ?? 0, uploadedAt: new Date().toISOString(), summary: res.summary };
      await updateJourney(prev => ({ documents: { ...prev.documents, [spec.id]: doc } }));
      setSlot(spec.id, undefined);
    } catch (e) {
      if (e instanceof ApiError && e.code === 'ABORTED') setSlot(spec.id, undefined);
      else setSlot(spec.id, { kind: 'failed', error: e instanceof ApiError ? e.message : 'Upload Failed. Please Try Again.' });
    } finally {
      if (jobs.current[spec.id] === ctrl) delete jobs.current[spec.id];
    }
  }

  function remove(spec: DocumentSpec) {
    const doc = journey.documents?.[spec.id];
    if (doc) void deleteDocument(doc.id);
    void updateJourney(prev => {
      const documents = { ...prev.documents };
      delete documents[spec.id];
      return { documents };
    });
  }

  async function getScore() {
    if (missing.length || busy || starting) return;
    const docIds = specs.map(d => journey.documents?.[d.id]?.id).filter((id): id is string => !!id);
    const fingerprint = docIds.join(',');
    // Same documents as the last run → resume it instead of starting over.
    if (journey.analysis?.fingerprint === fingerprint && journey.analysis.status !== 'failed') {
      router.push('/analysing');
      return;
    }
    setStarting(true);
    setError(null);
    try {
      const { id } = await startAnalysis(docIds, journey.entityType!);
      await updateJourney({ analysis: { id, fingerprint, startedAt: new Date().toISOString(), status: 'running' } });
      router.push('/analysing');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could Not Start Reading Your Documents. Please Try Again.');
    } finally {
      setStarting(false);
    }
  }

  const card = (spec: DocumentSpec, i: number) => (
    <Animated.View key={spec.id} entering={FadeInDown.delay(80 + i * 60).duration(360)}>
      <DocumentCard
        spec={spec}
        slot={slotFor(spec.id)}
        onPick={src => void pick(spec, src)}
        onCancel={() => jobs.current[spec.id]?.abort()}
        onRemove={() => remove(spec)}
        locked={starting}
      />
    </Animated.View>
  );

  return (
    <Screen
      header={<StepHeader step={5} />}
      footer={
        <JourneyFooter
          onContinue={() => void getScore()}
          disabled={missing.length > 0 || busy}
          loading={starting}
          hint={hint}
          error={error}
          label="Get My Health Score"
          note="Private • Never Shared Without Your Consent"
        />
      }>
      <Animated.View entering={FadeInDown.duration(400)} style={s.top}>
        <View style={s.topText}>
          <Text style={s.title} accessibilityRole="header">Unlock Your Score With Just {required.length} Documents</Text>
          <Text style={s.sub}>Takes About 2 Minutes. You Can Add More Documents Later.</Text>
        </View>
        <View style={s.readyCard} accessible accessibilityLabel={`${ready} Of ${required.length} Documents Ready`}>
          <ProgressRing progress={ready / required.length} size={60} stroke={5}>
            <Text style={s.readyCount}>{ready}/{required.length}</Text>
          </ProgressRing>
          <Text style={s.readyLabel}>Ready</Text>
        </View>
      </Animated.View>

      <View style={s.list}>{required.map(card)}</View>

      {optional.length > 0 && (
        <>
          <Text style={s.section}>Optional · Lenders Usually Ask For This</Text>
          <View style={s.list}>{optional.map((d, i) => card(d, required.length + i))}</View>
        </>
      )}

      <Text style={s.formats}>{ACCEPTED_LABEL}</Text>

      <View style={s.why}>
        <View style={s.whyHead}>
          <Icon name="info" size={18} color={C.navy} />
          <Text style={s.whyTitle}>Why These {required.length}?</Text>
        </View>
        <Text style={s.whyText}>
          They Let Us Calculate Your 0–100 Financial Health Score And Find Verified Lenders That Fit. Lenders Make The Final Credit Decision.
        </Text>
      </View>
    </Screen>
  );
}

function joinTitles(titles: string[]) {
  return titles.length <= 1 ? titles.join('') : `${titles.slice(0, -1).join(', ')} And ${titles[titles.length - 1]}`;
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: S.md },
  topText: { flex: 1 },
  title: { fontFamily: F.heading, fontSize: 26, lineHeight: 34, letterSpacing: -0.3, color: C.navy },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.muted, marginTop: 8 },
  readyCard: { alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 14, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  readyCount: { fontFamily: F.heading, fontSize: 16, color: C.navy },
  readyLabel: { fontFamily: F.body, fontSize: 12, color: C.muted },
  list: { gap: 14, marginTop: S.lg },
  section: { fontFamily: F.body, fontSize: 12, fontWeight: '600', letterSpacing: 0.4, color: C.muted, marginTop: S.lg, marginBottom: -S.sm },
  formats: { fontFamily: F.body, fontSize: 12, color: C.muted, textAlign: 'center', marginTop: S.md },
  why: { marginTop: S.lg, padding: S.md + 4, borderRadius: R.card, backgroundColor: C.subtle, gap: 8 },
  whyHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  whyTitle: { fontFamily: F.heading, fontSize: 17, color: C.navy },
  whyText: { fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.muted },
});
