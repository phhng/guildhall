import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { GoldButton, Heading, Panel, Txt } from '@/components/ui';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { api } from '@/services';
import { errorMessage } from '@/services/errors';
import type { Member, Quest } from '@/services/schemas';
import { useTheme } from '@/theme/useTheme';
import { hapticDrop, hapticPickup } from '@/utils/feedback';
import type { WidgetProps } from './types';

const COLS = [
  { key: 'backlog', label: 'Backlog' }, { key: 'inProgress', label: 'In Progress' },
  { key: 'inReview', label: 'In Review' }, { key: 'slain', label: 'Slain' },
] as const;

const asDateInput = (timestamp: number | null) => timestamp === null ? '' : new Date(timestamp).toISOString().slice(0, 10);
const parseDateInput = (value: string): number | null => {
  if (!value.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) throw new Error('Enter a deadline as YYYY-MM-DD or leave it blank.');
  const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day)
    throw new Error('Enter a valid calendar date.');
  return date.getTime();
};

export function QuestBoard({ campaignId }: WidgetProps) {
  const { c, fonts, radius } = useTheme();
  const { quests, members, setError } = useCampaignData(campaignId);
  const [colW, setColW] = useState(0);
  const [dragCol, setDragCol] = useState<number | null>(null);
  const [detail, setDetail] = useState<Quest | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState<Quest | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState('5');
  const [deadline, setDeadline] = useState('');
  const [saving, setSaving] = useState(false);

  const move = async (q: Quest, col: number) => {
    const status = COLS[col].key;
    if (status === q.status) return;
    try { await api.quests.move({ questId: q.id, status, order: Date.now() }); } catch (e) { setError(errorMessage(e)); }
  };
  const openCreate = () => {
    setError(null);
    setEditing(null); setTitle(''); setDescription(''); setNotes(''); setPriority('5'); setDeadline('');
    setFormOpen(true);
  };
  const openEdit = () => {
    if (!detail) return;
    setEditing(detail); setTitle(detail.title); setDescription(detail.description); setNotes(detail.notes);
    setPriority(String(detail.priority)); setDeadline(asDateInput(detail.dueAt));
    setDetail(null); setFormOpen(true);
  };
  const save = async () => {
    const parsedPriority = Number(priority);
    if (!Number.isInteger(parsedPriority) || parsedPriority < 1 || parsedPriority > 10) {
      setError('Priority must be a whole number from 1 to 10.');
      return;
    }
    let dueAt: number | null;
    try { dueAt = parseDateInput(deadline); } catch (e) { setError(e instanceof Error ? e.message : errorMessage(e)); return; }
    setSaving(true);
    try {
      if (editing) {
        await api.quests.update({ questId: editing.id, title, description, notes, priority: parsedPriority, dueAt });
      } else {
        await api.quests.create({ campaignId, title, description, notes, priority: parsedPriority, dueAt });
      }
      setFormOpen(false);
    } catch (e) { setError(errorMessage(e)); }
    finally { setSaving(false); }
  };
  const remove = async () => {
    if (!detail) return;
    try {
      await api.quests.delete({ questId: detail.id });
      setConfirmDelete(false); setDetail(null);
    } catch (e) { setError(errorMessage(e)); }
  };

  return (
    <View style={{ flex: 1, padding: 8, gap: 8 }}>
      <GoldButton label="Add quest" onPress={openCreate} />
      <ScrollView>
        <View style={{ flexDirection: 'row' }} onLayout={(e) => setColW(e.nativeEvent.layout.width / COLS.length)}>
          {COLS.map((col, i) => (
            <View key={col.key} style={{ flex: 1, paddingHorizontal: 3, gap: 6, zIndex: dragCol === i ? 10 : 0 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 13, color: c.gold }} numberOfLines={1}>{col.label}</Text>
              {quests.filter((q) => q.status === col.key).sort((a, b) => a.order - b.order).map((q) => (
                <QuestCard key={q.id} q={q} col={i} colW={colW} assignee={members.find((m) => m.userId === q.assigneeId)}
                  onOpen={() => setDetail(q)} onDragState={(on) => setDragCol(on ? i : null)} onMove={(to) => move(q, to)} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={detail !== null} transparent animationType="fade" onRequestClose={() => setDetail(null)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 18, backgroundColor: 'rgba(0,0,0,0.72)' }}>
          <Pressable accessibilityLabel="Close quest details" onPress={() => setDetail(null)} style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }} />
          {detail && <Panel style={{ maxWidth: 560, width: '100%', alignSelf: 'center', gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Heading size={22}>{detail.title}</Heading>
              <Pressable accessibilityRole="button" accessibilityLabel="Close quest details" onPress={() => setDetail(null)} style={{ marginLeft: 'auto', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Txt bold style={{ fontSize: 28 }}>×</Txt>
              </Pressable>
            </View>
            <Txt>Priority: {detail.priority}/10</Txt>
            {detail.dueAt !== null && <Txt>Deadline: {asDateInput(detail.dueAt)}</Txt>}
            <Txt>{detail.description || 'No description provided.'}</Txt>
            <Txt muted bold>Notes</Txt>
            <Txt>{detail.notes || 'No notes yet.'}</Txt>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <GoldButton label="Edit quest" onPress={openEdit} />
              <GoldButton label="Delete quest" variant="ghost" onPress={() => setConfirmDelete(true)} />
            </View>
          </Panel>}
        </View>
      </Modal>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, justifyContent: 'center', padding: 16, backgroundColor: 'rgba(0,0,0,0.76)' }}>
          <Panel style={{ width: '100%', maxWidth: 560, maxHeight: '90%', alignSelf: 'center' }}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Heading size={22}>{editing ? 'Edit quest' : 'New quest'}</Heading>
                <Pressable accessibilityRole="button" accessibilityLabel="Close quest form" onPress={() => setFormOpen(false)} style={{ marginLeft: 'auto', minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt bold style={{ fontSize: 28 }}>×</Txt>
                </Pressable>
              </View>
              <QuestField label="Title" value={title} onChangeText={setTitle} placeholder="Name this quest" />
              <QuestField label="Description" value={description} onChangeText={setDescription} multiline placeholder="What needs to be done?" />
              <QuestField label="Notes" value={notes} onChangeText={setNotes} multiline placeholder="Add helpful details or progress notes" />
              <QuestField label="Priority (1-10)" value={priority} onChangeText={setPriority} keyboardType="number-pad" />
              <QuestField label="Deadline (YYYY-MM-DD, optional)" value={deadline} onChangeText={setDeadline} placeholder="Leave blank for no deadline" />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <GoldButton label={editing ? 'Save changes' : 'Create quest'} onPress={save} loading={saving} />
                <GoldButton label="Cancel" variant="ghost" onPress={() => setFormOpen(false)} />
              </View>
            </ScrollView>
          </Panel>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.76)' }}>
          <Panel style={{ width: '100%', maxWidth: 420, alignSelf: 'center' }}>
            <Heading size={22}>Delete this quest?</Heading>
            <Txt>This cannot be undone.</Txt>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <GoldButton label="Cancel" variant="ghost" onPress={() => setConfirmDelete(false)} />
              <GoldButton label="Delete" onPress={remove} />
            </View>
          </Panel>
        </View>
      </Modal>
    </View>
  );
}

function QuestField({ label, multiline, ...input }: { label: string; multiline?: boolean } & TextInputProps) {
  const { c, fonts, radius } = useTheme();
  return (
    <View style={{ gap: 4 }}>
      <Txt muted style={{ fontSize: 15 }}>{label}</Txt>
      <TextInput accessibilityLabel={label} placeholderTextColor={c.textMuted} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'}
        style={{ minHeight: multiline ? 80 : 48, borderWidth: 1, borderColor: c.leatherEdge, borderRadius: radius, padding: 10, color: c.text, fontFamily: fonts.body, fontSize: 16 }}
        {...input} />
    </View>
  );
}

function QuestCard({ q, col, colW, assignee, onOpen, onDragState, onMove }: { q: Quest; col: number; colW: number; assignee?: Member; onOpen: () => void; onDragState: (on: boolean) => void; onMove: (to: number) => void }) {
  const { c, radius } = useTheme();
  const tx = useSharedValue(0), ty = useSharedValue(0), lift = useSharedValue(0), on = useSharedValue(false);
  const last = COLS.length - 1;
  const pan = Gesture.Pan().activateAfterLongPress(250)
    .onStart(() => { on.value = true; lift.value = withTiming(1, { duration: 120 }); runOnJS(onDragState)(true); runOnJS(hapticPickup)(); })
    .onUpdate((e) => { tx.value = e.translationX; ty.value = e.translationY; })
    .onFinalize(() => {
      if (!on.value) return;
      on.value = false;
      const to = colW > 0 ? Math.min(Math.max(col + Math.round(tx.value / colW), 0), last) : col;
      tx.value = withSpring(0); ty.value = withSpring(0); lift.value = withTiming(0, { duration: 160 });
      runOnJS(onDragState)(false); runOnJS(hapticDrop)(); runOnJS(onMove)(to);
    });
  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: 1 + 0.06 * lift.value }],
    shadowOpacity: 0.2 + 0.5 * lift.value, shadowRadius: 4 + 12 * lift.value, elevation: 2 + 10 * lift.value, zIndex: lift.value > 0 ? 5 : 0,
  }));
  const step = (d: number, label: string) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`Move ${q.title} to ${label}`} hitSlop={4} onPress={() => onMove(col + d)}
      style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: 22, color: c.inkMuted }}>{d < 0 ? '‹' : '›'}</Text>
    </Pressable>
  );
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ backgroundColor: c.parchment, borderRadius: radius, padding: 8, shadowColor: c.ember, shadowOffset: { width: 0, height: 2 } }, anim]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Open quest ${q.title}`} onPress={onOpen} style={{ minHeight: 44, justifyContent: 'center' }}>
          <Txt ink bold style={{ fontSize: 16, lineHeight: 20 }}>{q.title}</Txt>
          <Txt ink muted style={{ fontSize: 13, lineHeight: 17 }}>Priority {q.priority}/10 · {q.xp} XP</Txt>
          {q.dueAt !== null && <Txt ink muted style={{ fontSize: 12, lineHeight: 16 }}>Due {asDateInput(q.dueAt)}</Txt>}
          <Txt ink muted numberOfLines={1} style={{ fontSize: 13, lineHeight: 17 }}>{assignee ? `${assignee.avatar ?? ''} ${assignee.displayName}` : 'Unassigned'}</Txt>
        </Pressable>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          {col > 0 ? step(-1, COLS[col - 1].label) : <View style={{ width: 40 }} />}
          {col < last ? step(1, COLS[col + 1].label) : <View style={{ width: 40 }} />}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}
