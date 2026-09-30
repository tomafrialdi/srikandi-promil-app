import { useState, type ReactNode } from 'react'
import { ConfirmDialog } from './ConfirmDialog'
import { TextField } from '../TextField'

interface ReasonDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  confirmLabel?: string
  tone?: 'primary' | 'danger'
  reasonLabel?: string
  placeholder?: string
  icon?: ReactNode
  onConfirm: (reason: string) => Promise<void> | void
}

/** ConfirmDialog that also asks for a reason / ticket reference (min. 3 characters). */
export function ReasonDialog({
  reasonLabel = 'Reason or ticket reference',
  placeholder = 'e.g. TCK-4821',
  onConfirm,
  onClose,
  ...rest
}: ReasonDialogProps) {
  const [reason, setReason] = useState('')
  const valid = reason.trim().length >= 3

  return (
    <ConfirmDialog
      {...rest}
      onClose={() => {
        setReason('')
        onClose()
      }}
      onConfirm={async () => {
        if (!valid) throw new Error('Enter a reason or ticket reference (at least 3 characters).')
        await onConfirm(reason.trim())
        setReason('')
      }}
    >
      <TextField
        id="reason-dialog-input"
        label={reasonLabel}
        placeholder={placeholder}
        value={reason}
        onChange={(event) => setReason(event.target.value)}
        autoFocus
      />
    </ConfirmDialog>
  )
}
