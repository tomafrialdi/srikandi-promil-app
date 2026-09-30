import { useCallback } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { fetchAlert, fetchAuditEvent, fetchAuditList, fetchAuditSummary, fetchPdp, fetchPdpList, fetchViews } from '../services/audit.service'
import type { ViewFilters } from '../types'

export const PAGE_SIZE = 10

export const useAuditSummary = () => useAsyncData('audit-summary', fetchAuditSummary)
export const usePdpList = () => useAsyncData('audit-pdp', fetchPdpList)
export const useViews = () => useAsyncData('audit-views', fetchViews)

export function useAuditList(filters: ViewFilters, page: number) {
  const fetcher = useCallback(() => fetchAuditList(filters, PAGE_SIZE, (page - 1) * PAGE_SIZE), [filters, page])
  return useAsyncData(JSON.stringify(['audit', filters, page]), fetcher)
}

export function useAuditEvent(id: number | null) {
  const fetcher = useCallback(() => (id != null ? fetchAuditEvent(id) : Promise.resolve(null)), [id])
  return useAsyncData(`audit-event-${id}`, fetcher)
}

export function useAlert(id: string | null) {
  const fetcher = useCallback(() => (id ? fetchAlert(id) : Promise.resolve(null)), [id])
  return useAsyncData(`audit-alert-${id}`, fetcher)
}

export function usePdp(id: string | null) {
  const fetcher = useCallback(() => (id ? fetchPdp(id) : Promise.resolve(null)), [id])
  return useAsyncData(`audit-pdp-${id}`, fetcher)
}
