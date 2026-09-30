import { Avatar, Badge, Card, CardHeader } from '../../../../shared/ui'
import { formatIdrCompact, formatIdr, timeAgo } from '../../../../shared/lib/format'
import { PLAN_LABEL, type PlanKey } from '../../../../shared/lib/labels'
import type { SubscriptionsOverview } from '../../types'

export function CodeUsageCard({ data }: { data: SubscriptionsOverview['code_usage'] }) {
  return (
    <Card className="min-w-0 flex-1">
      <CardHeader
        title="Recent code usage"
        subtitle={`Redemptions · latest · ${formatIdrCompact(data.discounted_30d)} discounted · 30d`}
      />
      <ul className="m-0 flex list-none flex-col p-0">
        {data.rows.map((row, index) => (
          <li key={`${row.name}-${row.at}-${index}`} className="flex items-center gap-3 border-b border-border py-2.5 last:border-b-0">
            <Avatar label={row.name[0] ?? ''} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="flex items-center gap-2 text-13 font-bold">
                {row.name}
                <Badge tone="neutral">{row.code}</Badge>
              </span>
              <span className="text-11 text-ink-muted">
                {(PLAN_LABEL[row.plan as PlanKey] ?? row.plan)} · {timeAgo(row.at)}
              </span>
            </span>
            {row.outcome === 'rejected' ? (
              <span className="text-12 font-bold text-error">{row.note ?? 'rejected'}</span>
            ) : row.discount_idr > 0 ? (
              <span className="text-12 font-extrabold">− {formatIdr(row.discount_idr)}</span>
            ) : (
              <span className="text-12 font-bold text-secondary">{row.note ?? 'applied'}</span>
            )}
          </li>
        ))}
        {data.rows.length === 0 && <li className="text-12 text-ink-muted">No redemptions yet.</li>}
      </ul>
    </Card>
  )
}
