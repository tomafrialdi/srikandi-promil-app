
interface BulkBarProps {
  count: number
  onGrantPlus: () => void
  onSuspend: () => void
  onClear: () => void
}

/** Appears above the table while rows are selected. */
export function BulkBar({ count, onGrantPlus, onSuspend, onClear }: BulkBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-4.5 rounded-[10px] bg-primary-soft px-3.5 py-2.5" role="toolbar" aria-label="Bulk actions">
      <span className="text-13 font-extrabold text-primary">{count} selected</span>
      <button type="button" className="text-13 font-bold text-primary disabled:opacity-45" disabled title="Notifications module is not built yet">
        Send notification
      </button>
      <button type="button" className="text-13 font-bold text-primary disabled:opacity-45" onClick={onGrantPlus}>
        Grant Plus
      </button>
      <button type="button" className="text-13 font-bold text-error" onClick={onSuspend}>
        Suspend
      </button>
      <button type="button" className="ml-auto text-12 font-semibold text-ink-muted" onClick={onClear}>
        Clear
      </button>
    </div>
  )
}
