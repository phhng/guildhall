import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ErrorBanner, Field, GoldButton, Heading, Panel, Screen, Txt } from '@/components/ui';
import { AVATARS, CLASS_INFO } from '@/features/character/classes';
import { CLASSES, type CharacterClass } from '@/services/schemas';
import { useAuth } from '@/store/authStore';
import { useTheme } from '@/theme/useTheme';

export default function CharacterCreation() {
  const { c, fonts, radius } = useTheme();
  const { user, createCharacter, busy, error } = useAuth();
  const [displayName, setName] = useState(user?.displayName ?? '');
  const [cls, setCls] = useState<CharacterClass>('wizard');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  return (
    <Screen headerless>
      <Heading size={32}>Create your character</Heading>
      <ErrorBanner message={error} />
      <Field label="Character name" value={displayName} onChangeText={setName} autoCapitalize="words" />
      <Txt muted>Class</Txt>
      {CLASSES.map((k) => {
        const on = k === cls;
        return (
          <Pressable key={k} accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={`${CLASS_INFO[k].label}. ${CLASS_INFO[k].blurb}`} onPress={() => setCls(k)}
            style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius, borderWidth: on ? 2 : 1, borderColor: on ? c.gold : c.leatherEdge, backgroundColor: c.leather }}>
            <Text style={{ fontSize: 28, color: c.gold, width: 36, textAlign: 'center' }}>{CLASS_INFO[k].rune}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 16, color: c.text }}>{CLASS_INFO[k].label}</Text>
              <Txt muted style={{ fontSize: 16 }}>{CLASS_INFO[k].blurb}</Txt>
            </View>
          </Pressable>
        );
      })}
      <Txt muted>Avatar</Txt>
      <Panel style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {AVATARS.map((a) => (
          <Pressable key={a} accessibilityRole="radio" accessibilityLabel={`Avatar ${a}`} accessibilityState={{ selected: a === avatar }} onPress={() => setAvatar(a)}
            style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: a === avatar ? 2 : 1, borderColor: a === avatar ? c.gold : c.leatherEdge }}>
            <Text style={{ fontSize: 26 }}>{a}</Text>
          </Pressable>
        ))}
      </Panel>
      <GoldButton label="Begin the adventure" loading={busy} onPress={() => createCharacter({ displayName, characterClass: cls, avatar })} />
    </Screen>
  );
}
