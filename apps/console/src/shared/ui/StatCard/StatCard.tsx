import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Badge, type BadgeTone } from '../Badge'
import { Card } from '../Card'

interface StatCardProps {
  label: string
  value: ReactNode
  badge?: { tone: BadgeTone; text: string } | null
  /** Extra muted text next to the badge. */
  hint?: ReactNode
}

/** Compact KPI card: label, big value, optional badge. */
export function StatCard({ label, value, badge, hint }: StatCardProps) {
  return (
    <Card className="gap-1.5 p-4">
      <span className="text-12 font-semibold text-ink-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="text-22 leading-tight font-extrabold">{value}</span>
        {badge && <Badge tone={badge.tone}>{badge.text}</Badge>}
        {hint && <span className="text-12 text-ink-faint">{hint}</span>}
      </div>
    </Card>
  )
}

export function StatGrid({ children, columns = 5 }: { children: ReactNode; columns?: 4 | 5 }) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 gap-4',
        columns === 4 ? 'min-[1281px]:grid-cols-4' : 'min-[801px]:grid-cols-3 min-[1281px]:grid-cols-5',
      )}
    >
      {children}
    </div>
  )
}
