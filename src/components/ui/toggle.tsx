import { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { C } from '@/constants/brand';

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
  disabled?: boolean;
};

const W = 48;
const H = 28;
const KNOB = 22;

/** Navy on/off switch from the design system (same look on iOS, Android and web). */
export function Toggle({ value, onChange, accessibilityLabel, disabled }: Props) {
  const p = useSharedValue(value ? 1 : 0);
  useEffect(() => { p.value = withTiming(value ? 1 : 0, { duration: 180 }); }, [value, p]);

  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], ['#E1E2E5', C.navy]) }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * (W - KNOB - 6) }] }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      aria-checked={value}
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={8}
      onPress={() => onChange(!value)}>
      <Animated.View style={[s.track, track, disabled && s.disabled]}>
        <Animated.View style={[s.knob, knob]} />
      </Animated.View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  track: { width: W, height: H, borderRadius: H / 2, padding: 3, justifyContent: 'center' },
  knob: { width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: C.white, boxShadow: '0px 1px 3px rgba(10, 25, 47, 0.25)' },
  disabled: { opacity: 0.5 },
});
