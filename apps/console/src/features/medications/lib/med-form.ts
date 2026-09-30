import type { MedFields, MedFormState, Preset } from '../types'

export const blankPreset = (): Preset => ({ dose: '', frequency: '1× daily', timing: 'Every day (no cycle link)', time: '08:00' })

export function blankForm(): MedFormState {
  return {
    type: 'oral',
    generic_name: '',
    bpom: '',
    brands: [],
    category: '',
    strength_value: '',
    strength_unit: 'mg',
    form: 'tablet',
    rx: false,
    require_doctor_note: false,
    presets: [blankPreset()],
    reminder_template: 'Time for {name} {dose}',
    show_quick_log: true,
    show_program: false,
    suggest_pcos: false,
    include_report: true,
    warnings: '',
    reviewer_id: '',
    article_id: '',
  }
}

export function toForm(m: MedFields): MedFormState {
  return {
    type: m.type,
    generic_name: m.generic_name,
    bpom: m.bpom ?? '',
    brands: m.brands,
    category: m.category,
    strength_value: String(m.strength_value),
    strength_unit: m.strength_unit,
    form: m.form,
    rx: m.rx,
    require_doctor_note: m.require_doctor_note,
    presets: m.presets,
    reminder_template: m.reminder_template,
    show_quick_log: m.show_quick_log,
    show_program: m.show_program,
    suggest_pcos: m.suggest_pcos,
    include_report: m.include_report,
    warnings: m.warnings,
    reviewer_id: m.reviewer_id ?? '',
    article_id: m.article_id ?? '',
  }
}

export function toPayload(f: MedFormState): MedFields {
  return {
    generic_name: f.generic_name.trim(),
    type: f.type,
    category: f.category,
    strength_value: Number(f.strength_value),
    strength_unit: f.strength_unit,
    form: f.form,
    brands: f.brands,
    bpom: f.bpom.trim() ? f.bpom.trim().toUpperCase() : null,
    rx: f.rx,
    require_doctor_note: f.require_doctor_note,
    presets: f.presets.filter((p) => p.dose.trim()),
    reminder_template: f.reminder_template,
    warnings: f.warnings,
    show_quick_log: f.show_quick_log,
    show_program: f.show_program,
    suggest_pcos: f.suggest_pcos,
    include_report: f.include_report,
    reviewer_id: f.reviewer_id || null,
    article_id: f.article_id || null,
  }
}

/** What stops a draft from being saved at all. */
export function draftIssue(f: MedFormState): string | null {
  if (f.generic_name.trim().length < 2) return 'Enter the generic name'
  if (!f.category) return 'Pick a category'
  if (!(Number(f.strength_value) > 0)) return 'Enter the strength'
  return null
}

/** What stops it from being sent to review. */
export function submitIssue(f: MedFormState): string | null {
  const base = draftIssue(f)
  if (base) return base
  if (!f.presets.some((p) => p.dose.trim())) return 'Add at least one dosage preset'
  if (f.reminder_template.trim().length < 5) return 'Write the reminder template'
  if (f.rx && !f.bpom.trim()) return 'Prescription items need a BPOM registration number'
  if (!f.reviewer_id) return 'Choose a medical reviewer'
  return null
}

export function pushPreview(f: MedFormState): string {
  const dose = f.presets.find((p) => p.dose.trim())?.dose ?? `${f.strength_value} ${f.strength_unit}`
  return f.reminder_template
    .replaceAll('{name}', f.generic_name || 'Medication')
    .replaceAll('{dose}', dose)
    .replaceAll('{day}', 'Day 1')
    .replaceAll('{n}', '1')
}

export const presetLabel = (p: Preset) => `${p.dose} · ${p.timing.replace(/^Every day.*/, 'daily')}`
