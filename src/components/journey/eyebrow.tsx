import { StyleSheet, Text, View } from 'react-native';

import { C, F } from '@/constants/brand';

/** Gold dot + uppercase context line ("Assessment • Step 3 of 6"). */
export function Eyebrow({ label }: { label: string }) {
  return (
    <View style={s.row}>
      <View style={s.dot} />
      <Text style={s.text}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.gold },
  text: { fontFamily: F.body, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase', color: C.muted },
});
