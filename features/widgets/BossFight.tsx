import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Txt } from '@/components/ui';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { CONFIG_SCHEMAS } from '@/services/schemas';
import { useTheme } from '@/theme/useTheme';
import type { WidgetProps } from './types';
import { useWidgetConfig } from './useWidgetConfig';

// Shared HP = XP of the linked quests (all quests if none are linked) that are not yet slain.
export function BossFight({ widget, campaignId }: WidgetProps) {
  const { c, fonts, radius } = useTheme();
  const { quests, setError } = useCampaignData(campaignId);
  const { config, save } = useWidgetConfig(widget, CONFIG_SCHEMAS.bossFight);
  const [name, setName] = useState(config.name);
  useEffect(() => setName(config.name), [config.name]);

  const linked = config.linked.length ? quests.filter((q) => config.linked.includes(q.id)) : quests;
  const total = linked.reduce((s, q) => s + q.xp, 0);
  const left = linked.filter((q) => q.status !== 'slain').reduce((s, q) => s + q.xp, 0);
  const pct = total > 0 ? left / total : 1;
  const slain = total > 0 && left === 0;
  const hp = useSharedValue(pct);
  useEffect(() => { hp.value = withTiming(pct, { duration: 700 }); }, [pct, hp]);
  const bar = useAnimatedStyle(() => ({ width: `${hp.value * 100}%` as `${number}%` }));
  const run = async (patch: Parameters<typeof save>[0]) => { const err = await save(patch); if (err) setError(err); };
  const toggle = (id: string) => run({ linked: config.linked.includes(id) ? config.linked.filter((x) => x !== id) : [...config.linked, id] });

  return (
    <ScrollView contentContainerStyle={{ padding: 10, gap: 10 }}>
      <TextInput accessibilityLabel="Boss name" value={name} onChangeText={setName} maxLength={60}
        onEndEditing={() => { if (name.trim() && name !== config.name) run({ name }); }}
        style={{ fontFamily: fonts.display, fontSize: 20, color: slain ? c.textMuted : c.gold, paddingVertical: 4 }} />
      <View accessibilityRole="progressbar" accessibilityLabel={`Boss health ${left} of ${total}`} style={{ height: 22, borderRadius: radius, borderWidth: 1, borderColor: c.gold, backgroundColor: c.bg, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', backgroundColor: c.danger }, bar]} />
      </View>
      <Txt style={{ fontSize: 16 }}>{total === 0 ? 'No quests linked yet. Post a quest to give the boss some HP.' : slain ? 'The boss is slain! Glory to the party.' : `${left} of ${total} HP remain`}</Txt>
      <Txt muted style={{ fontSize: 15 }}>Linked quests (none selected means all):</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {quests.slice(0, 30).map((q) => {
          const on = config.linked.includes(q.id);
          return (
            <Pressable key={q.id} accessibilityRole="checkbox" accessibilityState={{ checked: on }} accessibilityLabel={`Link ${q.title}`} onPress={() => toggle(q.id)}
              style={{ minHeight: 40, paddingHorizontal: 10, borderRadius: radius, borderWidth: on ? 2 : 1, borderColor: on ? c.gold : c.leatherEdge, justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.body, fontSize: 15, color: c.text }}>{on ? '☑ ' : '☐ '}{q.title}{q.status === 'slain' ? ' ✓' : ''}</Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
