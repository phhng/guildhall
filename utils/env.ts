import { z } from 'zod';

// Typed env. Expo only inlines *static* process.env.EXPO_PUBLIC_* references.
// Everything here ships in the client bundle: NEVER put secrets here.
const Schema = z.object({
  EXPO_PUBLIC_API_MODE: z.enum(['mock', 'supabase']).default('mock'),
  EXPO_PUBLIC_SUPABASE_URL: z.url().optional(),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
});
export const env = Schema.parse({
  EXPO_PUBLIC_API_MODE: process.env.EXPO_PUBLIC_API_MODE || undefined,
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || undefined,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || undefined,
});
