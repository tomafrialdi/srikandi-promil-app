import type { ReactNode } from 'react'
import { Badge, Card } from '../../../../shared/ui'
import type { MembersSummary } from '../../types'

export function MembersMiniStats({ data }: { data?: MembersSummary['mini'] }) {
  const tfaPct = data && data.active > 0 ? Math.round((data.tfa / data.active) * 100) : null
  return (
    <div className="grid grid-cols-2 gap-4 min-[1101px]:grid-cols-4">
      <Stat label="Active members" value={data?.active} />
      <Stat label="Online now" value={data?.online}>
        {data && data.online > 0 && <Badge tone="success">live</Badge>}
      </Stat>
      <Stat label="2FA enrolled" value={data ? `${data.tfa} / ${data.active}` : undefined}>
        {tfaPct != null && <Badge tone={tfaPct === 100 ? 'success' : 'warning'}>{`${tfaPct}%`}</Badge>}
      </Stat>
      <Stat label="Pending invites" value={data?.pending_invites}>
        {data && data.expiring_invites > 0 && <Badge tone="warning">{`${data.expiring_invites} expire in 48h`}</Badge>}
      </Stat>
    </div>
  )
}

function Stat({ label, value, children }: { label: string; value?: number | string; children?: ReactNode }) {
  return (
    <Card className="gap-1.5 p-4">
      <span className="text-12 font-semibold text-ink-muted">{label}</span>
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-22 font-extrabold">{value ?? '—'}</span>
        {children}
      </div>
    </Card>
  )
}
