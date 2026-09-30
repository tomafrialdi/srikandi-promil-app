import { Badge, Card, CardHeader } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import { Row } from './SubscriptionCard'
import styles from './UserDetail.module.css'

export function DevicesCard({ data }: { data: UserDetail['devices'] }) {
  return (
    <Card>
      <CardHeader title="Devices & integrations" />
      <dl className={styles.kv}>
        <Row label="App" value={data.app} />
        <Row label="Device" value={data.device ?? '—'} />
        {data.integrations.map((item) => (
          <div key={item.kind} className={styles.kvRow}>
            <dt className={styles.kvLabel}>{item.label}</dt>
            <dd style={{ margin: 0 }}>
              <Badge tone="success">{item.note ? `${item.status} · ${item.note}` : item.status}</Badge>
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
