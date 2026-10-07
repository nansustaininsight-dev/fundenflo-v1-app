import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';

import { Icon, type IconName } from '@/components/ui/icon';
import { C, F, R, S, shadow } from '@/constants/brand';
import type { DocumentSource, DocumentSpec } from '@/constants/documents';
import type { UploadedDocument } from '@/store/app-store';

export type Slot =
  | { kind: 'empty' }
  | { kind: 'uploading'; fileName: string; progress: number }
  | { kind: 'reading'; fileName: string }
  | { kind: 'verified'; doc: UploadedDocument }
  | { kind: 'failed'; error: string };

const SOURCES: Record<DocumentSource, { label: string; icon: IconName }> = {
  digilocker: { label: 'DigiLocker', icon: 'verified' },
  upload: { label: 'Upload PDF', icon: 'upload' },
  scan: { label: 'Scan', icon: 'scan' },
};

const formatSize = (bytes: number) => (bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

type Props = {
  spec: DocumentSpec;
  slot: Slot;
  onPick: (source: DocumentSource) => void;
  onCancel: () => void;
  onRemove: () => void;
  locked?: boolean;
};

/** One checklist row: pending → uploading % → reading with AI → verified (or failed + retry). */
export function DocumentCard({ spec, slot, onPick, onCancel, onRemove, locked }: Props) {
  const busy = slot.kind === 'uploading' || slot.kind === 'reading';
  return (
    <Animated.View layout={LinearTransition.duration(200)} style={s.card} accessibilityLabel={`${spec.title}${spec.required ? '' : ', Optional'}`}>
      <View style={s.row}>
        <View style={[s.iconBox, slot.kind === 'verified' && s.iconBoxDone]}>
          <Icon name={spec.icon} size={22} color={C.navy} />
        </View>
        <View style={s.text}>
          <Text style={s.title}>{spec.title}</Text>
          {slot.kind === 'verified' ? (
            <View style={s.statusRow}>
              <Icon name="check-circle" size={15} color={C.success} />
              <Text style={s.verified}>Verified • Read By AI</Text>
            </View>
          ) : slot.kind === 'reading' ? (
            <Text style={s.sub} numberOfLines={1}>Reading {slot.fileName}…</Text>
          ) : (
            <Text style={s.sub}>{spec.sub}</Text>
          )}
        </View>
        <Badge slot={slot} required={spec.required} />
      </View>

      {slot.kind === 'uploading' && (
        <View style={s.progressWrap}>
          <View style={s.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: slot.progress }}>
            <View style={[s.fill, { width: `${slot.progress}%` }]} />
          </View>
          <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Cancel ${spec.title} Upload`} style={s.link}>
            <Text style={s.linkText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {slot.kind === 'verified' && (
        <View style={s.fileRow}>
          <Icon name="document" size={14} color={C.muted} />
          <Text style={s.fileName} numberOfLines={1}>{slot.doc.fileName} · {formatSize(slot.doc.size)}</Text>
          {!locked && (
            <Pressable onPress={onRemove} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Remove ${spec.title}`} style={s.link}>
              <Icon name="delete" size={15} color={C.muted} />
              <Text style={s.linkMuted}>Remove</Text>
            </Pressable>
          )}
        </View>
      )}

      {slot.kind === 'failed' && (
        <Animated.View entering={FadeIn} style={s.error} accessibilityLiveRegion="polite">
          <Icon name="error" size={15} color={C.error} />
          <Text style={s.errorText}>{slot.error}</Text>
        </Animated.View>
      )}

      {(slot.kind === 'empty' || slot.kind === 'failed') && (
        <View style={s.sources}>
          {spec.sources.map(src => {
            const soon = src === 'digilocker';
            const label = SOURCES[src].label;
            return (
              <Pressable
                key={src}
                onPress={() => onPick(src)}
                disabled={soon || locked || busy}
                accessibilityRole="button"
                accessibilityLabel={`${label}${soon ? ', Coming Soon' : ''} — ${spec.title}`}
                accessibilityState={{ disabled: soon || locked }}
                style={({ pressed }) => [s.source, pressed && s.sourcePressed, soon && s.sourceSoon]}>
                <Icon name={SOURCES[src].icon} size={17} color={soon ? C.slate : C.navy} />
                <Text style={[s.sourceText, soon && s.sourceTextSoon]} numberOfLines={1}>{label}</Text>
                {soon && <Text style={s.soon}>Soon</Text>}
              </Pressable>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
}

function Badge({ slot, required }: { slot: Slot; required: boolean }) {
  switch (slot.kind) {
    case 'verified':
      return slot.doc.summary ? <Text style={[s.badge, s.badgeMono]}>{slot.doc.summary}</Text> : null;
    case 'uploading':
      return <Text style={[s.badge, s.badgeActive]}>Uploading {slot.progress}%</Text>;
    case 'reading':
      return <ActivityIndicator size="small" color={C.goldDeep} accessibilityLabel="Reading Document" />;
    case 'failed':
      return <Text style={[s.badge, s.badgeError]}>FAILED</Text>;
    default:
      return <Text style={s.badge}>{required ? 'PENDING' : 'OPTIONAL'}</Text>;
  }
}

const s = StyleSheet.create({
  card: { padding: S.md + 4, borderRadius: R.card, backgroundColor: C.card, gap: 14, ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center' },
  iconBoxDone: { backgroundColor: C.successSoft },
  text: { flex: 1, minWidth: 0, paddingTop: 2 },
  title: { fontFamily: F.heading, fontSize: 17, lineHeight: 24, color: C.text },
  sub: { fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.muted, marginTop: 2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  verified: { fontFamily: F.body, fontSize: 13, fontWeight: '600', color: C.success },
  badge: {
    fontFamily: F.body, fontSize: 11, fontWeight: '600', letterSpacing: 0.6, color: C.muted, backgroundColor: C.subtle,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: R.chip, overflow: 'hidden', marginTop: 2,
  },
  badgeActive: { color: C.navy, letterSpacing: 0.2 },
  badgeMono: { color: C.navy, letterSpacing: 1, fontWeight: '700' },
  badgeError: { color: C.error, backgroundColor: '#FFF1EF' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: C.subtle, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: C.gold },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 },
  linkText: { fontFamily: F.body, fontSize: 12, fontWeight: '600', color: C.navy },
  linkMuted: { fontFamily: F.body, fontSize: 12, fontWeight: '500', color: C.muted },
  fileRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 62 },
  fileName: { flex: 1, fontFamily: F.body, fontSize: 12, color: C.muted },
  error: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: R.chip, backgroundColor: '#FFF1EF' },
  errorText: { flex: 1, fontFamily: F.body, fontSize: 12, lineHeight: 17, color: C.error },
  sources: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  source: {
    flexGrow: 1, flexBasis: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    minHeight: 46, paddingHorizontal: 10, borderRadius: R.button, backgroundColor: C.subtle,
  },
  sourcePressed: { backgroundColor: C.border },
  sourceSoon: { opacity: 0.7 },
  sourceText: { fontFamily: F.body, fontSize: 13, fontWeight: '600', color: C.navy, flexShrink: 1 },
  sourceTextSoon: { color: C.slate },
  soon: { fontFamily: F.body, fontSize: 9, fontWeight: '700', color: C.goldDeep, textTransform: 'uppercase' },
});
