import type { ReactNode } from 'react'
import { Button, PageState } from '../../../shared/ui'

interface QueryBoundaryProps<T> {
  data: T | undefined
  loading: boolean
  error?: string
  onRetry: () => void
  children: (data: T) => ReactNode
}

/** Renders loading / error states, otherwise the tab's content. */
export function QueryBoundary<T>({ data, loading, error, onRetry, children }: QueryBoundaryProps<T>) {
  if (error && !data) {
    return (
      <PageState
        title="Couldn't load analytics"
        description={error}
        action={<Button onClick={onRetry}>Try again</Button>}
      />
    )
  }
  if (!data) return <PageState title={loading ? 'Loading…' : 'No data'} />
  return <div style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.15s' }}>{children(data)}</div>
}
