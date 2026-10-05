import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { C } from '@/constants/brand';

type Props = {
  /** 0–1 */
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
};

/**
 * Circular progress without an SVG dependency: two clipped half-rings rotate into view
 * (first the right half, 12→6 o'clock, then the left half, 6→12 o'clock).
 */
export function ProgressRing({ progress, size = 64, stroke = 5, color = C.gold, track = C.border, children }: Props) {
  const p = useSharedValue(progress);
  useEffect(() => {
    p.value = withTiming(Math.min(1, Math.max(0, progress)), { duration: 500 });
  }, [p, progress]);

  const rightArc = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.min(p.value, 0.5) * 360}deg` }] }));
  const leftArc = useAnimatedStyle(() => ({ transform: [{ rotate: `${Math.max(p.value - 0.5, 0) * 360}deg` }] }));

  const box = { width: size, height: size };
  const half = { width: size / 2, height: size };
  const ring = { ...box, borderRadius: size / 2, borderWidth: stroke };

  return (
    <View style={box}>
      <View style={[StyleSheet.absoluteFill, ring, { borderColor: track }]} />
      {/* Right half: shows a left semicircle as it rotates clockwise into view. */}
      <View style={[s.clip, half, { left: size / 2 }]}>
        <Animated.View style={[box, { left: -size / 2 }, rightArc]}>
          <View style={[s.clip, half]}>
            <View style={[ring, { borderColor: color }]} />
          </View>
        </Animated.View>
      </View>
      {/* Left half: a right semicircle rotating in from 6 o'clock. */}
      <View style={[s.clip, half, { left: 0 }]}>
        <Animated.View style={[box, leftArc]}>
          <View style={[s.clip, half, { left: size / 2 }]}>
            <View style={[ring, { borderColor: color, left: -size / 2 }]} />
          </View>
        </Animated.View>
      </View>
      <View style={[StyleSheet.absoluteFill, s.center]}>{children}</View>
    </View>
  );
}

const s = StyleSheet.create({
  clip: { position: 'absolute', top: 0, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
});
