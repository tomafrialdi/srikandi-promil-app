import { useCallback } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { PAGE_SIZE } from '../config/labels'
import { fetchMed, fetchMedsList, fetchMedsOptions, fetchMedsSummary } from '../services/medications.service'
import type { MedsFilters } from '../types'

export const useMedsSummary = () => useAsyncData('meds-summary', fetchMedsSummary)
export const useMedsOptions = () => useAsyncData('meds-options', fetchMedsOptions)

export function useMedsList(filters: MedsFilters, page: number) {
  const fetcher = useCallback(() => fetchMedsList(filters, page, PAGE_SIZE), [filters, page])
  return useAsyncData(JSON.stringify(['meds', filters, page]), fetcher)
}

export function useMed(id: string | null) {
  const fetcher = useCallback(() => (id ? fetchMed(id) : Promise.resolve(null)), [id])
  return useAsyncData(`med-${id}`, fetcher)
}
