import { Badge, Card, CardHeader } from '../../../../shared/ui'
import { formatIdr } from '../../../../shared/lib/format'
import { PLAN_LABEL } from '../../../../shared/lib/labels'
import type { UserDetail } from '../../types'

export function SubscriptionCard({ data }: { data: UserDetail['subscription'] }) {
  const paid = data.plan === 'plus_monthly' || data.plan === 'plus_yearly'
  const price = data.price_idr > 0 ? `${formatIdr(data.price_idr)} / ${data.period_months >= 12 ? 'yr' : 'mo'}` : formatIdr(0)

  return (
    <Card className="gap-1">
      <CardHeader
        title="Subscription"
        action={paid ? <Badge tone={data.auto_renew ? 'success' : 'neutral'}>{data.auto_renew ? 'Auto-renew on' : 'Auto-renew off'}</Badge> : undefined}
      />
      <dl className="m-0 mt-2 flex flex-col">
        <Row label="Plan" value={data.label ?? PLAN_LABEL[data.plan]} />
        <Row label="Price" value={price} />
        <Row label="Next renewal" value={data.next_renewal ?? '—'} />
        <Row label="Payment" value={data.payment ?? '—'} />
        <Row label="Lifetime value" value={formatIdr(data.lifetime_idr)} />
      </dl>
      {data.pending_plan && (
        <p className="rounded-[10px] bg-warning-soft px-3 py-2.5 text-12 font-semibold text-warning-ink">
          Scheduled: switches to {PLAN_LABEL[data.pending_plan]} on {data.pending_plan_at ?? 'next renewal'}.
        </p>
      )}
    </Card>
  )
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-9 items-center justify-between gap-3 border-b border-border py-2 text-13 last:border-b-0">
      <dt className="font-medium text-ink-muted">{label}</dt>
      <dd className="text-right font-bold" style={{ margin: 0 }}>{value}</dd>
    </div>
  )
}
