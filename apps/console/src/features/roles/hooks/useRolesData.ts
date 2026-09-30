import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { fetchRolesOverview, fetchSecurity } from '../services/roles.service'

export const useRolesOverview = () => useAsyncData('roles-overview', fetchRolesOverview)
export const useSecurity = () => useAsyncData('roles-security', fetchSecurity)
