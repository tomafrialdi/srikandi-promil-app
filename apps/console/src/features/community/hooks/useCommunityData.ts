import { useCallback } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { fetchCommunitySummary, fetchGroups, fetchPost, fetchQueue } from '../services/community.service'
import type { QueueTab } from '../types'

export const useCommunitySummary = () => useAsyncData('community-summary', fetchCommunitySummary)
export const useGroups = () => useAsyncData('community-groups', fetchGroups)

export function useQueue(tab: QueueTab) {
  const fetcher = useCallback(() => fetchQueue(tab), [tab])
  return useAsyncData(`community-queue-${tab}`, fetcher)
}

export function usePost(id: string | null) {
  const fetcher = useCallback(() => (id ? fetchPost(id) : Promise.resolve(null)), [id])
  return useAsyncData(`community-post-${id}`, fetcher)
}
