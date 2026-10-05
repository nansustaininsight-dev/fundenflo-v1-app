import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { C, F, R } from '@/constants/brand';

type Props = {
  onContinue: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Why Continue is disabled (shown muted above the button). */
  hint?: string | null;
  /** Submit failure (shown in red above the button). */
  error?: string | null;
  label?: string;
  icon?: IconName;
  /** Footer note under the button. */
  note?: string;
};

/** Pinned CTA bar for journey screens: hint / error + Continue + encryption note. */
export function JourneyFooter({ onContinue, disabled, loading, hint, error, label = 'Continue', icon = 'arrow-forward', note = '256-Bit Bank-Grade Encryption Guaranteed' }: Props) {
  return (
    <>
      {error ? (
        <Animated.View entering={FadeIn} style={s.error} accessibilityLiveRegion="polite">
          <Icon name="error" size={15} color={C.error} />
          <Text style={s.errorText}>{error}</Text>
        </Animated.View>
      ) : hint && disabled ? (
        <Text style={s.hint} accessibilityLiveRegion="polite">{hint}</Text>
      ) : null}
      <Button label={label} icon={icon} onPress={onContinue} disabled={disabled} loading={loading} />
      <View style={s.secure}>
        <Icon name="lock" size={13} color={C.muted} />
        <Text style={s.secureText}>{note}</Text>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  hint: { fontFamily: F.body, fontSize: 12, color: C.muted, textAlign: 'center', marginBottom: 10 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, padding: 10, borderRadius: R.chip, backgroundColor: '#FFF1EF' },
  errorText: { fontFamily: F.body, fontSize: 12, color: C.error, flexShrink: 1 },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  secureText: { fontFamily: F.body, fontSize: 11, fontWeight: '600', color: C.muted },
});
