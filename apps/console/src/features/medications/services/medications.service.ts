import { supabase } from '../../../lib/supabase'
import type { MedFields, MedFull, MedsFilters, MedsList, MedsOptions, MedsSummary } from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchMedsSummary = () => rpc<MedsSummary>('admin_medications_summary')
export const fetchMedsOptions = () => rpc<MedsOptions>('admin_medications_options')
export const fetchMed = (id: string) => rpc<MedFull>('admin_medications_get', { p_id: id })

export function fetchMedsList(filters: MedsFilters, page: number, pageSize: number) {
  return rpc<MedsList>('admin_medications_list', {
    p_tab: filters.tab || 'all',
    p_search: filters.search || null,
    p_type: filters.type || null,
    p_rx: filters.rx || null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  })
}

export const saveMed = (id: string | null, payload: MedFields, submit: boolean) =>
  rpc<string>('admin_medications_save', { p_id: id, p_payload: payload, p_submit: submit })
export const reviewMed = (id: string, approve: boolean, note?: string) => rpc<void>('admin_medications_review', { p_id: id, p_approve: approve, p_note: note || null })
export const deleteMed = (id: string) => rpc<void>('admin_medications_delete', { p_id: id })
export const withdrawMed = (id: string) => rpc<void>('admin_medications_withdraw', { p_id: id })
