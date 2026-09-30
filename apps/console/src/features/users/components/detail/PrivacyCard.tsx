import { DownloadSimple, Eye } from '@phosphor-icons/react'
import { Badge, Button, Card, CardHeader } from '../../../../shared/ui'
import type { UserDetail } from '../../types'

const consent = (on: boolean, yes = 'Consented', no = 'Opted out') => (
  <Badge tone={on ? 'success' : 'neutral'}>{on ? yes : no}</Badge>
)

export function PrivacyCard({ data, onUnmask }: { data: UserDetail['privacy']; onUnmask: () => void }) {
  return (
    <Card className="gap-1">
      <CardHeader title="Privacy & consent" subtitle="UU PDP No. 27/2022" />
      <dl className="m-0 mt-2 flex flex-col">
        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-border py-2 text-13 last:border-b-0">
          <dt className="font-medium text-ink-muted">Health data processing</dt>
          <dd style={{ margin: 0 }}>{consent(data.health)}</dd>
        </div>
        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-border py-2 text-13 last:border-b-0">
          <dt className="font-medium text-ink-muted">Research (anonymised)</dt>
          <dd style={{ margin: 0 }}>{consent(data.research)}</dd>
        </div>
        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-border py-2 text-13 last:border-b-0">
          <dt className="font-medium text-ink-muted">Marketing emails</dt>
          <dd style={{ margin: 0 }}>{consent(data.marketing)}</dd>
        </div>
        <div className="flex min-h-10 items-center justify-between gap-3 border-b border-border py-2 text-13 last:border-b-0">
          <dt className="font-medium text-ink-muted">Discreet mode</dt>
          <dd className="text-right font-bold" style={{ margin: 0 }}>{data.discreet ? 'On' : 'Off'}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <Button variant="outline" disabled title="Data export requests are not built yet" leadingIcon={<DownloadSimple size={16} />}>
          Export data
        </Button>
        <Button variant="outline" onClick={onUnmask} leadingIcon={<Eye size={16} />}>
          Unmask (logged)
        </Button>
      </div>
    </Card>
  )
}
