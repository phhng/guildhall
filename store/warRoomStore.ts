import { create } from 'zustand';
import { api } from '@/services';
import { errorMessage } from '@/services/errors';
import type { Widget, WidgetType } from '@/services/schemas';
import { cellsFor, layout, rawCells, type LayoutItem } from '@/features/warroom/layout';
import { useErrorAlert } from './errorAlertStore';

interface Snap { cols: number; items: LayoutItem[] }
const MAX_HISTORY = 50;

interface WarRoomState {
  widgets: Widget[]; edit: boolean; loading: boolean; error: string | null; past: Snap[]; future: Snap[];
  load(campaignId: string, silent?: boolean): Promise<void>;
  setEdit(v: boolean): void;
  commit(campaignId: string, cols: number, items: LayoutItem[], before: LayoutItem[]): Promise<void>;
  undo(campaignId: string): Promise<void>;
  redo(campaignId: string): Promise<void>;
  addWidget(campaignId: string, cols: number, type: WidgetType, size: { w: number; h: number }, cell?: { x: number; y: number }): Promise<void>;
  removeWidgets(campaignId: string, widgetIds: string[]): Promise<void>;
}

const applyLayout = (ws: Widget[], cols: number, items: LayoutItem[]) =>
  ws.map((w) => { const it = items.find((i) => i.id === w.id); return it ? { ...w, layouts: { ...w.layouts, [String(cols)]: { x: it.x, y: it.y, w: it.w, h: it.h } } } : w; });

export const useWarRoom = create<WarRoomState>((set, get) => {
  // Optimistic write: the UI shows the new layout at once; if the service rejects it we roll back and show the error.
  const write = async (campaignId: string, cols: number, items: LayoutItem[]) => {
    const prev = get().widgets;
    set({ error: null, widgets: applyLayout(prev, cols, items) });
    try {
      set({ widgets: await api.widgets.layout({ campaignId, cols, items: items.map((i) => ({ widgetId: i.id, x: i.x, y: i.y, w: i.w, h: i.h })) }) });
      return true;
    } catch (e) { const message = errorMessage(e); useErrorAlert.getState().show(message); set({ widgets: prev, error: message }); return false; }
  };
  const step = async (campaignId: string, from: 'past' | 'future', to: 'past' | 'future') => {
    const stack = get()[from];
    const snap = stack[stack.length - 1];
    if (!snap) return;
    const ids = new Set(get().widgets.map((w) => w.id));
    const now: Snap = { cols: snap.cols, items: cellsFor(get().widgets, snap.cols) };
    if (await write(campaignId, snap.cols, snap.items.filter((i) => ids.has(i.id))))
      set((s) => ({ [from]: s[from].slice(0, -1), [to]: [...s[to], now].slice(-MAX_HISTORY) }) as Partial<WarRoomState>);
  };
  return {
    widgets: [], edit: false, loading: false, error: null, past: [], future: [],
    load: async (campaignId, silent) => {
      if (!silent) set({ loading: true, widgets: [], past: [], future: [] });
      try { set({ widgets: await api.widgets.list(campaignId), loading: false }); }
      catch (e) { const message = errorMessage(e); useErrorAlert.getState().show(message); set({ error: message, loading: false }); }
    },
    setEdit: (edit) => set({ edit, error: null }),
    commit: async (campaignId, cols, items, before) => {
      if (await write(campaignId, cols, items)) set((s) => ({ past: [...s.past, { cols, items: before }].slice(-MAX_HISTORY), future: [] }));
    },
    undo: (cid) => step(cid, 'past', 'future'),
    redo: (cid) => step(cid, 'future', 'past'),
    // Add/remove are not undoable, so they clear the history (old snapshots could reference missing widgets).
    addWidget: async (campaignId, cols, type, size, cell) => {
      try {
        const wd = await api.widgets.create({ campaignId, type, x: cell?.x ?? 0, y: cell?.y ?? 1000, w: size.w, h: size.h });
        set((s) => ({ widgets: [...s.widgets, wd], past: [], future: [], error: null }));
        if (cell) await write(campaignId, cols, layout(rawCells(get().widgets, cols), wd.id, cols));
      } catch (e) { const message = errorMessage(e); useErrorAlert.getState().show(message); set({ error: message }); }
    },
    // Removes one at a time so each delete is permission-checked, rate-limited and audited. Stops at the first rejection.
    removeWidgets: async (_campaignId, widgetIds) => {
      const removed: string[] = [];
      try {
        for (const id of widgetIds) { await api.widgets.remove(id); removed.push(id); }
        set({ error: null });
      } catch (e) { const message = errorMessage(e); useErrorAlert.getState().show(message); set({ error: message }); }
      if (removed.length) set((s) => ({ widgets: s.widgets.filter((w) => !removed.includes(w.id)), past: [], future: [] }));
    },
  };
});
