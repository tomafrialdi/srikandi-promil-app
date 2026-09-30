import { useCallback } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { PAGE_SIZE } from '../config/labels'
import { fetchClinic, fetchClinicsList, fetchClinicsSummary } from '../services/clinics.service'
import type { ClinicsFilters } from '../types'

export const useClinicsSummary = () => useAsyncData('clinics-summary', fetchClinicsSummary)

export function useClinicsList(filters: ClinicsFilters, page: number) {
  const fetcher = useCallback(() => fetchClinicsList(filters, page, PAGE_SIZE), [filters, page])
  return useAsyncData(JSON.stringify(['clinics', filters, page]), fetcher)
}

export function useClinic(id: string | null) {
  const fetcher = useCallback(() => (id ? fetchClinic(id) : Promise.resolve(null)), [id])
  return useAsyncData(`clinic-${id}`, fetcher)
}
