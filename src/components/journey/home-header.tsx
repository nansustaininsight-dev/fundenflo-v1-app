import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { Icon } from '@/components/ui/icon';
import { C, F, S } from '@/constants/brand';
import { firstName, useAppStore } from '@/store/app-store';

export function HomeHeader() {
  const { session, journey } = useAppStore();
  const name = firstName(session?.user);
  const hasUpdate = journey.application?.timeline.some(step => step.state === 'active') === true;

  return (
    <View style={s.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go Back"
        onPress={() => { if (router.canGoBack()) router.back(); }}
        hitSlop={8}
        style={s.back}>
        <Icon name="arrow-back" size={22} color={C.goldDeep} />
      </Pressable>
      <Text style={s.greeting} accessibilityRole="header" numberOfLines={1}>
        {name ? `Namaste, ${name}` : 'Namaste'}
      </Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Notifications" onPress={() => router.push('/notifications')} style={s.iconBtn}>
        <Icon name="notifications" size={22} color={C.navy} />
        {hasUpdate && <View style={s.dot} />}
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Profile" onPress={() => router.push('/profile')} style={s.avatar}>
        <Icon name="person" size={18} color={C.white} />
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  bar: { minHeight: 64, paddingHorizontal: S.margin, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.canvas, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.border },
  back: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  greeting: { flex: 1, fontFamily: F.heading, fontSize: 16, lineHeight: 22, color: C.navy },
  iconBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  dot: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: C.goldDeep, borderWidth: 2, borderColor: C.canvas },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center', marginLeft: 2 },
});
