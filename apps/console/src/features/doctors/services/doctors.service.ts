import { supabase } from '../../../lib/supabase'
import type { ActivityItem, DoctorFull, DoctorsFilters, DoctorsList, DoctorsOptions, DoctorsSummary, VerifyItem } from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchDoctorsSummary = () => rpc<DoctorsSummary>('admin_doctors_summary')
export const fetchDoctorsOptions = () => rpc<DoctorsOptions>('admin_doctors_options')
export const fetchDoctor = (id: string) => rpc<DoctorFull>('admin_doctors_get', { p_id: id })
export const fetchActivity = (id: string, category?: string) => rpc<ActivityItem[]>('admin_doctors_activity', { p_id: id, p_category: category || null })
export const fetchVerifyQueue = () => rpc<VerifyItem[]>('admin_doctors_verify_queue')

export function fetchDoctorsList(filters: DoctorsFilters, page: number, pageSize: number) {
  return rpc<DoctorsList>('admin_doctors_list', { p_group: filters.group || null, p_search: filters.search || null, p_limit: pageSize, p_offset: (page - 1) * pageSize })
}

export const createDoctor = (payload: Record<string, unknown>, draft: boolean) => rpc<string>('admin_doctors_create', { p_payload: payload, p_draft: draft })
export const updateDoctor = (id: string, patch: Record<string, unknown>) => rpc<void>('admin_doctors_update', { p_id: id, p_patch: patch })
export const setDoctorStatus = (id: string, status: 'active' | 'suspended', reason: string) => rpc<void>('admin_doctors_set_status', { p_id: id, p_status: status, p_reason: reason })
export const verifyDoctor = (id: string, approve: boolean, note?: string) => rpc<void>('admin_doctors_verify', { p_id: id, p_approve: approve, p_note: note || null })
export const requestReverify = (id: string) => rpc<void>('admin_doctors_request_reverify', { p_id: id })
export const revokeSession = (id: string, session: string) => rpc<void>('admin_doctors_revoke_session', { p_id: id, p_session: session })
