import { supabase } from '../../../lib/supabase'
import { RANGES } from '../config/labels'
import type { AlertDetail, AuditEventDetail, AuditList, AuditSummary, ExportScope, PdpDetail, PdpList, PdpRequest, SavedView, ViewFilters } from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

/** The page filters as the RPCs expect them; the range becomes a concrete `from` at call time. */
export function toRpcFilters(f: ViewFilters): Record<string, unknown> {
  const hours = RANGES.find((r) => r.value === (f.range ?? '24h'))?.hours ?? 24
  return { category: f.category || null, risk: f.risk || null, search: f.search || null, from: new Date(Date.now() - hours * 3_600_000).toISOString() }
}

const scopeToRpc = (s: ExportScope) => ({ category: s.category || null, from: new Date(`${s.from}T00:00:00`).toISOString(), to: new Date(`${s.to}T23:59:59`).toISOString() })

export const fetchAuditSummary = () => rpc<AuditSummary>('admin_audit_summary')
export const fetchAuditList = (f: ViewFilters, limit: number, offset: number) => rpc<AuditList>('admin_audit_list', { p_filters: toRpcFilters(f), p_limit: limit, p_offset: offset })
export const fetchAuditEvent = (id: number) => rpc<AuditEventDetail>('admin_audit_get', { p_id: id })
export const countAudit = (s: ExportScope) => rpc<number>('admin_audit_count', { p_filters: scopeToRpc(s) })
export const exportAudit = (s: ExportScope, purpose: string) => rpc<{ rows: AuditEventDetail[]; count: number }>('admin_audit_export', { p_filters: scopeToRpc(s), p_purpose: purpose })
export const verifyChain = () => rpc<{ ok: boolean; rows: number; head: string; broken_at: number | null }>('admin_audit_verify')
export const flagEvent = (id: number, note?: string) => rpc<void>('admin_audit_flag', { p_id: id, p_note: note ?? null })
export const revertEvent = (id: number) => rpc<void>('admin_audit_revert', { p_id: id })

export const fetchAlert = (id: string) => rpc<AlertDetail>('admin_audit_alert_get', { p_id: id })
export const containAlert = (id: string, kind: string) => rpc<void>('admin_audit_alert_contain', { p_id: id, p_kind: kind })
export const resolveAlert = (id: string, resolution: string, note: string) => rpc<void>('admin_audit_alert_resolve', { p_id: id, p_resolution: resolution, p_note: note })

export const fetchPdpList = () => rpc<PdpList>('admin_pdp_list')
export const fetchPdp = (id: string) => rpc<PdpDetail>('admin_pdp_get', { p_id: id })
export const updatePdp = (id: string, patch: Record<string, unknown>) => rpc<void>('admin_pdp_update', { p_id: id, p_patch: patch })
export const issueCertificate = (id: string) => rpc<PdpRequest>('admin_pdp_certificate', { p_id: id })

export const fetchViews = () => rpc<SavedView[]>('admin_audit_views')
export const saveView = (name: string, filters: ViewFilters, shared: boolean) => rpc<string>('admin_audit_view_save', { p_name: name, p_filters: filters, p_shared: shared })
export const deleteView = (id: string) => rpc<void>('admin_audit_view_delete', { p_id: id })
