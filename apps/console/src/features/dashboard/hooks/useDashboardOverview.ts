import { useCallback, useEffect, useState } from 'react'
import { fetchDashboardOverview } from '../services/dashboard.service'
import type { DashboardOverview } from '../types'

interface State {
  data: DashboardOverview | null
  loading: boolean
  error: string | null
}

export function useDashboardOverview() {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null })

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      setState({ data: await fetchDashboardOverview(), loading: false, error: null })
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Could not load the dashboard.'
      setState({ data: null, loading: false, error })
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    void load()
  }, [load])

  return { ...state, reload: load }
}
