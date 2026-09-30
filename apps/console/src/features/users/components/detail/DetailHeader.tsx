import { Bell, Crown, ProhibitInset, ArrowCounterClockwise } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Button } from '../../../../shared/ui'
import type { UserDetail } from '../../types'
import styles from './UserDetail.module.css'

interface DetailHeaderProps {
  profile: UserDetail['profile']
  onChangePlan: () => void
  onToggleSuspend: () => void
}

export function DetailHeader({ profile, onChangePlan, onToggleSuspend }: DetailHeaderProps) {
  const suspended = profile.status === 'suspended'
  return (
    <div className={styles.head}>
      <div className={styles.headText}>
        <h1 className={styles.h1}>
          <Link to="/users" className={styles.crumb}>Users</Link> / {profile.name}
        </h1>
        <p className={styles.sub}>
          User ID {profile.ref} · Joined {profile.joined} via {profile.signup_method}
        </p>
      </div>
      <div className={styles.actions}>
        <Button variant="outline" disabled title="Notifications module is not built yet" leadingIcon={<Bell size={16} />}>
          Send notification
        </Button>
        <Button variant="outline" onClick={onChangePlan} leadingIcon={<Crown size={16} />}>
          Change plan
        </Button>
        {suspended ? (
          <Button variant="outline" onClick={onToggleSuspend} leadingIcon={<ArrowCounterClockwise size={16} />}>
            Reactivate
          </Button>
        ) : (
          <Button variant="danger" onClick={onToggleSuspend} leadingIcon={<ProhibitInset size={16} />}>
            Suspend
          </Button>
        )}
      </div>
    </div>
  )
}
