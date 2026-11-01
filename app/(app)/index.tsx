import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { ErrorBanner, Field, GoldButton, Heading, Panel, Screen, Txt } from '@/components/ui';
import { ROLE_LABEL } from '@/services/permissions';
import { useAuth } from '@/store/authStore';
import { useWorkspace } from '@/store/workspaceStore';

export default function Guildhalls() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const { guildhalls, error, loadGuildhalls, createGuildhall, selectGuildhall } = useWorkspace();
  const [name, setName] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { loadGuildhalls().finally(() => setLoaded(true)); }, [loadGuildhalls]);

  return (
    <Screen loading={!loaded}>
      <Heading size={26}>Welcome, {user?.avatar} {user?.displayName}</Heading>
      <ErrorBanner message={error} />
      {guildhalls.length === 0 && <Txt muted>You have no guildhall yet. Found one below to start your first campaign.</Txt>}
      {guildhalls.map((g) => (
        <Pressable key={g.id} accessibilityRole="button" accessibilityLabel={`Open ${g.name}, your role: ${ROLE_LABEL[g.role]}`}
          onPress={() => { selectGuildhall(g.id); router.push('/campaigns'); }}>
          <Panel parchment style={{ minHeight: 64 }}>
            <Txt ink bold style={{ fontSize: 22 }}>{g.name}</Txt>
            <Txt ink muted>{ROLE_LABEL[g.role]}</Txt>
          </Panel>
        </Pressable>
      ))}
      <Panel>
        <Field label="Found a new guildhall" value={name} onChangeText={setName} autoCapitalize="words" placeholder="The Silver Flagon" />
        <GoldButton label="Found guildhall" onPress={async () => { if (await createGuildhall({ name })) setName(''); }} />
      </Panel>
      <View style={{ height: 8 }} />
      <GoldButton variant="ghost" label="Settings" onPress={() => router.push('/settings')} />
    </Screen>
  );
}
