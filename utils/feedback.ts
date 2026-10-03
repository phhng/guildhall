import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Plain functions (not methods) so they are safe to pass to runOnJS from gesture worklets.
export const hapticPickup = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };
export const hapticDrop = () => { if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

// Sound hooks (stubbed). TODO(phase5): play real samples with expo-audio.
export type SoundName = 'pickup' | 'drop' | 'roll' | 'levelUp';
export const playSound = (_name: SoundName) => {};
