import styles from './UsersList.module.css'

interface BulkBarProps {
  count: number
  onGrantPlus: () => void
  onSuspend: () => void
  onClear: () => void
}

/** Appears above the table while rows are selected. */
export function BulkBar({ count, onGrantPlus, onSuspend, onClear }: BulkBarProps) {
  return (
    <div className={styles.bulkBar} role="toolbar" aria-label="Bulk actions">
      <span className={styles.bulkCount}>{count} selected</span>
      <button type="button" className={styles.bulkAction} disabled title="Notifications module is not built yet">
        Send notification
      </button>
      <button type="button" className={styles.bulkAction} onClick={onGrantPlus}>
        Grant Plus
      </button>
      <button type="button" className={`${styles.bulkAction} ${styles.bulkDanger}`} onClick={onSuspend}>
        Suspend
      </button>
      <button type="button" className={styles.bulkClear} onClick={onClear}>
        Clear
      </button>
    </div>
  )
}
