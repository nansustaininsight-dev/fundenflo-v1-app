import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/ui/icon';
import { useKeyboardHeight } from '@/components/ui/keyboard-scroll';
import { C, F, MAX_WIDTH, R, S } from '@/constants/brand';
import { CITIES } from '@/constants/loan';

type Props = {
  visible: boolean;
  value?: string;
  title: string;
  onSelect: (city: string) => void;
  onClose: () => void;
};

/** Bottom-sheet city search. Unlisted towns can be entered as typed. */
export function CityPicker({ visible, value, title, onSelect, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardHeight();
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const results = q ? CITIES.filter(c => c.toLowerCase().includes(q)) : CITIES;
  const custom = query.trim().replace(/\s+/g, ' ');
  const canUseCustom = custom.length >= 3 && !CITIES.some(c => c.toLowerCase() === q);

  function pick(city: string) {
    onSelect(city);
    setQuery('');
  }

  function close() {
    onClose();
    setQuery('');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <View style={s.flex}>
        <Pressable style={s.backdrop} onPress={close} accessibilityRole="button" accessibilityLabel="Close City Picker" />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, S.md), marginBottom: keyboard, maxHeight: '88%', marginTop: insets.top + 40 }]}>
          <View style={s.grabber} />
          <View style={s.head}>
            <Text style={s.title} accessibilityRole="header">{title}</Text>
            <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={s.close}>
              <Icon name="close" size={20} color={C.text} />
            </Pressable>
          </View>
          <View style={s.search}>
            <Icon name="search" size={18} color={C.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search City"
              placeholderTextColor={C.slate}
              autoCorrect={false}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => { if (results.length === 1) pick(results[0]); else if (canUseCustom && !results.length) pick(custom); }}
              style={s.input}
              accessibilityLabel="Search City"
              maxLength={60}
            />
            {!!query && (
              <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Clear Search">
                <Icon name="close" size={16} color={C.muted} />
              </Pressable>
            )}
          </View>
          <FlatList
            data={results}
            keyExtractor={c => c}
            keyboardShouldPersistTaps="handled"
            style={s.list}
            ListHeaderComponent={canUseCustom ? (
              <Pressable onPress={() => pick(custom)} style={({ pressed }) => [s.row, pressed && s.rowPressed]} accessibilityRole="button">
                <Icon name="location" size={18} color={C.goldDeep} />
                <Text style={s.rowText} numberOfLines={1}>Use “{custom}”</Text>
              </Pressable>
            ) : null}
            ListEmptyComponent={!canUseCustom ? <Text style={s.empty}>Type At Least 3 Letters To Use Your Town.</Text> : null}
            renderItem={({ item }) => {
              const on = item === value;
              return (
                <Pressable
                  onPress={() => pick(item)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  aria-checked={on}
                  style={({ pressed }) => [s.row, pressed && s.rowPressed]}>
                  <Icon name="location" size={18} color={on ? C.navy : C.slate} />
                  <Text style={[s.rowText, on && s.rowTextOn]} numberOfLines={1}>{item}</Text>
                  {on && <Icon name="check" size={16} color={C.goldDeep} />}
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 25, 47, 0.45)' },
  sheet: {
    width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flexShrink: 1, backgroundColor: C.card,
    borderTopLeftRadius: R.sheet, borderTopRightRadius: R.sheet, paddingHorizontal: S.margin,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginTop: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.sm, minHeight: 44 },
  title: { fontFamily: F.heading, fontSize: 18, color: C.text },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, paddingHorizontal: 14, borderRadius: R.field, backgroundColor: C.fieldBg, marginTop: S.sm },
  input: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.text, paddingVertical: 10 },
  list: { marginTop: S.sm, flexGrow: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 50, paddingHorizontal: 6, borderRadius: R.chip },
  rowPressed: { backgroundColor: C.subtle },
  rowText: { flex: 1, fontFamily: F.body, fontSize: 15, color: C.text },
  rowTextOn: { fontWeight: '600', color: C.navy },
  empty: { fontFamily: F.body, fontSize: 13, color: C.muted, textAlign: 'center', paddingVertical: S.lg },
});
