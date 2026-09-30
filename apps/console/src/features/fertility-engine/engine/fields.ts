import type { ColorKey, ModeKey, SignalKey, StatusCategory } from '../types'

export type FieldType = 'enum' | 'int' | 'number' | 'bool'

export interface FieldDef {
  key: string
  label: string
  type: FieldType
  /** Ordered values for enums (comparison operators use this order). */
  options?: string[]
  /** Which raw signal feeds the field; used for the "Uses N signals" check. */
  signal: SignalKey | 'derived'
  unit?: string
}

export const FIELDS: FieldDef[] = [
  { key: 'lh', label: 'LH test level', type: 'enum', options: ['none', 'low', 'high', 'peak'], signal: 'lh' },
  { key: 'cm', label: 'Cervical mucus', type: 'enum', options: ['dry', 'sticky', 'watery', 'egg_white'], signal: 'cf' },
  { key: 'flow', label: 'Period flow', type: 'enum', options: ['none', 'spotting', 'light', 'medium', 'heavy'], signal: 'derived' },
  { key: 'cd', label: 'Cycle day', type: 'int', signal: 'calendar' },
  { key: 'score', label: 'Weighted score', type: 'number', signal: 'derived' },
  { key: 'days_to_ov', label: 'Days to ovulation', type: 'int', signal: 'derived' },
  { key: 'dpo', label: 'Days past ovulation', type: 'int', signal: 'derived' },
  { key: 'bbt_shift_days', label: 'BBT shift (days)', type: 'int', signal: 'bbt' },
  { key: 'bbt_shift_delta', label: 'BBT shift (°C)', type: 'number', signal: 'bbt', unit: '°C' },
  { key: 'bbt_shift_confirmed', label: 'BBT shift confirmed', type: 'bool', signal: 'bbt' },
  { key: 'lh_peak_days_ago', label: 'LH peak, days ago', type: 'int', signal: 'lh' },
  { key: 'lh_high_streak', label: 'Consecutive LH highs', type: 'int', signal: 'lh' },
  { key: 'cm_after_peak', label: 'Mucus after LH peak', type: 'enum', options: ['dry', 'sticky', 'watery', 'egg_white'], signal: 'cf' },
  { key: 'ovulation_confirmed', label: 'Ovulation confirmed', type: 'bool', signal: 'derived' },
  { key: 'period_started', label: 'New period started', type: 'bool', signal: 'derived' },
  { key: 'positive_test', label: 'Positive pregnancy test', type: 'bool', signal: 'derived' },
  { key: 'hcg', label: 'hCG (mIU/mL)', type: 'number', signal: 'derived' },
  { key: 'fever_flag', label: 'Fever flag', type: 'bool', signal: 'bbt' },
  { key: 'pregnancy_mode', label: 'Pregnancy mode on', type: 'bool', signal: 'derived' },
  { key: 'test_result', label: 'Test result', type: 'enum', options: ['none', 'negative', 'positive'], signal: 'derived' },
  { key: 'days_since_peak', label: 'Days since peak', type: 'int', signal: 'lh' },
  { key: 'flow_none_days', label: 'Days without flow', type: 'int', signal: 'derived' },
  { key: 'cycles_since_loss', label: 'Cycles since loss', type: 'int', signal: 'derived' },
  { key: 'days_since_procedure', label: 'Days since procedure', type: 'int', signal: 'derived' },
  { key: 'status', label: 'Current status', type: 'enum', options: ['peak', 'high_fertility', 'two_week_wait', 'low_fertility', 'menstrual', 'pregnant'], signal: 'derived' },
]

export const FIELD_BY_KEY: Record<string, FieldDef> = Object.fromEntries(FIELDS.map((f) => [f.key, f]))

export const OPERATORS = ['=', '≠', '≥', '≤', '>', '<', 'between'] as const

export function operatorsFor(field: FieldDef | undefined): readonly string[] {
  if (!field) return OPERATORS
  if (field.type === 'bool') return ['=']
  if (field.type === 'enum') return ['=', '≠', '≥', '≤']
  return OPERATORS
}

export const COLORS: Record<ColorKey, { label: string; hex: string; soft: string; strong: string }> = {
  primary: { label: 'Crimson', hex: '#c13d68', soft: '#f6dee6', strong: '#c13d68' },
  pink: { label: 'Pink', hex: '#e07a9b', soft: '#fbe6ee', strong: '#c9577f' },
  blue: { label: 'Blue', hex: '#2574c4', soft: '#dceaf9', strong: '#2574c4' },
  green: { label: 'Green', hex: '#3f9950', soft: '#e1f1e3', strong: '#2f7d3f' },
  amber: { label: 'Amber', hex: '#e0a030', soft: '#fbefd9', strong: '#b87a1f' },
  purple: { label: 'Purple', hex: '#6b4fbb', soft: '#e9e3f8', strong: '#6b4fbb' },
  gray: { label: 'Gray', hex: '#a6a49b', soft: '#f1efe9', strong: '#6f6d66' },
  red: { label: 'Red', hex: '#d64545', soft: '#fae1e1', strong: '#c23a3a' },
}

export const CATEGORIES: Array<{ value: StatusCategory; label: string }> = [
  { value: 'menstrual', label: 'Menstrual' },
  { value: 'follicular', label: 'Follicular phase' },
  { value: 'fertile', label: 'Fertile window' },
  { value: 'luteal', label: 'Luteal phase' },
  { value: 'pregnancy', label: 'Pregnancy' },
  { value: 'other', label: 'Other' },
]

export const MODES: Array<{ key: ModeKey; label: string; slug: string }> = [
  { key: 'ttc', label: 'TTC', slug: 'ttc' },
  { key: 'pcos', label: 'PCOS', slug: 'pcos' },
  { key: 'iui_ivf', label: 'IUI/IVF', slug: 'iui-ivf' },
  { key: 'after_loss', label: 'After loss', slug: 'after-loss' },
]

export const modeFromSlug = (slug: string | undefined): ModeKey => MODES.find((m) => m.slug === slug)?.key ?? 'ttc'
export const slugOf = (mode: ModeKey): string => MODES.find((m) => m.key === mode)?.slug ?? 'ttc'

export const SIGNAL_LABEL: Record<SignalKey, string> = {
  lh: 'LH test',
  cf: 'Cervical fluid',
  bbt: 'BBT shift',
  calendar: 'Calendar prior',
  skin: 'Wearable skin temp',
  protocol: 'Clinic protocol dates',
}
