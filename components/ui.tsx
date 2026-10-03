import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, type StyleProp, type TextInputProps, type TextProps, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/useTheme';

export function Screen({ children, headerless }: { children: ReactNode; headerless?: boolean }) {
  const { c, space } = useTheme();
  return (
    <SafeAreaView edges={headerless ? undefined : ['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: space.md, gap: space.md, width: '100%', maxWidth: 640, alignSelf: 'center' }}>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Heading({ children, size = 28 }: { children: ReactNode; size?: number }) {
  const { c, fonts } = useTheme();
  return <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: size, color: c.gold, letterSpacing: 1 }}>{children}</Text>;
}

export function Txt({ muted, bold, ink, style, ...p }: TextProps & { muted?: boolean; bold?: boolean; ink?: boolean }) {
  const { c, fonts } = useTheme();
  const color = ink ? (muted ? c.inkMuted : c.ink) : muted ? c.textMuted : c.text;
  return <Text {...p} style={[{ fontFamily: bold ? fonts.bodyBold : fonts.body, fontSize: 18, lineHeight: 26, color }, style]} />;
}

// Aged-leather panel with gold trim and a torchlit glow. `parchment` flips it to a parchment card (use <Txt ink>).
export function Panel({ children, parchment, style }: { children: ReactNode; parchment?: boolean; style?: StyleProp<ViewStyle> }) {
  const { c, radius, space } = useTheme();
  return (
    <View style={[{ backgroundColor: parchment ? c.parchment : c.leather, borderColor: c.gold, borderWidth: 1, borderRadius: radius, padding: space.md, gap: space.sm, shadowColor: c.ember, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 4 }, style]}>
      {children}
    </View>
  );
}

export function GoldButton({ label, onPress, variant = 'primary', disabled, loading }: { label: string; onPress: () => void; variant?: 'primary' | 'ghost'; disabled?: boolean; loading?: boolean }) {
  const { c, fonts, radius } = useTheme();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!(disabled || loading), busy: !!loading }}
      disabled={disabled || loading} onPress={onPress}
      style={({ pressed }) => ({ minHeight: 48, minWidth: 48, paddingHorizontal: 20, borderRadius: radius, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: c.gold, backgroundColor: primary ? c.gold : 'transparent', opacity: disabled ? 0.5 : 1, transform: [{ scale: pressed ? 0.97 : 1 }] })}>
      {loading ? <ActivityIndicator color={primary ? c.onGold : c.gold} /> : <Text style={{ fontFamily: fonts.display, fontSize: 15, letterSpacing: 1, color: primary ? c.onGold : c.gold }}>{label}</Text>}
    </Pressable>
  );
}

export function Field({ label, ...p }: TextInputProps & { label: string }) {
  const { c, fonts, radius } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Txt muted style={{ fontSize: 16 }}>{label}</Txt>
      <TextInput accessibilityLabel={label} placeholderTextColor={c.textMuted} autoCapitalize="none"
        style={{ minHeight: 48, borderWidth: 1, borderColor: c.leatherEdge, borderRadius: radius, paddingHorizontal: 12, color: c.text, backgroundColor: c.leather, fontFamily: fonts.body, fontSize: 18 }} {...p} />
    </View>
  );
}

export function ErrorBanner({ message }: { message: string | null }) {
  const { c, radius } = useTheme();
  if (!message) return null;
  return (
    <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ borderWidth: 1, borderColor: c.danger, borderRadius: radius, padding: 12, backgroundColor: c.leather }}>
      <Txt style={{ color: c.danger }}>{message}</Txt>
    </View>
  );
}
