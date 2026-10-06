import type { ComponentType } from 'react';
import type { z } from 'zod';
import { CONFIG_SCHEMAS, type WidgetType } from '@/services/schemas';
import { ActivityFeed } from './ActivityFeed';
import { BossFight } from './BossFight';
import { CampaignJournal } from './CampaignJournal';
import { DiceRoller } from './DiceRoller';
import { InitiativeTracker } from './InitiativeTracker';
import { PartyRoster } from './PartyRoster';
import { QuestBoard } from './QuestBoard';
import { SessionCalendar } from './SessionCalendar';
import { XpPanel } from './XpPanel';
import type { WidgetProps } from './types';

export interface WidgetDef { label: string; rune: string; component: ComponentType<WidgetProps>; defaultSize: { w: number; h: number }; configSchema: z.ZodTypeAny }

// type -> component + config schema + default size. Every WidgetType must be registered.
export const WIDGETS: Record<WidgetType, WidgetDef> = {
  questBoard: { label: 'Quest Board', rune: 'ᛊ', component: QuestBoard, defaultSize: { w: 2, h: 4 }, configSchema: CONFIG_SCHEMAS.questBoard },
  initiative: { label: 'Initiative Tracker', rune: 'ᚠ', component: InitiativeTracker, defaultSize: { w: 1, h: 3 }, configSchema: CONFIG_SCHEMAS.initiative },
  dice: { label: 'Dice Roller', rune: 'ᚦ', component: DiceRoller, defaultSize: { w: 1, h: 3 }, configSchema: CONFIG_SCHEMAS.dice },
  bossFight: { label: 'Boss Fight', rune: 'ᚷ', component: BossFight, defaultSize: { w: 2, h: 3 }, configSchema: CONFIG_SCHEMAS.bossFight },
  roster: { label: 'Party Roster', rune: 'ᛗ', component: PartyRoster, defaultSize: { w: 1, h: 2 }, configSchema: CONFIG_SCHEMAS.roster },
  journal: { label: 'Campaign Journal', rune: 'ᛚ', component: CampaignJournal, defaultSize: { w: 2, h: 3 }, configSchema: CONFIG_SCHEMAS.journal },
  calendar: { label: 'Calendar of Sessions', rune: 'ᛞ', component: SessionCalendar, defaultSize: { w: 2, h: 4 }, configSchema: CONFIG_SCHEMAS.calendar },
  xp: { label: 'XP and Achievements', rune: 'ᛉ', component: XpPanel, defaultSize: { w: 1, h: 3 }, configSchema: CONFIG_SCHEMAS.xp },
  activity: { label: 'Activity Feed', rune: 'ᚨ', component: ActivityFeed, defaultSize: { w: 1, h: 2 }, configSchema: CONFIG_SCHEMAS.activity },
};
export const widgetLabel = (t: WidgetType) => WIDGETS[t].label;
