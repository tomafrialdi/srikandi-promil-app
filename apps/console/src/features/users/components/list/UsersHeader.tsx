import { DownloadSimple, UserPlus } from '@phosphor-icons/react'
import { Button } from '../../../../shared/ui'

interface UsersHeaderProps {
  onExport: () => void
  exporting: boolean
  onInvite: () => void
}

export function UsersHeader({ onExport, exporting, onInvite }: UsersHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Users</h1>
        <p className="text-14 text-ink-muted">Manage accounts, plans and access. Health data is masked by default.</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={onExport} disabled={exporting} leadingIcon={<DownloadSimple size={16} />}>
          {exporting ? 'Exporting…' : 'Export CSV'}
        </Button>
        <Button onClick={onInvite} leadingIcon={<UserPlus size={16} color="#fff" />}>
          Invite admin
        </Button>
      </div>
    </div>
  )
}
