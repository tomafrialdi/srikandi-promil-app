import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { UsersFilters } from '../types'

const KEYS = ['tab', 'search', 'plan', 'mode', 'city', 'status'] as const

/** List filters + page live in the URL (?tab=paid&q=nadia&page=2) so they survive reloads and can be shared. */
export function useUsersFilters() {
  const [params, setParams] = useSearchParams()

  const filters: UsersFilters = useMemo(
    () => ({
      tab: params.get('tab') ?? 'all',
      search: params.get('q') ?? '',
      plan: params.get('plan') ?? '',
      mode: params.get('mode') ?? '',
      city: params.get('city') ?? '',
      status: params.get('status') ?? '',
    }),
    [params],
  )
  const page = Math.max(1, Number(params.get('page') ?? 1) || 1)

  const setFilter = useCallback(
    (key: (typeof KEYS)[number], value: string) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          const param = key === 'search' ? 'q' : key
          if (value && !(key === 'tab' && value === 'all')) next.set(param, value)
          else next.delete(param)
          next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const setPage = useCallback(
    (nextPage: number) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (nextPage > 1) next.set('page', String(nextPage))
          else next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return { filters, page, setFilter, setPage }
}
