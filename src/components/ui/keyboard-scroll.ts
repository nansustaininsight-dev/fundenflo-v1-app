import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Dimensions, Keyboard, Platform, TextInput, type HostInstance, type KeyboardEvent, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollView } from 'react-native';

const GAP = 24;

type Measurable = {
  measureInWindow: (callback: (x: number, y: number, width: number, height: number) => void) => void;
};

function measurable(value: HostInstance | null): Measurable | null {
  if (value && typeof (value as Measurable).measureInWindow === 'function') return value as Measurable;
  return null;
}

export function useKeyboardHeight() {
  const [height, setHeight] = useState(0);
  const rest = useRef(Dimensions.get('window').height);

  useEffect(() => {
    const showName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideName = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showName, (event: KeyboardEvent) => {
      const shrunk = Math.max(0, rest.current - Dimensions.get('window').height);
      setHeight(Math.max(0, event.endCoordinates.height - shrunk));
    });
    const hide = Keyboard.addListener(hideName, () => {
      rest.current = Dimensions.get('window').height;
      setHeight(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}

export function useRevealFocusedInput(scrollRef: RefObject<ScrollView | null>, keyboardHeight: number) {
  const offset = useRef(0);
  const inset = useRef(0);
  const focused = useRef<HostInstance | null>(null);

  useEffect(() => {
    inset.current = keyboardHeight;
  }, [keyboardHeight]);

  const reveal = useCallback(() => {
    const scroll = scrollRef.current;
    const frame = measurable(scroll ? scroll.getNativeScrollRef() : null);
    const input = measurable(TextInput.State.currentlyFocusedInput());
    const keyboard = inset.current;
    if (!scroll || !frame || !input || keyboard <= 0) return;
    frame.measureInWindow((_x, sy, _w, sh) => {
      input.measureInWindow((_ix, iy, _iw, ih) => {
        const visual = ih < 8 ? 64 : ih;
        const keyboardTop = Dimensions.get('window').height - keyboard;
        const visibleBottom = Math.min(sy + sh, keyboardTop) - GAP;
        const visibleTop = sy + 8;
        if (visual > visibleBottom - visibleTop) {
          const shift = iy - visibleTop;
          if (shift > 8) scroll.scrollTo({ y: Math.max(0, offset.current + shift), animated: true });
          return;
        }
        const overlap = iy + visual - visibleBottom;
        if (overlap > 8) scroll.scrollTo({ y: offset.current + overlap, animated: true });
      });
    });
  }, [scrollRef]);

  useEffect(() => {
    const first = setTimeout(reveal, 80);
    const second = setTimeout(reveal, 320);
    return () => {
      clearTimeout(first);
      clearTimeout(second);
    };
  }, [keyboardHeight, reveal]);

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    offset.current = event.nativeEvent.contentOffset.y;
  }, []);

  const onTouchStart = useCallback(() => {
    setTimeout(() => {
      const next = TextInput.State.currentlyFocusedInput();
      if (!next || next === focused.current) return;
      focused.current = next;
      reveal();
    }, 300);
  }, [reveal]);

  return { onScroll, onTouchStart };
}
