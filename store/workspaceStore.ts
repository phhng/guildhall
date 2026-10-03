import { create } from 'zustand';
import { api } from '@/services';
import { errorMessage } from '@/services/errors';
import type { Campaign, CreateGuildhallInput, GuildhallWithRole } from '@/services/schemas';

interface WorkspaceState {
  guildhalls: GuildhallWithRole[]; campaigns: Campaign[];
  guildhallId: string | null; campaignId: string | null; error: string | null;
  loadGuildhalls(): Promise<void>;
  createGuildhall(i: CreateGuildhallInput): Promise<boolean>;
  selectGuildhall(id: string): void;
  loadCampaigns(): Promise<void>;
  createCampaign(name: string, description: string): Promise<boolean>;
  selectCampaign(id: string): void;
  clearError(): void;
  reset(): void;
}
const empty = { guildhalls: [], campaigns: [], guildhallId: null, campaignId: null, error: null };

export const useWorkspace = create<WorkspaceState>((set, get) => ({
  ...empty,
  loadGuildhalls: async () => { try { set({ guildhalls: await api.guildhalls.list() }); } catch (e) { set({ error: errorMessage(e) }); } },
  createGuildhall: async (i) => {
    try { const g = await api.guildhalls.create(i); set((s) => ({ guildhalls: [...s.guildhalls, g], error: null })); return true; }
    catch (e) { set({ error: errorMessage(e) }); return false; }
  },
  selectGuildhall: (id) => set({ guildhallId: id, campaigns: [], campaignId: null, error: null }),
  loadCampaigns: async () => {
    const id = get().guildhallId; if (!id) return;
    try { set({ campaigns: await api.campaigns.list(id) }); } catch (e) { set({ error: errorMessage(e) }); }
  },
  createCampaign: async (name, description) => {
    const guildhallId = get().guildhallId; if (!guildhallId) return false;
    try { const c = await api.campaigns.create({ guildhallId, name, description }); set((s) => ({ campaigns: [...s.campaigns, c], error: null })); return true; }
    catch (e) { set({ error: errorMessage(e) }); return false; } // e.g. FORBIDDEN -> rejected-action banner
  },
  selectCampaign: (id) => set({ campaignId: id, error: null }),
  clearError: () => set({ error: null }),
  reset: () => set(empty),
}));

export const useRole = () => useWorkspace((s) => s.guildhalls.find((g) => g.id === s.guildhallId)?.role ?? null);
