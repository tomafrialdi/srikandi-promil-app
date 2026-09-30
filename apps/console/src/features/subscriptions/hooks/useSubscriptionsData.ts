import { useCallback } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import type { DateRange } from '../../analytics/config/date-range'
import { TX_PAGE_SIZE } from '../config/labels'
import {
  fetchOverview,
  fetchPromoDetail,
  fetchPromos,
  fetchPromosSummary,
  fetchTransactions,
  fetchTransactionsSummary,
} from '../services/subscriptions.service'
import type { TransactionFilters } from '../types'

export const useOverview = () => useAsyncData('subs-overview', fetchOverview)
export const usePromosSummary = () => useAsyncData('promos-summary', fetchPromosSummary)

export function usePromos(tab: string) {
  const fetcher = useCallback(() => fetchPromos(tab), [tab])
  return useAsyncData(`promos-${tab}`, fetcher)
}

export function usePromoDetail(code: string | null) {
  const fetcher = useCallback(() => (code ? fetchPromoDetail(code) : Promise.resolve(null)), [code])
  return useAsyncData(`promo-${code}`, fetcher)
}

export function useTransactionsSummary(range: DateRange) {
  const fetcher = useCallback(() => fetchTransactionsSummary(range), [range])
  return useAsyncData(`tx-summary-${range.from}-${range.to}`, fetcher)
}

export function useTransactions(filters: TransactionFilters, range: DateRange, page: number) {
  const fetcher = useCallback(() => fetchTransactions(filters, range, page, TX_PAGE_SIZE), [filters, range, page])
  return useAsyncData(JSON.stringify([filters, range.from, range.to, page]), fetcher)
}
