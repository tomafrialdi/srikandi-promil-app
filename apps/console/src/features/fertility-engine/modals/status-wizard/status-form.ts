import { FIELD_BY_KEY } from '../../engine/fields'
import type { Cond, EngineConfig, Groups, ModeKey, StatusCategory, StatusDef, StatusExperience, StatusOutputs, TriggerItem, ColorKey } from '../../types'

export interface StatusForm {
  editing: boolean
  isDefault: boolean
  key: string
  keyTouched: boolean
  name: string
  description: string
  color: ColorKey
  icon: string
  category: StatusCategory
  /** order of the status this one is placed before */
  order: number
  modes: ModeKey[]
  entry: Groups
  exit: Groups
  experience: StatusExperience
  triggers: TriggerItem[]
  outputs: StatusOutputs
  content_tags: string[]
}

export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)

export const CONTENT_TAGS = ['Two-week wait survival', 'Implantation explained', 'Luteal phase & progesterone', 'Fertile window tips', 'PCOS basics', 'Tracking BBT well']

const emptyCopy = { headline: '', subtitle: '', ring: '', discreet: 'Cycle update' }

export const CALENDAR_MARKERS = ['Filled purple dot + “OV”', 'Filled dot', 'Outlined ring', 'Small icon only', 'No marker']
export const TONES = ['Warm · reassuring', 'Neutral · informative', 'Celebratory', 'Gentle · low-key']

export function defaultTriggers(name: string): TriggerItem[] {
  return [
    { key: 'push', type: 'push', title: 'Push to user', text: `“${name || 'New status'}”`, detail: '08:00 local · respects quiet hours', enabled: true },
    { key: 'partner', type: 'partner', title: 'Partner alert', text: '', detail: 'Only if partner sharing is on', enabled: false },
    { key: 'reminder', type: 'reminder', title: 'Schedule test-day reminder', text: 'Creates reminder for 12 DPO at 07:00', detail: 'Auto-cancelled if period starts', enabled: false },
    { key: 'email', type: 'email', title: 'Weekly email digest', text: 'Adds this status to the cycle recap', detail: '', enabled: false },
  ]
}

export function newForm(config: EngineConfig): StatusForm {
  const defaultStatus = config.statuses.find((s) => s.default)
  return {
    editing: false,
    isDefault: false,
    key: '',
    keyTouched: false,
    name: '',
    description: '',
    color: 'purple',
    icon: 'check-circle',
    category: 'luteal',
    order: defaultStatus?.order ?? config.statuses.length,
    modes: ['ttc', 'pcos', 'after_loss'],
    entry: [[{ field: 'lh', op: '=', value: 'peak' }]],
    exit: [],
    experience: { copy: { en: { ...emptyCopy }, id: { ...emptyCopy } }, calendar_marker: CALENDAR_MARKERS[0]!, tone: TONES[0]!, celebration: true, hide_after_loss: false },
    triggers: defaultTriggers(''),
    outputs: { cycle_history: true, doctor_report: true, analytics_event: true, clinic_webhook: false },
    content_tags: [],
  }
}

export function fromStatus(s: StatusDef, config: EngineConfig): StatusForm {
  const base = newForm(config)
  return {
    ...base,
    editing: true,
    isDefault: s.default,
    key: s.key,
    keyTouched: true,
    name: s.name,
    description: s.description,
    color: s.color,
    icon: s.icon,
    category: s.category,
    order: s.order,
    modes: s.modes,
    entry: s.entry,
    exit: s.exit,
    experience: s.experience ?? { ...base.experience, copy: { en: { ...emptyCopy, headline: s.copy.replace(/^“|”$/g, '') }, id: { ...emptyCopy } } },
    triggers: s.triggers ?? defaultTriggers(s.name),
    outputs: s.outputs ?? base.outputs,
    content_tags: s.content_tags ?? [],
  }
}

export function toStatus(form: StatusForm, base?: StatusDef): StatusDef {
  const headline = form.experience.copy.en.headline.trim() || form.name.trim()
  return {
    key: form.key,
    name: form.name.trim(),
    color: form.color,
    icon: form.icon,
    order: form.order,
    category: form.category,
    modes: form.modes,
    description: form.description.trim(),
    entry: form.entry,
    exit: form.exit,
    copy: `“${headline}”`,
    default: form.isDefault,
    counts_as: base?.counts_as ?? [],
    ...(base?.counts_mode ? { counts_mode: base.counts_mode } : {}),
    experience: form.experience,
    triggers: form.triggers,
    outputs: form.outputs,
    content_tags: form.content_tags,
  }
}

/** Why a condition can't be saved (null = fine). */
export function condIssue(c: Cond): string | null {
  const def = FIELD_BY_KEY[c.field]
  const value = c.value.trim()
  if (!def) return 'Pick a signal'
  if (!value) return 'Enter a value'
  if (c.op === 'between') return /^-?\d+(\.\d+)?\s*(?:[-–]|\.\.)\s*-?\d+(\.\d+)?$/.test(value) ? null : 'Use "1 - 2"'
  if (def.type === 'bool') return value === 'true' || value === 'false' ? null : 'Use true or false'
  if (def.type === 'enum') return value.split(/\s+OR\s+/i).every((v) => def.options?.includes(v.trim())) ? null : `Use: ${def.options?.join(', ')}`
  return Number.isNaN(parseFloat(value)) ? 'Enter a number' : null
}

export const groupsIssues = (groups: Groups): number => groups.flat().filter((c) => condIssue(c) !== null).length

export function basicsIssue(f: StatusForm, config: EngineConfig): string | null {
  if (f.name.trim().length < 2) return 'Give the status a name'
  if (!/^[a-z][a-z0-9_]{2,40}$/.test(f.key)) return 'The rule key must be snake_case (3+ characters)'
  if (!f.editing && config.statuses.some((s) => s.key === f.key)) return 'That rule key is already used'
  if (f.modes.length === 0) return 'Pick at least one mode'
  return null
}

export function conditionsIssue(f: StatusForm): string | null {
  if (!f.isDefault && f.entry.length === 0) return 'Add at least one entry condition'
  if (groupsIssues(f.entry) + groupsIssues(f.exit) > 0) return 'Fix the highlighted conditions'
  return null
}

/** A fresh condition row ("lh = peak") used by the "Add condition" actions. */
export const BLANK_COND: import('../../types').Cond = { field: 'lh', op: '=', value: 'peak' }
