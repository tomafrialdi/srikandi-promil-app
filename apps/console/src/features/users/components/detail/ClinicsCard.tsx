import { Badge, Card, CardHeader, type BadgeTone } from '../../../../shared/ui'
import type { UserDetail } from '../../types'

const STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  visited: { label: 'Visited', tone: 'success' },
  recommended: { label: 'Recommended', tone: 'primary' },
  saved: { label: 'Saved', tone: 'info' },
  dismissed: { label: 'Dismissed', tone: 'neutral' },
}

export function ClinicsCard({ data, onOpen }: { data: UserDetail['clinics']; onOpen: () => void }) {
  return (
    <Card>
      <CardHeader
        title="Clinics"
        subtitle="Visited & recommended"
        action={
          data.total > 0 ? (
            <button type="button" className="text-12 font-bold text-primary disabled:text-ink-muted disabled:opacity-45" onClick={onOpen}>
              View
            </button>
          ) : undefined
        }
      />
      <ul className="m-0 flex list-none flex-col p-0">
        {data.items.map((clinic) => {
          const status = STATUS[clinic.status] ?? STATUS.dismissed!
          const place = [clinic.city, clinic.distance_km != null ? `${clinic.distance_km} km` : null, clinic.bpjs ? 'BPJS' : null, clinic.ivf_lab ? 'IVF lab' : null]
            .filter(Boolean)
            .join(' · ')
          return (
            <li key={clinic.id} className="flex w-full items-center gap-3 border-b border-border py-3 text-left last:border-b-0" style={{ alignItems: 'flex-start' }}>
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="flex flex-wrap items-center gap-2 text-13 font-bold">
                  {clinic.name}
                  <Badge tone={status.tone}>{status.label}</Badge>
                </span>
                <span className="text-11 text-ink-muted">{place}</span>
                {clinic.program && <span className="text-11 text-ink-muted">{clinic.program}</span>}
                {clinic.note && <span className="text-11 text-ink-muted">{clinic.note}</span>}
              </span>
            </li>
          )
        })}
        {data.items.length === 0 && <li className="text-11 text-ink-muted">No clinics yet.</li>}
      </ul>
    </Card>
  )
}
