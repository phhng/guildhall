import { ScrollView, Text, View } from 'react-native';
import { Txt } from '@/components/ui';
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
  const badges = [
    { label: 'First Blood', earned: slain.length >= 1, hint: 'Slay your first quest' },
    { label: 'Slayed the Backlog Dragon', earned: quests.length > 0 && !quests.some((q) => q.status === 'backlog'), hint: 'Empty the Backlog' },
    { label: 'Full Party', earned: members.length >= 3, hint: 'Gather three adventurers' },
    { label: 'Century', earned: xp >= 100, hint: 'Earn 100 XP' },
  ];
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
        <Txt key={b.label} accessibilityLabel={`${b.label}, ${b.earned ? 'earned' : 'locked'}`} muted={!b.earned} style={{ fontSize: 16 }}>{b.earned ? '🏅' : '🔒'} {b.label}{b.earned ? '' : ` (${b.hint})`}</Txt>
      ))}
      <Txt bold>Leaderboard</Txt>
      {board.map(({ m, xp: x }) => <Txt key={m.userId} style={{ fontSize: 16 }}>{m.avatar ?? '👤'} {m.displayName}: {x} XP (level {levelOf(x)})</Txt>)}
    </ScrollView>
  );
}
