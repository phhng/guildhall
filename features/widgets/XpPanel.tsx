import { Image, ScrollView, Text, View } from 'react-native';
import { Txt } from '@/components/ui';
import { achievementsFor } from '@/features/achievements/catalog';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { useSettings } from '@/store/settingsStore';
import { useTheme } from '@/theme/useTheme';
import type { WidgetProps } from './types';

const levelOf = (xp: number) => Math.floor(Math.sqrt(xp / 50)) + 1; // L2 at 50, L3 at 200, L4 at 450...

export function XpPanel({ campaignId }: WidgetProps) {
  const { c, fonts, radius } = useTheme();
  const gamification = useSettings((s) => s.gamification);
  const { quests, members } = useCampaignData(campaignId);
  if (!gamification) return <Txt muted style={{ padding: 12 }}>Gamification is off. Turn it on in Settings to earn XP and badges.</Txt>;

  const slain = quests.filter((q) => q.status === 'slain');
  const xp = slain.reduce((s, q) => s + q.xp, 0);
  const lvl = levelOf(xp), from = 50 * (lvl - 1) ** 2, to = 50 * lvl ** 2;
  const pct = Math.min(1, (xp - from) / (to - from));
  const badges = achievementsFor(quests, members);
  const board = members.map((m) => ({ m, xp: slain.filter((q) => q.assigneeId === m.userId).reduce((s, q) => s + q.xp, 0) })).sort((a, b) => b.xp - a.xp);
  return (
    <ScrollView contentContainerStyle={{ padding: 10, gap: 10 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 22, color: c.gold }}>Party level {lvl}</Text>
      <View accessibilityRole="progressbar" accessibilityLabel={`${xp} of ${to} XP`} style={{ height: 16, borderRadius: radius, borderWidth: 1, borderColor: c.gold, overflow: 'hidden' }}>
        <View style={{ width: `${pct * 100}%`, height: '100%', backgroundColor: c.gold }} />
      </View>
      <Txt muted style={{ fontSize: 15 }}>{xp} XP, {to - xp} to level {lvl + 1}</Txt>
      <Txt bold>Badges</Txt>
      {badges.map((b) => (
        <View key={b.id} accessibilityLabel={`${b.title}, ${b.isEarned ? 'earned' : `locked: ${b.unlockHint}`}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, opacity: b.isEarned ? 1 : 0.55 }}>
          <Image source={b.icon} style={{ width: 24, height: 24 }} resizeMode="contain" />
          <Txt muted={!b.isEarned} style={{ flex: 1, fontSize: 16 }}>{b.title}{b.isEarned ? '' : ` (${b.unlockHint})`}</Txt>
        </View>
      ))}
      <Txt bold>Leaderboard</Txt>
      {board.map(({ m, xp: x }) => <Txt key={m.userId} style={{ fontSize: 16 }}>{m.avatar ?? '👤'} {m.displayName}: {x} XP (level {levelOf(x)})</Txt>)}
    </ScrollView>
  );
}
