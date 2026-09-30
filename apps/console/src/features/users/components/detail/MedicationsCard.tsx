import { useState } from 'react'
import { Badge, Card, CardHeader, type BadgeTone } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import styles from './UserDetail.module.css'

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
      <div className={styles.chips}>
        {FILTERS.map((f) => (
          <button key={f.key} type="button" className={`${styles.chip} ${filter === f.key ? styles.chipOn : ''}`} onClick={() => setFilter(f.key)}>
            {f.label} {data.counts[f.key]}
          </button>
        ))}
      </div>
      <ul className={styles.list}>
        {items.map((med) => {
          const status = STATUS_LABEL[med.status]
          return (
            <li key={med.id}>
              <button type="button" className={styles.listItem} onClick={() => onOpen(med.id)}>
                <span className={styles.itemMain}>
                  <span className={styles.itemTitle}>
                    {med.name}
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <Badge tone={med.purchase_status === 'Purchased' ? 'success' : 'neutral'}>{med.purchase_status}</Badge>
                  </span>
                  <span className={styles.itemLine}>{med.schedule}</span>
                </span>
                <span className={styles.itemAside}>
                  <span className={styles.adherence}>{med.adherence != null ? `${med.adherence}%` : '—'}</span>
                  <span className={styles.adherenceLabel}>adherence</span>
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
