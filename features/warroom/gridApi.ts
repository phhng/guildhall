import type { WidgetType } from '@/services/schemas';

// The Spellbook lives outside the Grid, so the Grid registers a drop handler here while edit mode is on.
export const gridApi: { current: null | { drop(type: WidgetType, absX: number, absY: number): void } } = { current: null };
