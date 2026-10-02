import { ArrowCounterClockwise, ArrowUUpLeft, CalendarCheck, CheckCircle, Eye, FloppyDisk, PaperPlaneTilt, RocketLaunch } from '@phosphor-icons/react'
import { Button, Tooltip, TooltipBody } from '../../../../shared/ui'
import { TYPE_HEADING } from '../../config/editor'
import type { ContentType } from '../../types'

interface EditorHeaderProps {
  type: ContentType
  subtitle?: string
  busy: boolean
  onSave: () => void
  onSubmit: () => void
  canSubmit: boolean
  /** What can happen next once approved or archived; each handler is only set when it applies. */
  lifecycle?: { onSchedule?: () => void; onPublishNow?: () => void; onRepublish?: () => void }
  /** Review actions for Super admins and Medical reviewers; omit for everyone else. */
  review?: {
    canApprove: boolean
    canRequestChanges: boolean
    canPublishDraft: boolean
    onApprove: () => void
    onApprovePublish: () => void
    onRequestChanges: () => void
    onPublishDraft: () => void
  }
}

export function EditorHeader({ type, subtitle, busy, onSave, onSubmit, canSubmit, lifecycle, review }: EditorHeaderProps) {
  const heading = TYPE_HEADING[type]
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-26 font-extrabold">{heading.title}</h1>
        <p className="text-14 text-ink-muted">{subtitle ?? heading.subtitle}</p>
      </div>
      <div className="flex flex-wrap gap-2.5">
        <Tooltip placement="bottom" align="end" content={<TooltipBody title="Preview is coming soon" />}>
          <Button variant="outline" disabled leadingIcon={<Eye size={16} />}>Preview</Button>
        </Tooltip>
        {review?.canRequestChanges && (
          <Button variant="outline" onClick={review.onRequestChanges} disabled={busy} leadingIcon={<ArrowUUpLeft size={16} />}>Request changes</Button>
        )}
        {review?.canPublishDraft && (
          <Button variant="outline" onClick={review.onPublishDraft} disabled={busy} leadingIcon={<RocketLaunch size={16} />}>Publish without review</Button>
        )}
        <Button variant="outline" onClick={onSave} disabled={busy} leadingIcon={<FloppyDisk size={16} />}>Save draft</Button>
        {review?.canApprove && (
          <>
            <Button variant="outline" onClick={review.onApprove} disabled={busy} leadingIcon={<CheckCircle size={16} />}>Approve</Button>
            <Button onClick={review.onApprovePublish} disabled={busy} leadingIcon={<RocketLaunch size={16} color="#fff" />}>Approve &amp; publish</Button>
          </>
        )}
        {lifecycle?.onSchedule && (
          <Button variant="outline" onClick={lifecycle.onSchedule} disabled={busy} leadingIcon={<CalendarCheck size={16} />}>Schedule</Button>
        )}
        {lifecycle?.onPublishNow && (
          <Button onClick={lifecycle.onPublishNow} disabled={busy} leadingIcon={<RocketLaunch size={16} color="#fff" />}>Publish now</Button>
        )}
        {lifecycle?.onRepublish && (
          <Button onClick={lifecycle.onRepublish} disabled={busy} leadingIcon={<ArrowCounterClockwise size={16} color="#fff" />}>Re-publish</Button>
        )}
        {!review?.canApprove && !lifecycle?.onSchedule && !lifecycle?.onPublishNow && !lifecycle?.onRepublish && (
          <Button onClick={onSubmit} disabled={busy || !canSubmit} leadingIcon={<PaperPlaneTilt size={16} color="#fff" />}>
            {heading.submit}
          </Button>
        )}
      </div>
    </div>
  )
}
