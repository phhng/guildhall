import { ScrollView } from 'react-native';
import { Txt } from '@/components/ui';
import { ago, describeAction } from '@/features/warroom/activity';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import type { WidgetProps } from './types';

export function ActivityFeed({ campaignId }: WidgetProps) {
  const { members, activity } = useCampaignData(campaignId);
  const who = (id: string) => members.find((m) => m.userId === id);
  return (
    <ScrollView contentContainerStyle={{ padding: 10, gap: 8 }}>
      {activity.length === 0 && <Txt muted>Quiet in the hall. Actions by the party will appear here.</Txt>}
      {activity.map((e) => (
        <Txt key={e.id} accessible style={{ fontSize: 16, lineHeight: 22 }}>
          {who(e.actorId)?.avatar ?? '👤'} <Txt bold>{who(e.actorId)?.displayName ?? 'Someone'}</Txt> {describeAction(e.action)}. <Txt muted style={{ fontSize: 14 }}>{ago(e.at)}</Txt>
        </Txt>
      ))}
    </ScrollView>
  );
}
