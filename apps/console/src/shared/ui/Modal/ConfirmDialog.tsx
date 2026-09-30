import { useState, type ReactNode } from 'react'
import { Button } from '../Button'
import { Notice } from '../Notice'
import { Warning } from '@phosphor-icons/react'
import { Modal, ModalFooter } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  tone?: 'primary' | 'danger'
  /** Throw to keep the dialog open and show the message. */
  onConfirm: () => Promise<void> | void
  icon?: ReactNode
  children?: ReactNode
}

/** Small yes/no modal built on <Modal>; handles the pending and error states. */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  tone = 'primary',
  onConfirm,
  icon,
  children,
}: ConfirmDialogProps) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const close = () => {
    if (pending) return
    setError(null)
    onClose()
  }

  const confirm = async () => {
    setPending(true)
    setError(null)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title={title}
      icon={icon}
      size="sm"
      footer={
        <ModalFooter>
          <Button variant="outline" onClick={close} disabled={pending}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={confirm} disabled={pending}>
            {pending ? 'Working…' : confirmLabel}
          </Button>
        </ModalFooter>
      }
    >
      {description && <p style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-muted)' }}>{description}</p>}
      {children}
      {error && (
        <Notice tone="error" icon={<Warning size={16} />}>
          {error}
        </Notice>
      )}
    </Modal>
  )
}
