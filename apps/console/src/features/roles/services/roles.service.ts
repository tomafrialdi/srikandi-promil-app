import { supabase } from '../../../lib/supabase'
import type { AuditExportRow, RolesOverview, SecurityData, SecurityDraft } from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchRolesOverview = () => rpc<RolesOverview>('admin_roles_overview')
export const fetchAuditExport = () => rpc<AuditExportRow[]>('admin_roles_audit_export', { p_limit: 1000 })

export const fetchSecurity = () => rpc<SecurityData>('admin_security_get')
export const requestSecurityChange = (draft: SecurityDraft) => rpc<string>('admin_security_request', { p_draft: draft })
export const decideSecurityChange = (id: string, approve: boolean) => rpc<void>('admin_security_decide', { p_id: id, p_approve: approve })
export const cancelSecurityChange = (id: string) => rpc<void>('admin_security_cancel', { p_id: id })
export const signOutAllSessions = () => rpc<number>('admin_security_sign_out_all')
export const checkMyIp = (ranges: string[]) => rpc<{ ip: string | null; allowed: boolean | null }>('admin_security_check_ip', { p_ranges: ranges })
