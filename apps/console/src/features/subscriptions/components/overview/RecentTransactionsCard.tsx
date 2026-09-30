import { Link } from 'react-router-dom'
import { Badge, Card, CardHeader, DataTable, type Column } from '../../../../shared/ui'
import { formatIdr } from '../../../../shared/lib/format'
import { PLAN_LABEL } from '../../../../shared/lib/labels'
import { CHANNEL_LABEL, TX_STATUS } from '../../config/labels'
import type { SubscriptionsOverview } from '../../types'
import styles from './overview.module.css'

type Row = SubscriptionsOverview['recent_transactions'][number]

const dateTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })

const COLUMNS: Column<Row>[] = [
  { key: 'invoice', header: 'TRANSACTION', width: 150, render: (r) => <span className={styles.txCell}>{r.invoice}</span> },
  { key: 'user', header: 'USER', render: (r) => <span className={styles.plain}>{r.user}</span> },
  { key: 'plan', header: 'PLAN', width: 120, render: (r) => <span className={styles.plain}>{PLAN_LABEL[r.plan]}</span> },
  { key: 'method', header: 'METHOD', width: 110, render: (r) => <span className={styles.plain}>{CHANNEL_LABEL[r.channel]}</span> },
  { key: 'amount', header: 'AMOUNT', width: 110, render: (r) => <span className={styles.txCell}>{formatIdr(r.amount_idr)}</span> },
  {
    key: 'status',
    header: 'STATUS',
    width: 150,
    render: (r) => (
      <Badge tone={TX_STATUS[r.status].tone}>
        {r.status === 'failed' ? `Failed · retry ${r.retry}/3` : TX_STATUS[r.status].label}
      </Badge>
    ),
  },
  { key: 'date', header: 'DATE', width: 120, render: (r) => <span className={styles.plain}>{dateTime.format(new Date(r.at))}</span> },
]

export function RecentTransactionsCard({ data, onOpen }: { data: Row[]; onOpen: (invoice: string) => void }) {
  return (
    <Card>
      <CardHeader
        title="Recent transactions"
        subtitle="Midtrans + app stores"
        action={<Link to="/subscriptions/transactions" className={styles.link}>View all →</Link>}
      />
      <DataTable columns={COLUMNS} rows={data} rowKey={(r) => r.invoice} rowHeight={48} onRowClick={(r) => onOpen(r.invoice)} />
    </Card>
  )
}
