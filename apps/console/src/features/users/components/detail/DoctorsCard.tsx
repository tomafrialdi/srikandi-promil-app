import { CaretRight } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Card, CardHeader, type BadgeTone } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import { CardLink } from './CardLink'
import { FilterChips } from './FilterChips'

type Doctor = UserDetail['doctors']['items'][number]

const RELATION: Record<Doctor['relation'], { label: string; tone: BadgeTone; tint: string }> = {
  visited: { label: 'Visited', tone: 'success', tint: 'bg-secondary-soft' },
  upcoming: { label: 'Upcoming', tone: 'warning', tint: 'bg-secondary-soft' },
  recommended: { label: 'Recommended', tone: 'purple', tint: 'bg-[#ede7fa]' },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'visited', label: 'Visited' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'recommended', label: 'Recommended' },
] as const
type FilterKey = (typeof FILTERS)[number]['key']

export function DoctorsCard({ data, onOpen }: { data: UserDetail['doctors']; onOpen: (linkId: string) => void }) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const items = data.items.filter((d) => filter === 'all' || d.relation === filter)
  const primary = data.items.find((d) => d.primary)

  return (
    <Card className="gap-3.5">
      <CardHeader title="Doctors" subtitle="Visited, upcoming and recommended" action={primary && <CardLink onClick={() => onOpen(primary.id)}>Care timeline</CardLink>} />
      <FilterChips filters={FILTERS} counts={data.counts} active={filter} onChange={setFilter} />
      <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
        {items.map((doctor) => {
          const relation = RELATION[doctor.relation]
          const lines = doctor.summary.filter(Boolean) as string[]
          return (
            <li key={doctor.id}>
              <button type="button" className="flex w-full items-center gap-3.5 rounded-xl bg-surface px-3.5 py-3.5 text-left hover:bg-surface-alt" onClick={() => onOpen(doctor.id)}>
                <span className={`inline-flex size-10 flex-none items-center justify-center rounded-full text-14 font-extrabold ${relation.tint}`} aria-hidden="true">
                  {doctor.title.replace(/^dr\.\s*/i, '')[0] ?? '?'}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2 text-13 font-bold">
                    {doctor.title}
                    <Badge tone={relation.tone}>{relation.label}</Badge>
                    {doctor.primary && <Badge tone="info">Primary doctor</Badge>}
                  </span>
                  {lines.map((line, i) => (
                    <span key={line} className={i === 0 ? 'text-11 font-medium text-ink-muted' : i === 1 ? 'text-11 font-semibold' : 'text-11 font-medium text-ink-faint'}>{line}</span>
                  ))}
                </span>
                <CaretRight size={16} className="flex-none text-ink-faint" />
              </button>
            </li>
          )
        })}
        {items.length === 0 && <li className="text-11 text-ink-muted">Nothing here.</li>}
      </ul>
    </Card>
  )
}
