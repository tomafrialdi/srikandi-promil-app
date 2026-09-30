import { Check, Circle } from '@phosphor-icons/react'
import { useState } from 'react'
import { Button, Field, Modal, ModalFooter, Notice, TextField, useToast } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { Warning } from '@phosphor-icons/react'
import { PASSWORD_RULES } from '../config/options'
import { changePassword } from '../services/account.service'

interface ChangePasswordModalProps {
  open: boolean
  email: string
  onClose: () => void
  onChanged: () => void
}

const STRENGTH = ['Too weak', 'Weak', 'Okay', 'Strong']

export function ChangePasswordModal({ open, email, onClose, onChanged }: ChangePasswordModalProps) {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const passed = PASSWORD_RULES.filter((r) => r.test(next)).length
  const score = next.length === 0 ? 0 : Math.min(3, passed - (next.length >= 14 ? 0 : 1) + (next.length >= 18 ? 1 : 0))
  const valid = passed === PASSWORD_RULES.length && next === confirm && current.length > 0 && next !== current

  const close = () => {
    if (busy) return
    setCurrent('')
    setNext('')
    setConfirm('')
    setError(null)
    onClose()
  }

  const submit = async () => {
    setBusy(true)
    setError(null)
    try {
      await changePassword(email, current, next)
      toast({ title: 'Password updated', description: 'Other sessions were signed out.' })
      onChanged()
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the password.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Change password"
      subtitle="You'll stay signed in on this device. Other sessions will be signed out."
      size="sm"
      footer={
        <ModalFooter>
          <Button variant="outline" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={submit} disabled={busy || !valid}>{busy ? 'Updating…' : 'Update password'}</Button>
        </ModalFooter>
      }
    >
      <TextField id="pw-current" type="password" autoComplete="current-password" label="Current password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      <TextField id="pw-new" type="password" autoComplete="new-password" label="New password" value={next} onChange={(e) => setNext(e.target.value)} />
      <div className="flex flex-col gap-1.5" aria-live="polite">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={cn('h-1.5 flex-1 rounded-full', next && i < score ? (score >= 3 ? 'bg-success' : 'bg-warning') : 'bg-border')} />
          ))}
        </div>
        <span className="text-12 font-semibold">{next ? STRENGTH[score] : 'Choose a strong password'} <span className="font-medium text-ink-faint">· {next.length} characters</span></span>
      </div>
      <ul className="flex flex-col gap-1.5">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(next)
          return (
            <li key={rule.key} className={cn('flex items-center gap-2 text-12 font-medium', ok ? 'text-success' : 'text-ink-muted')}>
              {ok ? <Check size={14} weight="bold" /> : <Circle size={14} />}
              {rule.label}
            </li>
          )
        })}
      </ul>
      <TextField id="pw-confirm" type="password" autoComplete="new-password" label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {confirm && next !== confirm && <Field label=""><p className="text-11 font-semibold text-error">The passwords don’t match.</p></Field>}
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
    </Modal>
  )
}
