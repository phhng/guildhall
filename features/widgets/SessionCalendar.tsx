import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Txt } from '@/components/ui';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { api } from '@/services';
import { errorMessage } from '@/services/errors';
import { useTheme } from '@/theme/useTheme';
import type { WidgetProps } from './types';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const same = (a: Date, y: number, m: number, d: number) => a.getFullYear() === y && a.getMonth() === m && a.getDate() === d;

// Quest deadlines are shown as "session dates". Pick a day, then pick an unscheduled quest to schedule it.
export function SessionCalendar({ campaignId }: WidgetProps) {
  const { c, fonts, radius } = useTheme();
  const { quests, setError } = useCampaignData(campaignId);
  const now = new Date();
  const [cur, setCur] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [sel, setSel] = useState<number | null>(null);
  const offset = new Date(cur.y, cur.m, 1).getDay();
  const days = new Date(cur.y, cur.m + 1, 0).getDate();
  const cells = Array.from({ length: offset + days }, (_, i) => (i < offset ? null : i - offset + 1));
  const dueOn = (d: number) => quests.filter((q) => q.dueAt && same(new Date(q.dueAt), cur.y, cur.m, d));
  const setDue = async (questId: string, dueAt: number | null) => { try { await api.quests.setDue({ questId, dueAt }); } catch (e) { setError(errorMessage(e)); } };
  const shift = (d: number) => { setSel(null); setCur((p) => { const t = new Date(p.y, p.m + d, 1); return { y: t.getFullYear(), m: t.getMonth() }; }); };
  const monthQuests = quests.filter((q) => q.dueAt && new Date(q.dueAt).getFullYear() === cur.y && new Date(q.dueAt).getMonth() === cur.m).sort((a, b) => a.dueAt! - b.dueAt!);
  const nav = (d: number, label: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={() => shift(d)} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: c.gold, fontSize: 24 }}>{d < 0 ? '‹' : '›'}</Text>
    </Pressable>
  );
  return (
    <ScrollView contentContainerStyle={{ padding: 10, gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {nav(-1, 'Previous month')}
        <Text accessibilityRole="header" style={{ fontFamily: fonts.display, color: c.gold, fontSize: 16 }}>{MONTHS[cur.m]} {cur.y}</Text>
        {nav(1, 'Next month')}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          const due = d ? dueOn(d).length : 0;
          const on = d !== null && d === sel;
          return (
            <View key={i} style={{ flexBasis: '14.2857%', padding: 1 }}>
              {d !== null && (
                <Pressable accessibilityRole="button" accessibilityLabel={`${MONTHS[cur.m]} ${d}${due ? `, ${due} session${due > 1 ? 's' : ''}` : ''}`} onPress={() => setSel(d)}
                  style={{ minHeight: 40, borderRadius: radius / 2, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 2 : 1, borderColor: on ? c.gold : same(now, cur.y, cur.m, d) ? c.ember : c.leatherEdge, backgroundColor: due ? c.leatherEdge : 'transparent' }}>
                  <Text style={{ fontFamily: fonts.body, color: c.text, fontSize: 15 }}>{d}</Text>
                  {due > 0 && <Text style={{ color: c.gold, fontSize: 10, lineHeight: 10 }}>{'●'.repeat(Math.min(due, 3))}</Text>}
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
      {sel !== null && (
        <>
          <Txt muted style={{ fontSize: 15 }}>Schedule on {MONTHS[cur.m]} {sel}:</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {quests.filter((q) => !q.dueAt && q.status !== 'slain').map((q) => (
              <Pressable key={q.id} accessibilityRole="button" accessibilityLabel={`Schedule ${q.title}`} onPress={() => setDue(q.id, new Date(cur.y, cur.m, sel, 12).getTime())}
                style={{ minHeight: 40, paddingHorizontal: 10, borderRadius: radius, borderWidth: 1, borderColor: c.gold, justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.body, fontSize: 15, color: c.text }}>{q.title}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}
      {monthQuests.length === 0 ? <Txt muted style={{ fontSize: 15 }}>No sessions this month.</Txt> : monthQuests.map((q) => (
        <Pressable key={q.id} accessibilityRole="button" accessibilityLabel={`${q.title} on ${new Date(q.dueAt!).getDate()}. Press to unschedule`} onPress={() => setDue(q.id, null)} style={{ minHeight: 40, justifyContent: 'center' }}>
          <Txt style={{ fontSize: 16 }}>{MONTHS[cur.m].slice(0, 3)} {new Date(q.dueAt!).getDate()}: {q.title} ✕</Txt>
        </Pressable>
      ))}
    </ScrollView>
  );
}
