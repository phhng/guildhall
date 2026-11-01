import { useCallback, useEffect, useState } from 'react';
import { api } from '@/services';
import { errorMessage } from '@/services/errors';
import type { AuditEntry, Member, Quest } from '@/services/schemas';
import { useWorkspace } from '@/store/workspaceStore';
import { useErrorAlert } from '@/store/errorAlertStore';

// Quests, party and activity for one campaign, kept fresh through the realtime channel.
export function useCampaignData(campaignId: string | null) {
  const guildhallId = useWorkspace((s) => s.guildhallId);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [activity, setActivity] = useState<AuditEntry[]>([]);
  const [error, setErrorState] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(campaignId));
  const setError = useCallback((message: string | null) => {
    setErrorState(message);
    if (message) useErrorAlert.getState().show(message);
  }, []);
  const reload = useCallback(async () => {
    if (!guildhallId || !campaignId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [q, m, a] = await Promise.all([api.quests.list(campaignId), api.members.list(guildhallId), api.activity.list(guildhallId)]);
      setQuests(q); setMembers(m); setActivity(a);
      setError(null);
    } catch (e) { setError(errorMessage(e)); }
    finally { setLoading(false); }
  }, [campaignId, guildhallId, setError]);
  useEffect(() => {
    if (!campaignId) return;
    reload();
    return api.realtime.subscribe(`campaign:${campaignId}`, () => { reload(); });
  }, [campaignId, reload]);
  return { quests, members, activity, error, setError, reload, loading };
}
