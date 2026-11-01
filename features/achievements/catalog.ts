import type { ImageSourcePropType } from 'react-native';
import type { Member, Quest } from '@/services/schemas';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlockHint: string;
  icon: ImageSourcePropType;
  earned(quests: Quest[], members: Member[]): boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-blood',
    title: 'First Blood',
    description: 'Every legend begins with one completed quest. Your party has claimed its first victory.',
    unlockHint: 'Slay your first quest.',
    icon: require('../../assets/achievements/first-blood.png'),
    earned: (quests) => quests.some((quest) => quest.status === 'slain'),
  },
  {
    id: 'dragon-slayer',
    title: 'Backlog Dragon',
    description: 'The backlog has been cleared. No unfinished quest remains to haunt the guildhall.',
    unlockHint: 'Empty the Backlog.',
    icon: require('../../assets/achievements/dragon-slayer.png'),
    earned: (quests) => quests.length > 0 && !quests.some((quest) => quest.status === 'backlog'),
  },
  {
    id: 'full-party',
    title: 'Full Party',
    description: 'A strong party shares the burden. Three or more adventurers now stand together.',
    unlockHint: 'Gather three adventurers.',
    icon: require('../../assets/achievements/full-party.png'),
    earned: (_quests, members) => members.length >= 3,
  },
  {
    id: 'quest-veteran',
    title: 'Quest Veteran',
    description: 'Ten completed quests have tested the party and forged a seasoned crew.',
    unlockHint: 'Slay ten quests.',
    icon: require('../../assets/achievements/quest-veteran.png'),
    earned: (quests) => quests.filter((quest) => quest.status === 'slain').length >= 10,
  },
];

export function achievementsFor(quests: Quest[], members: Member[]) {
  return ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    isEarned: achievement.earned(quests, members),
  }));
}
