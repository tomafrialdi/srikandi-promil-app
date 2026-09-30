import { DownloadSimple, UserPlus } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Button } from '../../../../shared/ui'

interface MembersHeaderProps {
  canInvite: boolean
  exporting: boolean
  onExport: () => void
  onInvite: () => void
}

export function MembersHeader({ canInvite, exporting, onExport, onInvite }: MembersHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">
          <Link to="/roles" className="text-ink-muted hover:text-primary">Roles &amp; access</Link> / Team members
        </h1>
        <p className="text-14 text-ink-muted">Everyone with access to the admin console. Changes are recorded in the audit log.</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={onExport} disabled={exporting} leadingIcon={<DownloadSimple size={16} />}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
        {canInvite && (
          <Button onClick={onInvite} leadingIcon={<UserPlus size={16} color="#fff" />}>Invite member</Button>
        )}
      </div>
    </div>
  )
}
