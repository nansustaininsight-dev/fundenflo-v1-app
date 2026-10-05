import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AppStoreProvider, useAppStore } from '@/store/app-store';

void SplashScreen.preventAutoHideAsync();

function Navigator() {
  const { ready } = useAppStore();
  const [loaded, error] = useFonts({
    Poppins: require('../../assets/fonts/Poppins-SemiBold.ttf'),
    Inter: require('../../assets/fonts/Inter.ttf'),
  });
  const fontsDone = loaded || !!error;
  useEffect(() => { if (fontsDone && ready) void SplashScreen.hideAsync(); }, [fontsDone, ready]);
  if (!fontsDone || !ready) return null;
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F8F7F3' }, animation: 'fade' }}>
    <Stack.Screen name="index" />
    <Stack.Screen name="(auth)/login" options={{ animation: 'fade', contentStyle: { backgroundColor: '#0A192F' } }} />
    <Stack.Screen name="(auth)/verify-otp" options={{ animation: 'slide_from_right', contentStyle: { backgroundColor: '#FFFFFF' } }} />
    <Stack.Screen name="(borrower)" options={{ animation: 'slide_from_right' }} />
  </Stack></>;
}

export default function RootLayout() {
  return <AppStoreProvider><Navigator /></AppStoreProvider>;
}
