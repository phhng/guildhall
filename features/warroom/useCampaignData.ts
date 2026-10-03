import { useCallback, useEffect, useState } from 'react';
import { api } from '@/services';
import { errorMessage } from '@/services/errors';
import type { Member, Quest } from '@/services/schemas';
import { useWorkspace } from '@/store/workspaceStore';

// Quests + party for one campaign, kept fresh through the realtime channel.
export function useCampaignData(campaignId: string) {
  const guildhallId = useWorkspace((s) => s.guildhallId);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    if (!guildhallId) return;
    try {
      const [q, m] = await Promise.all([api.quests.list(campaignId), api.members.list(guildhallId)]);
      setQuests(q); setMembers(m);
    } catch (e) { setError(errorMessage(e)); }
  }, [campaignId, guildhallId]);
  useEffect(() => {
    reload();
    return api.realtime.subscribe(`campaign:${campaignId}`, () => { reload(); });
  }, [campaignId, reload]);
  return { quests, members, error, setError, reload };
}
