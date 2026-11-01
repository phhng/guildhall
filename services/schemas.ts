import { z } from 'zod';

export const ROLES = ['guildmaster', 'officer', 'adventurer', 'squire'] as const;
export const CLASSES = ['wizard', 'rogue', 'cleric', 'ranger', 'paladin'] as const;
export const WIDGET_TYPES = ['questBoard', 'questDetails', 'initiative', 'dice', 'bossFight', 'roster', 'journal', 'calendar', 'xp', 'activity'] as const;
export const QUEST_STATUSES = ['backlog', 'inProgress', 'inReview', 'slain'] as const;

export const RoleSchema = z.enum(ROLES);
export const ClassSchema = z.enum(CLASSES);
const id = z.string().min(1).max(64);
const name = z.string().trim().min(2, 'Use at least 2 characters.').max(40, 'Use 40 characters or fewer.');
const ts = z.number().int();

// ----- entities -----
export const UserSchema = z.object({
  id, email: z.string().email(), displayName: name, characterClass: ClassSchema.nullable(), avatar: z.string().nullable(),
  profileImage: z.string().max(4096).nullable().optional(), bannerImage: z.string().max(4096).nullable().optional(), createdAt: ts,
});
export const GuildhallSchema = z.object({ id, name, ownerId: id, createdAt: ts });
export const MembershipSchema = z.object({ userId: id, guildhallId: id, role: RoleSchema });
export const CampaignSchema = z.object({ id, guildhallId: id, name, description: z.string().max(280), createdAt: ts });
export const QuestSchema = z.object({ id, campaignId: id, title: z.string().trim().min(1).max(120), description: z.string().max(2000), notes: z.string().max(2000), priority: z.number().int().min(1).max(10), status: z.enum(QUEST_STATUSES), assigneeId: id.nullable(), order: z.number(), xp: z.number().int().min(0).max(1000), dueAt: ts.nullable() });
export const WidgetSchema = z.object({ id, campaignId: id, type: z.enum(WIDGET_TYPES), x: z.number().int().min(0), y: z.number().int().min(0), w: z.number().int().min(1).max(6), h: z.number().int().min(1).max(12), config: z.record(z.string(), z.unknown()), layouts: z.record(z.string(), z.object({ x: z.number().int().min(0), y: z.number().int().min(0), w: z.number().int().min(1).max(6), h: z.number().int().min(1).max(12) })) });
export const AuditEntrySchema = z.object({ id, at: ts, actorId: id, action: z.string(), target: z.string(), ok: z.boolean(), detail: z.string().optional(), guildhallId: id.optional() });

// ----- inputs (used by forms AND the service layer) -----
export const SignUpSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email.'), password: z.string().min(8, 'Password needs 8+ characters.').max(128), displayName: name });
export const SignInSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email.'), password: z.string().min(1, 'Enter your password.').max(128) });
export const CharacterSchema = z.object({ displayName: name, characterClass: ClassSchema, avatar: z.string().min(1).max(8) });
export const UpdateProfileSchema = z.object({
  displayName: name, characterClass: ClassSchema, avatar: z.string().min(1).max(8),
  profileImage: z.string().max(4096).nullable(), bannerImage: z.string().max(4096).nullable(),
});
export const CreateGuildhallSchema = z.object({ name });
export const CreateCampaignSchema = z.object({ guildhallId: id, name, description: z.string().trim().max(280).default('') });
export const CreateQuestSchema = z.object({
  campaignId: id, title: z.string().trim().min(1, 'Name the quest.').max(120),
  description: z.string().trim().max(2000).default(''), notes: z.string().trim().max(2000).default(''),
  priority: z.number().int().min(1).max(10).default(5), dueAt: ts.nullable().default(null),
  xp: z.number().int().min(0).max(1000).default(50),
});
export const UpdateQuestSchema = z.object({
  questId: id, title: z.string().trim().min(1, 'Name the quest.').max(120),
  description: z.string().trim().max(2000), notes: z.string().trim().max(2000),
  priority: z.number().int().min(1).max(10), dueAt: ts.nullable(),
});
export const DeleteQuestSchema = z.object({ questId: id });
export const MoveQuestSchema = z.object({ questId: id, status: z.enum(QUEST_STATUSES), order: z.number() });
export const MoveWidgetSchema = z.object({ widgetId: id, x: z.number().int().min(0), y: z.number().int().min(0), w: z.number().int().min(1).max(6), h: z.number().int().min(1).max(12) });

export type Role = z.infer<typeof RoleSchema>;
export type CharacterClass = z.infer<typeof ClassSchema>;
export type User = z.infer<typeof UserSchema>;
export type Guildhall = z.infer<typeof GuildhallSchema>;
export type Membership = z.infer<typeof MembershipSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;
export type Quest = z.infer<typeof QuestSchema>;
export type Widget = z.infer<typeof WidgetSchema>;
export type WidgetType = Widget['type'];
export type AuditEntry = z.infer<typeof AuditEntrySchema>;
export type GuildhallWithRole = Guildhall & { role: Role };
export type SignUpInput = z.input<typeof SignUpSchema>;
export type SignInInput = z.input<typeof SignInSchema>;
export type CharacterInput = z.input<typeof CharacterSchema>;
export type UpdateProfileInput = z.input<typeof UpdateProfileSchema>;
export type CreateGuildhallInput = z.input<typeof CreateGuildhallSchema>;
export type CreateCampaignInput = z.input<typeof CreateCampaignSchema>;
export type CreateQuestInput = z.input<typeof CreateQuestSchema>;
export type UpdateQuestInput = z.input<typeof UpdateQuestSchema>;
export type DeleteQuestInput = z.input<typeof DeleteQuestSchema>;
export type MoveQuestInput = z.input<typeof MoveQuestSchema>;
export type MoveWidgetInput = z.input<typeof MoveWidgetSchema>;

// ----- Phase 2 additions -----
export const AssignQuestSchema = z.object({ questId: id, assigneeId: id.nullable() });
// Layouts are stored per column count ("1".."6") so phones and desktops each keep their own arrangement.
export const SetLayoutSchema = z.object({ campaignId: id, cols: z.number().int().min(1).max(6), items: z.array(MoveWidgetSchema).min(1).max(50) });
export const MemberSchema = z.object({ userId: id, displayName: name, avatar: z.string().nullable(), characterClass: ClassSchema.nullable(), role: RoleSchema });
export type AssignQuestInput = z.input<typeof AssignQuestSchema>;
export type SetLayoutInput = z.input<typeof SetLayoutSchema>;
export type Member = z.infer<typeof MemberSchema>;

// ----- Phase 3 additions -----
export const CreateWidgetSchema = z.object({ campaignId: id, type: z.enum(WIDGET_TYPES), x: z.number().int().min(0).max(5).default(0), y: z.number().int().min(0).max(1000).default(1000), w: z.number().int().min(1).max(6), h: z.number().int().min(1).max(12) });
export const SetConfigSchema = z.object({ widgetId: id, config: z.record(z.string(), z.unknown()) });
export const SetDueSchema = z.object({ questId: id, dueAt: ts.nullable() });
// Per-widget config, validated by the service on every write and reused by the UI registry.
export const CONFIG_SCHEMAS = {
  questBoard: z.object({}),
  questDetails: z.object({ questId: z.string().max(64).default('') }),
  initiative: z.object({ order: z.array(id).max(50).default([]), turn: z.number().int().min(0).max(50).default(0) }),
  dice: z.object({ sides: z.number().int().min(2).max(100).default(20) }),
  bossFight: z.object({ name: z.string().trim().min(1).max(60).default('The Backlog Dragon'), linked: z.array(id).max(100).default([]) }),
  roster: z.object({}),
  journal: z.object({ notes: z.string().max(5000).default('') }),
  calendar: z.object({}),
  xp: z.object({}),
  activity: z.object({}),
} satisfies Record<(typeof WIDGET_TYPES)[number], z.ZodTypeAny>;
export type CreateWidgetInput = z.input<typeof CreateWidgetSchema>;
export type SetConfigInput = z.input<typeof SetConfigSchema>;
export type SetDueInput = z.input<typeof SetDueSchema>;
