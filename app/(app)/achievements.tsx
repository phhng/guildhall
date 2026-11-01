import { useRouter } from 'expo-router';
import { ErrorBanner, GoldButton, Heading, Panel, Screen, Txt } from '@/components/ui';
import { AchievementGrid } from '@/features/achievements/AchievementGrid';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { useWorkspace } from '@/store/workspaceStore';
import { useSettings } from '@/store/settingsStore';

export default function Achievements() {
  const router = useRouter();
  const campaignId = useWorkspace((s) => s.campaignId);
  const gamification = useSettings((s) => s.gamification);
  const { quests, members, error, loading } = useCampaignData(gamification ? campaignId : null);
  return (
    <Screen loading={Boolean(gamification && campaignId && loading)}>
      <Heading>Achievements</Heading>
      {!gamification ? (
        <Panel>
          <Txt>Gamification is off. Turn it on in Settings to view achievements.</Txt>
          <GoldButton label="Open Settings" onPress={() => router.push('/settings')} />
        </Panel>
      ) : !campaignId ? (
        <Panel>
          <Txt>Choose a campaign to see its quest achievements and party progress.</Txt>
          <GoldButton label="Browse campaigns" onPress={() => router.push('/campaigns')} />
        </Panel>
      ) : (
        <>
          <ErrorBanner message={error} />
          <AchievementGrid quests={quests} members={members} presentation="standalone" />
        </>
      )}
    </Screen>
  );
}
