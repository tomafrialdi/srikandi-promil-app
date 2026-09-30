import type { ReactNode } from 'react'

interface PageStateProps {
  title: string
  description?: string
  action?: ReactNode
}

/** Centered message used for loading, empty and error states. */
export function PageState({ title, description, action }: PageStateProps) {
  return (
    <div className="flex min-h-60 flex-col items-center justify-center gap-2 p-8 text-center">
      <h2 className="text-16 font-bold">{title}</h2>
      {description && <p className="max-w-105 text-13 text-ink-muted">{description}</p>}
      {action}
    </div>
  )
}
