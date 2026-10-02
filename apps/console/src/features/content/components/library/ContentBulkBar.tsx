interface ContentBulkBarProps {
  count: number
  busy: boolean
  onSendToReview: () => void
  /** Only for Super admins and Medical reviewers. */
  onApprove?: () => void
  /** Each action only appears when something in the selection can use it. */
  onSchedule?: () => void
  onPublishNow?: () => void
  onRepublish?: () => void
  onArchive: () => void
  onClear: () => void
}

/** Appears above the table while rows are selected. */
export function ContentBulkBar({ count, busy, onSendToReview, onApprove, onSchedule, onPublishNow, onRepublish, onArchive, onClear }: ContentBulkBarProps) {
  const action = 'text-13 font-bold text-primary disabled:opacity-45'
  return (
    <div className="flex flex-wrap items-center gap-4.5 rounded-[10px] bg-primary-soft px-3.5 py-2.5" role="toolbar" aria-label="Bulk actions">
      <span className="text-13 font-extrabold text-primary">{count} selected</span>
      <button type="button" className={action} disabled={busy} onClick={onSendToReview}>Send to review</button>
      {onApprove && <button type="button" className={action} disabled={busy} onClick={onApprove}>Approve</button>}
      {onSchedule && <button type="button" className={action} disabled={busy} onClick={onSchedule}>Schedule</button>}
      {onPublishNow && <button type="button" className={action} disabled={busy} onClick={onPublishNow}>Publish now</button>}
      {onRepublish && <button type="button" className={action} disabled={busy} onClick={onRepublish}>Re-publish</button>}
      <button type="button" className="text-13 font-bold text-error disabled:opacity-45" disabled={busy} onClick={onArchive}>Archive</button>
      <button type="button" className="ml-auto text-12 font-semibold text-ink-muted" onClick={onClear}>Clear</button>
    </div>
  )
}
