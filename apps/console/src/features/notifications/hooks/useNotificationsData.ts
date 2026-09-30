import { useCallback } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { PAGE_SIZE } from '../config/labels'
import { fetchCampaigns, fetchFailures, fetchHourlyOpens, fetchNotificationsSummary } from '../services/notifications.service'

export const useNotificationsSummary = () => useAsyncData('notif-summary', fetchNotificationsSummary)
export const useHourlyOpens = () => useAsyncData('notif-hourly', fetchHourlyOpens)
export const useFailures = () => useAsyncData('notif-failures', fetchFailures)

export function useCampaigns(tab: string, page: number) {
  const fetcher = useCallback(() => fetchCampaigns(tab, page, PAGE_SIZE), [tab, page])
  return useAsyncData(`notif-list-${tab}-${page}`, fetcher)
}
