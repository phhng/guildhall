import { z } from 'zod';

export const ROLES = ['guildmaster', 'officer', 'adventurer', 'squire'] as const;
export const CLASSES = ['wizard', 'rogue', 'cleric', 'ranger', 'paladin'] as const;
export const WIDGET_TYPES = ['questBoard', 'initiative', 'dice', 'bossFight', 'roster', 'journal', 'calendar', 'xp', 'activity'] as const;
export const QUEST_STATUSES = ['backlog', 'inProgress', 'inReview', 'slain'] as const;

export const RoleSchema = z.enum(ROLES);
export const ClassSchema = z.enum(CLASSES);
const id = z.string().min(1).max(64);
const name = z.string().trim().min(2, 'Use at least 2 characters.').max(40, 'Use 40 characters or fewer.');
const ts = z.number().int();

// ----- entities -----
export const UserSchema = z.object({ id, email: z.string().email(), displayName: name, characterClass: ClassSchema.nullable(), avatar: z.string().nullable(), createdAt: ts });
export const GuildhallSchema = z.object({ id, name, ownerId: id, createdAt: ts });
export const MembershipSchema = z.object({ userId: id, guildhallId: id, role: RoleSchema });
export const CampaignSchema = z.object({ id, guildhallId: id, name, description: z.string().max(280), createdAt: ts });
export const QuestSchema = z.object({ id, campaignId: id, title: z.string().trim().min(1).max(120), description: z.string().max(2000), status: z.enum(QUEST_STATUSES), assigneeId: id.nullable(), order: z.number(), xp: z.number().int().min(0).max(1000), dueAt: ts.nullable() });
export const WidgetSchema = z.object({ id, campaignId: id, type: z.enum(WIDGET_TYPES), x: z.number().int().min(0), y: z.number().int().min(0), w: z.number().int().min(1).max(6), h: z.number().int().min(1).max(12), config: z.record(z.string(), z.unknown()) });
export const AuditEntrySchema = z.object({ id, at: ts, actorId: id, action: z.string(), target: z.string(), ok: z.boolean(), detail: z.string().optional() });

// ----- inputs (used by forms AND the service layer) -----
export const SignUpSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email.'), password: z.string().min(8, 'Password needs 8+ characters.').max(128), displayName: name });
export const SignInSchema = z.object({ email: z.string().trim().toLowerCase().email('Enter a valid email.'), password: z.string().min(1, 'Enter your password.').max(128) });
export const CharacterSchema = z.object({ displayName: name, characterClass: ClassSchema, avatar: z.string().min(1).max(8) });
export const CreateGuildhallSchema = z.object({ name });
export const CreateCampaignSchema = z.object({ guildhallId: id, name, description: z.string().trim().max(280).default('') });
export const CreateQuestSchema = z.object({ campaignId: id, title: z.string().trim().min(1, 'Name the quest.').max(120), description: z.string().trim().max(2000).default(''), xp: z.number().int().min(0).max(1000).default(50) });
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
export type CreateGuildhallInput = z.input<typeof CreateGuildhallSchema>;
export type CreateCampaignInput = z.input<typeof CreateCampaignSchema>;
export type CreateQuestInput = z.input<typeof CreateQuestSchema>;
export type MoveQuestInput = z.input<typeof MoveQuestSchema>;
export type MoveWidgetInput = z.input<typeof MoveWidgetSchema>;

// ----- Phase 2 additions -----
export const AssignQuestSchema = z.object({ questId: id, assigneeId: id.nullable() });
export const SetLayoutSchema = z.object({ campaignId: id, items: z.array(MoveWidgetSchema).min(1).max(50) });
export const MemberSchema = z.object({ userId: id, displayName: name, avatar: z.string().nullable(), characterClass: ClassSchema.nullable(), role: RoleSchema });
export type AssignQuestInput = z.input<typeof AssignQuestSchema>;
export type SetLayoutInput = z.input<typeof SetLayoutSchema>;
export type Member = z.infer<typeof MemberSchema>;
