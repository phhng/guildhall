import { Pressable, ScrollView, View } from 'react-native';
import { GoldButton, Txt } from '@/components/ui';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { CONFIG_SCHEMAS } from '@/services/schemas';
import { useTheme } from '@/theme/useTheme';
import type { WidgetProps } from './types';
import { useWidgetConfig } from './useWidgetConfig';

export function QuestDetails({ widget, campaignId }: WidgetProps) {
  const { c, radius } = useTheme();
  const { quests, setError } = useCampaignData(campaignId);
  const { config, save } = useWidgetConfig(widget, CONFIG_SCHEMAS.questDetails);
  const quest = quests.find((item) => item.id === config.questId);
  const select = async (questId: string) => {
    const error = await save({ questId });
    if (error) setError(error);
  };

  if (!quest) {
    return (
      <ScrollView contentContainerStyle={{ padding: 10, gap: 8 }}>
        <Txt muted>Select a quest to show its details in this widget.</Txt>
        {quests.map((item) => (
          <GoldButton key={item.id} label={item.title} variant="ghost" onPress={() => select(item.id)} />
        ))}
        {quests.length === 0 && <Txt muted>No quests are available yet.</Txt>}
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 10, gap: 8 }}>
      <Txt bold style={{ fontSize: 22, lineHeight: 28 }}>{quest.title}</Txt>
      <Txt muted>Priority {quest.priority}/10 · {quest.status.replace(/([A-Z])/g, ' $1')}</Txt>
      {quest.dueAt !== null && <Txt muted>Deadline: {new Date(quest.dueAt).toISOString().slice(0, 10)}</Txt>}
      <Txt>{quest.description || 'No description provided.'}</Txt>
      <View style={{ borderTopWidth: 1, borderColor: c.leatherEdge, paddingTop: 8, gap: 6 }}>
        <Txt bold>Notes</Txt>
        <Txt>{quest.notes || 'No notes yet.'}</Txt>
      </View>
      <Txt muted style={{ marginTop: 4 }}>Choose another quest</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {quests.map((item) => (
          <Pressable key={item.id} accessibilityRole="button" accessibilityState={{ selected: item.id === quest.id }}
            onPress={() => select(item.id)}
            style={{ minHeight: 40, justifyContent: 'center', paddingHorizontal: 10, borderRadius: radius, borderWidth: 1, borderColor: item.id === quest.id ? c.gold : c.leatherEdge }}>
            <Txt style={{ fontSize: 14 }}>{item.title}</Txt>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
