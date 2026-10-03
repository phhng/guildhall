import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { ErrorBanner, GoldButton, Txt } from '@/components/ui';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { api } from '@/services';
import { errorMessage } from '@/services/errors';
import type { Member, Quest } from '@/services/schemas';
import { useTheme } from '@/theme/useTheme';
import { hapticDrop, hapticPickup } from '@/utils/feedback';
import type { WidgetProps } from './types';

const COLS = [
  { key: 'backlog', label: 'Backlog' }, { key: 'inProgress', label: 'In Progress' },
  { key: 'inReview', label: 'In Review' }, { key: 'slain', label: 'Slain' },
] as const;

export function QuestBoard({ campaignId }: WidgetProps) {
  const { c, fonts, radius } = useTheme();
  const { quests, members, error, setError } = useCampaignData(campaignId);
  const [colW, setColW] = useState(0);
  const [dragCol, setDragCol] = useState<number | null>(null);
  const [title, setTitle] = useState('');

  const move = async (q: Quest, col: number) => {
    const status = COLS[col].key;
    if (status === q.status) return;
    try { await api.quests.move({ questId: q.id, status, order: Date.now() }); } catch (e) { setError(errorMessage(e)); }
  };
  const add = async () => {
    try { await api.quests.create({ campaignId, title }); setTitle(''); } catch (e) { setError(errorMessage(e)); }
  };

  return (
    <View style={{ flex: 1, padding: 8, gap: 8 }}>
      <ErrorBanner message={error} />
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TextInput accessibilityLabel="New quest title" value={title} onChangeText={setTitle} placeholder="Name a new quest" placeholderTextColor={c.textMuted} onSubmitEditing={add}
          style={{ flex: 1, minHeight: 48, borderWidth: 1, borderColor: c.leatherEdge, borderRadius: radius, paddingHorizontal: 12, color: c.text, fontFamily: fonts.body, fontSize: 17 }} />
        <GoldButton label="Add quest" onPress={add} />
      </View>
      <ScrollView>
        <View style={{ flexDirection: 'row' }} onLayout={(e) => setColW(e.nativeEvent.layout.width / COLS.length)}>
          {COLS.map((col, i) => (
            <View key={col.key} style={{ flex: 1, paddingHorizontal: 3, gap: 6, zIndex: dragCol === i ? 10 : 0 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 13, color: c.gold }} numberOfLines={1}>{col.label}</Text>
              {quests.filter((q) => q.status === col.key).sort((a, b) => a.order - b.order).map((q) => (
                <QuestCard key={q.id} q={q} col={i} colW={colW} assignee={members.find((m) => m.userId === q.assigneeId)}
                  onDragState={(on) => setDragCol(on ? i : null)} onMove={(to) => move(q, to)} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function QuestCard({ q, col, colW, assignee, onDragState, onMove }: { q: Quest; col: number; colW: number; assignee?: Member; onDragState: (on: boolean) => void; onMove: (to: number) => void }) {
  const { c, radius } = useTheme();
  const tx = useSharedValue(0), ty = useSharedValue(0), lift = useSharedValue(0), on = useSharedValue(false);
  const last = COLS.length - 1;

  // Long-press to pick up, so vertical scrolling inside the board still works.
  const pan = Gesture.Pan().activateAfterLongPress(250)
    .onStart(() => { on.value = true; lift.value = withTiming(1, { duration: 120 }); runOnJS(onDragState)(true); runOnJS(hapticPickup)(); })
    .onUpdate((e) => { tx.value = e.translationX; ty.value = e.translationY; })
    .onFinalize(() => {
      if (!on.value) return;
      on.value = false;
      const to = colW > 0 ? Math.min(Math.max(col + Math.round(tx.value / colW), 0), last) : col;
      tx.value = withSpring(0); ty.value = withSpring(0); lift.value = withTiming(0, { duration: 160 });
      runOnJS(onDragState)(false); runOnJS(hapticDrop)(); runOnJS(onMove)(to);
    });
  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: 1 + 0.06 * lift.value }],
    shadowOpacity: 0.2 + 0.5 * lift.value, shadowRadius: 4 + 12 * lift.value, elevation: 2 + 10 * lift.value, zIndex: lift.value > 0 ? 5 : 0,
  }));
  const step = (d: number, label: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`Move ${q.title} to ${label}`} hitSlop={4} onPress={() => onMove(col + d)}
      style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, color: c.inkMuted }}>{d < 0 ? '‹' : '›'}</Text>
    </Pressable>
  );
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ backgroundColor: c.parchment, borderRadius: radius, padding: 8, shadowColor: c.ember, shadowOffset: { width: 0, height: 2 } }, anim]}>
        <Txt ink bold style={{ fontSize: 16, lineHeight: 20 }}>{q.title}</Txt>
        <Txt ink muted style={{ fontSize: 14, lineHeight: 18 }}>{q.xp} XP {assignee ? `${assignee.avatar ?? ''} ${assignee.displayName}` : 'unassigned'}</Txt>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {col > 0 ? step(-1, COLS[col - 1].label) : <View style={{ width: 40 }} />}
          {col < last ? step(1, COLS[col + 1].label) : <View style={{ width: 40 }} />}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
