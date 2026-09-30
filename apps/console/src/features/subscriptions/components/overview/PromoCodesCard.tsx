import { Link } from 'react-router-dom'
import { Badge, Card, CardHeader, DataTable, ProgressBar, type Column } from '../../../../shared/ui'
import { PROMO_STATUS } from '../../config/labels'
import type { PromoRow, SubscriptionsOverview } from '../../types'
import styles from './overview.module.css'

const COLUMNS: Column<PromoRow>[] = [
  { key: 'code', header: 'CODE', width: 112, render: (r) => <span className={styles.codeChip}>{r.code}</span> },
  {
    key: 'offer',
    header: 'DISCOUNT',
    render: (r) => (
      <span className={styles.offerCell}>
        <span className={styles.offerMain}>{r.offer}</span>
        <span className={styles.offerSub}>{r.sub ?? '—'}</span>
      </span>
    ),
  },
  {
    key: 'usage',
    header: 'USAGE',
    width: 96,
    render: (r) => (
      <span className={styles.usageCell}>
        <span className={styles.usageText}>{r.max ? `${r.used} / ${r.max}` : `${r.used} · unlimited`}</span>
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
    <Card className={styles.grow}>
      <CardHeader
        title="Promo codes"
        subtitle={`${active} active · ${scheduled} scheduled · ${expired} expired`}
        action={<Link to="/subscriptions/promo-codes" className={styles.link}>Manage codes →</Link>}
      />
      <DataTable columns={COLUMNS} rows={data.rows} rowKey={(r) => r.code} rowHeight={52} />
    </Card>
  )
}
