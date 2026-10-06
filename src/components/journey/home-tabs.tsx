import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, type Href } from 'expo-router';

import { Icon, type IconName } from '@/components/ui/icon';
import { C, F } from '@/constants/brand';

type TabId = 'home' | 'applications' | 'documents' | 'profile';

const TABS: { id: TabId; label: string; icon: IconName; href: Href; push: boolean }[] = [
  { id: 'home', label: 'Home', icon: 'tab-home', href: '/home', push: false },
  { id: 'applications', label: 'Applications', icon: 'assignment', href: '/application', push: true },
  { id: 'documents', label: 'Documents', icon: 'folder', href: '/documents', push: true },
  { id: 'profile', label: 'Profile', icon: 'account', href: '/profile', push: false },
];

export function HomeTabs({ active }: { active: TabId }) {
  const insets = useSafeAreaInsets();

  function open(tab: (typeof TABS)[number]) {
    if (tab.id === active) return;
    if (tab.push) router.push(tab.href);
    else router.replace(tab.href);
  }

  return (
    <View style={[s.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map(tab => {
        const selected = tab.id === active;
        const color = selected ? C.navy : C.muted;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={tab.label}
            onPress={() => open(tab)}
            style={s.tab}>
            <Icon name={tab.icon} size={22} color={color} />
            <Text style={[s.label, selected && s.labelOn]}>{tab.label}</Text>
            <View style={[s.dot, selected && s.dotOn]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', minHeight: 64, paddingTop: 8, backgroundColor: C.card, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.border },
  tab: { minWidth: 64, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: F.body, fontSize: 11, lineHeight: 14, color: C.muted, marginTop: 2 },
  labelOn: { color: C.navy, fontWeight: '600' },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 4, backgroundColor: 'transparent' },
  dotOn: { backgroundColor: C.goldDeep },
});
