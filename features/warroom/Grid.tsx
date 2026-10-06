import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Platform, Pressable, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { WIDGETS, widgetLabel } from '@/features/widgets/registry';
import type { Widget, WidgetType } from '@/services/schemas';
import { useTheme } from '@/theme/useTheme';
import { hapticDrop, hapticPickup, playSound } from '@/utils/feedback';
import { EditToolbar } from './EditToolbar';
import { gridApi } from './gridApi';
import { cellsFor, changedItems, colsFor, layout, type LayoutItem } from './layout';

const ROW_H = 120, GAP = 12;
// Widgets glide into place over 200 ms with no overshoot or bounce.
const GLIDE = { duration: 200, easing: Easing.out(Easing.cubic) };
interface Metrics { cols: number; gap: number; rowH: number; colW: number }

interface GridProps {
  widgets: Widget[]; campaignId: string; edit: boolean; canRemove: boolean;
  onCommit: (cols: number, next: LayoutItem[], before: LayoutItem[]) => void;
  onAdd: (type: WidgetType, cell: { x: number; y: number }, cols: number) => void;
  onRemove: (ids: string[]) => void;
  onInteract: (active: boolean) => void;
}

export function Grid({ widgets, campaignId, edit, canRemove, onCommit, onAdd, onRemove, onInteract }: GridProps) {
  const { c, radius } = useTheme();
  const [width, setWidth] = useState(0);
  const [pv, setPv] = useState<{ id: string; items: LayoutItem[] } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [pending, setPending] = useState<string[] | null>(null); // ids waiting for delete confirmation
  const gridRef = useRef<View>(null);
  const cols = colsFor(width);
  const base = useMemo(() => cellsFor(widgets, cols), [widgets, cols]);
  const byId = useMemo(() => new Map(widgets.map((w) => [w.id, w])), [widgets]);
  const items = pv?.items ?? base;
  const colW = width > 0 ? (width - GAP * (cols - 1)) / cols : 0;
  const m: Metrics = { cols, gap: GAP, rowH: ROW_H, colW };
  const selected = useMemo(() => (edit ? selectedIds.filter((id) => byId.has(id)) : []), [edit, selectedIds, byId]);
  useEffect(() => { if (!edit) { setSelectedIds([]); setPending(null); } }, [edit]);

  // One patch pins that widget where it was put; several patches (multi-resize) are simply compacted.
  const build = useCallback((patches: Record<string, Partial<LayoutItem>>) => {
    const ids = Object.keys(patches);
    return layout(base.map((i) => (patches[i.id] ? { ...i, ...patches[i.id] } : i)), ids.length === 1 ? ids[0] : null, cols);
  }, [base, cols]);
  // Called only when the snapped cell changes, which is what throttles live layout updates.
  const preview = useCallback((id: string, patch: Partial<LayoutItem>) => setPv({ id, items: build({ [id]: patch }) }), [build]);
  const commit = useCallback((patches: Record<string, Partial<LayoutItem>>) => {
    const next = build(patches);
    if (changedItems(next, base).length) onCommit(cols, next, base);
  }, [build, base, cols, onCommit]);
  const drop = useCallback((id: string, patch: Partial<LayoutItem>) => {
    setPv(null); onInteract(false); hapticDrop(); playSound('drop');
    commit({ [id]: patch });
  }, [commit, onInteract]);
  const resizeSelected = (dw: number, dh: number) => {
    const patches: Record<string, Partial<LayoutItem>> = {};
    base.filter((i) => selected.includes(i.id)).forEach((i) => { patches[i.id] = { w: Math.max(1, i.w + dw), h: Math.max(1, i.h + dh) }; });
    if (Object.keys(patches).length) { hapticDrop(); commit(patches); }
  };
  const toggle = (id: string) => setSelectedIds((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  // Lets the Spellbook drop a new widget at a screen position.
  useEffect(() => {
    if (!edit || colW <= 0) return;
    gridApi.current = {
      drop: (type, ax, ay) => gridRef.current?.measureInWindow((x, y, w) => {
        if (ax < x || ax > x + w || ay < y - 24) return;
        const gx = Math.min(Math.max(Math.floor((ax - x) / (colW + GAP)), 0), cols - 1);
        const gy = Math.max(Math.floor((ay - y) / (ROW_H + GAP)), 0);
        onAdd(type, { x: gx, y: gy }, cols);
      }),
    };
    return () => { gridApi.current = null; };
  }, [edit, colW, cols, onAdd]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const height = Math.max(...items.map((i) => i.y + i.h), 1) * (ROW_H + GAP) - GAP;
  const ghost = pv?.items.find((i) => i.id === pv.id);
  const one = pending && pending.length === 1 ? byId.get(pending[0]) : null;

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {edit && (
        <EditToolbar count={selected.length} total={widgets.length} onSelectAll={() => setSelectedIds(widgets.map((w) => w.id))} onClear={() => setSelectedIds([])}
          onDelete={canRemove ? () => setPending(selected) : undefined} onResize={resizeSelected} />
      )}
      {width > 0 && (
        <View ref={gridRef} style={{ height }}>
          {ghost && <View pointerEvents="none" style={{ position: 'absolute', left: ghost.x * (colW + GAP), top: ghost.y * (ROW_H + GAP), width: ghost.w * (colW + GAP) - GAP, height: ghost.h * (ROW_H + GAP) - GAP, borderWidth: 2, borderStyle: 'dashed', borderColor: c.gold, borderRadius: radius, opacity: 0.6 }} />}
          {items.map((it) => {
            const wd = byId.get(it.id)!;
            const Body = WIDGETS[wd.type].component;
            return (
              <Tile key={it.id} item={it} m={m} edit={edit} title={widgetLabel(wd.type)} selected={selected.includes(it.id)}
                onToggle={() => toggle(it.id)} onRemove={canRemove ? () => setPending([it.id]) : undefined}
                onStart={() => { hapticPickup(); playSound('pickup'); onInteract(true); }}
                onDrag={(x, y) => preview(it.id, { x, y })} onDrop={(x, y) => drop(it.id, { x, y })}
                onResize={(w, h) => preview(it.id, { w, h })} onResizeDrop={(w, h) => drop(it.id, { w, h })}>
                <Body widget={wd} campaignId={campaignId} />
              </Tile>
            );
          })}
        </View>
      )}
      <ConfirmDialog visible={!!pending && pending.length > 0}
        title={pending && pending.length > 1 ? `Delete ${pending.length} widgets?` : 'Delete this widget?'}
        message={pending && pending.length > 1 ? `${pending.length} widgets will be removed from the War Room for everyone.` : `${one ? `"${widgetLabel(one.type)}"` : 'This widget'} will be removed from the War Room for everyone.`}
        confirmLabel={pending && pending.length > 1 ? `Delete ${pending.length}` : 'Delete'}
        onCancel={() => setPending(null)}
        onConfirm={() => { if (pending) { onRemove(pending); setSelectedIds((s) => s.filter((id) => !pending.includes(id))); } setPending(null); }} />
    </View>
  );
}

interface TileProps {
  item: LayoutItem; m: Metrics; edit: boolean; title: string; selected: boolean; children: ReactNode;
  onToggle: () => void; onRemove?: () => void; onStart: () => void;
  onDrag: (x: number, y: number) => void; onDrop: (x: number, y: number) => void;
  onResize: (w: number, h: number) => void; onResizeDrop: (w: number, h: number) => void;
}

function Tile({ item, m, edit, title, selected, children, onToggle, onRemove, onStart, onDrag, onDrop, onResize, onResizeDrop }: TileProps) {
  const { c, fonts, radius } = useTheme();
  const cw = m.colW + m.gap, rh = m.rowH + m.gap, gap = m.gap, cols = m.cols, iw = item.w, ih = item.h, ix = item.x, iy = item.y;
  const tl = item.x * cw, tt = item.y * rh, tw = item.w * cw - gap, th = item.h * rh - gap;
  const left = useSharedValue(tl), top = useSharedValue(tt), width = useSharedValue(tw), height = useSharedValue(th);
  const startA = useSharedValue(0), startB = useSharedValue(0), lastA = useSharedValue(0), lastB = useSharedValue(0);
  const lift = useSharedValue(0), active = useSharedValue(false);

  // Follow layout changes (pushed by another widget, size buttons, undo, window resize) unless this tile is being held.
  const settle = useCallback(() => {
    if (active.value) return;
    left.value = withTiming(tl, GLIDE); top.value = withTiming(tt, GLIDE); width.value = withTiming(tw, GLIDE); height.value = withTiming(th, GLIDE);
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
      left.value = withTiming(lastA.value * cw, GLIDE); top.value = withTiming(lastB.value * rh, GLIDE);
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
      width.value = withTiming(lastA.value * cw - gap, GLIDE); height.value = withTiming(lastB.value * rh - gap, GLIDE);
      runOnJS(onResizeDrop)(lastA.value, lastB.value);
    });

  const anim = useAnimatedStyle(() => ({
    position: 'absolute' as const, left: left.value, top: top.value, width: width.value, height: height.value,
    zIndex: active.value ? 20 : 1, transform: [{ scale: 1 + 0.03 * lift.value }],
    shadowOpacity: 0.3 + 0.4 * lift.value, shadowRadius: 8 + 14 * lift.value, elevation: 4 + 10 * lift.value,
  }));
  const noSelect = Platform.OS === 'web' ? ({ userSelect: 'none' } as object) : null;

  return (
    // The outer view carries the shadow, so it needs the same radius and a fill (square glow otherwise).
    <Animated.View style={[{ borderRadius: radius, backgroundColor: c.leather, shadowColor: c.ember, shadowOffset: { width: 0, height: 0 } }, anim]}>
      <View style={{ flex: 1, backgroundColor: c.leather, borderColor: selected ? c.ember : edit ? c.gold : c.leatherEdge, borderWidth: selected ? 2.5 : 1.5, borderRadius: radius, overflow: 'hidden' }}>
        <GestureDetector gesture={drag}>
          <View style={[{ minHeight: 44, paddingLeft: 12, flexDirection: 'row', alignItems: 'center', backgroundColor: c.leatherEdge }, noSelect]}>
            <Pressable accessibilityRole={edit ? 'checkbox' : 'header'} accessibilityLabel={title} accessibilityState={edit ? { checked: selected } : undefined} disabled={!edit} onPress={onToggle}
              style={{ flex: 1, minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {edit && <Text style={{ color: c.gold, fontSize: 20 }}>{selected ? '☑' : '☐'}</Text>}
              <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fonts.display, color: c.gold, fontSize: 15 }}>{title}</Text>
            </Pressable>
            {edit && onRemove && (
              <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${title}`} onPress={onRemove} style={{ minWidth: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: c.gold, fontSize: 18, fontFamily: fonts.bodyBold }}>✕</Text>
              </Pressable>
            )}
            {edit && <Text accessibilityLabel={`Hold and drag to move ${title}`} style={{ color: c.gold, fontSize: 22, paddingRight: 12 }}>⠿</Text>}
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
