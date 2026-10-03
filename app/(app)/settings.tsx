import { Switch, View } from 'react-native';
import { GoldButton, Panel, Screen, Txt } from '@/components/ui';
import { useAuth } from '@/store/authStore';
import { useSettings } from '@/store/settingsStore';
import { useTheme } from '@/theme/useTheme';

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const { c } = useTheme();
  return (
    <View style={{ minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Txt>{label}</Txt>
      <Switch accessibilityLabel={label} value={value} onValueChange={onChange} trackColor={{ true: c.gold, false: c.leatherEdge }} thumbColor={c.parchment} />
    </View>
  );
}

export default function Settings() {
  const { theme, gamification, notifications, set } = useSettings();
  const signOut = useAuth((s) => s.signOut);
  return (
    <Screen>
      <Panel>
        <Row label="Daylight Tavern theme" value={theme === 'light'} onChange={(v) => set({ theme: v ? 'light' : 'dark' })} />
        <Row label="Gamification (XP, levels, loot)" value={gamification} onChange={(v) => set({ gamification: v })} />
        <Row label="Notifications" value={notifications} onChange={(v) => set({ notifications: v })} />
      </Panel>
      <Txt muted>Data export and account deletion arrive in Phase 4 with the audit log.</Txt>
      <GoldButton label="Sign out" variant="ghost" onPress={signOut} />
    </Screen>
  );
}
