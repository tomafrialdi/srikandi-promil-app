import { CaretRight, Pill, Syringe, type Icon } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Card, CardHeader, type BadgeTone } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import { FilterChips } from './FilterChips'

type Med = UserDetail['medications']['items'][number]

const STATUS_LABEL: Record<Med['status'], { label: string; tone: BadgeTone; color: string; icon: Icon }> = {
  active: { label: 'Active', tone: 'success', color: '#3f9950', icon: Pill },
  completed: { label: 'Completed', tone: 'neutral', color: '#c13d68', icon: Pill },
  scheduled: { label: 'Scheduled', tone: 'warning', color: '#2574c4', icon: Syringe },
  suggested: { label: 'Suggested', tone: 'purple', color: '#6b4fbb', icon: Pill },
  stopped: { label: 'Stopped', tone: 'neutral', color: '#a6a49b', icon: Pill },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'purchased', label: 'Purchased' },
  { key: 'suggested', label: 'Suggested' },
  { key: 'stopped', label: 'Stopped' },
] as const
type FilterKey = (typeof FILTERS)[number]['key']

const match = (filter: string, med: Med) =>
  filter === 'all' || (filter === 'purchased' ? med.purchase_status === 'Purchased' : med.status === filter)

const purchaseTone = (status: string): BadgeTone => (status === 'Purchased' ? 'info' : status === 'Not purchased' ? 'error' : 'neutral')

export function MedicationsCard({ data, onOpen }: { data: UserDetail['medications']; onOpen: (id: string) => void }) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const items = data.items.filter((med) => match(filter, med))

  return (
    <Card className="gap-3.5">
      <CardHeader title="Medications & supplements" subtitle="From Meds log, Treatment program & purchases" />
      <FilterChips filters={FILTERS} counts={data.counts} active={filter} onChange={setFilter} />
      <ul className="m-0 flex list-none flex-col p-0">
        {items.map((med) => {
          const status = STATUS_LABEL[med.status]
          const Glyph = status.icon
          return (
            <li key={med.id} className="border-b border-border last:border-b-0">
              <button type="button" className="flex h-[60px] w-full items-center gap-3 text-left hover:bg-surface" onClick={() => onOpen(med.id)}>
                <span className="inline-flex size-9 flex-none items-center justify-center rounded-[10px]" style={{ background: `${status.color}22`, color: status.color }}>
                  <Glyph size={16} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-13 font-bold">{med.name}</span>
                  <span className="truncate text-11 font-medium text-ink-muted">{med.schedule}</span>
                </span>
                <span className="flex flex-none items-center gap-1.5">
                  <Badge tone={status.tone}>{status.label}</Badge>
                  <Badge tone={purchaseTone(med.purchase_status)}>{med.purchase_status}</Badge>
                </span>
                <span className="flex w-[52px] flex-none flex-col items-center">
                  <span className={med.adherence != null ? 'text-13 font-extrabold' : 'text-13 font-extrabold text-ink-faint'}>{med.adherence != null ? `${med.adherence}%` : '—'}</span>
                  <span className="text-9 font-semibold text-ink-faint">adherence</span>
                </span>
                <CaretRight size={16} className="flex-none text-ink-faint" />
              </button>
            </li>
          )
        })}
        {items.length === 0 && <li className="py-3 text-11 text-ink-muted">Nothing here.</li>}
      </ul>
    </Card>
  )
}
