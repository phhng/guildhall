import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable } from 'react-native';
import { ErrorBanner, Field, GoldButton, Panel, Screen, Txt } from '@/components/ui';
import { ROLE_LABEL } from '@/services/permissions';
import { useRole, useWorkspace } from '@/store/workspaceStore';

export default function Campaigns() {
  const router = useRouter();
  const role = useRole();
  const { campaigns, error, loadCampaigns, createCampaign, selectCampaign } = useWorkspace();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { loadCampaigns().finally(() => setLoaded(true)); }, [loadCampaigns]);

  return (
    <Screen loading={!loaded}>
      <Txt muted>Your role here: {role ? ROLE_LABEL[role] : 'unknown'}</Txt>
      <ErrorBanner message={error} />
      {campaigns.length === 0 && <Txt muted>No campaigns yet. An Officer or Guildmaster can launch the first one.</Txt>}
      {campaigns.map((c) => (
        <Pressable key={c.id} accessibilityRole="button" accessibilityLabel={`Open campaign ${c.name}`} onPress={() => { selectCampaign(c.id); router.push('/war-room'); }}>
          <Panel parchment style={{ minHeight: 64 }}>
            <Txt ink bold style={{ fontSize: 22 }}>{c.name}</Txt>
            {!!c.description && <Txt ink muted>{c.description}</Txt>}
          </Panel>
        </Pressable>
      ))}
      {/* Shown to everyone on purpose in Phase 1: try it as a Squire later and see the service reject it. */}
      <Panel>
        <Field label="Campaign name" value={name} onChangeText={setName} autoCapitalize="words" placeholder="The Lost Roadmap" />
        <Field label="Description" value={description} onChangeText={setDescription} autoCapitalize="sentences" multiline />
        <GoldButton label="Launch campaign" onPress={async () => { if (await createCampaign(name, description)) { setName(''); setDescription(''); } }} />
      </Panel>
    </Screen>
  );
}
