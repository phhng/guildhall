import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useFocusEffect, usePathname } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

type ReadinessReporter = (path: string, ready: boolean) => void;
const ReadinessContext = createContext<ReadinessReporter>(() => {});

export function RouteTransition({ pathname, children }: { pathname: string; children: ReactNode }) {
  const { c, fonts } = useTheme();
  const previousPath = useRef(pathname);
  const [pending, setPending] = useState<{ path: string; ready: boolean; minimumElapsed: boolean } | null>(null);

  useLayoutEffect(() => {
    if (previousPath.current === pathname) return;
    previousPath.current = pathname;
    setPending({ path: pathname, ready: false, minimumElapsed: false });
    const timer = setTimeout(() => {
      setPending((current) => current?.path === pathname ? { ...current, minimumElapsed: true } : current);
    }, 350);
    return () => clearTimeout(timer);
  }, [pathname]);

  const reportReadiness = useCallback<ReadinessReporter>((path, ready) => {
    setPending((current) => current?.path === path ? { ...current, ready } : current);
  }, []);

  const reporter = useMemo(() => reportReadiness, [reportReadiness]);
  const visible = pending !== null && !(pending.ready && pending.minimumElapsed);
  return (
    <ReadinessContext.Provider value={reporter}>
      {children}
      {visible && (
        <View accessibilityRole="progressbar" accessibilityLabel="Loading page" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, zIndex: 100, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: c.bg }}>
          <ActivityIndicator color={c.gold} size="large" />
          <Text style={{ color: c.textMuted, fontFamily: fonts.body, fontSize: 18 }}>Preparing the hall...</Text>
        </View>
      )}
    </ReadinessContext.Provider>
  );
}

export function useRouteReadiness(ready: boolean) {
  const pathname = usePathname();
  const reportReadiness = useContext(ReadinessContext);
  useFocusEffect(useCallback(() => {
    reportReadiness(pathname, ready);
  }, [pathname, ready, reportReadiness]));
}
