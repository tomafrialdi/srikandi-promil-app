import { useCallback, useEffect, useState } from 'react'

interface Result<T> {
  key: string
  data?: T
  error?: string
}

/**
 * Runs `fetcher` whenever `key` changes. Keeps the previous data while reloading;
 * `reload()` forces a refetch with the same key. `fetcher` must be stable (module function or useCallback).
 */
export function useAsyncData<T>(key: string, fetcher: () => Promise<T>) {
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result<T>>()
  const fullKey = `${key}|${attempt}`

  useEffect(() => {
    let cancelled = false
    fetcher()
      .then((data) => !cancelled && setResult({ key: fullKey, data }))
      .catch((err: unknown) => {
        if (!cancelled) setResult({ key: fullKey, error: err instanceof Error ? err.message : 'Something went wrong.' })
      })
    return () => {
      cancelled = true
    }
  }, [fullKey, fetcher])

  const reload = useCallback(() => setAttempt((n) => n + 1), [])
  const settled = result?.key === fullKey

  return { data: result?.data, error: settled ? result?.error : undefined, loading: !settled, reload }
}
