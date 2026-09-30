import { useState } from 'react'
import { Avatar, Badge, Card, CardHeader, type BadgeTone } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import styles from './UserDetail.module.css'

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
            <button type="button" className={styles.cardAction} onClick={() => onOpen(primary.id)}>
              Care timeline
            </button>
          )
        }
      />
      <div className={styles.chips}>
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={`${styles.chip} ${filter === f.key ? styles.chipOn : ''}`} onClick={() => setFilter(f.key)}>
            {f.label} {data.counts[f.key]}
          </button>
        ))}
      </div>
      <ul className={styles.list}>
        {items.map((doctor) => {
          const relation = RELATION[doctor.relation]
          return (
            <li key={doctor.id}>
              <button type="button" className={styles.listItem} onClick={() => onOpen(doctor.id)}>
                <Avatar label={doctor.title.replace(/^dr\.\s*/i, '')[0] ?? '?'} size={36} />
                <span className={styles.itemMain}>
                  <span className={styles.itemTitle}>
                    {doctor.title}
                    <Badge tone={relation.tone}>{relation.label}</Badge>
                    {doctor.primary && <Badge tone="info">Primary doctor</Badge>}
                  </span>
                  {doctor.summary.filter(Boolean).map((line) => (
                    <span key={line} className={styles.itemLine}>{line}</span>
                  ))}
                </span>
              </button>
            </li>
          )
        })}
        {items.length === 0 && <li className={styles.itemLine}>Nothing here.</li>}
      </ul>
    </Card>
  )
}
