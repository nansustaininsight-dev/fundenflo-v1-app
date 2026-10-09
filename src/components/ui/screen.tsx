import type { ReactNode } from 'react';
import { useRef } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { useKeyboardHeight, useRevealFocusedInput } from '@/components/ui/keyboard-scroll';
import { C, MAX_WIDTH, S } from '@/constants/brand';

type Props = {
  children: ReactNode;
  /** Pinned below the scroll area (CTA bar). Moves up with the keyboard. */
  footer?: ReactNode;
  /** Rendered above the scroll area (step header). */
  header?: ReactNode;
  background?: string;
  edges?: Edge[];
  contentStyle?: StyleProp<ViewStyle>;
  padded?: boolean;
  flushFooter?: boolean;
};

/** Standard screen shell: safe area + keyboard avoidance + scroll + centered 560px column. */
export function Screen({ children, footer, header, background = C.canvas, edges = ['top', 'bottom'], contentStyle, padded = true, flushFooter = false }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const keyboardHeight = useKeyboardHeight();
  const keyboard = useRevealFocusedInput(scrollRef, keyboardHeight);
  return (
    <SafeAreaView edges={edges} style={[s.root, { backgroundColor: background }]}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={s.flex} behavior="padding">
        {header && <View style={s.column}>{header}</View>}
        <ScrollView
          ref={scrollRef}
          style={s.flex}
          contentContainerStyle={[s.scroll, padded && s.padded, contentStyle, keyboardHeight > 0 && { paddingBottom: keyboardHeight + S.lg }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={keyboard.onScroll}
          onTouchStart={keyboard.onTouchStart}>
          <View style={[s.column, s.flexGrow]}>{children}</View>
        </ScrollView>
        {footer && <View style={[s.column, flushFooter ? s.footerFlush : s.footer]}>{footer}</View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1 },
  scroll: { flexGrow: 1 },
  padded: { paddingHorizontal: S.margin, paddingBottom: S.lg },
  column: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center' },
  footer: { paddingHorizontal: S.margin, paddingTop: S.sm, paddingBottom: S.md },
  footerFlush: { paddingBottom: 0 },
});
