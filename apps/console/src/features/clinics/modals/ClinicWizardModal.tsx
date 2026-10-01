import { ArrowLeft, ArrowRight, FloppyDisk, Hospital, PaperPlaneTilt, Warning } from '@phosphor-icons/react'
import { useRef, useState } from 'react'
import { Badge, Button, Modal, ModalFooter, Notice, StepTabs, useToast } from '../../../shared/ui'
import { STEP_DEFS } from '../config/labels'
import { useClinic } from '../hooks/useClinicsData'
import { blankForm, hoursIssue, toForm, toPayload } from '../lib/clinic-form'
import { saveClinic } from '../services/clinics.service'
import type { ClinicForm, ClinicFull } from '../types'
import { DoctorsStep } from './wizard/DoctorsStep'
import { LocationStep } from './wizard/LocationStep'
import { PartnershipStep } from './wizard/PartnershipStep'
import { ProfileStep } from './wizard/ProfileStep'
import { ServicesStep } from './wizard/ServicesStep'

const NEXT = ['Next: Location', 'Next: Services', 'Next: Doctors', 'Next: Review']

interface ClinicWizardModalProps {
  open: boolean
  onClose: () => void
  /** Clinic being edited (already loaded); null = add a new one. Mount with a key so the form starts fresh. */
  clinic: ClinicFull | null
  onSaved: (id: string) => void
}

export function ClinicWizardModal({ open, onClose, clinic: initial, onSaved }: ClinicWizardModalProps) {
  const toast = useToast()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ClinicForm>(() => (initial ? toForm(initial) : blankForm()))
  const [clinicId, setClinicId] = useState<string | null>(initial?.id ?? null)
  const [reached, setReached] = useState(0)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const live = useClinic(clinicId)
  const clinic = live.data ?? initial ?? undefined
  const editingLive = initial !== null && initial.status !== 'draft'
  const dirtyRef = useRef(false)
  const set = (patch: Partial<ClinicForm>) => {
    dirtyRef.current = true
    setForm((f) => ({ ...f, ...patch }))
  }

  const go = (n: number) => {
    setStep(n)
    setReached((r) => Math.max(r, n))
  }

  const issue = step === 0 ? (form.name.trim().length < 2 ? 'Enter the clinic name' : null) : step === 1 ? hoursIssue(form) : null

  const persist = async (submit: boolean): Promise<boolean> => {
    setSaving(true)
    setError(null)
    try {
      const id = await saveClinic(clinicId, toPayload(form), submit)
      setClinicId(id)
      setSavedAt(Date.now())
      dirtyRef.current = false
      live.reload()
      if (submit) {
        toast({ title: editingLive ? 'Clinic updated' : 'Submitted for verification', description: form.name })
        onSaved(id)
        onClose()
      }
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the clinic.')
      return false
    } finally {
      setSaving(false)
    }
  }

  const goNext = async () => {
    if (step === 3 && !dirtyRef.current) return go(4)
    if (await persist(false)) go(step + 1)
  }
  const saveDraft = async () => {
    if (await persist(false)) {
      toast({ title: 'Draft saved', description: form.name })
      onSaved(clinicId ?? '')
    }
  }

  const missingKars = clinic?.checklist.find((i) => i.key === 'kars')?.ok === false
  const title = initial ? `Edit clinic · ${form.name || initial.name}` : `Add clinic${form.name.trim() ? ` · ${form.name.trim()}` : ''}`

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      size="xl"
      icon={<Hospital size={20} />}
      title={title}
      subtitle="Listing goes live after licence verification (1–3 working days)"
      headerActions={<Badge tone="neutral">{initial ? (initial.status === 'draft' ? 'Draft' : 'Editing') : 'Draft'}</Badge>}
      tabs={<StepTabs steps={STEP_DEFS} current={step} onSelect={go} isEnabled={(i) => !saving && (initial !== null || i <= reached)} />}
      footer={
        <ModalFooter
          info={
            step === 4 && missingKars ? (
              <span className="inline-flex items-center gap-1.5 font-semibold text-warning-ink"><Warning size={14} /> Will publish as “Pending verification” until KARS is uploaded</span>
            ) : (
              <span className="inline-flex items-center gap-1.5"><FloppyDisk size={14} /> {savedAt ? `Draft saved · ${step + 1} of 5` : `Step ${step + 1} of 5`}</span>
            )
          }
        >
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          {step > 0 && <Button variant="outline" onClick={() => go(step - 1)} disabled={saving} leadingIcon={<ArrowLeft size={16} />}>Back</Button>}
          {step < 4 ? (
            <Button onClick={goNext} disabled={saving || issue !== null} title={issue ?? undefined} trailingIcon={<ArrowRight size={16} color="#fff" />}>{saving ? 'Saving…' : NEXT[step]}</Button>
          ) : (
            <>
              {!editingLive && <Button variant="outline" onClick={saveDraft} disabled={saving} leadingIcon={<FloppyDisk size={16} />}>Save draft</Button>}
              <Button onClick={() => persist(true)} disabled={saving} leadingIcon={<PaperPlaneTilt size={16} color="#fff" />}>{saving ? 'Saving…' : editingLive ? 'Save changes' : 'Submit for verification'}</Button>
            </>
          )}
        </ModalFooter>
      }
    >
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
      {issue && <p className="m-0 text-12 font-semibold text-warning-ink">{issue}</p>}
      {step === 0 && <ProfileStep form={form} set={set} />}
      {step === 1 && <LocationStep form={form} set={set} />}
      {step === 2 && <ServicesStep form={form} set={set} />}
      {step === 3 && <DoctorsStep clinicId={clinicId} clinic={clinic} onChanged={live.reload} />}
      {step === 4 && <PartnershipStep form={form} set={set} clinic={clinic} />}
    </Modal>
  )
}
