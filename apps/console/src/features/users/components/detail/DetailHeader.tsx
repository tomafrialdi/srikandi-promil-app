import { Bell, Crown, ProhibitInset, ArrowCounterClockwise } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Button } from '../../../../shared/ui'
import type { UserDetail } from '../../types'

interface DetailHeaderProps {
  profile: UserDetail['profile']
  onChangePlan: () => void
  onToggleSuspend: () => void
}

export function DetailHeader({ profile, onChangePlan, onToggleSuspend }: DetailHeaderProps) {
  const suspended = profile.status === 'suspended'
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">
          <Link to="/users" className="text-ink-muted hover:text-primary">Users</Link> / {profile.name}
        </h1>
        <p className="text-14 text-ink-muted">
          User ID {profile.ref} · Joined {profile.joined} via {profile.signup_method}
        </p>
      </div>
      <div className="flex flex-wrap gap-2.5">
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
