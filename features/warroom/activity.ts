const VERBS: Record<string, string> = {
  'quest.create': 'posted a new quest', 'quest.move': 'updated a quest', 'quest.delete': 'removed a quest',
  'widget.move': 'rearranged the War Room', 'widget.create': 'added a widget', 'widget.delete': 'removed a widget',
  'campaign.create': 'launched a campaign', 'guildhall.create': 'founded the guildhall', 'character.create': 'created a character',
};
export const describeAction = (action: string) => VERBS[action] ?? 'took an action';
export function ago(at: number) {
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 60) return 'just now';
  const m = Math.round(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60); if (h < 24) return `${h} h ago`;
  return `${Math.round(h / 24)} d ago`;
}
