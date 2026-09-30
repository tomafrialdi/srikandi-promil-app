import { useCallback } from 'react'
import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { PAGE_SIZE } from '../config/labels'
import { fetchUserDetail, fetchUsersList, fetchUsersSummary } from '../services/users.service'
import type { UsersFilters } from '../types'

export function useUsersSummary() {
  return useAsyncData('users-summary', fetchUsersSummary)
}

export function useUsersList(filters: UsersFilters, page: number) {
  const fetcher = useCallback(() => fetchUsersList(filters, page, PAGE_SIZE), [filters, page])
  return useAsyncData(JSON.stringify([filters, page]), fetcher)
}

export function useUserDetail(userId: string) {
  const fetcher = useCallback(() => fetchUserDetail(userId), [userId])
  return useAsyncData(`user-${userId}`, fetcher)
}
