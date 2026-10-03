export type Mode = 'dark' | 'light';
export const palettes = {
  // Dark fantasy: torchlit leather, parchment, gold trim
  dark: { bg: '#120d09', leather: '#2a1c12', leatherEdge: '#4a3322', parchment: '#e9dbb8', ink: '#2b1d10', inkMuted: '#5e4a33', text: '#f0e3c4', textMuted: '#b9a47e', gold: '#d9ab3f', ember: '#ff8a3d', danger: '#ff7a6e', onGold: '#1a1208' },
  // "Daylight Tavern": contrast-checked darker gold/ink on warm parchment
  light: { bg: '#f1e4c6', leather: '#dcc496', leatherEdge: '#a98350', parchment: '#fbf4e0', ink: '#2b1d10', inkMuted: '#5a4730', text: '#2b1d10', textMuted: '#5a4730', gold: '#7a5610', ember: '#b4501c', danger: '#a3261c', onGold: '#fff8e6' },
};
export type Palette = typeof palettes.dark;
export const fonts = { display: 'Cinzel_700Bold', body: 'CrimsonText_400Regular', bodyBold: 'CrimsonText_600SemiBold' };
export const space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 40 };
export const radius = 10;
