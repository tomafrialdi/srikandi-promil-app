import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type BadgeTone = 'success' | 'warning' | 'error' | 'primary' | 'info' | 'neutral' | 'purple'

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
  purple: 'bg-[#ede7fa] text-[#6b4fbb]',
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-[9px] py-[3px] text-11 font-bold whitespace-nowrap', TONE[tone])}>
      {children}
    </span>
  )
}
