import type { Widget } from '@/services/schemas';

export interface LayoutItem { id: string; x: number; y: number; w: number; h: number }

// Phone 1, tablet 2-3, web 4-6 columns, from the measured grid width.
export const colsFor = (width: number) => (width < 560 ? 1 : width < 820 ? 2 : width < 1060 ? 3 : width < 1300 ? 4 : width < 1560 ? 5 : 6);

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);
const overlaps = (a: LayoutItem, b: LayoutItem) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

// Clamp everything to `cols`, keep the pinned item exactly where it was dropped, then drop every other item
// into the highest free slot. Items that collide with the pinned one are pushed down below it.
export function layout(items: LayoutItem[], pinnedId: string | null, cols: number): LayoutItem[] {
  const all = items.map((i) => {
    const w = clamp(i.w, 1, cols);
    return { ...i, w, x: clamp(i.x, 0, cols - w), y: Math.max(0, i.y) };
  });
  const placed: LayoutItem[] = all.filter((i) => i.id === pinnedId);
  const rest = all.filter((i) => i.id !== pinnedId).sort((a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id));
  for (const it of rest) {
    const c = { ...it };
    let y = 0;
    for (;;) {
      c.y = y;
      const hit = placed.find((p) => overlaps(p, c));
      if (!hit) break;
      y = hit.y + hit.h;
    }
    placed.push(c);
  }
  return all.map((i) => placed.find((p) => p.id === i.id)!);
}

export const changedItems = (next: LayoutItem[], prev: LayoutItem[]) =>
  next.filter((n) => {
    const p = prev.find((i) => i.id === n.id);
    return !p || p.x !== n.x || p.y !== n.y || p.w !== n.w || p.h !== n.h;
  });

// Stored cell for this column count, falling back to the widget's base position.
export const rawCells = (widgets: Widget[], cols: number): LayoutItem[] =>
  widgets.map((wd) => ({ id: wd.id, ...(wd.layouts[String(cols)] ?? { x: wd.x, y: wd.y, w: wd.w, h: wd.h }) }));
export const cellsFor = (widgets: Widget[], cols: number) => layout(rawCells(widgets, cols), null, cols);
