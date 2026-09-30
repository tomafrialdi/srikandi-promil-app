import type { ReactNode } from 'react'
import { Badge, Card } from '../../../shared/ui'
import { Sparkline } from '../../../shared/charts'
import type { TrendBadge } from './trend-badge'

interface MetricCardProps {
  label: string
  value: ReactNode
  badge?: TrendBadge | null
  spark?: number[]
}

export function MetricCard({ label, value, badge, spark }: MetricCardProps) {
  return (
    <Card className="gap-2 p-4">
      <span className="text-12 font-semibold text-ink-muted">{label}</span>
      <div className="flex items-end justify-between gap-2">
        <span className="text-22 leading-tight font-extrabold">{value}</span>
        {spark && spark.length > 1 && <Sparkline values={spark} />}
      </div>
      {badge && (
        <span>
          <Badge tone={badge.tone}>{badge.text}</Badge>
        </span>
      )}
    </Card>
  )
}

export function MetricStrip({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-4 min-[801px]:grid-cols-3 min-[1281px]:grid-cols-5">{children}</div>
}
