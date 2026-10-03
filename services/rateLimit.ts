import { AppError } from './errors';

// Sliding-window limiter for mock writes. TODO(supabase): enforce at the edge/API gateway, not in the client.
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) throw new AppError('RATE_LIMITED', 'Slow down, adventurer. Wait a moment and try again.');
  recent.push(now);
  hits.set(key, recent);
}
