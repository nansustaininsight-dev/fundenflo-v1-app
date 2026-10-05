import { useRef, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { C } from '@/constants/brand';

type Props = {
  value: number;
  min: number;
  max: number;
  step: number;
  /** Fires continuously while dragging. */
  onChange: (value: number) => void;
  /** Fires once when the drag (or an accessibility increment) ends — persist here. */
  onChangeEnd?: (value: number) => void;
  accessibilityLabel: string;
  formatValue?: (value: number) => string;
};

const THUMB = 22;

/**
 * Lightweight range slider built on the core touch responder (iOS, Android and web,
 * no extra dependency). Holds the touch so a parent ScrollView doesn't steal the drag.
 */
export function Slider({ value, min, max, step, onChange, onChangeEnd, accessibilityLabel, formatValue = String }: Props) {
  const [width, setWidth] = useState(0);
  const drag = useRef({ startX: 0, startPage: 0, last: value });

  function valueAt(x: number) {
    if (!width) return min;
    const raw = min + (Math.min(width, Math.max(0, x)) / width) * (max - min);
    return Math.min(max, Math.max(min, min + Math.round((raw - min) / step) * step));
  }

  function emit(x: number) {
    const v = valueAt(x);
    if (v !== drag.current.last) {
      drag.current.last = v;
      onChange(v);
    }
  }

  function start(e: GestureResponderEvent) {
    drag.current = { startX: e.nativeEvent.locationX, startPage: e.nativeEvent.pageX, last: value };
    emit(drag.current.startX);
  }

  const move = (e: GestureResponderEvent) => emit(drag.current.startX + e.nativeEvent.pageX - drag.current.startPage);
  const end = () => onChangeEnd?.(drag.current.last);

  const ratio = max > min ? (Math.min(max, Math.max(min, value)) - min) / (max - min) : 0;

  function nudge(dir: 1 | -1) {
    const next = Math.min(max, Math.max(min, value + dir * step));
    onChange(next);
    onChangeEnd?.(next);
  }

  return (
    <View
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
      onResponderGrant={start}
      onResponderMove={move}
      onResponderRelease={end}
      onResponderTerminate={end}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={s.hit}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min, max, now: value, text: formatValue(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={e => nudge(e.nativeEvent.actionName === 'increment' ? 1 : -1)}>
      <View style={s.track}>
        <View style={[s.fill, { width: ratio * width }]} />
      </View>
      <View style={[s.thumb, { left: ratio * width - THUMB / 2 }]} />
    </View>
  );
}

const s = StyleSheet.create({
  // Children ignore touches so locationX is always relative to the full track.
  hit: { height: 44, justifyContent: 'center', cursor: 'pointer' },
  track: { height: 8, borderRadius: 4, backgroundColor: '#E5E9EF', overflow: 'hidden', pointerEvents: 'none' },
  fill: { height: '100%', backgroundColor: 'rgba(253, 185, 1, 0.35)' },
  thumb: {
    position: 'absolute', width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: C.gold,
    borderWidth: 3, borderColor: C.white, boxShadow: '0px 2px 6px rgba(10, 25, 47, 0.25)', pointerEvents: 'none',
  },
});
