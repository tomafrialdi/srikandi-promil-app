import { ArrowLeft, ArrowRight, Info, PaperPlaneTilt, Scroll, UserPlus, Warning } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Button, Modal, ModalFooter, Notice, StepTabs } from '../../../../shared/ui'
import { useAuth } from '../../../auth/hooks/useAuth'
import { fetchRoleCatalog, inviteAdmins } from '../../services/users.service'
import type { RoleCatalog } from '../../types'
import { AccessStep } from './AccessStep'
import { DetailsStep } from './DetailsStep'
import { INITIAL_FORM, buildPayload, validEmails, type InviteForm } from './invite-form'
import { ReviewStep } from './ReviewStep'
import { RoleStep } from './RoleStep'

const STEPS = [
  { key: 'details', label: 'Details' },
  { key: 'role', label: 'Role & permissions' },
  { key: 'access', label: 'Access & security' },
  { key: 'review', label: 'Review & send' },
]
const NEXT_LABEL = ['Next: Role', 'Next: Access', 'Next: Review']

interface InviteAdminModalProps {
  open: boolean
  onClose: () => void
  onInvited: (count: number) => void
}

/** 4-step wizard to invite team members to the console. */
export function InviteAdminModal({ open, onClose, onInvited }: InviteAdminModalProps) {
  const { session } = useAuth()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<InviteForm>(INITIAL_FORM)
  const [catalog, setCatalog] = useState<RoleCatalog>()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || catalog) return
    let cancelled = false
    fetchRoleCatalog()
      .then((data) => !cancelled && setCatalog(data))
      .catch((err: unknown) => !cancelled && setError(err instanceof Error ? err.message : 'Could not load roles.'))
    return () => {
      cancelled = true
    }
  }, [open, catalog])

  const update = (patch: Partial<InviteForm>) => setForm((current) => ({ ...current, ...patch }))
  const close = () => {
    if (sending) return
    onClose()
    setStep(0)
    setForm(INITIAL_FORM)
    setError(null)
  }

  const valid = validEmails(form, catalog)
  const canContinue =
    step === 0 ? valid.length > 0 && form.department !== '' : step === 2 ? form.access.type === 'permanent' || form.access.expiresOn !== '' : true

  const send = async () => {
    setSending(true)
    setError(null)
    try {
      const result = await inviteAdmins(buildPayload(form, catalog))
      onInvited(result.created.length)
      setStep(0)
      setForm(INITIAL_FORM)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send invitations.')
    } finally {
      setSending(false)
    }
  }

  const info =
    step === 0
      ? `Step 1 of 4 · ${valid.length} valid invitee${valid.length === 1 ? '' : 's'}`
      : step === 1
        ? 'Step 2 of 4 · Least privilege recommended'
        : step === 2
          ? "Step 3 of 4 · 2FA can't be disabled"
          : 'Invites are recorded in the audit log'

  return (
    <Modal
      open={open}
      onClose={close}
      size="md"
      icon={<UserPlus size={20} />}
      title="Invite team member"
      subtitle="Team members get access to the Srikandi Promil admin console."
      tabs={<StepTabs steps={STEPS} current={step} onSelect={setStep} />}
      footer={
        <ModalFooter info={<span className="inline-flex items-center gap-1.5">{step === 3 ? <Scroll size={14} className="text-ink-faint" /> : <Info size={14} className="text-ink-faint" />}{info}</span>}>
          {step < 3 && <Button variant="outline" onClick={close}>Cancel</Button>}
          {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)} disabled={sending} leadingIcon={<ArrowLeft size={16} />}>Back</Button>}
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canContinue} trailingIcon={<ArrowRight size={16} />}>
              {NEXT_LABEL[step]}
            </Button>
          ) : (
            <Button onClick={send} disabled={sending || valid.length === 0} trailingIcon={<PaperPlaneTilt size={16} weight="fill" />}>
              {sending ? 'Sending…' : `Send ${valid.length} invite${valid.length === 1 ? '' : 's'}`}
            </Button>
          )}
        </ModalFooter>
      }
    >
      {error && (
        <Notice tone="error" icon={<Warning size={16} />}>
          {error}
        </Notice>
      )}
      {step === 0 && <DetailsStep form={form} update={update} catalog={catalog} />}
      {step === 1 && <RoleStep form={form} update={update} catalog={catalog} />}
      {step === 2 && <AccessStep form={form} update={update} />}
      {step === 3 && <ReviewStep form={form} catalog={catalog} onEdit={setStep} senderEmail={session?.user.email ?? ''} />}
    </Modal>
  )
}
