import { Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Field, Modal, ModalFooter, Button, Notice } from '../../../shared/ui'

interface ScheduleModalProps {
  open: boolean
  count: number
  onClose: () => void
  /** ISO timestamp. Throw to keep the dialog open. */
  onConfirm: (at: string) => Promise<void>
}

/** Default: tomorrow 07:00 local time. */
function defaultSlot(): string {
  const d = new Date(Date.now() + 86_400_000)
  d.setHours(7, 0, 0, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ScheduleModal({ open, count, onClose, onConfirm }: ScheduleModalProps) {
  const [value, setValue] = useState(defaultSlot)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    const at = new Date(value)
    if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) return setError('Pick a publish time in the future.')
    setPending(true)
    setError(null)
    try {
      await onConfirm(at.toISOString())
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not schedule.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={pending ? () => undefined : onClose}
      title="Schedule publishing"
      subtitle={`${count} item${count === 1 ? '' : 's'} will go live at the chosen time.`}
      size="sm"
      footer={
        <ModalFooter>
          <Button variant="outline" onClick={onClose} disabled={pending}>Cancel</Button>
          <Button onClick={submit} disabled={pending}>{pending ? 'Scheduling…' : 'Schedule'}</Button>
        </ModalFooter>
      }
    >
      <Field label="Publish at" htmlFor="schedule-at">
        <input
          id="schedule-at"
          type="datetime-local"
          className="h-11 rounded-control border border-border bg-card px-3.5 text-13 font-semibold outline-0 focus-visible:border-primary"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
    </Modal>
  )
}
