import type { AuditEventDetail } from '../types'

type Json = Record<string, unknown>

const str = (v: unknown) => (typeof v === 'string' && v ? v : null)
const isObj = (v: unknown): v is Json => typeof v === 'object' && v !== null && !Array.isArray(v)

export interface FieldAccess {
  label: string
  access: string
}

/** Optional blocks an event can carry in its metadata; the modal shows only what is there. */
export function readMeta(e: AuditEventDetail) {
  const m = e.metadata
  const fields = Array.isArray(m.fields) ? (m.fields as unknown[]).filter(isObj).map((f) => ({ label: String(f.label ?? ''), access: String(f.access ?? 'viewed') })) : []
  const before = isObj(m.before) ? m.before : str(m.from) ? { role: m.from_role ?? m.from } : null
  const after = isObj(m.after) ? m.after : str(m.to) ? { role: m.to_role ?? m.to } : null
  return {
    fields: fields as FieldAccess[],
    before,
    after,
    impact: Array.isArray(m.impact) ? (m.impact as unknown[]).map(String) : [],
    reason: str(m.reason),
    ticket: str(m.ticket),
    approver: str(m.approver),
    auth: str(m.auth),
    durationSeconds: typeof m.duration_s === 'number' ? m.duration_s : null,
    targetName: str(m.target_name),
    canRevert: e.action === 'admin.role_change' && str(m.from_role) !== null && str(m.target_id) !== null && m.reverts == null,
  }
}

/** TCK-4821 → 4821, used to open the ticket in the support inbox. */
export const ticketNumber = (ref: string | null) => ref?.match(/TCK-(\d+)/i)?.[1] ?? null

export const prettyJson = (v: unknown) => JSON.stringify(v, null, 2)
