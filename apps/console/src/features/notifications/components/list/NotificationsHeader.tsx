import { FileText, Plus } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { Button, Tooltip, TooltipBody } from '../../../../shared/ui'

export function NotificationsHeader() {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">Notifications</h1>
        <p className="text-14 text-ink-muted">Monitor campaigns, triggers and delivery health.</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Tooltip placement="bottom" align="end" content={<TooltipBody title="Templates are coming soon" />}>
          <Button variant="outline" disabled leadingIcon={<FileText size={16} />}>Templates</Button>
        </Tooltip>
        <Link to="/notifications/new">
          <Button leadingIcon={<Plus size={16} color="#fff" />}>New notification</Button>
        </Link>
      </div>
    </div>
  )
}
