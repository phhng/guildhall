import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Panel, Txt } from '@/components/ui';
import { WIDGETS } from '@/features/widgets/registry';
import type { WidgetType } from '@/services/schemas';
import { useTheme } from '@/theme/useTheme';
import { hapticDrop, hapticPickup, playSound } from '@/utils/feedback';
import { gridApi } from './gridApi';

// The widget drawer. Tap a spell to add it, or hold and drag it onto the grid.
export function Spellbook({ onAdd }: { onAdd: (type: WidgetType) => void }) {
  return (
    <Panel style={{ zIndex: 50, marginBottom: 12 }}>
      <Txt muted style={{ fontSize: 16 }}>Spellbook: tap a widget to add it, or hold and drag it onto the grid.</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {(Object.keys(WIDGETS) as WidgetType[]).map((t) => <Chip key={t} type={t} onAdd={onAdd} />)}
      </View>
    </Panel>
  );
}

function Chip({ type, onAdd }: { type: WidgetType; onAdd: (t: WidgetType) => void }) {
  const { c, fonts, radius } = useTheme();
  const tx = useSharedValue(0), ty = useSharedValue(0), ax = useSharedValue(0), ay = useSharedValue(0), lift = useSharedValue(0), on = useSharedValue(false);
  const drop = (x: number, y: number) => { hapticDrop(); playSound('drop'); gridApi.current?.drop(type, x, y); };
  const pan = Gesture.Pan().activateAfterLongPress(200)
    .onStart(() => { on.value = true; lift.value = withTiming(1, { duration: 120 }); runOnJS(hapticPickup)(); })
    .onUpdate((e) => { tx.value = e.translationX; ty.value = e.translationY; ax.value = e.absoluteX; ay.value = e.absoluteY; })
    .onFinalize(() => {
      if (!on.value) return;
      on.value = false; lift.value = withTiming(0, { duration: 160 });
      runOnJS(drop)(ax.value, ay.value);
      tx.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) }); ty.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.cubic) });
    });
  const tap = Gesture.Tap().onEnd((_e, ok) => { if (ok) runOnJS(onAdd)(type); });
  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: 1 + 0.12 * lift.value }],
    zIndex: lift.value > 0 ? 100 : 0, shadowOpacity: 0.2 + 0.5 * lift.value, shadowRadius: 4 + 12 * lift.value, elevation: 2 + 22 * lift.value,
  }));
  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View accessible accessibilityRole="button" accessibilityLabel={`Add ${WIDGETS[type].label} to the War Room`} onAccessibilityTap={() => onAdd(type)}
        style={[{ minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, borderRadius: radius, borderWidth: 1, borderColor: c.gold, backgroundColor: c.leather, shadowColor: c.ember, shadowOffset: { width: 0, height: 2 } }, anim]}>
        <Text style={{ fontSize: 20, color: c.gold }}>{WIDGETS[type].rune}</Text>
        <Text style={{ fontFamily: fonts.body, fontSize: 16, color: c.text }}>{WIDGETS[type].label}</Text>
      </Animated.View>
    </GestureDetector>
  );
}
