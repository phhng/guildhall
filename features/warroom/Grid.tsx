import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { Txt } from '@/components/ui';
import { WIDGETS, widgetLabel } from '@/features/widgets/registry';
import type { Widget } from '@/services/schemas';
import { useTheme } from '@/theme/useTheme';
import { hapticDrop, hapticPickup, playSound } from '@/utils/feedback';
import { changedItems, colsFor, layout, type LayoutItem } from './layout';

const ROW_H = 120, GAP = 12;
const BOUNCE = { damping: 11, stiffness: 190, mass: 0.7 };
const SETTLE = { damping: 18, stiffness: 170 };
interface Metrics { cols: number; gap: number; rowH: number; colW: number }

export function Grid({ widgets, campaignId, edit, onCommit, onInteract }: { widgets: Widget[]; campaignId: string; edit: boolean; onCommit: (changes: LayoutItem[]) => void; onInteract: (active: boolean) => void }) {
  const { c, radius } = useTheme();
  const [width, setWidth] = useState(0);
  const [pv, setPv] = useState<{ id: string; items: LayoutItem[] } | null>(null);
  const cols = colsFor(width);
  const canEdit = edit && cols >= 2;
  const base = useMemo(() => layout(widgets.map(({ id, x, y, w, h }) => ({ id, x, y, w, h })), null, cols), [widgets, cols]);
  const byId = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);
  const items = pv?.items ?? base;
  const m: Metrics = { cols, gap: GAP, rowH: ROW_H, colW: width > 0 ? (width - GAP * (cols - 1)) / cols : 0 };

  const compute = useCallback((id: string, patch: Partial<LayoutItem>) => layout(base.map((i) => (i.id === id ? { ...i, ...patch } : i)), id, cols), [base, cols]);
  // Called only when the snapped cell changes, which is what throttles live layout updates.
  const preview = useCallback((id: string, patch: Partial<LayoutItem>) => setPv({ id, items: compute(id, patch) }), [compute]);
  const drop = useCallback((id: string, patch: Partial<LayoutItem>) => {
    const next = compute(id, patch);
    setPv(null); onInteract(false); hapticDrop(); playSound('drop');
    const changes = changedItems(next, base);
    if (changes.length) onCommit(changes);
  }, [compute, base, onCommit, onInteract]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const height = Math.max(...items.map((i) => i.y + i.h), 1) * (ROW_H + GAP) - GAP;
  const ghost = pv?.items.find((i) => i.id === pv.id);

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {edit && cols < 2 && <Txt muted style={{ marginBottom: 8 }}>On a one-column screen the War Room is a stacked view. Widen the window or rotate the device to rearrange it.</Txt>}
      {width > 0 && (
        <View style={{ height }}>
          {ghost && <View pointerEvents="none" style={{ position: 'absolute', left: ghost.x * (m.colW + GAP), top: ghost.y * (ROW_H + GAP), width: ghost.w * (m.colW + GAP) - GAP, height: ghost.h * (ROW_H + GAP) - GAP, borderWidth: 2, borderStyle: 'dashed', borderColor: c.gold, borderRadius: radius, opacity: 0.6 }} />}
          {items.map((it) => {
            const wd = byId.get(it.id)!;
            const Def = WIDGETS[wd.type];
            return (
              <Tile key={it.id} item={it} m={m} edit={canEdit} title={widgetLabel(wd.type)}
                onStart={() => { hapticPickup(); playSound('pickup'); onInteract(true); }}
                onDrag={(x, y) => preview(it.id, { x, y })} onDrop={(x, y) => drop(it.id, { x, y })}
                onResize={(w, h) => preview(it.id, { w, h })} onResizeDrop={(w, h) => drop(it.id, { w, h })}>
                {Def ? <Def.component widget={wd} campaignId={campaignId} /> : <Txt muted style={{ padding: 12 }}>This widget arrives in Phase 3.</Txt>}
              </Tile>
            );
          })}
        </View>
      )}
    </View>
  );
}

interface TileProps { item: LayoutItem; m: Metrics; edit: boolean; title: string; children: ReactNode; onStart: () => void; onDrag: (x: number, y: number) => void; onDrop: (x: number, y: number) => void; onResize: (w: number, h: number) => void; onResizeDrop: (w: number, h: number) => void }

function Tile({ item, m, edit, title, children, onStart, onDrag, onDrop, onResize, onResizeDrop }: TileProps) {
  const { c, fonts, radius } = useTheme();
  const cw = m.colW + m.gap, rh = m.rowH + m.gap, gap = m.gap, cols = m.cols, iw = item.w, ih = item.h, ix = item.x, iy = item.y;
  const tl = item.x * cw, tt = item.y * rh, tw = item.w * cw - gap, th = item.h * rh - gap;
  const left = useSharedValue(tl), top = useSharedValue(tt), width = useSharedValue(tw), height = useSharedValue(th);
  const startA = useSharedValue(0), startB = useSharedValue(0), lastA = useSharedValue(0), lastB = useSharedValue(0);
  const lift = useSharedValue(0), active = useSharedValue(false);

  // Follow layout changes (pushed by another widget, window resize, undo later) unless this tile is being held.
  const settle = useCallback(() => {
    if (active.value) return;
    left.value = withSpring(tl, SETTLE); top.value = withSpring(tt, SETTLE); width.value = withSpring(tw, SETTLE); height.value = withSpring(th, SETTLE);
  }, [tl, tt, tw, th, active, left, top, width, height]);
  useEffect(settle, [settle]);

  // Long-press the title bar to pick the widget up, so scrolling the page never moves widgets by accident.
  const drag = Gesture.Pan().enabled(edit).activateAfterLongPress(250)
    .onStart(() => {
      active.value = true; startA.value = left.value; startB.value = top.value; lastA.value = ix; lastB.value = iy;
      lift.value = withTiming(1, { duration: 120 }); runOnJS(onStart)();
    })
    .onUpdate((e) => {
      left.value = startA.value + e.translationX; top.value = startB.value + e.translationY;
      const gx = Math.min(Math.max(Math.round(left.value / cw), 0), cols - iw);
      const gy = Math.max(Math.round(top.value / rh), 0);
      if (gx !== lastA.value || gy !== lastB.value) { lastA.value = gx; lastB.value = gy; runOnJS(onDrag)(gx, gy); }
    })
    .onFinalize(() => {
      if (!active.value) return;
      active.value = false; lift.value = withTiming(0, { duration: 160 });
      left.value = withSpring(lastA.value * cw, BOUNCE); top.value = withSpring(lastB.value * rh, BOUNCE);
      runOnJS(onDrop)(lastA.value, lastB.value);
    });

  const resize = Gesture.Pan().enabled(edit)
    .onStart(() => {
      active.value = true; startA.value = width.value; startB.value = height.value; lastA.value = iw; lastB.value = ih;
      lift.value = withTiming(1, { duration: 120 }); runOnJS(onStart)();
    })
    .onUpdate((e) => {
      width.value = Math.max(cw * 0.6, startA.value + e.translationX); height.value = Math.max(rh * 0.6, startB.value + e.translationY);
      const gw = Math.min(Math.max(Math.round((width.value + gap) / cw), 1), cols - ix);
      const gh = Math.max(Math.round((height.value + gap) / rh), 1);
      if (gw !== lastA.value || gh !== lastB.value) { lastA.value = gw; lastB.value = gh; runOnJS(onResize)(gw, gh); }
    })
    .onFinalize(() => {
      if (!active.value) return;
      active.value = false; lift.value = withTiming(0, { duration: 160 });
      width.value = withSpring(lastA.value * cw - gap, BOUNCE); height.value = withSpring(lastB.value * rh - gap, BOUNCE);
      runOnJS(onResizeDrop)(lastA.value, lastB.value);
    });

  const anim = useAnimatedStyle(() => ({
    position: 'absolute' as const, left: left.value, top: top.value, width: width.value, height: height.value,
    zIndex: active.value ? 20 : 1, transform: [{ scale: 1 + 0.03 * lift.value }],
    shadowOpacity: 0.3 + 0.4 * lift.value, shadowRadius: 8 + 14 * lift.value, elevation: 4 + 10 * lift.value,
  }));
  const noSelect = Platform.OS === 'web' ? ({ userSelect: 'none' } as object) : null;

  return (
    <Animated.View style={[{ shadowColor: c.ember, shadowOffset: { width: 0, height: 0 } }, anim]}>
      <View style={{ flex: 1, backgroundColor: c.leather, borderColor: edit ? c.ember : c.gold, borderWidth: 1.5, borderRadius: radius, overflow: 'hidden' }}>
        <GestureDetector gesture={drag}>
          <View style={[{ minHeight: 44, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.leatherEdge }, noSelect]}>
            <Text numberOfLines={1} accessibilityRole="header" style={{ flex: 1, fontFamily: fonts.display, color: c.gold, fontSize: 15 }}>{title}</Text>
            {edit && <Text accessibilityLabel={`Hold and drag to move ${title}`} style={{ color: c.gold, fontSize: 22 }}>⠿</Text>}
          </View>
        </GestureDetector>
        <View style={{ flex: 1 }} pointerEvents={edit ? 'none' : 'auto'}>{children}</View>
        {edit && (
          <GestureDetector gesture={resize}>
            <View accessibilityLabel={`Resize ${title}`} style={[{ position: 'absolute', right: 0, bottom: 0, width: 48, height: 48, alignItems: 'flex-end', justifyContent: 'flex-end', padding: 6 }, noSelect]}>
              <Text style={{ color: c.gold, fontSize: 24 }}>◢</Text>
            </View>
          </GestureDetector>
        )}
      </View>
    </Animated.View>
  );
}
