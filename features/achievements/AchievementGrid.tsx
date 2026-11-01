import { useState } from 'react';
import { Image, Modal, Pressable, View } from 'react-native';
import { Heading, Panel, Txt } from '@/components/ui';
import { achievementsFor } from '@/features/achievements/catalog';
import type { Member, Quest } from '@/services/schemas';
import { useTheme } from '@/theme/useTheme';

export function AchievementGrid({ quests, members, presentation = 'profile' }: { quests: Quest[]; members: Member[]; presentation?: 'profile' | 'standalone' }) {
  const { c, radius } = useTheme();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const awards = achievementsFor(quests, members);
  const selected = awards.find((achievement) => achievement.id === selectedId);
  const earnedCount = awards.filter((achievement) => achievement.isEarned).length;

  return (
    <>
      <Txt muted>{earnedCount} of {awards.length} earned</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {awards.map((achievement) => (
          <Pressable key={achievement.id} accessibilityRole="button"
            accessibilityLabel={`${achievement.title}, ${achievement.isEarned ? 'earned' : `locked: ${achievement.unlockHint}`}`}
            onPress={() => setSelectedId(achievement.id)}
            style={{ width: '30%', minHeight: presentation === 'standalone' ? 124 : 112, alignItems: 'center', justifyContent: 'center', gap: 4, padding: 8, borderWidth: presentation === 'standalone' ? 0 : 1, borderColor: c.leatherEdge, borderRadius: radius, backgroundColor: presentation === 'standalone' ? 'transparent' : c.leather, opacity: achievement.isEarned ? 1 : 0.55 }}>
            <Image source={achievement.icon} style={{ width: presentation === 'standalone' ? 52 : 44, height: presentation === 'standalone' ? 52 : 44 }} resizeMode="contain" />
            <Txt bold style={{ textAlign: 'center', fontSize: 14, lineHeight: 18 }}>{achievement.title}</Txt>
            <Txt muted style={{ fontSize: 13, lineHeight: 16 }}>{achievement.isEarned ? 'Earned' : 'Locked'}</Txt>
          </Pressable>
        ))}
      </View>
      <Modal visible={selected !== undefined} transparent animationType="fade" onRequestClose={() => setSelectedId(null)}>
        {selected && (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close achievement details" onPress={() => setSelectedId(null)}
              style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.72)' }} />
            <View accessibilityViewIsModal style={{ width: '100%', maxWidth: 420 }}>
              <Panel style={{ alignItems: 'center', padding: 20, gap: 12 }}>
                <Pressable accessibilityRole="button" accessibilityLabel="Close achievement details" onPress={() => setSelectedId(null)}
                  style={{ position: 'absolute', top: 8, right: 8, zIndex: 1, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt bold style={{ fontSize: 28, lineHeight: 32 }}>×</Txt>
                </Pressable>
                <Image source={selected.icon} accessibilityLabel={`${selected.title} badge`} style={{ width: 140, height: 140 }} resizeMode="contain" />
                <Heading size={26}>{selected.title}</Heading>
                <Txt style={{ textAlign: 'center' }}>{selected.description}</Txt>
                <Txt muted style={{ textAlign: 'center' }}>{selected.isEarned ? 'This badge is yours.' : `How to earn it: ${selected.unlockHint}`}</Txt>
              </Panel>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}
