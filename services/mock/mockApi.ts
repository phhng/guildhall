import { randomId, randomToken, sha256 } from '@/utils/crypto';
import { appendAudit, readAudit } from '../audit';
import { AppError, parse } from '../errors';
import { can, ROLE_LABEL, type Action } from '../permissions';
import { rateLimit } from '../rateLimit';
import { MockRealtime } from '../realtime';
import * as S from '../schemas';
import type { Api, Session } from '../types';

const sleep = (ms = 120) => new Promise((r) => setTimeout(r, ms));

// ---- in-memory "tables". TODO(supabase): Postgres tables with RLS on every one. ----
const users = new Map<string, S.User>();
const creds = new Map<string, { salt: string; hash: string }>(); // TODO: server-side argon2/bcrypt, never client hashing
const sessions = new Map<string, string>(); // token -> userId
const guildhalls: S.Guildhall[] = [];
const memberships: S.Membership[] = [];
const campaigns: S.Campaign[] = [];
const quests: S.Quest[] = [];
const widgets: S.Widget[] = [];
let activeToken: string | null = null;
const bus = new MockRealtime();

function actor(): S.User {
  const uid = activeToken ? sessions.get(activeToken) : undefined;
  const u = uid ? users.get(uid) : undefined;
  if (!u) throw new AppError('UNAUTHENTICATED', 'Sign in to continue.');
  return u;
}
function requireMember(guildhallId: string) {
  const user = actor();
  const m = memberships.find((x) => x.userId === user.id && x.guildhallId === guildhallId);
  if (!m) throw new AppError('FORBIDDEN', 'You are not a member of that guildhall.');
  return { user, role: m.role };
}
const campaignOf = (id: string) => {
  const c = campaigns.find((x) => x.id === id);
  if (!c) throw new AppError('NOT_FOUND', 'Campaign not found.');
  return c;
};

// Every write goes through here: membership -> role check (audited on denial) -> rate limit -> apply -> audit -> publish.
async function mutate<T>(action: Action, guildhallId: string, target: string, fn: (u: S.User) => T, channel?: string): Promise<T> {
  await sleep();
  const { user, role } = requireMember(guildhallId);
  if (!can(role, action)) {
    appendAudit({ actorId: user.id, action, target, ok: false, detail: `denied for ${role}`, guildhallId });
    throw new AppError('FORBIDDEN', `A ${ROLE_LABEL[role]} cannot do that.`);
  }
  rateLimit(`${user.id}:${action}`, 30, 10_000);
  const out = fn(user);
  appendAudit({ actorId: user.id, action, target, ok: true, guildhallId });
  if (channel) bus.publish(channel, { type: action, by: user.id });
  return out;
}

function openSession(user: S.User): Session {
  const token = randomToken();
  sessions.set(token, user.id);
  activeToken = token;
  return { user, token };
}
const seedWidgets = (campaignId: string) => {
  const mk = (type: S.WidgetType, x: number, y: number, w: number, h: number) =>
    widgets.push({ id: randomId('wid_'), campaignId, type, x, y, w, h, config: {}, layouts: {} });
  mk('questBoard', 0, 0, 2, 4); mk('dice', 2, 0, 1, 2); mk('roster', 2, 2, 1, 2); mk('bossFight', 0, 4, 2, 2); mk('activity', 2, 4, 1, 2);
};

// TODO: Replace mock API with real API
export const mockApi: Api = {
  auth: {
    async signUp(raw) {
      await sleep();
      const i = parse(S.SignUpSchema, raw);
      rateLimit(`signup:${i.email}`, 5, 60_000);
      if ([...users.values()].some((u) => u.email === i.email)) throw new AppError('CONFLICT', 'That email already has a character.');
      const user: S.User = { id: randomId('usr_'), email: i.email, displayName: i.displayName, characterClass: null, avatar: null, createdAt: Date.now() };
      const salt = randomToken(16);
      users.set(user.id, user);
      creds.set(user.id, { salt, hash: await sha256(salt + i.password) });
      appendAudit({ actorId: user.id, action: 'auth.signUp', target: user.id, ok: true });
      return openSession(user);
    },
    async signIn(raw) {
      await sleep();
      const i = parse(S.SignInSchema, raw);
      rateLimit(`signin:${i.email}`, 5, 60_000);
      const user = [...users.values()].find((u) => u.email === i.email);
      const c = user && creds.get(user.id);
      if (!user || !c || (await sha256(c.salt + i.password)) !== c.hash) throw new AppError('UNAUTHENTICATED', 'Wrong email or password.');
      appendAudit({ actorId: user.id, action: 'auth.signIn', target: user.id, ok: true });
      return openSession(user);
    },
    async restore(token) {
      await sleep(30);
      const uid = sessions.get(token);
      const u = uid ? users.get(uid) : undefined;
      if (u) activeToken = token;
      return u ? { ...u } : null;
    },
    async signOut() {
      if (activeToken) sessions.delete(activeToken);
      activeToken = null;
    },
    async createCharacter(raw) {
      await sleep();
      const user = actor();
      const i = parse(S.CharacterSchema, raw);
      const next = { ...user, ...i };
      users.set(user.id, next);
      appendAudit({ actorId: user.id, action: 'character.create', target: user.id, ok: true });
      return { ...next };
    },
    async updateProfile(raw) {
      await sleep();
      const user = actor();
      const i = parse(S.UpdateProfileSchema, raw);
      rateLimit(`${user.id}:profile.update`, 5, 60_000);
      const next = { ...user, ...i };
      users.set(user.id, next);
      appendAudit({ actorId: user.id, action: 'profile.update', target: user.id, ok: true });
      return { ...next };
    },
  },
  guildhalls: {
    async list() {
      await sleep();
      const user = actor();
      return memberships.filter((m) => m.userId === user.id).map((m) => ({ ...guildhalls.find((g) => g.id === m.guildhallId)!, role: m.role }));
    },
    async create(raw) {
      await sleep();
      const user = actor();
      const i = parse(S.CreateGuildhallSchema, raw);
      rateLimit(`${user.id}:guildhall.create`, 5, 60_000);
      const g: S.Guildhall = { id: randomId('gld_'), name: i.name, ownerId: user.id, createdAt: Date.now() };
      guildhalls.push(g);
      memberships.push({ userId: user.id, guildhallId: g.id, role: 'guildmaster' });
      appendAudit({ actorId: user.id, action: 'guildhall.create', target: g.id, ok: true, guildhallId: g.id });
      return { ...g, role: 'guildmaster' };
    },
  },
  campaigns: {
    async list(guildhallId) {
      await sleep();
      requireMember(guildhallId);
      return campaigns.filter((c) => c.guildhallId === guildhallId).map((c) => ({ ...c }));
    },
    async create(raw) {
      const i = parse(S.CreateCampaignSchema, raw);
      return mutate('campaign.create', i.guildhallId, `campaign:${i.name}`, () => {
        const c: S.Campaign = { id: randomId('cmp_'), guildhallId: i.guildhallId, name: i.name, description: i.description, createdAt: Date.now() };
        campaigns.push(c);
        seedWidgets(c.id);
        return { ...c };
      });
    },
  },
  quests: {
    async list(campaignId) {
      await sleep();
      requireMember(campaignOf(campaignId).guildhallId);
      return quests.filter((q) => q.campaignId === campaignId).map((q) => ({ ...q }));
    },
    async create(raw) {
      const i = parse(S.CreateQuestSchema, raw);
      return mutate('quest.create', campaignOf(i.campaignId).guildhallId, `campaign:${i.campaignId}`, () => {
        const q: S.Quest = {
          id: randomId('qst_'), campaignId: i.campaignId, title: i.title, description: i.description,
          notes: i.notes, priority: i.priority, status: 'backlog', assigneeId: null, order: Date.now(), xp: i.xp, dueAt: i.dueAt,
        };
        quests.push(q);
        return { ...q };
      }, `campaign:${i.campaignId}`);
    },
    async update(raw) {
      const i = parse(S.UpdateQuestSchema, raw);
      const q = quests.find((x) => x.id === i.questId);
      if (!q) throw new AppError('NOT_FOUND', 'Quest not found.');
      return mutate('quest.update', campaignOf(q.campaignId).guildhallId, `quest:${q.id}`, () => {
        Object.assign(q, { title: i.title, description: i.description, notes: i.notes, priority: i.priority, dueAt: i.dueAt });
        return { ...q };
      }, `campaign:${q.campaignId}`);
    },
    async delete(raw) {
      const i = parse(S.DeleteQuestSchema, raw);
      const index = quests.findIndex((x) => x.id === i.questId);
      if (index < 0) throw new AppError('NOT_FOUND', 'Quest not found.');
      const q = quests[index];
      await mutate('quest.delete', campaignOf(q.campaignId).guildhallId, `quest:${q.id}`, () => { quests.splice(index, 1); }, `campaign:${q.campaignId}`);
    },
    async move(raw) {
      const i = parse(S.MoveQuestSchema, raw);
      const q = quests.find((x) => x.id === i.questId);
      if (!q) throw new AppError('NOT_FOUND', 'Quest not found.');
      return mutate('quest.move', campaignOf(q.campaignId).guildhallId, `quest:${q.id}`, () => {
        q.status = i.status; q.order = i.order;
        return { ...q };
      }, `campaign:${q.campaignId}`);
    },
    async assign(raw) {
      const i = parse(S.AssignQuestSchema, raw);
      const q = quests.find((x) => x.id === i.questId);
      if (!q) throw new AppError('NOT_FOUND', 'Quest not found.');
      const gid = campaignOf(q.campaignId).guildhallId;
      if (i.assigneeId && !memberships.some((m) => m.userId === i.assigneeId && m.guildhallId === gid)) throw new AppError('VALIDATION', 'That adventurer is not in this guildhall.');
      return mutate('quest.move', gid, `quest:${q.id}`, () => { q.assigneeId = i.assigneeId; return { ...q }; }, `campaign:${q.campaignId}`);
    },
    async setDue(raw) {
      const i = parse(S.SetDueSchema, raw);
      const q = quests.find((x) => x.id === i.questId);
      if (!q) throw new AppError('NOT_FOUND', 'Quest not found.');
      return mutate('quest.move', campaignOf(q.campaignId).guildhallId, `quest:${q.id}`, () => { q.dueAt = i.dueAt; return { ...q }; }, `campaign:${q.campaignId}`);
    },
  },
  members: {
    async list(guildhallId) {
      await sleep();
      requireMember(guildhallId);
      return memberships.filter((m) => m.guildhallId === guildhallId).map((m) => {
        const u = users.get(m.userId)!;
        return { userId: u.id, displayName: u.displayName, avatar: u.avatar, characterClass: u.characterClass, role: m.role };
      });
    },
  },
  widgets: {
    async list(campaignId) {
      await sleep();
      requireMember(campaignOf(campaignId).guildhallId);
      return widgets.filter((w) => w.campaignId === campaignId).map((w) => ({ ...w }));
    },
    async move(raw) {
      const i = parse(S.MoveWidgetSchema, raw);
      const widget = widgets.find((x) => x.id === i.widgetId);
      if (!widget) throw new AppError('NOT_FOUND', 'Widget not found.');
      return mutate('widget.move', campaignOf(widget.campaignId).guildhallId, `widget:${widget.id}`, () => {
        Object.assign(widget, { x: i.x, y: i.y, w: i.w, h: i.h });
        return { ...widget };
      }, `campaign:${widget.campaignId}`);
    },
    // One audited, atomic write for a whole drop. Stored per column count (cols).
    async layout(raw) {
      const i = parse(S.SetLayoutSchema, raw);
      const camp = campaignOf(i.campaignId);
      return mutate('widget.move', camp.guildhallId, `layout:${i.campaignId}`, () => {
        const targets = i.items.map((it) => {
          const wd = widgets.find((x) => x.id === it.widgetId && x.campaignId === i.campaignId);
          if (!wd) throw new AppError('NOT_FOUND', 'Widget not found.');
          return { wd, it };
        });
        targets.forEach(({ wd, it }) => { wd.layouts = { ...wd.layouts, [String(i.cols)]: { x: it.x, y: it.y, w: it.w, h: it.h } }; });
        return widgets.filter((x) => x.campaignId === i.campaignId).map((x) => ({ ...x }));
      }, `campaign:${i.campaignId}`);
    },
    async create(raw) {
      const i = parse(S.CreateWidgetSchema, raw);
      const camp = campaignOf(i.campaignId);
      return mutate('widget.create', camp.guildhallId, `widget:${i.type}`, () => {
        const wd: S.Widget = { id: randomId('wid_'), campaignId: i.campaignId, type: i.type, x: i.x, y: i.y, w: i.w, h: i.h, config: S.CONFIG_SCHEMAS[i.type].parse({}) as Record<string, unknown>, layouts: {} };
        widgets.push(wd);
        return { ...wd };
      }, `campaign:${i.campaignId}`);
    },
    async remove(widgetId) {
      const idx = widgets.findIndex((x) => x.id === widgetId);
      if (idx < 0) throw new AppError('NOT_FOUND', 'Widget not found.');
      const wd = widgets[idx];
      await mutate('widget.delete', campaignOf(wd.campaignId).guildhallId, `widget:${wd.id}`, () => { widgets.splice(widgets.indexOf(wd), 1); }, `campaign:${wd.campaignId}`);
    },
    async setConfig(raw) {
      const i = parse(S.SetConfigSchema, raw);
      const wd = widgets.find((x) => x.id === i.widgetId);
      if (!wd) throw new AppError('NOT_FOUND', 'Widget not found.');
      const config = parse(S.CONFIG_SCHEMAS[wd.type], i.config) as Record<string, unknown>; // per-type validation
      return mutate('widget.move', campaignOf(wd.campaignId).guildhallId, `config:${wd.id}`, () => { wd.config = config; return { ...wd }; }, `campaign:${wd.campaignId}`);
    },
  },
  activity: {
    // TODO(phase4): the full audit log (incl. denied actions) is Officer-only; this feed shows successful, non-auth events.
    async list(guildhallId, limit = 30) {
      await sleep(60);
      requireMember(guildhallId);
      return readAudit().filter((e) => e.guildhallId === guildhallId && e.ok).slice(-limit).reverse();
    },
  },
  realtime: {
    subscribe(channel, handler) {
      const [kind, id] = channel.split(':');
      if (kind !== 'campaign' || !id) throw new AppError('VALIDATION', 'Unknown channel.');
      requireMember(campaignOf(id).guildhallId); // authenticated channel: members only
      return bus.subscribe(channel, handler);
    },
  },
};
