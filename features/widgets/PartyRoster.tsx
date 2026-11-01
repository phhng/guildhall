import { ScrollView, Text, View } from 'react-native';
import { Txt } from '@/components/ui';
import { CLASS_INFO } from '@/features/character/classes';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { ROLE_LABEL } from '@/services/permissions';
import { useTheme } from '@/theme/useTheme';
import type { WidgetProps } from './types';

export function PartyRoster({ campaignId }: WidgetProps) {
  const { c } = useTheme();
  const { members } = useCampaignData(campaignId);
  return (
    <ScrollView contentContainerStyle={{ padding: 10, gap: 8 }}>
      {members.map((m) => {
        const cls = m.characterClass ? CLASS_INFO[m.characterClass] : null;
        return (
          <View key={m.userId} accessible accessibilityLabel={`${m.displayName}, ${cls?.label ?? 'no class'}, ${ROLE_LABEL[m.role]}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: c.gold, alignItems: 'center', justifyContent: 'center', backgroundColor: c.leatherEdge }}>
              <Text style={{ fontSize: 24 }}>{m.avatar ?? '👤'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Txt bold numberOfLines={1}>{m.displayName}</Txt>
              <Txt muted style={{ fontSize: 15, lineHeight: 19 }}>{cls ? `${cls.rune} ${cls.label}` : 'Classless'}, {ROLE_LABEL[m.role]}</Txt>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}
