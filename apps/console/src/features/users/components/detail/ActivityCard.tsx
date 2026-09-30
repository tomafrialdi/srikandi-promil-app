import { Link } from 'react-router-dom'
import { Card, CardHeader } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import styles from './UserDetail.module.css'

const dayTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
const timeOnly = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })

function when(iso: string): string {
  const date = new Date(iso)
  return dayKey.format(date) === dayKey.format(new Date()) ? `Today, ${timeOnly.format(date)}` : dayTime.format(date)
}

export function ActivityCard({ data }: { data: UserDetail['activity'] }) {
  return (
    <Card>
      <CardHeader
        title="Activity log"
        subtitle="Admin & system events"
        action={
          <Link to="/audit-log" className={styles.cardAction}>
            View audit log →
          </Link>
        }
      />
      <ul className={styles.list}>
        {data
          .filter((event) => event.text)
          .map((event) => (
            <li key={`${event.at}-${event.text}`} className={styles.listItem}>
              <span className={styles.activityDot} />
              <span className={styles.itemMain}>
                <span className={styles.itemTitle}>{event.text}</span>
                <span className={styles.activityTime}>{when(event.at)}</span>
              </span>
            </li>
          ))}
      </ul>
    </Card>
  )
}
