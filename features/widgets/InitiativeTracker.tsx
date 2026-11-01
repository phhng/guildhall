import { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { GoldButton, Txt } from '@/components/ui';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { CONFIG_SCHEMAS, type Member } from '@/services/schemas';
import { useTheme } from '@/theme/useTheme';
import { hapticDrop, hapticPickup } from '@/utils/feedback';
import type { WidgetProps } from './types';
import { useWidgetConfig } from './useWidgetConfig';

const ROW = 56;

export function InitiativeTracker({ widget, campaignId }: WidgetProps) {
  const { members, setError } = useCampaignData(campaignId);
  const { config, save } = useWidgetConfig(widget, CONFIG_SCHEMAS.initiative);
  const ordered = useMemo(() => {
    const byId = new Map(members.map((m) => [m.userId, m]));
    const known = config.order.map((id) => byId.get(id)).filter((m): m is Member => !!m);
    return [...known, ...members.filter((m) => !config.order.includes(m.userId))];
  }, [members, config.order]);
  const n = ordered.length;
  const turn = n ? config.turn % n : 0;
  const persist = async (ids: string[], t: number) => { const err = await save({ order: ids, turn: t }); if (err) setError(err); };
  const reorder = (from: number, to: number) => {
    if (from === to) return;
    const ids = ordered.map((m) => m.userId);
    const current = ids[turn];
    ids.splice(to, 0, ids.splice(from, 1)[0]);
    persist(ids, Math.max(ids.indexOf(current), 0));
  };
  return (
    <ScrollView contentContainerStyle={{ padding: 10, gap: 8 }}>
      <GoldButton label="Next turn" onPress={() => persist(ordered.map((m) => m.userId), (turn + 1) % Math.max(n, 1))} disabled={n === 0} />
      <Txt muted style={{ fontSize: 15 }}>Hold a row and drag to change the turn order, or use the arrows.</Txt>
      {ordered.map((m, i) => <Row key={m.userId} m={m} index={i} n={n} active={i === turn} onReorder={reorder} />)}
    </ScrollView>
  );
}

function Row({ m, index, n, active, onReorder }: { m: Member; index: number; n: number; active: boolean; onReorder: (from: number, to: number) => void }) {
  const { c, radius } = useTheme();
  const ty = useSharedValue(0), lift = useSharedValue(0), on = useSharedValue(false);
  const pan = Gesture.Pan().activateAfterLongPress(200)
    .onStart(() => { on.value = true; lift.value = withTiming(1, { duration: 120 }); runOnJS(hapticPickup)(); })
    .onUpdate((e) => { ty.value = e.translationY; })
    .onFinalize(() => {
      if (!on.value) return;
      on.value = false;
      const to = Math.min(Math.max(index + Math.round(ty.value / ROW), 0), n - 1);
      ty.value = withSpring(0); lift.value = withTiming(0, { duration: 160 });
      runOnJS(hapticDrop)(); runOnJS(onReorder)(index, to);
    });
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }, { scale: 1 + 0.04 * lift.value }], zIndex: lift.value > 0 ? 5 : 0, shadowOpacity: 0.2 + 0.5 * lift.value, shadowRadius: 4 + 10 * lift.value, elevation: 2 + 8 * lift.value }));
  const arrow = (d: number, glyph: string, label: string, off: boolean) => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={off} onPress={() => onReorder(index, index + d)} style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', opacity: off ? 0.3 : 1 }}>
      <Text style={{ color: c.inkMuted, fontSize: 16 }}>{glyph}</Text>
    </Pressable>
  );
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ height: ROW - 6, borderRadius: radius, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, backgroundColor: c.parchment, borderWidth: active ? 2 : 0, borderColor: c.ember, shadowColor: c.ember, shadowOffset: { width: 0, height: 2 } }, anim]}>
        <Text style={{ fontSize: 22 }}>{m.avatar ?? '👤'}</Text>
        <View style={{ flex: 1 }}>
          <Txt ink bold numberOfLines={1} style={{ fontSize: 16, lineHeight: 20 }}>{index + 1}. {m.displayName}</Txt>
          {active && <Txt ink muted style={{ fontSize: 13, lineHeight: 16 }}>Acting now</Txt>}
        </View>
        {arrow(-1, '▲', `Move ${m.displayName} earlier`, index === 0)}
        {arrow(1, '▼', `Move ${m.displayName} later`, index === n - 1)}
      </Animated.View>
    </GestureDetector>
  );
}
