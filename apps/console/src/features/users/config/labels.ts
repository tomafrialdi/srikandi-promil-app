import type { BadgeTone } from '../../../shared/ui'
import type { UserStatusDisplay } from '../types'

export const STATUS_BADGE: Record<UserStatusDisplay, { label: string; tone: BadgeTone; dot?: string }> = {
  active: { label: 'Active', tone: 'success', dot: 'var(--success)' },
  inactive: { label: 'Inactive', tone: 'neutral', dot: 'var(--ink-faint)' },
  suspended: { label: 'Suspended', tone: 'error', dot: 'var(--error)' },
  deletion_requested: { label: 'Deletion requested', tone: 'warning', dot: 'var(--warning)' },
}

export const PLAN_FILTER_OPTIONS = [
  { value: '', label: 'Plan: All' },
  { value: 'free', label: 'Free' },
  { value: 'trial', label: 'Trial' },
  { value: 'plus_monthly', label: 'Plus monthly' },
  { value: 'plus_yearly', label: 'Plus yearly' },
  { value: 'clinic_sponsored', label: 'Clinic-sponsored' },
]

export const MODE_FILTER_OPTIONS = [
  { value: '', label: 'Mode: All' },
  { value: 'ttc', label: 'TTC' },
  { value: 'pcos', label: 'PCOS' },
  { value: 'iui', label: 'IUI' },
  { value: 'ivf', label: 'IVF' },
  { value: 'after_loss', label: 'After loss' },
  { value: 'pregnant', label: 'Pregnant' },
]

export const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'Status: All' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deletion_requested', label: 'Deletion requested' },
]

export const PAGE_SIZE = 10
