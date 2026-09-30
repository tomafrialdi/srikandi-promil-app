import type { ElementType, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface CardProps {
  as?: ElementType
  className?: string
  children: ReactNode
}

/** White rounded surface. Pass `className` to override gap / padding. */
export function Card({ as: Tag = 'section', className, children }: CardProps) {
  return <Tag className={cn('flex min-w-0 flex-col gap-4 rounded-card border border-border bg-card p-5', className)}>{children}</Tag>
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function CardHeader({ title, subtitle, action }: CardHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="flex flex-none flex-col gap-0.5">
        <h2 className="text-15 font-bold text-ink">{title}</h2>
        {subtitle && <p className="text-12 font-medium text-ink-muted">{subtitle}</p>}
      </div>
      {action}
    </header>
  )
}
