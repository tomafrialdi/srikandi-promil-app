interface ContentBulkBarProps {
  count: number
  busy: boolean
  onSendToReview: () => void
  onSchedule: () => void
  onArchive: () => void
  onClear: () => void
}

/** Appears above the table while rows are selected. */
export function ContentBulkBar({ count, busy, onSendToReview, onSchedule, onArchive, onClear }: ContentBulkBarProps) {
  const action = 'text-13 font-bold text-primary disabled:opacity-45'
  return (
    <div className="flex flex-wrap items-center gap-4.5 rounded-[10px] bg-primary-soft px-3.5 py-2.5" role="toolbar" aria-label="Bulk actions">
      <span className="text-13 font-extrabold text-primary">{count} selected</span>
      <button type="button" className={action} disabled={busy} onClick={onSendToReview}>Send to review</button>
      <button type="button" className={action} disabled={busy} onClick={onSchedule}>Schedule</button>
      <button type="button" className="text-13 font-bold text-error disabled:opacity-45" disabled={busy} onClick={onArchive}>Archive</button>
      <button type="button" className="ml-auto text-12 font-semibold text-ink-muted" onClick={onClear}>Clear</button>
    </div>
  )
}
