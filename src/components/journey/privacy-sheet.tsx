import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { C, F, MAX_WIDTH, R, S } from '@/constants/brand';
import { CONSENT_ITEMS, PRIVACY_POLICY_URL } from '@/constants/consent';

/** Plain-language summary of each consent, plus the full policy link when configured. */
export function PrivacySheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={s.root}>
        <Pressable style={s.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close privacy summary" />
        <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, S.md), marginTop: insets.top + 40 }]}>
          <View style={s.grabber} />
          <View style={s.head}>
            <Text style={s.title} accessibilityRole="header">How we use your data</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Close" style={s.close}>
              <Icon name="close" size={20} color={C.text} />
            </Pressable>
          </View>
          <ScrollView style={s.scroll} contentContainerStyle={s.body} showsVerticalScrollIndicator={false}>
            {CONSENT_ITEMS.map(item => (
              <View key={item.id} style={s.item}>
                <View style={s.itemHead}>
                  <Text style={s.itemTitle}>{item.title}</Text>
                  <Text style={[s.badge, item.required && s.badgeRequired]}>{item.required ? 'Required' : 'Optional'}</Text>
                </View>
                <Text style={s.itemText}>{item.details}</Text>
              </View>
            ))}
            <View style={s.note}>
              <Icon name="shield" size={16} color={C.navy} />
              <Text style={s.noteText}>Nothing is processed for an item you keep off. You can change or withdraw any consent later by returning to this step.</Text>
            </View>
          </ScrollView>
          {PRIVACY_POLICY_URL ? (
            <Button label="Open full privacy policy" variant="ghost" icon="arrow-forward" onPress={() => void WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)} style={s.cta} />
          ) : (
            <Button label="Got it" onPress={onClose} style={s.cta} />
          )}
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(10, 25, 47, 0.45)' },
  sheet: {
    width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', flexShrink: 1, backgroundColor: C.card,
    borderTopLeftRadius: R.sheet, borderTopRightRadius: R.sheet, paddingHorizontal: S.margin,
  },
  grabber: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: C.border, marginTop: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: S.sm, minHeight: 44 },
  title: { fontFamily: F.heading, fontSize: 18, color: C.text },
  close: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginRight: -8 },
  scroll: { flexGrow: 0, flexShrink: 1 },
  body: { gap: S.md, paddingVertical: S.sm },
  item: { gap: 6 },
  itemHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemTitle: { flex: 1, fontFamily: F.body, fontSize: 14, fontWeight: '600', color: C.text },
  badge: { fontFamily: F.body, fontSize: 10, fontWeight: '600', color: C.muted, backgroundColor: C.subtle, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  badgeRequired: { color: C.navy, backgroundColor: C.goldSoft },
  itemText: { fontFamily: F.body, fontSize: 13, lineHeight: 20, color: C.muted },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 12, borderRadius: R.field, backgroundColor: C.subtle },
  noteText: { flex: 1, fontFamily: F.body, fontSize: 12, lineHeight: 18, color: C.muted },
  cta: { marginTop: S.md },
});
