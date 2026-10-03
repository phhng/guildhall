import { Stack } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

export default function AppLayout() {
  const { c, fonts } = useTheme();
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: c.leather }, headerTintColor: c.gold, headerTitleStyle: { fontFamily: fonts.display }, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="index" options={{ title: 'Your Guildhalls' }} />
      <Stack.Screen name="campaigns" options={{ title: 'Campaigns' }} />
      <Stack.Screen name="war-room" options={{ title: 'War Room' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
