import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const navy = '#082C4B', gold = '#F5BE35', muted = '#687786';
const KEY = 'fundenflo:onboarding:v1';
const slides = [
  { tag: 'CLARITY BEFORE CAPITAL', title: 'Your next chapter.\nA clearer financial start.', accent: 'Know where you stand.', body: 'Understand your financial readiness and discover practical steps toward your personal or business goals.', note: 'A FundenFlo score is distinct from a bureau score.' },
  { tag: 'MATCHED WITH PURPOSE', title: 'The right fit.\nFor your next big move.', accent: 'Explore with confidence.', body: 'Choose your loan category. Discover suitable lender options based on your profile, with clear reasons behind each match.', note: 'Lender availability and eligibility apply. Approval is the lender’s decision.' },
  { tag: 'PROGRESS YOU CAN FOLLOW', title: 'Less uncertainty.\nMore forward momentum.', accent: 'Every step, in one place.', body: 'From your document checklist to application updates, follow your funding journey with clarity at every stage.', note: 'Submitting an application does not guarantee funding.' },
];

function Button({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [s.button, secondary && s.secondary, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}><Text style={[s.buttonText, secondary && { color: navy }]}>{label}</Text>{!secondary && <Text style={s.arrow}>↗</Text>}</Pressable>;
}

function Illustration({ page }: { page: number }) {
  return <View style={s.scene} accessibilityLabel={['Illustration of financial readiness factors', 'Illustration of lender suitability', 'Illustration of an application checklist'][page]}>
    <View style={s.orbit} /><View style={s.orbitSmall} /><View style={s.goldDot} /><View style={s.blueDot} />
    <View style={s.card}>
      <View style={s.cardTop}><Text style={s.cardLabel}>{['FINANCIAL READINESS', 'YOUR LENDER SHORTLIST', 'YOUR FUNDING JOURNEY'][page]}</Text><View style={s.miniMark}><Text style={s.miniMarkText}>↗</Text></View></View>
      {page === 0 ? <><View style={s.scoreCircle}><Text style={s.scoreIcon}>↗</Text><Text style={s.scoreTitle}>A clearer picture</Text><Text style={s.small}>Understand. Improve. Grow.</Text></View><View style={s.factor}><Text style={s.small}>Cash flow</Text><View style={s.track}><View style={[s.fill, { width: '76%' }]} /></View></View><View style={s.factor}><Text style={s.small}>Financial stability</Text><View style={s.track}><View style={[s.fill, { width: '58%', backgroundColor: gold }]} /></View></View></> : page === 1 ? <><Text style={s.cardHeading}>Built around your goals.</Text>{['Your chosen loan category', 'Your financial profile', 'Relevant lender criteria'].map((t, i) => <View key={t} style={s.listRow}><View style={s.number}><Text style={s.numberText}>{i + 1}</Text></View><Text style={s.rowText}>{t}</Text><Text style={s.check}>✓</Text></View>)}<View style={s.softPill}><Text style={s.pillText}>Suitability explained, simply</Text></View></> : <><Text style={s.cardHeading}>One step closer.</Text>{['Prepare your documents', 'Follow your application', 'Stay informed on progress'].map((t, i) => <View key={t} style={s.listRow}><View style={[s.number, i === 0 && { backgroundColor: navy }]}><Text style={[s.numberText, i === 0 && { color: 'white' }]}>{i === 0 ? '✓' : i + 1}</Text></View><Text style={s.rowText}>{t}</Text></View>)}<View style={s.track}><View style={[s.fill, { width: '33%' }]} /></View></>}
      <Text style={s.preview}>ILLUSTRATIVE PRODUCT PREVIEW</Text>
    </View>
    <View style={s.floating}><View style={s.spark}><Text style={s.sparkText}>{['✦', '↗', '✓'][page]}</Text></View><View><Text style={s.floatTitle}>{['Your potential, unlocked', 'A match that makes sense', 'Clarity at every step'][page]}</Text><Text style={[s.small, { color: '#C2D1DC' }]}>{['For individuals & businesses', 'Guided by your financial profile', 'From preparation to progress'][page]}</Text></View></View>
  </View>;
}

export default function WelcomeFlow() {
  const [stage, setStage] = useState<'splash' | 'slides' | 'ready'>('splash');
  const [page, setPage] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [fade] = useState(() => new Animated.Value(0));
  const { width } = useWindowDimensions();
  const swipeX = useRef<number | null>(null);
  useEffect(() => {
    let active = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    void AccessibilityInfo.isReduceMotionEnabled().then(v => { if (active) setReduceMotion(v); });
    const timer = new Promise(resolve => setTimeout(resolve, 1600));
    void Promise.all([AsyncStorage.getItem(KEY).catch(() => null), timer]).then(([seen]) => { if (active) setStage(seen === 'done' ? 'ready' : 'slides'); });
    return () => { active = false; subscription.remove(); };
  }, []);
  useEffect(() => {
    fade.setValue(0);
    const animation = Animated.timing(fade, { toValue: 1, duration: reduceMotion ? 0 : 450, useNativeDriver: true });
    animation.start();
    return () => animation.stop();
  }, [page, stage, fade, reduceMotion]);
  async function finish() {
    if (saving) return;
    setSaving(true);
    try { await AsyncStorage.setItem(KEY, 'done'); setStorageError(false); } catch { setStorageError(true); }
    setStage('ready'); setSaving(false);
  }
  if (stage === 'splash') return <SafeAreaView style={s.splash}><StatusBar style="light" /><View style={s.splashRing} /><Animated.View style={[s.splashCenter, { opacity: fade }]}><Image source={require('../../assets/brand/logo-white.png')} style={s.splashLogo} resizeMode="contain" /><View style={s.goldLine} /><Text style={s.splashMessage}>A clearer path to capital.</Text></Animated.View><Text style={s.splashFooter}>YOUR AMBITION. OUR DIRECTION.</Text></SafeAreaView>;
  const current = slides[page];
  return <SafeAreaView style={s.root}><StatusBar style="dark" /><View style={[s.shell, width > 650 && s.desktop]}>
    <View style={s.header}><Image source={require('../../assets/brand/logo.png')} style={s.logo} resizeMode="contain" />{stage === 'slides' && <Pressable accessibilityRole="button" onPress={() => void finish()} hitSlop={12} style={s.skip}><Text style={s.skipText}>Skip intro ↗</Text></Pressable>}</View>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll} onTouchStart={e => { swipeX.current = e.nativeEvent.pageX; }} onTouchEnd={e => { if (stage !== 'slides' || swipeX.current === null) return; const dx = e.nativeEvent.pageX - swipeX.current; if (Math.abs(dx) > 65) setPage(p => Math.max(0, Math.min(2, p + (dx < 0 ? 1 : -1)))); swipeX.current = null; }}>
      <Animated.View style={{ opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [reduceMotion ? 0 : 12, 0] }) }] }}>
        <View style={s.eyebrow}><View style={s.tinyDot} /><Text style={s.eyebrowText}>{stage === 'ready' ? 'YOUR JOURNEY STARTS HERE' : current.tag}</Text></View>
        <Illustration page={stage === 'ready' ? 2 : page} />
        <View style={s.copy}><Text accessibilityRole="header" style={s.title}>{stage === 'ready' ? 'Ready for your\nnext chapter?' : current.title}</Text><Text style={s.accent}>{stage === 'ready' ? 'Let’s move forward, together.' : current.accent}</Text><Text style={s.body}>{stage === 'ready' ? 'You’ve explored the FundenFlo journey. Account creation is the next part of the app we’ll build.' : current.body}</Text></View>
      </Animated.View>
    </ScrollView>
    <View style={s.footer}>{stage === 'slides' ? <><View style={s.progress}><View style={s.dots}>{slides.map((_, i) => <Pressable key={i} accessibilityRole="button" accessibilityLabel={`Go to slide ${i + 1}`} accessibilityState={{ selected: page === i }} onPress={() => setPage(i)} style={s.dotTarget}><View style={[s.dot, page === i && s.dotActive]} /></Pressable>)}</View><Text style={s.counter}>0{page + 1}<Text style={{ color: '#9CA5AB' }}> / 03</Text></Text></View><Button label={saving ? 'Preparing…' : page === 2 ? 'Let’s get started' : 'Continue'} onPress={() => page < 2 ? setPage(page + 1) : void finish()} /><View style={s.bottomRow}>{page > 0 ? <Pressable accessibilityRole="button" onPress={() => setPage(page - 1)} hitSlop={10}><Text style={s.back}>← Back</Text></Pressable> : <Text style={s.bottomText}>Made for individuals & MSMEs</Text>}<Text style={s.bottomText}>A clearer way forward</Text></View><Text style={s.disclosure}>{current.note}</Text></> : <><View style={s.coming}><Text style={s.comingTitle}>Registration · Coming next</Text><Text style={s.small}>No account or financial data is collected in this preview.</Text></View><Button secondary label="Explore the introduction again" onPress={() => { setPage(0); setStage('slides'); }} />{storageError && <Text style={s.disclosure}>Your introduction preference couldn’t be saved on this device.</Text>}</>}</View>
  </View></SafeAreaView>;
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8F7F3' }, shell: { flex: 1, width: '100%', maxWidth: 500, alignSelf: 'center', paddingHorizontal: 26 }, desktop: { marginVertical: 24, borderWidth: 1, borderColor: '#E4E5DF', borderRadius: 28, backgroundColor: '#F8F7F3', overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, paddingBottom: 24 }, logo: { width: 157, height: 40 }, skip: { minHeight: 44, justifyContent: 'center' }, skipText: { fontFamily: 'Inter', fontSize: 12, color: muted },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingBottom: 12 }, eyebrow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, tinyDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#B58A23' }, eyebrowText: { fontFamily: 'Inter', fontSize: 10, letterSpacing: 1.8, color: muted },
  scene: { height: 300, alignItems: 'center', justifyContent: 'center', marginVertical: 12 }, orbit: { position: 'absolute', width: 280, height: 280, borderRadius: 140, backgroundColor: '#EAEFEA', borderWidth: 1, borderColor: '#DEE5DD' }, orbitSmall: { position: 'absolute', width: 235, height: 235, borderRadius: 120, borderWidth: 1, borderColor: '#D8E2DA' }, goldDot: { position: 'absolute', top: 20, right: 30, width: 18, height: 18, backgroundColor: gold, borderRadius: 9 }, blueDot: { position: 'absolute', bottom: 24, left: 20, width: 9, height: 9, backgroundColor: navy, borderRadius: 5 },
  card: { width: '88%', maxWidth: 305, padding: 20, backgroundColor: '#FFFFFF', borderRadius: 20, borderWidth: 1, borderColor: '#E3E9E4', boxShadow: '0px 14px 32px rgba(8,44,75,0.09)', transform: [{ rotate: '-3deg' }] }, cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 13 }, cardLabel: { fontFamily: 'Inter', fontSize: 9, letterSpacing: 1, color: muted }, miniMark: { width: 25, height: 25, backgroundColor: navy, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }, miniMarkText: { color: gold, fontSize: 20 }, scoreCircle: { alignItems: 'center', paddingVertical: 8 }, scoreIcon: { color: navy, fontSize: 46, backgroundColor: '#F7EDCB', width: 74, height: 74, borderRadius: 37, textAlign: 'center', lineHeight: 74 }, scoreTitle: { fontFamily: 'Poppins', color: navy, fontSize: 17, marginTop: 8 }, small: { fontFamily: 'Inter', color: muted, fontSize: 10, lineHeight: 17 }, factor: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }, track: { height: 6, width: '45%', borderRadius: 4, backgroundColor: '#EBEFEB', overflow: 'hidden' }, fill: { height: 6, backgroundColor: '#3D8273', borderRadius: 4 }, preview: { fontFamily: 'Inter', fontSize: 7, letterSpacing: 1, color: muted, textAlign: 'center', marginTop: 17 }, floating: { position: 'absolute', bottom: 4, right: 0, backgroundColor: navy, padding: 14, borderRadius: 15, flexDirection: 'row', gap: 10, alignItems: 'center', boxShadow: '0px 8px 18px rgba(8,44,75,0.15)' }, spark: { backgroundColor: gold, width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, sparkText: { fontSize: 22, color: navy }, floatTitle: { fontFamily: 'Poppins', color: '#fff', fontSize: 11 },
  cardHeading: { fontFamily: 'Poppins', fontSize: 18, color: navy, marginBottom: 12 }, listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }, number: { width: 29, height: 29, borderRadius: 10, backgroundColor: '#EFF3EC', alignItems: 'center', justifyContent: 'center' }, numberText: { color: navy, fontFamily: 'Inter', fontSize: 12 }, rowText: { fontFamily: 'Inter', color: navy, fontSize: 11, flex: 1 }, check: { color: '#3D8273' }, softPill: { backgroundColor: '#F7EDCB', padding: 9, borderRadius: 8, marginTop: 8 }, pillText: { fontFamily: 'Inter', color: navy, fontSize: 10, textAlign: 'center' },
  copy: { marginTop: 16 }, title: { fontFamily: 'Poppins', fontSize: 29, lineHeight: 39, color: navy, letterSpacing: -0.8 }, accent: { fontFamily: 'Poppins', fontSize: 14, color: '#9A7218', marginTop: 14 }, body: { fontFamily: 'Inter', fontSize: 14, lineHeight: 23, color: muted, marginTop: 8 },
  footer: { paddingTop: 12, paddingBottom: 12 }, progress: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }, dots: { flexDirection: 'row', alignItems: 'center' }, dotTarget: { minWidth: 28, height: 32, justifyContent: 'center', alignItems: 'center' }, dot: { width: 6, height: 6, borderRadius: 4, backgroundColor: '#CDD4D6' }, dotActive: { width: 26, backgroundColor: navy }, counter: { fontFamily: 'Inter', fontSize: 11, color: navy }, button: { minHeight: 58, backgroundColor: navy, borderRadius: 16, paddingHorizontal: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, secondary: { backgroundColor: '#E9EEE9', justifyContent: 'center' }, buttonText: { color: '#FFFFFF', fontFamily: 'Poppins', fontSize: 14 }, arrow: { color: gold, fontSize: 25 }, bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 42 }, bottomText: { fontFamily: 'Inter', fontSize: 9, color: muted }, back: { fontFamily: 'Inter', fontSize: 12, color: navy }, disclosure: { fontFamily: 'Inter', fontSize: 9, lineHeight: 14, color: muted, textAlign: 'center' }, coming: { padding: 18, borderRadius: 16, borderWidth: 1, borderColor: '#DDE3DC', marginBottom: 14 }, comingTitle: { fontFamily: 'Poppins', fontSize: 14, color: navy, marginBottom: 6 },
  splash: { flex: 1, backgroundColor: navy, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, splashCenter: { alignItems: 'center', width: '100%', paddingHorizontal: 36 }, splashLogo: { width: '100%', maxWidth: 340, height: 100 }, goldLine: { width: 40, height: 3, borderRadius: 3, backgroundColor: gold, marginTop: 22, marginBottom: 20 }, splashMessage: { fontFamily: 'Inter', color: '#D8E2EA', fontSize: 14 }, splashFooter: { position: 'absolute', bottom: 48, color: '#B2C3D1', fontFamily: 'Inter', fontSize: 9, letterSpacing: 2 }, splashRing: { position: 'absolute', width: 520, height: 520, borderRadius: 260, borderWidth: 1, borderColor: '#17415F' },
});
