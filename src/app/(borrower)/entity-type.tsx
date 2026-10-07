import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { router } from 'expo-router';

import { Button } from '@/components/ui/button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { useAppStore, type EntityType } from '@/store/app-store';

const OPTIONS: { id: EntityType; title: string; sub: string; icon: IconName }[] = [
  { id: 'msme', title: 'Business / MSME', sub: 'Proprietor, Partnership, LLP Or Pvt Ltd', icon: 'business' },
  { id: 'individual', title: 'Individual', sub: 'Salaried Or Self-Employed', icon: 'person' },
];

export default function EntityTypeScreen() {
  const { journey, updateJourney, signOut } = useAppStore();
  const [selected, setSelected] = useState<EntityType | undefined>(journey.entityType);

  async function next() {
    if (!selected) return;
    await updateJourney({ entityType: selected });
    router.push('/loan-category');
  }

  async function logout() {
    await signOut();
    router.replace('/login');
  }

  return (
    <Screen
      header={<StepHeader step={1} hideBack />}
      footer={<>
        <Button label="Continue" icon="arrow-forward" onPress={() => void next()} disabled={!selected} />
        <View style={s.secure}>
          <Icon name="lock" size={13} color={C.muted} />
          <Text style={s.secureText}>256-Bit Bank Grade Encryption</Text>
        </View>
      </>}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Text style={s.title} accessibilityRole="header">Who Is This Loan For?</Text>
        <Text style={s.sub}>Select Your Entity Type To Personalize Documentation And Matching Lenders.</Text>
      </Animated.View>

      <View style={s.list} accessibilityRole="radiogroup">
        {OPTIONS.map((o, i) => {
          const on = selected === o.id;
          return (
            <Animated.View key={o.id} entering={FadeInDown.delay(100 + i * 80).duration(400)}>
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={`${o.title}. ${o.sub}`}
                onPress={() => setSelected(o.id)}
                style={({ pressed }) => [s.card, on && s.cardOn, pressed && { transform: [{ scale: 0.99 }] }]}>
                <View style={[s.iconTile, on && s.iconTileOn]}>
                  <Icon name={o.icon} size={22} color={C.navy} />
                </View>
                <View style={s.cardText}>
                  <Text style={s.cardTitle}>{o.title}</Text>
                  <Text style={s.cardSub}>{o.sub}</Text>
                </View>
                {on ? (
                  <Animated.View entering={ZoomIn.duration(200)} style={s.radioOn}><Icon name="check" size={14} color={C.white} /></Animated.View>
                ) : <View style={s.radio} />}
              </Pressable>
            </Animated.View>
          );
        })}
      </View>

      <View style={s.hint}>
        <Icon name="info" size={15} color={C.muted} />
        <Text style={s.hintText}>Your Checklist And Assessment Adapt To This Choice.</Text>
      </View>

      <View style={s.grow} />
      <Pressable accessibilityRole="button" onPress={() => void logout()} hitSlop={8} style={s.logout}>
        <Text style={s.logoutText}>Not You? Log Out</Text>
      </Pressable>
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 24, lineHeight: 32, letterSpacing: -0.3, color: C.text },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.muted, marginTop: S.sm },
  list: { gap: 12, marginTop: S.lg },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 20, borderRadius: R.card, backgroundColor: C.card, borderWidth: 1.5, borderColor: 'transparent', ...shadow.card },
  cardOn: { backgroundColor: C.subtle, borderColor: C.border },
  iconTile: { width: 48, height: 48, borderRadius: 10, backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center' },
  iconTileOn: { backgroundColor: C.card },
  cardText: { flex: 1 },
  cardTitle: { fontFamily: F.heading, fontSize: 16, color: C.text },
  cardSub: { fontFamily: F.body, fontSize: 12, lineHeight: 18, color: C.muted, marginTop: 2 },
  radio: { width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: C.border },
  radioOn: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.goldDeep, alignItems: 'center', justifyContent: 'center' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.md, paddingHorizontal: 4 },
  hintText: { fontFamily: F.body, fontSize: 12, color: C.muted, flexShrink: 1 },
  grow: { flexGrow: 1, minHeight: S.lg },
  logout: { alignSelf: 'center', minHeight: 40, justifyContent: 'center' },
  logoutText: { fontFamily: F.body, fontSize: 12, color: C.muted, textDecorationLine: 'underline' },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12 },
  secureText: { fontFamily: F.body, fontSize: 11, fontWeight: '600', color: C.muted },
});
