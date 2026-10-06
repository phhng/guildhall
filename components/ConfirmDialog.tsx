import { Modal, Pressable, Text, View } from 'react-native';
import { GoldButton, Panel, Txt } from '@/components/ui';
import { useTheme } from '@/theme/useTheme';

// Cross-platform confirmation popup (Alert.alert has no buttons on web).
export function ConfirmDialog({ visible, title, message, confirmLabel, onConfirm, onCancel }: { visible: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => void; onCancel: () => void }) {
  const { c, fonts, radius } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <View accessibilityViewIsModal style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Panel style={{ width: '100%', maxWidth: 420, gap: 14 }}>
          <Text accessibilityRole="header" style={{ fontFamily: fonts.display, fontSize: 20, color: c.gold }}>{title}</Text>
          <Txt>{message}</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' }}>
            <GoldButton label="Cancel" variant="ghost" onPress={onCancel} />
            <Pressable accessibilityRole="button" accessibilityLabel={confirmLabel} onPress={onConfirm}
              style={({ pressed }) => ({ minHeight: 48, paddingHorizontal: 20, borderRadius: radius, alignItems: 'center', justifyContent: 'center', backgroundColor: c.danger, opacity: pressed ? 0.85 : 1 })}>
              <Text style={{ fontFamily: fonts.display, fontSize: 15, letterSpacing: 1, color: c.onGold }}>{confirmLabel}</Text>
            </Pressable>
          </View>
        </Panel>
      </View>
    </Modal>
  );
}
