import { create } from 'zustand';
import { api } from '@/services';
import { errorMessage } from '@/services/errors';
import type { Widget } from '@/services/schemas';
import type { LayoutItem } from '@/features/warroom/layout';

interface WarRoomState {
  widgets: Widget[]; edit: boolean; loading: boolean; error: string | null;
  load(campaignId: string, silent?: boolean): Promise<void>;
  setEdit(v: boolean): void;
  commit(campaignId: string, changes: LayoutItem[]): Promise<void>;
}

export const useWarRoom = create<WarRoomState>((set, get) => ({
  widgets: [], edit: false, loading: false, error: null,
  load: async (campaignId, silent) => {
    if (!silent) set({ loading: true, widgets: [] });
    try { set({ widgets: await api.widgets.list(campaignId), loading: false }); }
    catch (e) { set({ error: errorMessage(e), loading: false }); }
  },
  setEdit: (edit) => set({ edit, error: null }),
  // Optimistic: the UI already shows the dropped layout; the service call is the real write.
  // If the service rejects it (e.g. a Squire), we roll back and show the rejected-action banner.
  commit: async (campaignId, changes) => {
    if (!changes.length) return;
    const prev = get().widgets;
    set({ error: null, widgets: prev.map((w) => { const c = changes.find((x) => x.id === w.id); return c ? { ...w, x: c.x, y: c.y, w: c.w, h: c.h } : w; }) });
    try { set({ widgets: await api.widgets.layout({ campaignId, items: changes.map((c) => ({ widgetId: c.id, x: c.x, y: c.y, w: c.w, h: c.h })) }) }); }
    catch (e) { set({ widgets: prev, error: errorMessage(e) }); }
  },
}));
