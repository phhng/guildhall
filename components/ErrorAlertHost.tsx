import { useMemo } from 'react';
import { PanResponder, View } from 'react-native';
import messages from '@/messages/message.json';
import { useErrorAlert } from '@/store/errorAlertStore';
import { useTheme } from '@/theme/useTheme';
import { Txt } from './ui';

export function ErrorAlertHost() {
  const { c, radius } = useTheme();
  const message = useErrorAlert((s) => s.message);
  const dismiss = useErrorAlert((s) => s.dismiss);
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 18 || Math.abs(gesture.dy) > 18,
    onPanResponderRelease: (_, gesture) => {
      if (Math.abs(gesture.dx) > 32 || Math.abs(gesture.dy) > 32) dismiss();
    },
  }), [dismiss]);

  if (!message) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', top: 8, left: 12, right: 12, zIndex: 10000, elevation: 20 }}>
      <View {...responder.panHandlers} accessibilityRole="alert" accessibilityLiveRegion="polite"
        style={{ borderWidth: 1, borderColor: c.danger, borderRadius: radius, padding: 12, backgroundColor: c.leather, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}>
        <Txt bold style={{ color: c.danger, fontSize: 15 }}>{messages.alerts.errorTitle}</Txt>
        <Txt style={{ color: c.danger, fontSize: 16, lineHeight: 20 }}>{message}</Txt>
        <Txt muted style={{ textAlign: 'right', fontSize: 13, lineHeight: 16 }}>{messages.alerts.dismissHint}</Txt>
      </View>
    </View>
  );
}
