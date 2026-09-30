import { Badge, Card, CardHeader } from '../../../../shared/ui'
import { formatIdr } from '../../../../shared/lib/format'
import { PLAN_LABEL } from '../../../../shared/lib/labels'
import type { UserDetail } from '../../types'
import styles from './UserDetail.module.css'

export function SubscriptionCard({ data }: { data: UserDetail['subscription'] }) {
  const paid = data.plan === 'plus_monthly' || data.plan === 'plus_yearly'
  const price = data.price_idr > 0 ? `${formatIdr(data.price_idr)} / ${data.period_months >= 12 ? 'yr' : 'mo'}` : formatIdr(0)

  return (
    <Card>
      <CardHeader
        title="Subscription"
        action={paid ? <Badge tone={data.auto_renew ? 'success' : 'neutral'}>{data.auto_renew ? 'Auto-renew on' : 'Auto-renew off'}</Badge> : undefined}
      />
      <dl className={styles.kv}>
        <Row label="Plan" value={data.label ?? PLAN_LABEL[data.plan]} />
        <Row label="Price" value={price} />
        <Row label="Next renewal" value={data.next_renewal ?? '—'} />
        <Row label="Payment" value={data.payment ?? '—'} />
        <Row label="Lifetime value" value={formatIdr(data.lifetime_idr)} />
      </dl>
      {data.pending_plan && (
        <p className={styles.pendingNote}>
          Scheduled: switches to {PLAN_LABEL[data.pending_plan]} on {data.pending_plan_at ?? 'next renewal'}.
        </p>
      )}
    </Card>
  )
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.kvRow}>
      <dt className={styles.kvLabel}>{label}</dt>
      <dd className={styles.kvValue} style={{ margin: 0 }}>{value}</dd>
    </div>
  )
}
