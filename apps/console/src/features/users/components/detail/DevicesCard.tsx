import { Badge, Card, CardHeader } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import { Row } from './SubscriptionCard'

export function DevicesCard({ data }: { data: UserDetail['devices'] }) {
  return (
    <Card className="gap-1">
      <CardHeader title="Devices & integrations" />
      <dl className="m-0 mt-2 flex flex-col">
        <Row label="App" value={data.app} />
        <Row label="Device" value={data.device ?? '—'} />
        {data.integrations.map((item) => (
          <div key={item.kind} className="flex min-h-10 items-center justify-between gap-3 border-b border-border py-2 text-13 last:border-b-0">
            <dt className="font-medium text-ink-muted">{item.label}</dt>
            <dd style={{ margin: 0 }}>
              <Badge tone={item.kind === 'partner' ? 'info' : 'success'}>{item.note ? `${item.status} · ${item.note}` : item.status}</Badge>
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
