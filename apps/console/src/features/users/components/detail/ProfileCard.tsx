import { Avatar, Badge, Card } from '../../../../shared/ui'
import { initials } from '../../../../shared/lib/format'
import { MODE_LABEL, PLAN_LABEL } from '../../../../shared/lib/labels'
import type { UserDetail } from '../../types'
import styles from './UserDetail.module.css'

export function ProfileCard({ profile }: { profile: UserDetail['profile'] }) {
  const location = [profile.city, profile.province].filter(Boolean).join(', ')
  const contact = [profile.email, profile.phone, location, profile.age != null ? `${profile.age} y.o.` : null].filter(Boolean).join(' · ')

  return (
    <Card className={styles.profile}>
      <Avatar label={initials(profile.name)} size={72} />
      <div className={styles.profileMain}>
        <div className={styles.nameRow}>
          <h2 className={styles.name}>{profile.name}</h2>
          {profile.status === 'suspended' ? (
            <Badge tone="error">Suspended</Badge>
          ) : profile.deletion_requested ? (
            <Badge tone="warning">Deletion requested</Badge>
          ) : (
            <Badge tone="success">Active</Badge>
          )}
          <Badge tone="primary">{PLAN_LABEL[profile.plan].replace(' ', ' · ')}</Badge>
          <Badge tone="info">{MODE_LABEL[profile.mode]} mode</Badge>
        </div>
        <p className={styles.contact}>{contact}</p>
        {profile.suspended_reason && <p className={styles.contact}>Suspended: {profile.suspended_reason}</p>}
      </div>
      <div className={styles.quickStats}>
        <Quick label="Trying for" value={profile.trying_months != null ? `${profile.trying_months} months` : '—'} />
        <Quick label="Cycles tracked" value={String(profile.cycles_tracked)} />
        <Quick label="Streak" value={`${profile.streak_days} days`} />
        <Quick label="Partner" value={profile.partner ? 'Linked' : 'Not linked'} />
      </div>
    </Card>
  )
}

function Quick({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.quick}>
      <span className={styles.quickLabel}>{label}</span>
      <span className={styles.quickValue}>{value}</span>
    </div>
  )
}
