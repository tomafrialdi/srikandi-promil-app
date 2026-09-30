import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { useCallback } from 'react'
import { fetchRoleCatalog } from '../../users/services/users.service'
import { MEMBERS_PAGE_SIZE } from '../config/members'
import { fetchMembersList, fetchMembersSummary, fetchRolesOverview, fetchSecurity } from '../services/roles.service'
import type { MembersFilters } from '../types'

export const useRolesOverview = () => useAsyncData('roles-overview', fetchRolesOverview)
export const useSecurity = () => useAsyncData('roles-security', fetchSecurity)

export const useMembersSummary = () => useAsyncData('members-summary', fetchMembersSummary)
export const useRoleCatalog = () => useAsyncData('role-catalog', fetchRoleCatalog)

export function useMembersList(filters: MembersFilters, page: number) {
  const fetcher = useCallback(() => fetchMembersList(filters, page, MEMBERS_PAGE_SIZE), [filters, page])
  return useAsyncData(JSON.stringify([filters, page]), fetcher)
}
