import { Badge, Button, Card, CardHeader } from '../../../../shared/ui'
import type { UserDetail } from '../../types'

const consent = (on: boolean, yes = 'Consented', no = 'Opted out') => (
  <Badge tone={on ? 'success' : 'neutral'}>{on ? yes : no}</Badge>
)

export function PrivacyCard({ data, onUnmask }: { data: UserDetail['privacy']; onUnmask: () => void }) {
  return (
    <Card>
      <CardHeader title="Privacy & consent" subtitle="UU PDP No. 27/2022" />
      <dl className="flex flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border py-[9px] text-13 last:border-b-0">
          <dt className="text-ink-muted">Health data processing</dt>
          <dd style={{ margin: 0 }}>{consent(data.health)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-border py-[9px] text-13 last:border-b-0">
          <dt className="text-ink-muted">Research (anonymised)</dt>
          <dd style={{ margin: 0 }}>{consent(data.research)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-border py-[9px] text-13 last:border-b-0">
          <dt className="text-ink-muted">Marketing emails</dt>
          <dd style={{ margin: 0 }}>{consent(data.marketing)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-b border-border py-[9px] text-13 last:border-b-0">
          <dt className="text-ink-muted">Discreet mode</dt>
          <dd className="text-right font-bold" style={{ margin: 0 }}>{data.discreet ? 'On' : 'Off'}</dd>
        </div>
      </dl>
      <div className="flex gap-2.5">
        <Button variant="outline" disabled title="Data export requests are not built yet">
          Export data
        </Button>
        <Button variant="outline" onClick={onUnmask}>
          Unmask (logged)
        </Button>
      </div>
    </Card>
  )
}
