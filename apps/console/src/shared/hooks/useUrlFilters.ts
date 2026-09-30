import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

/**
 * Keeps list filters + page in the URL query string.
 * `keys` maps a filter name to its query parameter, e.g. { search: 'q', tab: 'tab' }.
 */
export function useUrlFilters<K extends string>(keys: Record<K, string>, defaults: Partial<Record<K, string>> = {}) {
  const [params, setParams] = useSearchParams()

  const values = useMemo(() => {
    const out = {} as Record<K, string>
    for (const key of Object.keys(keys) as K[]) out[key] = params.get(keys[key]) ?? defaults[key] ?? ''
    return out
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params])

  const page = Math.max(1, Number(params.get('page') ?? 1) || 1)

  const setFilter = useCallback(
    (key: K, value: string) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          if (value && value !== (defaults[key] ?? '')) next.set(keys[key], value)
          else next.delete(keys[key])
          next.delete('page')
          return next
        },
        { replace: true },
      )
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return { values, page, setFilter, setPage }
}
