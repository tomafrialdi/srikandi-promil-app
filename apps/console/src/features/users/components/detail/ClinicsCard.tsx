import { Badge, Card, CardHeader, type BadgeTone } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import styles from './UserDetail.module.css'

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
            <button type="button" className={styles.cardAction} onClick={onOpen}>
              View
            </button>
          ) : undefined
        }
      />
      <ul className={styles.list}>
        {data.items.map((clinic) => {
          const status = STATUS[clinic.status] ?? STATUS.dismissed!
          const place = [clinic.city, clinic.distance_km != null ? `${clinic.distance_km} km` : null, clinic.bpjs ? 'BPJS' : null, clinic.ivf_lab ? 'IVF lab' : null]
            .filter(Boolean)
            .join(' · ')
          return (
            <li key={clinic.id} className={styles.listItem} style={{ alignItems: 'flex-start' }}>
              <span className={styles.itemMain}>
                <span className={styles.itemTitle}>
                  {clinic.name}
                  <Badge tone={status.tone}>{status.label}</Badge>
                </span>
                <span className={styles.itemLine}>{place}</span>
                {clinic.program && <span className={styles.itemLine}>{clinic.program}</span>}
                {clinic.note && <span className={styles.itemLine}>{clinic.note}</span>}
              </span>
            </li>
          )
        })}
        {data.items.length === 0 && <li className={styles.itemLine}>No clinics yet.</li>}
      </ul>
    </Card>
  )
}
