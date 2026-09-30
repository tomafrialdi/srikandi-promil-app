import { Card, CardHeader, ProgressBar } from '../../../shared/ui'
import { formatNumber, formatPercent, toPercentOf } from '../../../shared/lib/format'
import type { Funnel } from '../types'

export function FunnelCard({ data }: { data: Funnel }) {
  return (
    <Card className="min-w-0 flex-1">
      <CardHeader title="Activation funnel" subtitle={`Last 30 days cohort · ${formatNumber(data.cohort_size)} sign-ups`} />
      {data.steps.map((step) => {
        const pct = toPercentOf(step.count, data.cohort_size)
        return (
          <div key={step.key} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-12 font-semibold">{step.label}</span>
              <span className="text-12 font-bold text-ink-muted">{formatPercent(pct, pct < 10 ? 1 : 0)}</span>
            </div>
            <ProgressBar value={pct} />
          </div>
        )
      })}
    </Card>
  )
}
