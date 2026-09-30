import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'success' | 'warning' | 'error' | 'primary' | 'info' | 'neutral'

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
}

const TONE: Record<BadgeTone, string> = {
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning-ink',
  error: 'bg-error-soft text-error',
  primary: 'bg-primary-soft text-primary',
  info: 'bg-secondary-soft text-secondary',
  neutral: 'bg-surface-alt text-ink-muted',
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-[9px] py-[3px] text-11 font-bold whitespace-nowrap', TONE[tone])}>
      {children}
    </span>
  )
}
