import { create } from 'zustand';
import { api } from '@/services';
import { errorMessage } from '@/services/errors';
import { tokenStorage } from '@/services/secureStorage';
import type { CharacterInput, SignInInput, SignUpInput, User } from '@/services/schemas';
import type { Session } from '@/services/types';
import { useWorkspace } from './workspaceStore';

const TOKEN_KEY = 'guildhall.session';
interface AuthState {
  user: User | null; status: 'loading' | 'in' | 'out'; busy: boolean; error: string | null;
  hydrate(): Promise<void>;
  signIn(i: SignInInput): Promise<void>;
  signUp(i: SignUpInput): Promise<void>;
  createCharacter(i: CharacterInput): Promise<void>;
  signOut(): Promise<void>;
  clearError(): void;
}

export const useAuth = create<AuthState>((set) => {
  const run = async (fn: () => Promise<void>) => {
    set({ busy: true, error: null });
    try { await fn(); } catch (e) { set({ error: errorMessage(e) }); } finally { set({ busy: false }); }
  };
  const begin = async (s: Session) => { await tokenStorage.set(TOKEN_KEY, s.token); set({ user: s.user, status: 'in' }); };
  return {
    user: null, status: 'loading', busy: false, error: null,
    hydrate: async () => {
      let user: User | null = null;
      try { const t = await tokenStorage.get(TOKEN_KEY); user = t ? await api.auth.restore(t) : null; } catch { user = null; }
      if (!user) await tokenStorage.remove(TOKEN_KEY);
      set({ user, status: user ? 'in' : 'out' });
    },
    signIn: (i) => run(async () => begin(await api.auth.signIn(i))),
    signUp: (i) => run(async () => begin(await api.auth.signUp(i))),
    createCharacter: (i) => run(async () => { set({ user: await api.auth.createCharacter(i) }); }),
    signOut: async () => {
      await api.auth.signOut(); await tokenStorage.remove(TOKEN_KEY);
      useWorkspace.getState().reset(); set({ user: null, status: 'out', error: null });
    },
    clearError: () => set({ error: null }),
  };
});
