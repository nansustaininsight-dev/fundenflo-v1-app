import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming, ZoomIn } from 'react-native-reanimated';
import { Redirect, router } from 'expo-router';

import { Eyebrow } from '@/components/journey/eyebrow';
import { JourneyFooter } from '@/components/journey/journey-footer';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { CATEGORIES, type LoanCategoryId } from '@/constants/loan';
import { ApiError } from '@/services/api';
import { getLoanCategories, type CategoryAvailability } from '@/services/loan';
import { useAppStore } from '@/store/app-store';

export default function LoanCategoryScreen() {
  const { journey, updateJourney } = useAppStore();
  const entityType = journey.entityType;
  const [items, setItems] = useState<CategoryAvailability[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!entityType) return;
    let active = true;
    getLoanCategories(entityType).then(
      res => { if (active) setItems(res); },
      e => { if (active) setError(e instanceof ApiError ? e.message : 'Could not load loan categories. Please try again.'); },
    );
    return () => { active = false; };
  }, [entityType, attempt]);

  function retry() {
    setError(null);
    setItems(null);
    setAttempt(a => a + 1);
  }

  if (!entityType) return <Redirect href="/entity-type" />;

  // A saved category only counts if it is offered (and available) for this entity type.
  const selected = items?.find(i => i.id === journey.loanCategory && i.available)?.id;

  function select(id: LoanCategoryId) {
    void updateJourney({ loanCategory: id });
  }

  return (
    <Screen
      header={<StepHeader step={2} />}
      footer={<JourneyFooter onContinue={() => router.push('/loan-amount')} disabled={!selected} hint={items ? 'Select a loan category to continue.' : null} />}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Eyebrow label="Loan requirement • 1 of 3" />
        <Text style={s.title} accessibilityRole="header">What do you need funding for?</Text>
        <Text style={s.sub}>Select the primary purpose for your loan requirement.</Text>
      </Animated.View>

      {error ? (
        <Animated.View entering={FadeIn} style={s.errorCard}>
          <Icon name="error" size={22} color={C.error} />
          <Text style={s.errorText}>{error}</Text>
          <Button label="Try again" variant="ghost" icon="refresh" onPress={retry} style={s.retry} />
        </Animated.View>
      ) : !items ? (
        <View style={s.grid} accessibilityLabel="Loading loan categories" accessibilityState={{ busy: true }}>
          {Array.from({ length: entityType === 'msme' ? 8 : 4 }, (_, i) => <SkeletonTile key={i} />)}
        </View>
      ) : (
        <View style={s.grid} accessibilityRole="radiogroup" accessibilityLabel="Loan category">
          {items.map((item, i) => {
            const cat = CATEGORIES[item.id];
            if (!cat) return null;
            const on = selected === item.id;
            return (
              <Animated.View key={item.id} entering={FadeInDown.delay(40 * i).duration(320)} style={s.cell}>
                {item.available ? (
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    accessibilityLabel={cat.title}
                    onPress={() => select(item.id)}
                    style={({ pressed }) => [s.tile, on && s.tileOn, pressed && s.pressed]}>
                    <View style={s.tileTop}>
                      <View style={[s.iconBox, on && s.iconBoxOn]}>
                        <Icon name={cat.icon} size={18} color={on ? C.white : C.navy} />
                      </View>
                      {on && (
                        <Animated.View entering={ZoomIn.duration(180)} style={s.check}>
                          <Icon name="check" size={13} color={C.navy} />
                        </Animated.View>
                      )}
                    </View>
                    <Text style={[s.tileTitle, on && s.tileTitleOn]}>{cat.title}</Text>
                  </Pressable>
                ) : (
                  <View style={[s.tile, s.tileOff]} accessible accessibilityLabel={`${cat.title}. Unavailable. ${item.reason ?? ''}`} accessibilityState={{ disabled: true }}>
                    <View style={s.tileTop}>
                      <View style={[s.iconBox, s.iconBoxOff]}>
                        <Icon name={cat.icon} size={18} color={C.slate} />
                      </View>
                      <Text style={s.badge}>Unavailable</Text>
                    </View>
                    <View>
                      <Text style={[s.tileTitle, s.tileTitleOff]}>{cat.title}</Text>
                      {item.reason && <Text style={s.reason}>{item.reason}</Text>}
                    </View>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>
      )}

      {items && (
        <View style={s.hint}>
          <Icon name="info" size={15} color={C.muted} />
          <Text style={s.hintText}>We only list categories where verified lender routes exist.</Text>
        </View>
      )}
    </Screen>
  );
}

function SkeletonTile() {
  const o = useSharedValue(0.5);
  useEffect(() => { o.value = withRepeat(withTiming(1, { duration: 700 }), -1, true); }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[s.cell, s.tile, s.skeleton, style]} />;
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 24, lineHeight: 32, letterSpacing: -0.3, color: C.text },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.muted, marginTop: S.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: S.lg },
  cell: { flexBasis: '40%', flexGrow: 1 },
  tile: { minHeight: 118, padding: 14, borderRadius: R.card, backgroundColor: C.card, justifyContent: 'space-between', gap: 14, ...shadow.card },
  tileOn: { backgroundColor: C.canvas, borderWidth: 1, borderColor: C.border, boxShadow: '0px 4px 14px -2px rgba(10, 25, 47, 0.12)' },
  tileOff: { backgroundColor: C.subtle, boxShadow: 'none' },
  pressed: { transform: [{ scale: 0.98 }] },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  iconBox: { width: 34, height: 34, borderRadius: 8, backgroundColor: C.subtle, alignItems: 'center', justifyContent: 'center' },
  iconBoxOn: { backgroundColor: C.navy },
  iconBoxOff: { backgroundColor: '#E6EBF1' },
  check: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  tileTitle: { fontFamily: F.body, fontSize: 15, fontWeight: '500', lineHeight: 20, color: C.text },
  tileTitleOn: { fontWeight: '600', color: C.navy },
  tileTitleOff: { color: C.slate },
  reason: { fontFamily: F.body, fontSize: 11, lineHeight: 15, color: C.slate, marginTop: 2 },
  badge: { fontFamily: F.body, fontSize: 10, fontWeight: '600', color: C.muted, backgroundColor: '#E6EBF1', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  skeleton: { backgroundColor: '#E9EEF4', boxShadow: 'none' },
  errorCard: { marginTop: S.lg, padding: S.lg, borderRadius: R.card, backgroundColor: C.card, alignItems: 'center', gap: S.sm, ...shadow.card },
  errorText: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.text, textAlign: 'center' },
  retry: { marginTop: S.sm, alignSelf: 'stretch' },
  hint: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.md, paddingHorizontal: 4 },
  hintText: { fontFamily: F.body, fontSize: 12, color: C.muted, flexShrink: 1 },
});
