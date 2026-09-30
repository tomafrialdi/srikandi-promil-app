import { useCallback } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { PAGE_SIZE } from '../config/labels'
import { fetchActivity, fetchDoctor, fetchDoctorsList, fetchDoctorsOptions, fetchDoctorsSummary, fetchVerifyQueue } from '../services/doctors.service'
import type { DoctorsFilters } from '../types'

export const useDoctorsSummary = () => useAsyncData('doctors-summary', fetchDoctorsSummary)
export const useDoctorsOptions = () => useAsyncData('doctors-options', fetchDoctorsOptions)

export function useDoctorsList(filters: DoctorsFilters, page: number) {
  const fetcher = useCallback(() => fetchDoctorsList(filters, page, PAGE_SIZE), [filters, page])
  return useAsyncData(JSON.stringify(['doctors', filters, page]), fetcher)
}

export function useDoctor(id: string | null) {
  const fetcher = useCallback(() => (id ? fetchDoctor(id) : Promise.resolve(null)), [id])
  return useAsyncData(`doctor-${id}`, fetcher)
}

export function useDoctorActivity(id: string, category: string) {
  const fetcher = useCallback(() => fetchActivity(id, category), [id, category])
  return useAsyncData(`doctor-activity-${id}-${category}`, fetcher)
}

export function useVerifyQueue(open: boolean) {
  const fetcher = useCallback(() => (open ? fetchVerifyQueue() : Promise.resolve(null)), [open])
  return useAsyncData(`doctors-verify-${open}`, fetcher)
}
