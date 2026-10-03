import type { ComponentType } from 'react';
import { z } from 'zod';
import type { WidgetType } from '@/services/schemas';
import { DiceRoller } from './DiceRoller';
import { PartyRoster } from './PartyRoster';
import { QuestBoard } from './QuestBoard';
import { WIDGET_LABELS } from './labels';
import type { WidgetProps } from './types';

export interface WidgetDef { label: string; component: ComponentType<WidgetProps>; defaultSize: { w: number; h: number }; configSchema: z.ZodTypeAny }

// type -> component + config schema + default size. Unregistered types render a placeholder tile (Phase 3).
export const WIDGETS: Partial<Record<WidgetType, WidgetDef>> = {
  questBoard: { label: 'Quest Board', component: QuestBoard, defaultSize: { w: 2, h: 4 }, configSchema: z.object({}) },
  dice: { label: 'Dice Roller', component: DiceRoller, defaultSize: { w: 1, h: 2 }, configSchema: z.object({ sides: z.number().int().min(2).max(100).default(20) }) },
  roster: { label: 'Party Roster', component: PartyRoster, defaultSize: { w: 1, h: 2 }, configSchema: z.object({}) },
};
export const widgetLabel = (t: WidgetType) => WIDGETS[t]?.label ?? WIDGET_LABELS[t];
