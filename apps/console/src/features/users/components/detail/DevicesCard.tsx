import { Badge, Card, CardHeader } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import { Row } from './SubscriptionCard'

export function DevicesCard({ data }: { data: UserDetail['devices'] }) {
  return (
    <Card>
      <CardHeader title="Devices & integrations" />
      <dl className="flex flex-col">
        <Row label="App" value={data.app} />
        <Row label="Device" value={data.device ?? '—'} />
        {data.integrations.map((item) => (
          <div key={item.kind} className="flex items-center justify-between gap-3 border-b border-border py-[9px] text-13 last:border-b-0">
            <dt className="text-ink-muted">{item.label}</dt>
            <dd style={{ margin: 0 }}>
              <Badge tone="success">{item.note ? `${item.status} · ${item.note}` : item.status}</Badge>
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
