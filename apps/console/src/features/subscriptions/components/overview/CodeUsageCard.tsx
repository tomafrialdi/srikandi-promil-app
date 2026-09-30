import { Avatar, Badge, Card, CardHeader } from '../../../../shared/ui'
import { formatIdrCompact, formatIdr, timeAgo } from '../../../../shared/lib/format'
import { PLAN_LABEL, type PlanKey } from '../../../../shared/lib/labels'
import type { SubscriptionsOverview } from '../../types'
import styles from './overview.module.css'

export function CodeUsageCard({ data }: { data: SubscriptionsOverview['code_usage'] }) {
  return (
    <Card className={styles.grow}>
      <CardHeader
        title="Recent code usage"
        subtitle={`Redemptions · latest · ${formatIdrCompact(data.discounted_30d)} discounted · 30d`}
      />
      <ul className={styles.usageList}>
        {data.rows.map((row, index) => (
          <li key={`${row.name}-${row.at}-${index}`} className={styles.usageItem}>
            <Avatar label={row.name[0] ?? ''} />
            <span className={styles.usageMain}>
              <span className={styles.usageName}>
                {row.name}
                <Badge tone="neutral">{row.code}</Badge>
              </span>
              <span className={styles.usageMeta}>
                {(PLAN_LABEL[row.plan as PlanKey] ?? row.plan)} · {timeAgo(row.at)}
              </span>
            </span>
            {row.outcome === 'rejected' ? (
              <span className={styles.usageRejected}>{row.note ?? 'rejected'}</span>
            ) : row.discount_idr > 0 ? (
              <span className={styles.usageAmount}>− {formatIdr(row.discount_idr)}</span>
            ) : (
              <span className={styles.usageNote}>{row.note ?? 'applied'}</span>
            )}
          </li>
        ))}
        {data.rows.length === 0 && <li className={styles.muted}>No redemptions yet.</li>}
      </ul>
    </Card>
  )
}
