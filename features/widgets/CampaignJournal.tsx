import { useEffect, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { ErrorBanner, GoldButton, Txt } from '@/components/ui';
import { Markdown } from '@/features/journal/Markdown';
import { ago, describeAction } from '@/features/warroom/activity';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { CONFIG_SCHEMAS } from '@/services/schemas';
import { useTheme } from '@/theme/useTheme';
import type { WidgetProps } from './types';
import { useWidgetConfig } from './useWidgetConfig';

export function CampaignJournal({ widget, campaignId }: WidgetProps) {
  const { c, fonts, radius } = useTheme();
  const { members, activity } = useCampaignData(campaignId);
  const { config, save } = useWidgetConfig(widget, CONFIG_SCHEMAS.journal);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(config.notes);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (!editing) setDraft(config.notes); }, [config.notes, editing]);
  const nameOf = (id: string) => members.find((m) => m.userId === id)?.displayName ?? 'Someone';
  const submit = async () => { const err = await save({ notes: draft }); if (err) setError(err); else { setError(null); setEditing(false); } };

  return (
    <ScrollView contentContainerStyle={{ padding: 10, gap: 10 }}>
      <ErrorBanner message={error} />
      {editing ? (
        <>
          <TextInput accessibilityLabel="Journal notes (markdown)" multiline value={draft} onChangeText={setDraft} maxLength={5000} textAlignVertical="top"
            placeholder={'# Session notes\n- Use **bold**, *italic* and [https links](https://example.com)'} placeholderTextColor={c.textMuted}
            style={{ minHeight: 140, borderWidth: 1, borderColor: c.leatherEdge, borderRadius: radius, padding: 10, color: c.text, fontFamily: fonts.body, fontSize: 16 }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <GoldButton label="Save notes" onPress={submit} />
            <GoldButton label="Cancel" variant="ghost" onPress={() => { setEditing(false); setError(null); }} />
          </View>
        </>
      ) : (
        <>
          {config.notes ? <Markdown source={config.notes} /> : <Txt muted>The journal is empty. Record what the party learned.</Txt>}
          <GoldButton label="Edit notes" variant="ghost" onPress={() => setEditing(true)} />
        </>
      )}
      <Txt muted style={{ fontSize: 15, marginTop: 6 }}>Auto-entries</Txt>
      {activity.slice(0, 6).map((e) => <Txt key={e.id} muted style={{ fontSize: 15, lineHeight: 20, fontStyle: 'italic' }}>✦ {nameOf(e.actorId)} {describeAction(e.action)} ({ago(e.at)})</Txt>)}
    </ScrollView>
  );
}
