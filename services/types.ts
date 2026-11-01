import type { RealtimeEvent } from './realtime';
import type * as S from './schemas';

export interface Session { user: S.User; token: string }

// The only surface the UI talks to. A Supabase adapter implements this same interface.
export interface Api {
  auth: {
    signUp(i: S.SignUpInput): Promise<Session>;
    signIn(i: S.SignInInput): Promise<Session>;
    restore(token: string): Promise<S.User | null>;
    signOut(): Promise<void>;
    createCharacter(i: S.CharacterInput): Promise<S.User>;
    updateProfile(i: S.UpdateProfileInput): Promise<S.User>;
  };
  guildhalls: { list(): Promise<S.GuildhallWithRole[]>; create(i: S.CreateGuildhallInput): Promise<S.GuildhallWithRole> };
  campaigns: { list(guildhallId: string): Promise<S.Campaign[]>; create(i: S.CreateCampaignInput): Promise<S.Campaign> };
  quests: {
    list(campaignId: string): Promise<S.Quest[]>;
    create(i: S.CreateQuestInput): Promise<S.Quest>;
    update(i: S.UpdateQuestInput): Promise<S.Quest>;
    delete(i: S.DeleteQuestInput): Promise<void>;
    move(i: S.MoveQuestInput): Promise<S.Quest>;
    assign(i: S.AssignQuestInput): Promise<S.Quest>;
    setDue(i: S.SetDueInput): Promise<S.Quest>;
  };
  members: { list(guildhallId: string): Promise<S.Member[]> };
  activity: { list(guildhallId: string, limit?: number): Promise<S.AuditEntry[]> };
  widgets: { list(campaignId: string): Promise<S.Widget[]>; move(i: S.MoveWidgetInput): Promise<S.Widget>; layout(i: S.SetLayoutInput): Promise<S.Widget[]>; create(i: S.CreateWidgetInput): Promise<S.Widget>; remove(widgetId: string): Promise<void>; setConfig(i: S.SetConfigInput): Promise<S.Widget> };
  realtime: { subscribe(channel: string, handler: (e: RealtimeEvent) => void): () => void };
}
