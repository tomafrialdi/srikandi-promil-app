import { CheckCircle, PaperPlaneTilt, PencilSimple, Trash, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { Badge, Button, Card, ChipInput, ConfirmDialog, Field, Notice, TextAreaField, TextField, ToggleRow, useToast, UnitField } from '../../../shared/ui'
import { fmtDateShort } from '../lib/dates'
import { UNITS } from '../config/labels'
import { blankForm, presetLabel, submitIssue, toForm, toPayload } from '../lib/med-form'
import { deleteMed, reviewMed, saveMed, withdrawMed } from '../services/medications.service'
import type { MedFormState, MedFull } from '../types'

interface MedicationPanelProps {
  med: MedFull
  me: string
  canEdit: boolean
  onSaved: () => void
  onEditAll: () => void
}

/** Quick edit of the common fields. Mount with a key (id + updated) so it starts from the loaded item. */
export function MedicationPanel({ med, me, canEdit, onSaved, onEditAll }: MedicationPanelProps) {
  const toast = useToast()
  const source = med.revision ?? med
  const [form, setForm] = useState<MedFormState>(() => (source ? toForm(source) : blankForm()))
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const waiting = med.status === 'in_review' || med.has_revision
  const isReviewer = med.reviewer_id === me
  const locked = waiting || !canEdit
  const set = (patch: Partial<MedFormState>) => setForm((f) => ({ ...f, ...patch }))
  const issue = submitIssue(form)

  const run = async (task: () => Promise<unknown>, done: string) => {
    setBusy(true)
    setError(null)
    try {
      await task()
      toast({ title: done })
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="gap-3.5 min-[1201px]:sticky min-[1201px]:top-4">
      <header className="flex items-center justify-between gap-3">
        <h2 className="min-w-0 truncate text-15 font-bold">{med.status === 'draft' ? 'Draft' : 'Edit'} · {med.name}</h2>
        <Badge tone={med.rx ? 'warning' : 'neutral'}>{med.rx ? 'Rx' : 'OTC'}</Badge>
      </header>

      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}
      {waiting && (
        <Notice tone="warning" icon={<Warning size={16} />}>
          {med.has_revision ? `Changes by ${med.revision_by ?? 'the author'} are` : 'This item is'} waiting for {med.reviewer_name ?? 'a medical reviewer'}.
        </Notice>
      )}
      {med.review_note && !waiting && <Notice tone="warning" icon={<Warning size={16} />}>Reviewer note: {med.review_note}</Notice>}

      <fieldset disabled={locked} className="m-0 flex min-w-0 flex-col gap-3 border-0 p-0">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
          <Field label="Generic name">
            <TextField id="mp-generic" label="" hideLabel value={form.generic_name} onChange={(e) => set({ generic_name: e.target.value })} />
          </Field>
          <Field label="Strength" htmlFor="mp-strength">
            <UnitField id="mp-strength" value={form.strength_value} onChange={(strength_value) => set({ strength_value })} unit={form.strength_unit} units={UNITS} onUnitChange={(strength_unit) => set({ strength_unit })} unitLabel="Strength unit" />
          </Field>
        </div>
        <Field label="Brand names (ID market)">
          <ChipInput allowSpaces values={form.brands} onChange={(brands) => set({ brands })} placeholder="Type and press Enter" />
        </Field>
        <Field label="BPOM registration">
          <TextField id="mp-bpom" label="" hideLabel className="font-mono" placeholder="DKL1234567810A1" value={form.bpom} onChange={(e) => set({ bpom: e.target.value })} />
        </Field>
        <Field label="Dosage presets">
          <div className="flex flex-wrap gap-1.5">
            {form.presets.map((p, i) => (
              <span key={i} className="rounded-full border border-primary bg-primary-soft px-2.5 py-1 text-11 font-semibold text-primary">{presetLabel(p)}</span>
            ))}
            {canEdit && <button type="button" className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-11 font-semibold text-ink-muted" onClick={onEditAll}><PencilSimple size={11} /> Edit dosing</button>}
          </div>
        </Field>
        <Field label="Reminder template">
          <TextField id="mp-reminder" label="" hideLabel maxLength={160} value={form.reminder_template} onChange={(e) => set({ reminder_template: e.target.value })} />
        </Field>
        <Field label="Warnings shown to users">
          <TextAreaField maxLength={400} value={form.warnings} onChange={(e) => set({ warnings: e.target.value })} />
        </Field>
        <div className="flex flex-col gap-2.5">
          <ToggleRow label="Show in Treatment program" title="Show in Treatment program (IUI/IVF)" checked={form.show_program} onChange={(show_program) => set({ show_program })} />
          <ToggleRow label="Show in quick Meds log" title="Show in quick Meds log" checked={form.show_quick_log} onChange={(show_quick_log) => set({ show_quick_log })} />
          <ToggleRow label="Require doctor note to add" title="Require doctor note to add" checked={form.require_doctor_note} onChange={(require_doctor_note) => set({ require_doctor_note })} />
        </div>
      </fieldset>

      {med.status === 'published' && med.reviewed_by && !waiting && (
        <div className="flex items-center gap-2 rounded-xl bg-success-soft px-3.5 py-2.5 text-12 font-semibold text-success">
          <CheckCircle size={16} className="flex-none" /> Reviewed by {med.reviewed_by} · {fmtDateShort(med.reviewed_at)}
        </div>
      )}

      {waiting && isReviewer ? (
        <div className="flex flex-col gap-2.5">
          <TextAreaField placeholder="Note for the author (required to send back)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="outline" disabled={busy} onClick={() => run(() => reviewMed(med.id, false, note), 'Sent back for changes')}>Request changes</Button>
            <Button disabled={busy} onClick={() => run(() => reviewMed(med.id, true), 'Approved and published')}>Approve</Button>
          </div>
        </div>
      ) : waiting ? (
        canEdit && <Button variant="outline" disabled={busy} onClick={() => run(() => withdrawMed(med.id), 'Withdrawn from review')}>Withdraw from review</Button>
      ) : (
        canEdit && (
          <div className="grid grid-cols-2 gap-2.5">
            {med.status === 'draft' ? (
              <Button variant="outline" disabled={busy} onClick={() => setConfirmDelete(true)} leadingIcon={<Trash size={16} />}>Delete draft</Button>
            ) : (
              <Button variant="outline" disabled={busy} onClick={() => setForm(toForm(med))}>Discard</Button>
            )}
            <Button disabled={busy || issue !== null} title={issue ?? undefined} onClick={() => run(() => saveMed(med.id, toPayload(form), true), 'Sent to review')} leadingIcon={<PaperPlaneTilt size={16} color="#fff" />}>
              {busy ? 'Sending…' : 'Save & send to review'}
            </Button>
          </div>
        )
      )}
      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} tone="danger" title={`Delete draft “${med.name}”?`} description="The draft is removed. Published items can't be deleted." confirmLabel="Delete draft" onConfirm={async () => { await deleteMed(med.id); toast({ title: 'Draft deleted' }); onSaved() }} />
    </Card>
  )
}
