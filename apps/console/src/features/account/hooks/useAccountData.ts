import { useAsyncData } from '../../../shared/hooks/useAsyncData'
import { fetchAccount, fetchActivity, fetchSessions, fetchTokens } from '../services/account.service'

export const useAccount = () => useAsyncData('account', fetchAccount)
export const useSessions = () => useAsyncData('account-sessions', fetchSessions)
export const useActivity = () => useAsyncData('account-activity', fetchActivity)
export const useTokens = () => useAsyncData('account-tokens', fetchTokens)
