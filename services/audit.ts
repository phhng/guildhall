import { randomId } from '@/utils/crypto';
import type { AuditEntry } from './schemas';

// Append-only: no update/delete exported; readers get a frozen copy.
// TODO(supabase): INSERT-only table (no UPDATE/DELETE grants), written by a trigger or edge function.
const log: AuditEntry[] = [];
export function appendAudit(e: Omit<AuditEntry, 'id' | 'at'>) {
  log.push(Object.freeze({ ...e, id: randomId('aud_'), at: Date.now() }));
}
export const readAudit = (): readonly AuditEntry[] => Object.freeze([...log]);
