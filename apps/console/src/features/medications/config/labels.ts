import { Drop, Leaf, Pill, Syringe, type Icon } from '@phosphor-icons/react'
import type { BadgeTone } from '../../../shared/ui'
import type { MedForm, MedStatus, MedType } from '../types'

export const PAGE_SIZE = 10

export const TYPE: Record<MedType, { label: string; icon: Icon }> = {
  oral: { label: 'Oral medication', icon: Pill },
  injection: { label: 'Injection', icon: Syringe },
  supplement: { label: 'Supplement', icon: Leaf },
  topical: { label: 'Vaginal / topical', icon: Drop },
}

export const STATUS: Record<MedStatus, { label: string; tone: BadgeTone; dot: string }> = {
  published: { label: 'Published', tone: 'success', dot: 'var(--success)' },
  in_review: { label: 'In review', tone: 'warning', dot: 'var(--warning)' },
  draft: { label: 'Draft', tone: 'neutral', dot: 'var(--ink-faint)' },
}

/** Icon tile colours by category; anything else is neutral. */
export const CATEGORY_TONE: Record<string, { bg: string; fg: string }> = {
  Supplement: { bg: 'var(--success-soft)', fg: 'var(--success)' },
  'Supplement · PCOS': { bg: 'var(--warning-soft)', fg: 'var(--warning-ink)' },
  'Ovulation induction': { bg: 'var(--primary-soft)', fg: 'var(--primary)' },
  'Trigger shot': { bg: 'var(--secondary-soft)', fg: 'var(--secondary)' },
  'Luteal support': { bg: '#e9e3f8', fg: '#6b4fbb' },
}
export const NEUTRAL_TONE = { bg: 'var(--surface-alt)', fg: 'var(--ink-muted)' }

export const FORMS: Array<{ value: MedForm; label: string }> = [
  { value: 'tablet', label: 'Tablet' },
  { value: 'capsule', label: 'Capsule' },
  { value: 'sachet', label: 'Sachet (powder)' },
  { value: 'injection', label: 'Injection' },
  { value: 'pen', label: 'Pen injector' },
  { value: 'suppository', label: 'Suppository / pessary' },
  { value: 'gel', label: 'Gel / cream' },
  { value: 'other', label: 'Other' },
]

export const UNITS = ['mg', 'mcg', 'g', 'IU', 'mIU', 'ml'].map((u) => ({ value: u, label: u }))
export const FREQUENCIES = ['1× daily', '2× daily', '3× daily', 'Once', 'As needed'].map((v) => ({ value: v, label: v }))
export const TIMINGS = ['Every day (no cycle link)', 'CD 3–7', 'CD 5–9', 'Trigger day', 'From ovulation until test', 'Luteal phase (2WW)'].map((v) => ({ value: v, label: v }))

export const TYPE_FILTER = [
  { value: '', label: 'Type: All' },
  { value: 'oral', label: 'Oral' },
  { value: 'injection', label: 'Injection' },
  { value: 'supplement', label: 'Supplement' },
  { value: 'topical', label: 'Vaginal / topical' },
]
export const RX_FILTER = [
  { value: '', label: 'Rx: Any' },
  { value: 'rx', label: 'Rx only' },
  { value: 'otc', label: 'OTC only' },
]
