import { Hospital } from '@phosphor-icons/react'
import { Badge, Card, CardHeader, type BadgeTone } from '../../../../shared/ui'
import { CardLink } from './CardLink'
import type { UserDetail } from '../../types'

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  visited: { label: 'Visited', tone: 'success' },
  recommended: { label: 'Recommended', tone: 'purple' },
  saved: { label: 'Saved', tone: 'info' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
}

export function ClinicsCard({ data, onOpen }: { data: UserDetail['clinics']; onOpen: () => void }) {
  return (
    <Card className="gap-3.5">
      <CardHeader
        title="Clinics"
        subtitle="Visited & recommended"
        action={data.total > 0 ? <CardLink onClick={onOpen}>View</CardLink> : undefined}
      />
      <ul className="m-0 flex list-none flex-col p-0">
        {data.items.map((clinic) => {
          const status = STATUS[clinic.status] ?? STATUS.dismissed!
          const place = [clinic.city, clinic.distance_km != null ? `${clinic.distance_km} km` : null, clinic.bpjs ? 'BPJS' : null, clinic.ivf_lab ? 'IVF lab' : null]
            .filter(Boolean)
            .join(' · ')
          return (
            <li key={clinic.id} className="flex flex-col gap-1 border-b border-border py-2.5 last:border-b-0">
              <span className="flex items-center gap-2 text-13 font-bold">
                <Hospital size={14} className="flex-none text-ink-muted" />
                <span className="min-w-0 truncate">{clinic.name}</span>
              </span>
              <span className="text-11 font-medium text-ink-muted">{place}</span>
              <span className="flex flex-wrap items-center gap-1.5">
                <Badge tone={status.tone}>{status.label}</Badge>
                {clinic.program && <Badge tone="primary">{clinic.program}</Badge>}
              </span>
              {clinic.note && <span className="text-11 font-medium text-ink-faint">{clinic.note}</span>}
            </li>
          )
        })}
        {data.items.length === 0 && <li className="text-11 text-ink-muted">No clinics yet.</li>}
      </ul>
    </Card>
  )
}
