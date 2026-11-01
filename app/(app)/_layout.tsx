import { Stack, useRouter } from 'expo-router';
import { Image, Pressable, Text } from 'react-native';
import { useAuth } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

export default function AppLayout() {
  const { c, fonts } = useTheme();
  const router = useRouter();
  const user = useAuth((state) => state.user);
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: c.leather },
      headerTintColor: c.gold,
      headerTitleStyle: { fontFamily: fonts.display },
      contentStyle: { backgroundColor: c.bg },
      headerRight: () => (
        <Pressable accessibilityRole="button" accessibilityLabel="Open profile" onPress={() => router.push('/profile')} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
          {user?.profileImage
            ? <Image source={{ uri: user.profileImage }} style={{ width: 32, height: 32, borderRadius: 16 }} />
            : <Text style={{ fontSize: 24 }}>{user?.avatar ?? '👤'}</Text>}
        </Pressable>
      ),
    }}>
      <Stack.Screen name="index" options={{ title: 'Your Guildhalls' }} />
      <Stack.Screen name="campaigns" options={{ title: 'Campaigns' }} />
      <Stack.Screen name="war-room" options={{ title: 'War Room' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="profile" options={{ title: 'Profile', headerRight: () => null }} />
      <Stack.Screen name="achievements" options={{ title: 'Achievements' }} />
    </Stack>
  );
}
