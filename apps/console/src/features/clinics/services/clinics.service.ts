import { supabase } from '../../../lib/supabase'
import type { ClinicFull, ClinicsFilters, ClinicsList, ClinicsSummary, DoctorHit, ImportRow } from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchClinicsSummary = () => rpc<ClinicsSummary>('admin_clinics_summary')
export const fetchClinic = (id: string) => rpc<ClinicFull>('admin_clinics_get', { p_id: id })

export function fetchClinicsList(filters: ClinicsFilters, page: number, pageSize: number) {
  return rpc<ClinicsList>('admin_clinics_list', {
    p_tab: filters.tab || 'all',
    p_search: filters.search || null,
    p_city: filters.city || null,
    p_type: filters.type || null,
    p_bpjs: filters.bpjs || null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  })
}

export const saveClinic = (id: string | null, payload: Record<string, unknown>, submit: boolean) => rpc<string>('admin_clinics_save', { p_id: id, p_payload: payload, p_submit: submit })
export const approveClinic = (id: string) => rpc<void>('admin_clinics_approve', { p_id: id })
export const setClinicStatus = (id: string, status: 'suspended' | 'verified', reason: string) => rpc<void>('admin_clinics_set_status', { p_id: id, p_status: status, p_reason: reason })
export const requestDocs = (id: string, kinds: string[], message: string) => rpc<void>('admin_clinics_request_docs', { p_id: id, p_kinds: kinds, p_message: message })
export const setDocument = (id: string, kind: string, status: string, fileName?: string, note?: string) =>
  rpc<void>('admin_clinics_set_document', { p_id: id, p_kind: kind, p_status: status, p_file_name: fileName || null, p_note: note || null })
export const searchDoctors = (id: string, query: string) => rpc<DoctorHit[]>('admin_clinics_search_doctors', { p_id: id, p_query: query })
export const linkDoctor = (id: string, doctor: string, role: string) => rpc<void>('admin_clinics_link_doctor', { p_id: id, p_doctor: doctor, p_role: role })
export const unlinkDoctor = (id: string, doctor: string) => rpc<void>('admin_clinics_unlink_doctor', { p_id: id, p_doctor: doctor })
export const importClinics = (rows: ImportRow[]) => rpc<{ created: number; skipped: Array<{ row: number; reason: string }> }>('admin_clinics_import', { p_rows: rows })
