import { DownloadSimple, UserPlus } from '@phosphor-icons/react'
import { Button } from '../../../../shared/ui'
import styles from './UsersList.module.css'

interface UsersHeaderProps {
  onExport: () => void
  exporting: boolean
  onInvite: () => void
}

export function UsersHeader({ onExport, exporting, onInvite }: UsersHeaderProps) {
  return (
    <div className={styles.head}>
      <div className={styles.headText}>
        <h1 className={styles.h1}>Users</h1>
        <p className={styles.sub}>Manage accounts, plans and access. Health data is masked by default.</p>
      </div>
      <div className={styles.actions}>
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
