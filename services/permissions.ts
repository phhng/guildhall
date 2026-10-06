import type { Role } from './schemas';

export type Action =
  | 'campaign.create' | 'quest.create' | 'quest.move' | 'quest.delete'
  | 'widget.move' | 'widget.create' | 'widget.delete' | 'invite.create' | 'member.remove' | 'guildhall.delete';

const RANK: Record<Role, number> = { squire: 0, adventurer: 1, officer: 2, guildmaster: 3 };
const MIN_ROLE: Record<Action, Role> = {
  'campaign.create': 'officer', 'quest.create': 'adventurer', 'quest.move': 'adventurer', 'quest.delete': 'officer',
  'widget.move': 'adventurer', 'widget.create': 'adventurer', 'widget.delete': 'officer', 'invite.create': 'officer', 'member.remove': 'officer', 'guildhall.delete': 'guildmaster',
};
export const ROLE_LABEL: Record<Role, string> = { guildmaster: 'Guildmaster', officer: 'Officer', adventurer: 'Adventurer', squire: 'Squire' };

// UI may call this to hide buttons, but the service layer is what enforces it.
// TODO(supabase): mirror this matrix as Row Level Security policies; client checks are never authoritative.
export const can = (role: Role | null | undefined, action: Action) => !!role && RANK[role] >= RANK[MIN_ROLE[action]];
