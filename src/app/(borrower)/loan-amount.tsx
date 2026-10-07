import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Redirect, router } from 'expo-router';

import { ChoiceChip } from '@/components/journey/choice-chip';
import { CityPicker } from '@/components/journey/city-picker';
import { Eyebrow } from '@/components/journey/eyebrow';
import { JourneyFooter } from '@/components/journey/journey-footer';
import { Icon } from '@/components/ui/icon';
import { Screen } from '@/components/ui/screen';
import { Slider } from '@/components/ui/slider';
import { StepHeader } from '@/components/ui/step-header';
import { C, F, R, S, shadow } from '@/constants/brand';
import { CATEGORIES, clamp, estimateEmi, formatINR, formatShortINR, formatTenure, groupINR } from '@/constants/loan';
import { useAppStore } from '@/store/app-store';

export default function LoanAmountScreen() {
  const { journey, updateJourney } = useAppStore();
  const cat = journey.loanCategory ? CATEGORIES[journey.loanCategory] : undefined;

  const [amount, setAmount] = useState(() => (cat ? clamp(journey.amount ?? cat.defaultAmount, cat.minAmount, cat.maxAmount) : 0));
  const [text, setText] = useState(() => groupINR(amount));
  const [focused, setFocused] = useState(false);
  const [tenure, setTenure] = useState(() => (cat && journey.tenureYears && cat.tenures.includes(journey.tenureYears) ? journey.tenureYears : undefined));
  const [location, setLocation] = useState(journey.location);
  const [pickerOpen, setPickerOpen] = useState(false);

  if (!cat) return <Redirect href="/loan-category" />;

  const isBusiness = journey.entityType === 'msme';
  const locationLabel = isBusiness ? 'Operating Business Location' : 'Current City';
  const amountValid = amount >= cat.minAmount && amount <= cat.maxAmount;
  const showAmountError = !amountValid && (!focused || amount > cat.maxAmount);
  const valid = amountValid && !!tenure && !!location;
  const hint = !amountValid ? 'Enter A Loan Amount Within The Allowed Range.' : !tenure ? 'Select Your Preferred Tenure.' : !location ? `Select Your ${locationLabel.toLowerCase()}.` : null;
  const emi = amountValid && tenure ? estimateEmi(amount, cat.assumedRate, tenure) : 0;

  function onType(t: string) {
    const digits = t.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10);
    const n = Number(digits || 0);
    setText(digits ? groupINR(n) : '');
    setAmount(n);
  }

  function onBlur() {
    setFocused(false);
    if (amountValid) void updateJourney({ amount });
  }

  function onSlide(v: number) {
    setAmount(v);
    setText(groupINR(v));
  }

  function pickTenure(y: number) {
    setTenure(y);
    void updateJourney({ tenureYears: y });
  }

  function pickCity(city: string) {
    setLocation(city);
    setPickerOpen(false);
    void updateJourney({ location: city });
  }

  async function next() {
    if (!valid) return;
    await updateJourney({ amount, tenureYears: tenure, location });
    router.push('/loan-purpose');
  }

  return (
    <Screen
      header={<StepHeader step={2} />}
      footer={<JourneyFooter onContinue={() => void next()} disabled={!valid} hint={hint} />}>
      <Animated.View entering={FadeInDown.duration(400)}>
        <Eyebrow label="Loan Requirement • 2 Of 3" />
        <Text style={s.title} accessibilityRole="header">How Much Do You Need?</Text>
        <Text style={s.sub}>Set The Amount And Repayment Period That Works For You.</Text>
      </Animated.View>

      <Pressable onPress={() => router.dismissTo('/loan-category')} style={s.catChip} accessibilityRole="button" accessibilityLabel={`${cat.title}. Change Category`}>
        <View style={s.catIcon}><Icon name={cat.icon} size={14} color={C.white} /></View>
        <Text style={s.catText} numberOfLines={1}>{cat.title}</Text>
        <Text style={s.change}>Change</Text>
      </Pressable>

      <Animated.View entering={FadeInDown.delay(80).duration(400)} style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>How Much?</Text>
          <Text style={s.tag}>Requested Limit</Text>
        </View>
        <View style={[s.amountRow, focused && s.amountRowFocused, showAmountError && s.amountRowError]}>
          <Text style={s.rupee}>₹</Text>
          <TextInput
            value={text}
            onChangeText={onType}
            onFocus={() => setFocused(true)}
            onBlur={onBlur}
            keyboardType="number-pad"
            returnKeyType="done"
            selectTextOnFocus
            maxLength={14}
            placeholder="0"
            placeholderTextColor={C.slate}
            style={[s.amountInput, text.length > 11 && s.amountInputLong]}
            accessibilityLabel={`Loan Amount In Rupees, Between ${formatShortINR(cat.minAmount)} And ${formatShortINR(cat.maxAmount)}`}
          />
          <Icon name="edit" size={18} color={C.muted} />
        </View>
        {showAmountError ? (
          <Animated.View entering={FadeIn} style={s.errorRow} accessibilityLiveRegion="polite">
            <Icon name="error" size={14} color={C.error} />
            <Text style={s.errorText}>Enter An Amount Between {formatShortINR(cat.minAmount)} And {formatShortINR(cat.maxAmount)}.</Text>
          </Animated.View>
        ) : (
          <Text style={s.words}>{amount ? formatShortINR(amount) : ' '}</Text>
        )}

        <Slider
          value={clamp(amount, cat.minAmount, cat.maxAmount)}
          min={cat.minAmount}
          max={cat.maxAmount}
          step={cat.step}
          onChange={onSlide}
          onChangeEnd={v => void updateJourney({ amount: v })}
          accessibilityLabel="Loan Amount"
          formatValue={formatINR}
        />
        <View style={s.rangeRow}>
          <Text style={s.rangeText}>{formatShortINR(cat.minAmount)}</Text>
          <Text style={[s.rangeText, s.rangeMid]}>Max Sanction Pool</Text>
          <Text style={[s.rangeText, s.rangeEnd]}>{formatShortINR(cat.maxAmount)}</Text>
        </View>

        <Text style={s.label}>Preferred Tenure</Text>
        <View style={s.tenures} accessibilityRole="radiogroup" accessibilityLabel="Tenure In Years">
          {cat.tenures.map(y => (
            <ChoiceChip key={y} tone="pill" label={`${y} Yr`} selected={tenure === y} onPress={() => pickTenure(y)} style={s.tenure} />
          ))}
        </View>

        <Text style={s.label}>{locationLabel}</Text>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={({ pressed }) => [s.location, pressed && s.locationPressed]}
          accessibilityRole="button"
          accessibilityLabel={`${locationLabel}: ${location ?? 'Not Selected'}. ${location ? 'Change' : 'Select'}`}>
          <Icon name="location" size={20} color={location ? C.navy : C.slate} />
          <Text style={[s.locationText, !location && s.placeholder]} numberOfLines={1}>{location ?? 'Select City'}</Text>
          <Text style={s.change}>{location ? 'Change' : 'Select'}</Text>
          <Icon name="expand-more" size={18} color={C.muted} />
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(400)} style={s.emi}>
        <Icon name="verified" size={18} color={C.goldDeep} />
        {emi ? (
          <View style={s.emiBody}>
            <Text style={s.emiText}>Illustrative EMI ≈ <Text style={s.emiStrong}>{formatINR(emi)}/mo</Text></Text>
            <Text style={s.emiNote}>
              Assumes {cat.assumedRate}% P.A. Over {formatTenure(tenure!)} For Illustration Only. Not A Lender Offer — Lenders Set The Final Rate.
            </Text>
          </View>
        ) : (
          <Text style={[s.emiText, s.emiBody]}>Choose An Amount And Tenure To See An Illustrative EMI.</Text>
        )}
      </Animated.View>

      <CityPicker visible={pickerOpen} value={location} title={locationLabel} onSelect={pickCity} onClose={() => setPickerOpen(false)} />
    </Screen>
  );
}

const s = StyleSheet.create({
  title: { fontFamily: F.heading, fontSize: 24, lineHeight: 32, letterSpacing: -0.3, color: C.text },
  sub: { fontFamily: F.body, fontSize: 14, lineHeight: 22, color: C.muted, marginTop: S.sm },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', maxWidth: '100%', marginTop: S.md, paddingVertical: 6, paddingLeft: 6, paddingRight: 12, borderRadius: 999, backgroundColor: C.subtle },
  catIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  catText: { fontFamily: F.body, fontSize: 13, fontWeight: '600', color: C.navy, flexShrink: 1 },
  change: { fontFamily: F.body, fontSize: 12, fontWeight: '600', color: C.goldDeep },
  card: { marginTop: S.md, padding: S.lg, borderRadius: R.card, backgroundColor: C.card, ...shadow.card },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontFamily: F.heading, fontSize: 18, color: C.text },
  tag: { fontFamily: F.body, fontSize: 10, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted, backgroundColor: C.subtle, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, overflow: 'hidden' },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: S.md, paddingHorizontal: 10, borderRadius: R.field, borderWidth: 1.5, borderColor: 'transparent', marginHorizontal: -10 },
  amountRowFocused: { borderColor: C.border, backgroundColor: C.canvas },
  amountRowError: { borderColor: C.error, backgroundColor: '#FFF8F7' },
  rupee: { fontFamily: F.heading, fontSize: 30, color: C.navy },
  amountInput: { flex: 1, minWidth: 0, fontFamily: F.heading, fontSize: 32, color: C.navy, paddingVertical: 6 },
  amountInputLong: { fontSize: 24 },
  words: { fontFamily: F.body, fontSize: 12, color: C.muted, marginTop: 2 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  errorText: { fontFamily: F.body, fontSize: 12, color: C.error, flexShrink: 1 },
  rangeRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  rangeText: { flex: 1, fontFamily: F.body, fontSize: 12, color: C.muted },
  rangeMid: { textAlign: 'center' },
  rangeEnd: { textAlign: 'right' },
  label: { fontFamily: F.body, fontSize: 11, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase', color: C.muted, marginTop: S.lg, marginBottom: S.sm },
  tenures: { flexDirection: 'row', gap: 8 },
  tenure: { flex: 1, paddingHorizontal: 4 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 56, paddingHorizontal: 14, borderRadius: R.field, backgroundColor: C.subtle },
  locationPressed: { backgroundColor: '#E6EBF1' },
  locationText: { flex: 1, fontFamily: F.body, fontSize: 15, fontWeight: '500', color: C.text },
  placeholder: { color: C.slate, fontWeight: '400' },
  emi: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: S.md, padding: 14, borderRadius: R.field, backgroundColor: C.subtle, borderWidth: 1, borderColor: C.border },
  emiBody: { flex: 1 },
  emiText: { fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.text },
  emiStrong: { fontWeight: '700', color: C.navy },
  emiNote: { fontFamily: F.body, fontSize: 11, lineHeight: 16, color: C.muted, marginTop: 4 },
});
