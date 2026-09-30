import { BellRinging, BookmarkSimple, DownloadSimple } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Button } from '../../../shared/ui'

interface AuditHeaderProps {
  canExport: boolean
  onViews: () => void
  onExport: () => void
}

export function AuditHeader({ canExport, onViews, onExport }: AuditHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Audit log</h1>
        <p className="text-14 text-ink-muted">Immutable, hash-chained record of every admin &amp; system action · retained 5 years (UU PDP)</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Button variant="outline" onClick={onViews} leadingIcon={<BookmarkSimple size={16} />}>Saved views</Button>
        <Link to="/roles" className="inline-flex items-center justify-center gap-2 rounded-control border border-border bg-card px-3.5 py-[9px] text-13 font-bold whitespace-nowrap text-ink">
          <BellRinging size={16} />
          Alert rules
        </Link>
        {canExport && <Button onClick={onExport} leadingIcon={<DownloadSimple size={16} color="#fff" />}>Export log</Button>}
      </div>
    </div>
  )
}
