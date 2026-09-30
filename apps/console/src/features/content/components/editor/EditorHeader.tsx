import { Eye, FloppyDisk, PaperPlaneTilt } from '@phosphor-icons/react'
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
}

export function EditorHeader({ type, subtitle, busy, onSave, onSubmit, canSubmit }: EditorHeaderProps) {
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
        <Button variant="outline" onClick={onSave} disabled={busy} leadingIcon={<FloppyDisk size={16} />}>Save draft</Button>
        <Button onClick={onSubmit} disabled={busy || !canSubmit} leadingIcon={<PaperPlaneTilt size={16} color="#fff" />}>
          {heading.submit}
        </Button>
      </div>
    </div>
  )
}
