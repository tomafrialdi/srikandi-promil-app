import { useCallback, useState } from 'react'

/** Loads data for a modal on demand: `openWith(arg)` fetches, then the modal shows `data`. */
export function useModalData<T>(load: (arg: string) => Promise<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openWith = useCallback(
    async (arg: string) => {
      setLoading(true)
      setError(null)
      try {
        setData(await load(arg))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Could not load this view.')
      } finally {
        setLoading(false)
      }
    },
    [load],
  )

  const close = useCallback(() => {
    setData(null)
    setError(null)
  }, [])

  return { data, loading, error, openWith, close }
}
