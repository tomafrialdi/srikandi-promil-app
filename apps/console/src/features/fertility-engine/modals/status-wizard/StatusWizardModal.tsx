import { ArrowLeft, ArrowRight, FloppyDisk, GitPullRequest, Trash, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Button, ConfirmDialog, Modal, ModalFooter, Notice, StepTabs, useToast } from '../../../../shared/ui'
import { useGoldenCases } from '../../hooks/useEngineData'
import { patchDraft } from '../../services/engine.service'
import type { EngineConfig, StatusDef } from '../../types'
import { BasicsStep } from './BasicsStep'
import { ConditionsStep } from './ConditionsStep'
import { ExperienceStep } from './ExperienceStep'
import { ReviewStep } from './ReviewStep'
import { TriggersStep } from './TriggersStep'
import { basicsIssue, conditionsIssue, fromStatus, newForm, toStatus, type StatusForm } from './status-form'

const STEPS = [
  { key: 'basics', label: 'Basics' },
  { key: 'conditions', label: 'Conditions' },
  { key: 'experience', label: 'App experience' },
  { key: 'triggers', label: 'Triggers & outputs' },
  { key: 'review', label: 'Test & review' },
]
const NEXT = ['Next: Conditions', 'Next: App experience', 'Next: Triggers', 'Next: Test & review']

interface StatusWizardModalProps {
  open: boolean
  onClose: () => void
  config: EngineConfig
  /** Status being edited; null = add a new one. Mount with a key so the form starts fresh. */
  editing: StatusDef | null
  draft: string
  onSaved: () => void
}

export function StatusWizardModal({ open, onClose, config, editing, draft, onSaved }: StatusWizardModalProps) {
  const toast = useToast()
  const golden = useGoldenCases()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<StatusForm>(() => (editing ? fromStatus(editing, config) : newForm(config)))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const update = (patch: Partial<StatusForm>) => setForm((f) => ({ ...f, ...patch }))

  const issue = step === 0 ? basicsIssue(form, config) : step === 1 ? conditionsIssue(form) : null
  const cases = golden.data ?? []

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await patchDraft([{ op: 'save_status', status: toStatus(form, editing ?? undefined) }], `${form.editing ? 'Updated' : 'Added'} status “${form.name.trim()}”`)
      toast({ title: form.editing ? 'Status updated' : 'Status added', description: `Saved to ${draft}.` })
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the status.')
    } finally {
      setSaving(false)
    }
  }

  const remove = async () => {
    await patchDraft([{ op: 'delete_status', key: form.key }], `Deleted status “${form.name}”`)
    toast({ title: 'Status deleted', description: `Removed from ${draft}.` })
    onSaved()
    onClose()
  }

  return (
    <>
      <Modal
        open={open}
        onClose={() => !saving && onClose()}
        size="xl"
        icon={<GitPullRequest size={20} />}
        title={`${form.editing ? 'Edit' : 'Add'} status · “${form.name.trim() || 'New status'}”`}
        subtitle={`${form.editing ? 'Changes go into' : 'New rule in'} draft ${draft} · needs 2 medical approvals before release`}
        headerActions={<Badge tone="warning">{`Draft ${draft}`}</Badge>}
        tabs={<StepTabs steps={STEPS} current={step} onSelect={setStep} />}
        footer={
          <ModalFooter
            info={
              form.editing && !form.isDefault ? (
                <button type="button" className="inline-flex items-center gap-1.5 text-12 font-bold text-error" onClick={() => setConfirmDelete(true)}>
                  <Trash size={14} /> Delete status
                </button>
              ) : (
                `Step ${step + 1} of 5`
              )
            }
          >
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)} leadingIcon={<ArrowLeft size={16} />}>Back</Button>}
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)} disabled={issue !== null} trailingIcon={<ArrowRight size={16} color="#fff" />} title={issue ?? undefined}>{NEXT[step]}</Button>
            ) : (
              <Button onClick={save} disabled={saving} leadingIcon={<FloppyDisk size={16} color="#fff" />}>{saving ? 'Saving…' : 'Save to draft'}</Button>
            )}
          </ModalFooter>
        }
      >
        {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
        {issue && step < 2 && <p className="m-0 text-12 font-semibold text-warning-ink">{issue}</p>}
        {step === 0 && <BasicsStep form={form} update={update} config={config} />}
        {step === 1 && <ConditionsStep form={form} update={update} config={config} cases={cases} />}
        {step === 2 && <ExperienceStep form={form} update={update} />}
        {step === 3 && <TriggersStep form={form} update={update} />}
        {step === 4 && <ReviewStep form={form} config={config} cases={cases} draft={draft} />}
      </Modal>
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        tone="danger"
        title={`Delete “${form.name}”?`}
        description={`It is removed from draft ${draft}, together with any mode override that uses it. The live version is not affected until the draft is released.`}
        confirmLabel="Delete status"
        onConfirm={remove}
      />
    </>
  )
}
