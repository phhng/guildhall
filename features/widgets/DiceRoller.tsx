import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { GoldButton, Txt } from '@/components/ui';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { api } from '@/services';
import { errorMessage } from '@/services/errors';
import { useTheme } from '@/theme/useTheme';
import { randomInt } from '@/utils/crypto';
import { hapticDrop, hapticPickup, playSound } from '@/utils/feedback';
import type { WidgetProps } from './types';

const DICE = [4, 6, 8, 10, 12, 20];

export function DiceRoller({ campaignId }: WidgetProps) {
  const { c, fonts, radius } = useTheme();
  const { quests, members, setError } = useCampaignData(campaignId);
  const [sides, setSides] = useState(20);
  const [assign, setAssign] = useState(false);
  const [shown, setShown] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const spin = useSharedValue(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  const say = (line: string) => setLog((l) => [line, ...l].slice(0, 5));
  const finish = async (result: number) => {
    setShown(result); setRolling(false); hapticDrop();
    if (!assign) return say(`d${sides}: ${result}`);
    const member = members[result - 1];
    const quest = quests.filter((q) => q.status === 'backlog' && !q.assigneeId).sort((a, b) => a.order - b.order)[0];
    if (!quest) return say('No unassigned quests in the Backlog.');
    try {
      await api.quests.assign({ questId: quest.id, assigneeId: member.userId });
      say(`${member.avatar ?? ''} ${member.displayName} takes "${quest.title}"`);
    } catch (e) { setError(errorMessage(e)); }
  };
  const roll = () => {
    const n = assign ? members.length : sides;
    if (rolling || n < 1) return;
    const result = 1 + randomInt(n);
    setRolling(true); hapticPickup(); playSound('roll');
    spin.value = 0; spin.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) });
    let ticks = 0;
    timer.current = setInterval(() => {
      ticks += 1;
      if (ticks >= 10) { if (timer.current) clearInterval(timer.current); finish(result); } else setShown(1 + randomInt(n));
    }, 70);
  };
  const die = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value * 720}deg` }, { scale: 1 + 0.25 * Math.sin(spin.value * Math.PI) }] }));

  return (
    <ScrollView contentContainerStyle={{ padding: 10, gap: 10 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {DICE.map((d) => (
          <Pressable key={d} accessibilityRole="radio" accessibilityLabel={`d${d}`} accessibilityState={{ selected: !assign && d === sides }} onPress={() => { setAssign(false); setSides(d); }}
            style={{ minWidth: 44, minHeight: 44, borderRadius: radius, alignItems: 'center', justifyContent: 'center', borderWidth: !assign && d === sides ? 2 : 1, borderColor: !assign && d === sides ? c.gold : c.leatherEdge }}>
            <Text style={{ fontFamily: fonts.display, color: c.text }}>d{d}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: assign }} accessibilityLabel="Roll to assign a quest" onPress={() => setAssign(!assign)} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 22, color: c.gold }}>{assign ? '☑' : '☐'}</Text>
        <Txt style={{ flex: 1, fontSize: 16 }}>Roll to assign the next Backlog quest</Txt>
      </Pressable>
      <Animated.View style={[{ alignSelf: 'center', width: 96, height: 96, borderRadius: radius, backgroundColor: c.parchment, borderWidth: 2, borderColor: c.gold, alignItems: 'center', justifyContent: 'center' }, die]}>
        <Text accessibilityLiveRegion="polite" style={{ fontFamily: fonts.display, fontSize: 38, color: c.ink }}>{shown ?? '?'}</Text>
      </Animated.View>
      <GoldButton label={assign ? `Roll d${members.length || 1}` : `Roll d${sides}`} onPress={roll} disabled={rolling} />
      {log.map((l, i) => <Txt key={i} muted={i > 0} style={{ fontSize: 15, lineHeight: 20 }}>{l}</Txt>)}
    </ScrollView>
  );
}
