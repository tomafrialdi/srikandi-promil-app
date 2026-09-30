import { useState } from 'react'
import { Badge, Card, CardHeader, type BadgeTone } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import { cn } from '../../../../shared/lib/cn'

type Med = UserDetail['medications']['items'][number]

const STATUS_LABEL: Record<Med['status'], { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'success' },
  completed: { label: 'Completed', tone: 'info' },
  scheduled: { label: 'Scheduled', tone: 'warning' },
  suggested: { label: 'Suggested', tone: 'primary' },
  stopped: { label: 'Stopped', tone: 'neutral' },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'purchased', label: 'Purchased' },
  { key: 'suggested', label: 'Suggested' },
  { key: 'stopped', label: 'Stopped' },
] as const

const match = (filter: string, med: Med) =>
  filter === 'all' || (filter === 'purchased' ? med.purchase_status === 'Purchased' : med.status === filter)

export function MedicationsCard({ data, onOpen }: { data: UserDetail['medications']; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<string>('all')
  const items = data.items.filter((med) => match(filter, med))

  return (
    <Card>
      <CardHeader title="Medications & supplements" subtitle="From Meds log, Treatment program & purchases" />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={cn('rounded-full border px-3 py-[5px] text-12 font-semibold', filter === f.key ? 'border-ink bg-ink text-white' : 'border-border')} onClick={() => setFilter(f.key)}>
            {f.label} {data.counts[f.key]}
          </button>
        ))}
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {items.map((med) => {
          const status = STATUS_LABEL[med.status]
          return (
            <li key={med.id}>
              <button type="button" className="flex w-full items-center gap-3 border-b border-border py-3 text-left last:border-b-0 hover:bg-surface" onClick={() => onOpen(med.id)}>
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="flex flex-wrap items-center gap-2 text-13 font-bold">
                    {med.name}
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <Badge tone={med.purchase_status === 'Purchased' ? 'success' : 'neutral'}>{med.purchase_status}</Badge>
                  </span>
                  <span className="text-11 text-ink-muted">{med.schedule}</span>
                </span>
                <span className="flex flex-none flex-col items-end gap-0.5">
                  <span className="text-13 font-extrabold">{med.adherence != null ? `${med.adherence}%` : '—'}</span>
                  <span className="text-9 text-ink-faint">adherence</span>
                </span>
              </button>
            </li>
          )
        })}
        {items.length === 0 && <li className="text-11 text-ink-muted">Nothing here.</li>}
      </ul>
    </Card>
  )
}
