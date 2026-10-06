import { Pressable, Text, View } from 'react-native';
import { GoldButton, Panel, Txt } from '@/components/ui';
import { useWarRoom } from '@/store/warRoomStore';
import { useWorkspace } from '@/store/workspaceStore';
import { useTheme } from '@/theme/useTheme';

function Btn({ glyph, label, onPress, disabled }: { glyph: string; label: string; onPress: () => void; disabled?: boolean }) {
  const { c, radius } = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled }} disabled={disabled} onPress={onPress}
      style={({ pressed }) => ({ width: 48, height: 48, borderRadius: radius, borderWidth: 1, borderColor: c.gold, alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1, backgroundColor: pressed ? c.leatherEdge : 'transparent' })}>
      <Text style={{ color: c.gold, fontSize: 26, lineHeight: 30 }}>{glyph}</Text>
    </Pressable>
  );
}

function Stepper({ name, disabled, onInc, onDec }: { name: string; disabled: boolean; onInc: () => void; onDec: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Txt bold style={{ minWidth: 80 }}>{name}:</Txt>
      <Btn glyph="+" label={`Increase ${name.toLowerCase()} of selected widgets`} disabled={disabled} onPress={onInc} />
      <Btn glyph="−" label={`Decrease ${name.toLowerCase()} of selected widgets`} disabled={disabled} onPress={onDec} />
    </View>
  );
}

// Undo/redo, multi-select actions, and width/height steppers for the selected widgets.
export function EditToolbar({ count, total, onSelectAll, onClear, onDelete, onResize }: {
  count: number; total: number; onSelectAll: () => void; onClear: () => void; onDelete?: () => void; onResize: (dw: number, dh: number) => void;
}) {
  const campaignId = useWorkspace((s) => s.campaignId);
  const { past, future, undo, redo } = useWarRoom();
  if (!campaignId) return null;
  return (
    <Panel style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <GoldButton label="Undo" variant="ghost" disabled={past.length === 0} onPress={() => undo(campaignId)} />
        <GoldButton label="Redo" variant="ghost" disabled={future.length === 0} onPress={() => redo(campaignId)} />
        <GoldButton label="Select all" variant="ghost" disabled={total === 0 || count === total} onPress={onSelectAll} />
        <GoldButton label="Clear selection" variant="ghost" disabled={count === 0} onPress={onClear} />
        {onDelete && <GoldButton label={count > 1 ? `Delete ${count}` : 'Delete'} variant="ghost" disabled={count === 0} onPress={onDelete} />}
      </View>
      <Txt muted style={{ fontSize: 16 }}>{count === 0 ? 'Tap widget titles to select one or more. Hold a title bar to drag.' : `${count} of ${total} selected`}</Txt>
      <Stepper name="Width" disabled={count === 0} onInc={() => onResize(1, 0)} onDec={() => onResize(-1, 0)} />
      <Stepper name="Height" disabled={count === 0} onInc={() => onResize(0, 1)} onDec={() => onResize(0, -1)} />
    </Panel>
  );
}
