import type { CharacterClass } from '@/services/schemas';

export const CLASS_INFO: Record<CharacterClass, { label: string; rune: string; blurb: string }> = {
  wizard: { label: 'Wizard', rune: 'ᛟ', blurb: 'Plans the campaign from the tower.' },
  rogue: { label: 'Rogue', rune: 'ᚦ', blurb: 'Ships fast and finds the shortcuts.' },
  cleric: { label: 'Cleric', rune: 'ᛉ', blurb: 'Keeps the party healthy and unblocked.' },
  ranger: { label: 'Ranger', rune: 'ᚨ', blurb: 'Scouts ahead and tracks the bugs.' },
  paladin: { label: 'Paladin', rune: 'ᛏ', blurb: 'Holds the line on quality.' },
};
export const AVATARS = ['🦉', '🐺', '🐉', '🦅', '🔥', '🌙', '⚔️', '🛡️'];
