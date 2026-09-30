import { Clock, FloppyDisk, PaperPlaneTilt, Pill, Plus, ScanSmiley, Trash, Warning } from '@phosphor-icons/react'
import { useState } from 'react'
import { cn } from '../../../shared/lib/cn'
import { Button, ChipInput, Field, Modal, ModalFooter, ModalSection, Notice, SelectField, TextAreaField, TextField, ToggleRow, useToast } from '../../../shared/ui'
import { FORMS, FREQUENCIES, TIMINGS, TYPE, UNITS } from '../config/labels'
import { blankForm, blankPreset, draftIssue, pushPreview, submitIssue, toForm, toPayload } from '../lib/med-form'
import { saveMed } from '../services/medications.service'
import type { MedFormState, MedFull, MedType, MedsOptions } from '../types'

interface AddMedicationModalProps {
  open: boolean
  onClose: () => void
  /** null = add a new item. Mount with a key so the form starts fresh. */
  med: MedFull | null
  options?: MedsOptions
  onSaved: (id: string) => void
}

const TYPES: MedType[] = ['oral', 'injection', 'supplement', 'topical']

export function AddMedicationModal({ open, onClose, med, options, onSaved }: AddMedicationModalProps) {
  const toast = useToast()
  const [form, setForm] = useState<MedFormState>(() => (med ? toForm(med.revision ?? med) : blankForm()))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const set = (patch: Partial<MedFormState>) => setForm((f) => ({ ...f, ...patch }))
  const published = med?.status === 'published'
  const dIssue = draftIssue(form)
  const sIssue = submitIssue(form)

  const setPreset = (i: number, patch: Partial<MedFormState['presets'][number]>) => set({ presets: form.presets.map((p, x) => (x === i ? { ...p, ...patch } : p)) })

  const save = async (submit: boolean) => {
    setSaving(true)
    setError(null)
    try {
      const id = await saveMed(med?.id ?? null, toPayload(form), submit || published)
      toast({ title: submit || published ? 'Sent to medical review' : 'Saved as draft', description: form.generic_name })
      onSaved(id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the medication.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => !saving && onClose()}
      size="lg"
      icon={<Pill size={20} />}
      title={med ? `Edit · ${med.name}` : 'Add medication'}
      subtitle={published ? 'Changes go live only after the medical reviewer approves them.' : 'New items are saved as Draft until a medical reviewer approves them.'}
      footer={
        <ModalFooter info={sIssue ?? 'Ready to send to review'}>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          {!published && <Button variant="outline" onClick={() => save(false)} disabled={saving || dIssue !== null} title={dIssue ?? undefined} leadingIcon={<FloppyDisk size={16} />}>Save draft</Button>}
          <Button onClick={() => save(true)} disabled={saving || sIssue !== null} title={sIssue ?? undefined} leadingIcon={<PaperPlaneTilt size={16} color="#fff" />}>{saving ? 'Saving…' : 'Submit for review'}</Button>
        </ModalFooter>
      }
    >
      {error && <Notice tone="error" icon={<Warning size={16} />}>{error}</Notice>}

      <ModalSection label="Identity">
        <Field label="Type" required>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface-alt p-1 min-[701px]:grid-cols-4" role="radiogroup" aria-label="Type">
            {TYPES.map((t) => {
              const Glyph = TYPE[t].icon
              return (
                <button key={t} type="button" role="radio" aria-checked={form.type === t} className={cn('inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-12 font-semibold', form.type === t ? 'bg-card font-bold shadow-[0_1px_2px_rgba(26,26,24,0.08)]' : 'text-ink-muted')} onClick={() => set({ type: t })}>
                  <Glyph size={14} /> {TYPE[t].label}
                </button>
              )
            })}
          </div>
        </Field>
        <div className="flex items-center gap-3 rounded-xl bg-secondary-soft px-3.5 py-3 text-12 font-medium text-secondary">
          <ScanSmiley size={16} className="flex-none" />
          <span className="min-w-0 flex-1">Autofill from BPOM registry — paste a registration number (e.g. DKL…) to fill names, strength &amp; form.</span>
          <Button variant="outline" disabled title="Needs BPOM registry API access">Look up</Button>
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <Field label="Generic name" htmlFor="am-generic" required>
            <TextField id="am-generic" label="" hideLabel maxLength={80} value={form.generic_name} onChange={(e) => set({ generic_name: e.target.value })} />
          </Field>
          <Field label="BPOM registration" htmlFor="am-bpom" hint={form.rx ? 'Required for Rx' : 'Optional for OTC'}>
            <TextField id="am-bpom" label="" hideLabel className="font-mono" placeholder="e.g. DKL1234567810A1" value={form.bpom} onChange={(e) => set({ bpom: e.target.value })} />
          </Field>
        </div>
        <Field label="Brand names (Indonesian market)" hint="Press Enter to add">
          <ChipInput allowSpaces values={form.brands} onChange={(brands) => set({ brands })} placeholder="Type a brand name" />
        </Field>
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <Field label="Category" required>
            <SelectField aria-label="Category" value={form.category} options={[{ value: '', label: 'Select a category' }, ...(options?.categories ?? []).map((c) => ({ value: c, label: c }))]} onChange={(category) => set({ category })} />
          </Field>
          <Field label="Strength" required>
            <div className="flex gap-1.5">
              <TextField id="am-strength" label="" hideLabel inputMode="decimal" value={form.strength_value} onChange={(e) => set({ strength_value: e.target.value })} />
              <SelectField aria-label="Unit" className="w-24 flex-none" value={form.strength_unit} options={UNITS} onChange={(strength_unit) => set({ strength_unit })} />
            </div>
          </Field>
          <Field label="Form">
            <SelectField aria-label="Form" value={form.form} options={FORMS} onChange={(v) => set({ form: v as MedFormState['form'] })} />
          </Field>
        </div>
        <div className="rounded-xl bg-surface px-3.5 py-3">
          <ToggleRow label="Prescription required (Rx)" title="Prescription required (Rx)" description="Users must confirm a doctor prescribed it before adding." checked={form.rx} onChange={(rx) => set({ rx, require_doctor_note: rx })} />
        </div>
      </ModalSection>

      <ModalSection label="Default dosage & reminders">
        <div className="flex flex-col gap-2.5">
          <div className="hidden grid-cols-[minmax(0,0.7fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,1fr)_28px] gap-2.5 text-11 font-bold text-ink-muted min-[701px]:grid">
            <span>Dose</span><span>Frequency</span><span>Timing in cycle</span><span>Time</span><span />
          </div>
          {form.presets.map((p, i) => (
            <div key={i} className="grid items-center gap-2.5 min-[701px]:grid-cols-[minmax(0,0.7fr)_minmax(0,0.9fr)_minmax(0,1.3fr)_minmax(0,1fr)_28px]">
              <TextField id={`am-dose-${i}`} label="" hideLabel aria-label="Dose" placeholder="2 g" value={p.dose} onChange={(e) => setPreset(i, { dose: e.target.value })} />
              <SelectField aria-label="Frequency" value={p.frequency} options={FREQUENCIES} onChange={(frequency) => setPreset(i, { frequency })} />
              <SelectField aria-label="Timing in cycle" value={p.timing} options={TIMINGS} onChange={(timing) => setPreset(i, { timing })} />
              <TextField id={`am-time-${i}`} label="" hideLabel aria-label="Time" placeholder="08:00, 20:00" trailing={<Clock size={15} className="text-ink-faint" />} value={p.time} onChange={(e) => setPreset(i, { time: e.target.value })} />
              <button type="button" aria-label="Remove preset" className="inline-flex size-7 items-center justify-center text-ink-faint hover:text-error" onClick={() => set({ presets: form.presets.filter((_, x) => x !== i) })}><Trash size={15} /></button>
            </div>
          ))}
          {form.presets.length < 8 && (
            <button type="button" className="inline-flex items-center gap-1 self-start text-12 font-bold text-primary" onClick={() => set({ presets: [...form.presets, blankPreset()] })}><Plus size={12} weight="bold" /> Add dosage preset</button>
          )}
        </div>
        <div className="grid gap-3.5 min-[701px]:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Field label="Reminder template" htmlFor="am-reminder" required hint="{name} {dose} {day}">
            <TextField id="am-reminder" label="" hideLabel maxLength={160} value={form.reminder_template} onChange={(e) => set({ reminder_template: e.target.value })} />
          </Field>
          <Field label="Push preview">
            <div className="flex items-center gap-2.5 rounded-xl bg-surface px-3 py-2.5">
              <span className="inline-flex size-8 flex-none items-center justify-center rounded-lg bg-primary text-11 font-extrabold text-white">SP</span>
              <span className="flex min-w-0 flex-col">
                <span className="text-10 font-semibold text-ink-faint">SRIKANDI PROMIL · now</span>
                <span className="truncate text-12 font-semibold">{pushPreview(form)}</span>
              </span>
            </div>
          </Field>
        </div>
      </ModalSection>

      <ModalSection label="Where it appears">
        <div className="grid gap-x-8 gap-y-3.5 min-[701px]:grid-cols-2">
          <ToggleRow label="Quick Meds log" title="Quick Meds log" description="Shown in the Meds bottom sheet" checked={form.show_quick_log} onChange={(show_quick_log) => set({ show_quick_log })} />
          <ToggleRow label="Suggest to PCOS mode users" title="Suggest to PCOS mode users" description="Appears in PCOS recommendations" checked={form.suggest_pcos} onChange={(suggest_pcos) => set({ suggest_pcos })} />
          <ToggleRow label="Treatment program" title="Treatment program" description="IUI / IVF schedules" checked={form.show_program} onChange={(show_program) => set({ show_program })} />
          <ToggleRow label="Include in Doctor report" title="Include in Doctor report" description="Adherence chart in PDF export" checked={form.include_report} onChange={(include_report) => set({ include_report })} />
        </div>
      </ModalSection>

      <ModalSection label="Safety & review">
        <Field label="Warnings shown to users" htmlFor="am-warn">
          <TextAreaField id="am-warn" maxLength={400} value={form.warnings} onChange={(e) => set({ warnings: e.target.value })} />
        </Field>
        <div className="grid gap-3.5 min-[701px]:grid-cols-2">
          <Field label="Medical reviewer" required>
            <SelectField aria-label="Medical reviewer" value={form.reviewer_id} options={[{ value: '', label: 'Select a reviewer' }, ...(options?.reviewers ?? []).map((r) => ({ value: r.id, label: r.name }))]} onChange={(reviewer_id) => set({ reviewer_id })} />
          </Field>
          <Field label="Linked article">
            <SelectField aria-label="Linked article" value={form.article_id} options={[{ value: '', label: 'None' }, ...(options?.articles ?? []).map((a) => ({ value: a.id, label: a.title }))]} onChange={(article_id) => set({ article_id })} />
          </Field>
        </div>
      </ModalSection>
    </Modal>
  )
}
