import { Link } from 'react-router-dom'
import { Badge, Card, CardHeader, DataTable, ProgressBar, type Column } from '../../../../shared/ui'
import { PROMO_STATUS } from '../../config/labels'
import type { PromoRow, SubscriptionsOverview } from '../../types'

const COLUMNS: Column<PromoRow>[] = [
  { key: 'code', header: 'CODE', width: 112, render: (r) => <span className="inline-block rounded-md bg-surface-alt px-2 py-[3px] text-11 font-extrabold tracking-[0.02em]">{r.code}</span> },
  {
    key: 'offer',
    header: 'DISCOUNT',
    render: (r) => (
      <span className="flex min-w-0 flex-col">
        <span className="text-12 font-semibold">{r.offer}</span>
        <span className="text-11 font-medium text-ink-muted">{r.sub ?? '—'}</span>
      </span>
    ),
  },
  {
    key: 'usage',
    header: 'USAGE',
    width: 96,
    render: (r) => (
      <span className="flex w-full flex-col gap-1">
        <span className="text-12 font-bold">{r.max ? `${r.used} / ${r.max}` : `${r.used} · unlimited`}</span>
        {r.max ? <ProgressBar value={(r.used / r.max) * 100} height={5} /> : null}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'STATUS',
    width: 92,
    render: (r) => <Badge tone={PROMO_STATUS[r.status].tone}>{PROMO_STATUS[r.status].label}</Badge>,
  },
]

export function PromoCodesCard({ data }: { data: SubscriptionsOverview['promos'] }) {
  const { active, scheduled, expired } = data.summary
  return (
    <Card className="min-w-0 flex-1">
      <CardHeader
        title="Promo codes"
        subtitle={`${active} active · ${scheduled} scheduled · ${expired} expired`}
        action={<Link to="/subscriptions/promo-codes" className="text-13 font-bold text-primary">Manage codes →</Link>}
      />
      <DataTable columns={COLUMNS} rows={data.rows} rowKey={(r) => r.code} rowHeight={52} />
    </Card>
  )
}
