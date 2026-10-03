import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorBanner, GoldButton, Txt } from '@/components/ui';
import { Grid } from '@/features/warroom/Grid';
import { api } from '@/services';
import { can } from '@/services/permissions';
import { useWarRoom } from '@/store/warRoomStore';
import { useRole, useWorkspace } from '@/store/workspaceStore';
import { useTheme } from '@/theme/useTheme';

export default function WarRoom() {
  const { c, space } = useTheme();
  const campaignId = useWorkspace((s) => s.campaignId);
  const role = useRole();
  const { widgets, edit, error, loading, load, commit, setEdit } = useWarRoom();
  const [holding, setHolding] = useState(false); // freezes page scroll while a widget is held
  const mayEdit = can(role, 'widget.move');

  useEffect(() => {
    if (!campaignId) return;
    setEdit(false);
    load(campaignId);
    return api.realtime.subscribe(`campaign:${campaignId}`, () => { load(campaignId, true); });
  }, [campaignId, load, setEdit]);

  if (!campaignId) return <View style={{ flex: 1, backgroundColor: c.bg, padding: space.md }}><Txt muted>Pick a campaign first.</Txt></View>;
  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView scrollEnabled={!holding} contentContainerStyle={{ padding: space.md, gap: space.md, width: '100%', maxWidth: 1500, alignSelf: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <Txt muted style={{ flex: 1, fontSize: 16 }}>
            {edit ? 'Edit mode: hold a title bar to move a widget, drag the corner to resize.' : mayEdit ? 'View mode: widgets are locked in place.' : 'View only for your role.'}
          </Txt>
          {mayEdit && <GoldButton label={edit ? 'Done' : 'Edit layout'} variant={edit ? 'primary' : 'ghost'} onPress={() => setEdit(!edit)} />}
        </View>
        <ErrorBanner message={error} />
        {loading ? <Txt muted>Unrolling the war map...</Txt> : (
          <Grid widgets={widgets} campaignId={campaignId} edit={edit && mayEdit} onCommit={(changes) => commit(campaignId, changes)} onInteract={setHolding} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
