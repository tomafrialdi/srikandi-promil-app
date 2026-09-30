import { useCallback } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { fetchAgents, fetchMacros, fetchSupportSummary, fetchTicket, fetchTickets } from '../services/support.service'
import type { TicketFilters } from '../types'

export const LIST_LIMIT = 50

export const useSupportSummary = () => useAsyncData('support-summary', fetchSupportSummary)
export const useAgents = () => useAsyncData('support-agents', fetchAgents)
export const useMacros = () => useAsyncData('support-macros', fetchMacros)

export function useTickets(filters: TicketFilters) {
  const fetcher = useCallback(() => fetchTickets(filters, LIST_LIMIT), [filters])
  return useAsyncData(JSON.stringify(['tickets', filters]), fetcher)
}

export function useTicket(id: string | null) {
  const fetcher = useCallback(() => (id ? fetchTicket(id) : Promise.resolve(null)), [id])
  return useAsyncData(`ticket-${id}`, fetcher)
}
