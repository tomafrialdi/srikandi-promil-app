import { CalendarDots, Plus, UploadSimple } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Button, Tooltip, TooltipBody } from '../../../../shared/ui'

/** Import / Calendar view are placeholders until those flows exist. */
export function ContentHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Content library</h1>
        <p className="text-14 text-ink-muted">Articles, daily tips, in-app cards and videos across app &amp; website.</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Tooltip placement="bottom" align="end" content={<TooltipBody title="Bulk import is coming soon" />}>
          <Button variant="outline" disabled leadingIcon={<UploadSimple size={16} />}>Import</Button>
        </Tooltip>
        <Tooltip placement="bottom" align="end" content={<TooltipBody title="Calendar view is coming soon" />}>
          <Button variant="outline" disabled leadingIcon={<CalendarDots size={16} />}>Calendar view</Button>
        </Tooltip>
        <Link to="/articles/new">
          <Button leadingIcon={<Plus size={16} color="#fff" />}>Create content</Button>
        </Link>
      </div>
    </div>
  )
}
