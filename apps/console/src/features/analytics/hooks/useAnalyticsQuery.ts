import { useCallback, useEffect, useState } from 'react'
import type { DateRange } from '../config/date-range'
import { useDateRange } from './useDateRange'

interface Result<T> {
  key: string
  data?: T
  error?: string
}

/** Loads one tab's data for the selected range; keeps showing the previous data while reloading. */
export function useAnalyticsQuery<T>(fetcher: (range: DateRange) => Promise<T>) {
  const [range] = useDateRange()
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<Result<T>>()
  const key = `${range.from}|${range.to}|${attempt}`

  useEffect(() => {
    let cancelled = false
    fetcher(range)
      .then((data) => !cancelled && setResult({ key, data }))
      .catch((err: unknown) => {
        if (cancelled) return
        setResult({ key, error: err instanceof Error ? err.message : 'Could not load analytics.' })
      })
    return () => {
      cancelled = true
    }
  }, [fetcher, range, key])

  const retry = useCallback(() => setAttempt((n) => n + 1), [])
  const settled = result?.key === key

  return {
    range,
    data: result?.data,
    error: settled ? result?.error : undefined,
    loading: !settled,
    retry,
  }
}
