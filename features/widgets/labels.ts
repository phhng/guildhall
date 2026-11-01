import type { WidgetType } from '@/services/schemas';

// Phase 2 grows this into the full registry: type -> component + config schema + default size.
export const WIDGET_LABELS: Record<WidgetType, string> = {
  questBoard: 'Quest Board', questDetails: 'Quest Details', initiative: 'Initiative Tracker', dice: 'Dice Roller', bossFight: 'Boss Fight',
  roster: 'Party Roster', journal: 'Campaign Journal', calendar: 'Calendar of Sessions', xp: 'XP and Achievements', activity: 'Activity Feed',
};
