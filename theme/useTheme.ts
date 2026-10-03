import { useSettings } from '@/store/settingsStore';
import { palettes, fonts, space, radius } from './tokens';

export function useTheme() {
  const mode = useSettings((s) => s.theme);
  return { mode, c: palettes[mode], fonts, space, radius };
}
