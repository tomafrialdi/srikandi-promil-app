import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface NoticeProps {
  tone?: 'neutral' | 'warning' | 'error'
  icon: ReactNode
  children: ReactNode
}

const TONE = {
  neutral: 'bg-surface-alt text-ink-muted [&_p]:font-medium',
  warning: 'bg-warning-soft text-warning-ink [&_p]:font-semibold',
  error: 'bg-error-soft text-error [&_p]:font-semibold',
}

export function Notice({ tone = 'neutral', icon, children }: NoticeProps) {
  return (
    <div className={cn('flex items-start gap-2.5 rounded-xl px-3.5 py-3', TONE[tone])} role={tone === 'error' ? 'alert' : undefined}>
      <span className="inline-flex pt-px">{icon}</span>
      <p className="flex-1 text-12 leading-normal">{children}</p>
    </div>
  )
}
