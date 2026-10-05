import { Redirect, Stack } from 'expo-router';

import { C } from '@/constants/brand';
import { useAppStore } from '@/store/app-store';

/** Every borrower-journey screen requires a verified session. */
export default function BorrowerLayout() {
  const { session } = useAppStore();
  if (!session) return <Redirect href="/login" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: C.canvas } }} />;
}
