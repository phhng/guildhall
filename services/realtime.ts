export type RealtimeEvent = { type: string; by: string; at: number };
type Handler = (e: RealtimeEvent) => void;

// Per-dashboard pub/sub. Channels look like `campaign:<id>`.
// TODO(supabase): replace with Realtime *private* channels authorized by RLS; the service layer already
// checks membership before subscribing, mirroring what the server must do.
export class MockRealtime {
  private subs = new Map<string, Set<Handler>>();
  subscribe(channel: string, h: Handler) {
    const set = this.subs.get(channel) ?? new Set<Handler>();
    set.add(h);
    this.subs.set(channel, set);
    return () => { set.delete(h); };
  }
  publish(channel: string, e: Omit<RealtimeEvent, 'at'>) {
    this.subs.get(channel)?.forEach((h) => h({ ...e, at: Date.now() }));
  }
}
