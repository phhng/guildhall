import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ErrorBanner, Field, GoldButton, Heading, Panel, Screen, Txt } from '@/components/ui';
import { AchievementGrid } from '@/features/achievements/AchievementGrid';
import { AVATARS, CLASS_INFO } from '@/features/character/classes';
import { useAuth } from '@/store/authStore';
import { CLASSES, type CharacterClass } from '@/services/schemas';
import { errorMessage } from '@/services/errors';
import { useCampaignData } from '@/features/warroom/useCampaignData';
import { useSettings } from '@/store/settingsStore';
import { useWorkspace } from '@/store/workspaceStore';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

export default function Profile() {
  const router = useRouter();
  const { c, fonts, radius } = useTheme();
  const { user, updateProfile, busy, error } = useAuth();
  const campaignId = useWorkspace((state) => state.campaignId);
  const gamification = useSettings((state) => state.gamification);
  const { quests, members, error: achievementsError, loading: achievementsLoading } = useCampaignData(gamification ? campaignId : null);
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [characterClass, setCharacterClass] = useState<CharacterClass>(user?.characterClass ?? 'wizard');
  const [avatar, setAvatar] = useState(user?.avatar ?? AVATARS[0]);
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage ?? null);
  const [bannerImage, setBannerImage] = useState<string | null>(user?.bannerImage ?? null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const chooseImage = async (target: 'profile' | 'banner') => {
    setPickerError(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: target === 'profile' ? [1, 1] : [3, 1],
        quality: 0.85,
      });
      if (result.canceled) return;
      const uri = result.assets[0]?.uri;
      if (!uri) throw new Error('The selected image could not be opened.');
      if (target === 'profile') setProfileImage(uri);
      else setBannerImage(uri);
      setSaved(false);
    } catch (e) {
      setPickerError(errorMessage(e));
    }
  };

  const save = async () => {
    const updated = await updateProfile({ displayName, characterClass, avatar, profileImage, bannerImage });
    setSaved(updated);
  };

  return (
    <Screen loading={Boolean(gamification && campaignId && achievementsLoading)}>
      <Heading>Edit your profile</Heading>
      <ErrorBanner message={error ?? pickerError} />
      {saved && <Txt accessibilityRole="alert">Your profile has been updated.</Txt>}

      <Panel style={{ padding: 0, overflow: 'visible' }}>
        <View style={{ height: 154, backgroundColor: c.leatherEdge, borderTopLeftRadius: radius, borderTopRightRadius: radius, overflow: 'hidden' }}>
          {bannerImage ? <Image source={{ uri: bannerImage }} resizeMode="cover" style={{ width: '100%', height: '100%' }} /> : <View style={{ flex: 1, backgroundColor: c.leatherEdge }} />}
        </View>
        <View style={{ position: 'absolute', top: 108, left: 0, right: 0, alignItems: 'center', zIndex: 1 }}>
          <View style={{ width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: c.gold, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {profileImage ? <Image source={{ uri: profileImage }} resizeMode="cover" style={{ width: '100%', height: '100%' }} /> : <Text style={{ fontSize: 44 }}>{avatar}</Text>}
          </View>
        </View>
        <View style={{ padding: 16, paddingTop: 56, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: profileImage ? 'flex-start' : 'center', gap: 8 }}>
            <GoldButton variant="ghost" label="Choose portrait" onPress={() => chooseImage('profile')}
              style={profileImage ? { flex: 1, minWidth: 0, paddingHorizontal: 8 } : { width: '75%', paddingHorizontal: 8 }} />
            {profileImage && <GoldButton variant="ghost" label="Remove" onPress={() => { setProfileImage(null); setSaved(false); }} style={{ flex: 1, minWidth: 0, paddingHorizontal: 8 }} />}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: bannerImage ? 'flex-start' : 'center', gap: 8 }}>
            <GoldButton variant="ghost" label="Choose banner" onPress={() => chooseImage('banner')}
              style={bannerImage ? { flex: 1, minWidth: 0, paddingHorizontal: 8 } : { width: '75%', paddingHorizontal: 8 }} />
            {bannerImage && <GoldButton variant="ghost" label="Remove" onPress={() => { setBannerImage(null); setSaved(false); }} style={{ flex: 1, minWidth: 0, paddingHorizontal: 8 }} />}
          </View>
        </View>
      </Panel>

      <Field label="Display name" value={displayName} onChangeText={(value) => { setDisplayName(value); setSaved(false); }} autoCapitalize="words" maxLength={40} />
      <Txt muted>Class</Txt>
      {CLASSES.map((item) => {
        const selected = item === characterClass;
        return (
          <Pressable key={item} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${CLASS_INFO[item].label}. ${CLASS_INFO[item].blurb}`} onPress={() => { setCharacterClass(item); setSaved(false); }}
            style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radius, borderWidth: selected ? 2 : 1, borderColor: selected ? c.gold : c.leatherEdge, backgroundColor: c.leather }}>
            <Text style={{ fontSize: 26, color: c.gold, width: 36, textAlign: 'center' }}>{CLASS_INFO[item].rune}</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 16, color: c.text }}>{CLASS_INFO[item].label}</Text>
              <Txt muted style={{ fontSize: 16 }}>{CLASS_INFO[item].blurb}</Txt>
            </View>
          </Pressable>
        );
      })}

      <Txt muted>Avatar icon</Txt>
      <Panel style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {AVATARS.map((item) => (
          <Pressable key={item} accessibilityRole="radio" accessibilityLabel={`Avatar ${item}`} accessibilityState={{ selected: item === avatar }} onPress={() => { setAvatar(item); setProfileImage(null); setSaved(false); }}
            style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: item === avatar ? 2 : 1, borderColor: item === avatar ? c.gold : c.leatherEdge }}>
            <Text style={{ fontSize: 26 }}>{item}</Text>
          </Pressable>
        ))}
      </Panel>
      <GoldButton label="Save profile" loading={busy} onPress={save} />

      <Heading size={24}>Achievements</Heading>
      {!gamification ? (
        <Panel>
          <Txt muted>Achievements are turned off.</Txt>
          <GoldButton variant="ghost" label="Open settings" onPress={() => router.push('/settings')} />
        </Panel>
      ) : !campaignId ? (
        <Panel><Txt muted>Choose a campaign to see your party achievements.</Txt></Panel>
      ) : (
        <Panel>
          <ErrorBanner message={achievementsError} />
          {achievementsLoading ? <Txt muted>Gathering your achievements...</Txt> : <AchievementGrid quests={quests} members={members} />}
        </Panel>
      )}
    </Screen>
  );
}
