import { Badge, Card } from '../../../../shared/ui'
import { formatNumber } from '../../../../shared/lib/format'
import type { UsersSummary } from '../../types'

export function MiniStats({ data }: { data?: UsersSummary['mini'] }) {
  const change =
    data && data.new_week_prev > 0 ? Math.round(((data.new_week - data.new_week_prev) / data.new_week_prev) * 100) : null

  return (
    <div className="grid grid-cols-2 gap-4 min-[1101px]:grid-cols-4">
      <Stat label="New this week" value={data?.new_week}>
        {change != null && <Badge tone={change >= 0 ? 'success' : 'warning'}>{`${change >= 0 ? '↑' : '↓'} ${Math.abs(change)}%`}</Badge>}
      </Stat>
      <Stat label="Active (30d)" value={data?.active_30d}>
        {data?.active_pct != null && <Badge tone="neutral">{`${data.active_pct}% of total`}</Badge>}
      </Stat>
      <Stat label="Churn risk" value={data?.churn_risk}>
        <Badge tone="warning">no log in 21 days</Badge>
      </Stat>
      <Stat label="Deletion requests" value={data?.deletion_requests}>
        {data && data.deletion_requests > 0 && (
          <Badge tone="error">{`UU PDP · due in ${data.deletion_due_days ?? 0}d`}</Badge>
        )}
      </Stat>
    </div>
  )
}

function Stat({ label, value, children }: { label: string; value?: number; children?: React.ReactNode }) {
  return (
    <Card className="gap-1.5 p-4">
      <span className="text-12 font-semibold text-ink-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-22 font-extrabold">{value == null ? '—' : formatNumber(value)}</span>
        {children}
      </div>
    </Card>
  )
}
