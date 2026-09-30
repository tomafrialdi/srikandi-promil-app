import { supabase } from '../../../lib/supabase'
import type { DateRange } from '../../analytics/config/date-range'
import type {
  PlanEditor,
  PromoDetail,
  PromoRow,
  PromosSummary,
  Receipt,
  SubscriptionsOverview,
  TransactionFilters,
  TransactionsList,
  TransactionsSummary,
} from '../types'

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) throw new Error(error.message)
  return data as T
}

export const fetchOverview = () => rpc<SubscriptionsOverview>('admin_subscriptions_overview')

export const fetchPlanEditor = () => rpc<PlanEditor>('admin_plan_editor')

export const savePlan = (plan: string, payload: Record<string, unknown>, migrate: boolean) =>
  rpc<{ status: 'applied' | 'pending' }>('admin_save_plan', { p_plan: plan, p_payload: payload, p_migrate: migrate })

export const reviewPlanRequest = (id: number, approve: boolean) =>
  rpc<void>('admin_review_plan_request', { p_id: id, p_approve: approve })

export const fetchPromosSummary = () => rpc<PromosSummary>('admin_promos_summary')
export const fetchPromos = (tab: string) => rpc<PromoRow[]>('admin_promos_list', { p_tab: tab })
export const fetchPromoDetail = (code: string) => rpc<PromoDetail>('admin_promo_detail', { p_code: code })
export const savePromo = (payload: Record<string, unknown>) =>
  rpc<{ code: string; created: boolean }>('admin_save_promo', { p_payload: payload })
export const setPromoStatus = (code: string, status: 'active' | 'paused') =>
  rpc<void>('admin_set_promo_status', { p_code: code, p_status: status })

export const fetchTransactionsSummary = (range: DateRange) =>
  rpc<TransactionsSummary>('admin_transactions_summary', { p_from: range.from, p_to: range.to })

export function fetchTransactions(filters: TransactionFilters, range: DateRange, page: number, pageSize: number) {
  return rpc<TransactionsList>('admin_transactions_list', {
    p_tab: filters.tab || 'all',
    p_search: filters.search || null,
    p_from: range.from,
    p_to: range.to,
    p_channel: filters.channel || null,
    p_plan: filters.plan || null,
    p_promo: filters.promo || null,
    p_limit: pageSize,
    p_offset: (page - 1) * pageSize,
  })
}

export const fetchReceipt = (invoice: string) => rpc<Receipt>('admin_transaction_receipt', { p_invoice: invoice })
export const issueRefund = (invoice: string, reason: string) => rpc<void>('admin_issue_refund', { p_invoice: invoice, p_reason: reason })
