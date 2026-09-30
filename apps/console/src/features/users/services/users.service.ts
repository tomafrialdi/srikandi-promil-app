import { supabase } from '../../../lib/supabase'
import type {
  ClinicJourney,
  DoctorCare,
  EngineLog,
  MedicationDetail,
  PlanCatalogItem,
  PlanQuote,
  RoleCatalog,
  UserDetail,
  UsersFilters,
  UsersList,
  UsersSummary,
} from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchUsersSummary = () => rpc<UsersSummary>('admin_users_summary')

export function fetchUsersList(filters: UsersFilters, page: number, pageSize: number) {
  return rpc<UsersList>('admin_users_list', {
    p_tab: filters.tab || 'all',
    p_search: filters.search || null,
    p_plan: filters.plan || null,
    p_mode: filters.mode || null,
    p_city: filters.city || null,
    p_status: filters.status || null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  })
}

export const fetchUserDetail = (userId: string) => rpc<UserDetail>('admin_user_detail', { p_user: userId })

export const fetchEngineLog = (userId: string, reason: string) =>
  rpc<EngineLog>('admin_user_engine_log', { p_user: userId, p_reason: reason })

export const fetchMedication = (id: string, reason: string) =>
  rpc<MedicationDetail>('admin_user_medication', { p_medication: id, p_reason: reason })

export const fetchDoctorCare = (linkId: string) => rpc<DoctorCare>('admin_user_doctor_care', { p_link: linkId })

export const fetchClinicJourney = (userId: string) => rpc<ClinicJourney>('admin_user_clinic_journey', { p_user: userId })

export const setUsersStatus = (ids: string[], status: 'active' | 'suspended', reason: string) =>
  rpc<number>('admin_set_users_status', { p_user_ids: ids, p_status: status, p_reason: reason })

export const grantPlus = (ids: string[], reason: string) => rpc<number>('admin_grant_plus', { p_user_ids: ids, p_reason: reason })

export const fetchPlanQuote = (userId: string, plan: string, promo: string, when: string) =>
  rpc<PlanQuote>('admin_plan_change_preview', { p_user: userId, p_plan: plan, p_promo: promo || null, p_when: when })

export interface ChangePlanInput {
  userId: string
  plan: string
  promo: string
  when: string
  refundAs: string
  reason: string
  ticket: string
  notify: boolean
}

export const changePlan = (input: ChangePlanInput) =>
  rpc<PlanQuote>('admin_change_plan', {
    p_user: input.userId,
    p_plan: input.plan,
    p_promo: input.promo || null,
    p_when: input.when,
    p_refund_as: input.refundAs,
    p_reason: input.reason,
    p_ticket: input.ticket || null,
    p_notify: input.notify,
  })

export async function fetchPlanCatalog(): Promise<PlanCatalogItem[]> {
  const { data, error } = await supabase
    .from('plan_catalog')
    .select('plan, label, price_idr, period_months, tagline')
    .neq('plan', 'trial')
    .order('sort_order')
  if (error) throw new Error(error.message)
  return data as PlanCatalogItem[]
}

export const fetchRoleCatalog = () => rpc<RoleCatalog>('admin_role_catalog')

export const inviteAdmins = (payload: Record<string, unknown>) =>
  rpc<{ created: Array<{ id: string; email: string; status: string }>; expires_at: string; needs_approval: boolean }>(
    'admin_invite_admins',
    { p_payload: payload },
  )
