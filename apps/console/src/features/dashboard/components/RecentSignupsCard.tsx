import { Link } from 'react-router-dom'
import { Avatar, Badge, Card, CardHeader } from '../../../shared/ui'
import { initials, timeAgo } from '../../../shared/lib/format'
import { MODE_LABEL, PLAN_BADGE } from '../config/labels'
import type { RecentSignup } from '../types'
import styles from './RecentSignupsCard.module.css'

export function RecentSignupsCard({ data }: { data: RecentSignup[] }) {
  return (
    <Card className={styles.card}>
      <CardHeader
        title="Recent sign-ups"
        subtitle="Latest users"
        action={
          <Link to="/users" className={styles.viewAll}>
            View all users →
          </Link>
        }
      />

      <div className={styles.table} role="table">
        <div className={`${styles.row} ${styles.headRow}`} role="row">
          <span className={styles.user}>USER</span>
          <span className={styles.plan}>PLAN</span>
          <span className={styles.mode}>MODE</span>
          <span className={styles.city}>CITY</span>
          <span className={styles.joined}>JOINED</span>
        </div>
        {data.map((user) => {
          const badge = PLAN_BADGE[user.plan]
          return (
            <div key={user.id} className={styles.row} role="row">
              <span className={`${styles.user} ${styles.userCell}`}>
                <Avatar label={initials(user.full_name)[0] ?? ''} />
                <span className={styles.userText}>
                  <span className={styles.name}>{user.full_name}</span>
                  <span className={styles.email}>{user.email}</span>
                </span>
              </span>
              <span className={styles.plan}>
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </span>
              <span className={`${styles.mode} ${styles.strong}`}>{MODE_LABEL[user.tracking_mode]}</span>
              <span className={`${styles.city} ${styles.muted}`}>{user.city ?? '—'}</span>
              <span className={`${styles.joined} ${styles.muted}`}>{timeAgo(user.created_at)}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
