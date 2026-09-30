import { Lock, UserPlus } from '@phosphor-icons/react'
import { Button } from '../../../shared/ui'

interface RolesHeaderProps {
  canInvite: boolean
  onSecurity: () => void
  onInvite: () => void
}

export function RolesHeader({ canInvite, onSecurity, onInvite }: RolesHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Roles &amp; access</h1>
        <p className="text-14 text-ink-muted">Least-privilege by default. Health data access is always logged.</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={onSecurity} leadingIcon={<Lock size={16} />}>Security settings</Button>
        {canInvite && (
          <Button onClick={onInvite} leadingIcon={<UserPlus size={16} color="#fff" />}>Invite member</Button>
        )}
      </div>
    </div>
  )
}
