import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { CrimsonText_400Regular, CrimsonText_600SemiBold, useFonts } from '@expo-google-fonts/crimson-text';
import { Slot, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';
import { RouteTransition } from '@/components/routeLoading';
import { ErrorAlertHost } from '@/components/ErrorAlertHost';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Cinzel_700Bold, CrimsonText_400Regular, CrimsonText_600SemiBold });
  const { c, mode } = useTheme();
  const { status, user, hydrate } = useAuth();
  const segments = useSegments() as string[];
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => { hydrate(); }, [hydrate]);

  // Auth gate: signed-out -> sign-in; signed-in without a character -> character creation.
  useEffect(() => {
    if (!fontsLoaded || status === 'loading') return;
    const inAuth = segments[0] === '(auth)';
    if (status === 'out' && !inAuth) router.replace('/sign-in');
    else if (status === 'in') {
      const needsCharacter = !user?.characterClass;
      if (needsCharacter && segments[1] !== 'character') router.replace('/character');
      else if (!needsCharacter && inAuth) router.replace('/');
    }
  }, [fontsLoaded, status, user, segments, router]);

  if (!fontsLoaded || status === 'loading')
    return <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={c.gold} size="large" accessibilityLabel="Loading" /></View>;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      <RouteTransition pathname={pathname}>
        <Slot />
      </RouteTransition>
      <ErrorAlertHost />
    </GestureHandlerRootView>
  );
}
