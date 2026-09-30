import { useState } from 'react'
import { Avatar, Badge, Card, CardHeader, type BadgeTone } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import { cn } from '../../../../shared/lib/cn'

type Doctor = UserDetail['doctors']['items'][number]

const RELATION: Record<Doctor['relation'], { label: string; tone: BadgeTone }> = {
  visited: { label: 'Visited', tone: 'success' },
  upcoming: { label: 'Upcoming', tone: 'warning' },
  recommended: { label: 'Recommended', tone: 'primary' },
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'visited', label: 'Visited' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'recommended', label: 'Recommended' },
] as const

export function DoctorsCard({ data, onOpen }: { data: UserDetail['doctors']; onOpen: (linkId: string) => void }) {
  const [filter, setFilter] = useState<string>('all')
  const items = data.items.filter((d) => filter === 'all' || d.relation === filter)
  const primary = data.items.find((d) => d.primary)

  return (
    <Card>
      <CardHeader
        title="Doctors"
        subtitle="Visited, upcoming and recommended"
        action={
          primary && (
            <button type="button" className="text-12 font-bold text-primary disabled:text-ink-muted disabled:opacity-45" onClick={() => onOpen(primary.id)}>
              Care timeline
            </button>
          )
        }
      />
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={cn('rounded-full border px-3 py-[5px] text-12 font-semibold', filter === f.key ? 'border-ink bg-ink text-white' : 'border-border')} onClick={() => setFilter(f.key)}>
            {f.label} {data.counts[f.key]}
          </button>
        ))}
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {items.map((doctor) => {
          const relation = RELATION[doctor.relation]
          return (
            <li key={doctor.id}>
              <button type="button" className="flex w-full items-center gap-3 border-b border-border py-3 text-left last:border-b-0 hover:bg-surface" onClick={() => onOpen(doctor.id)}>
                <Avatar label={doctor.title.replace(/^dr\.\s*/i, '')[0] ?? '?'} size={36} />
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="flex flex-wrap items-center gap-2 text-13 font-bold">
                    {doctor.title}
                    <Badge tone={relation.tone}>{relation.label}</Badge>
                    {doctor.primary && <Badge tone="info">Primary doctor</Badge>}
                  </span>
                  {doctor.summary.filter(Boolean).map((line) => (
                    <span key={line} className="text-11 text-ink-muted">{line}</span>
                  ))}
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
