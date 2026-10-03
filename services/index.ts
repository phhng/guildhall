import { env } from '@/utils/env';
import { mockApi } from './mock/mockApi';
import type { Api } from './types';

export const api: Api = (() => {
  if (env.EXPO_PUBLIC_API_MODE === 'supabase') throw new Error('Supabase adapter arrives in Phase 5. Set EXPO_PUBLIC_API_MODE=mock.');
  return mockApi;
})();
