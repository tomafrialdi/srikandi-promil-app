import type { BadgeTone } from '../../../shared/ui'
import type { PdpRequest, Range, Risk, SystemState } from '../types'

export const CATEGORIES = [
  { key: 'auth', label: 'Auth' },
  { key: 'data_access', label: 'Data access' },
  { key: 'users', label: 'Users' },
  { key: 'content', label: 'Content' },
  { key: 'engine', label: 'Engine' },
  { key: 'billing', label: 'Billing' },
  { key: 'roles', label: 'Roles' },
  { key: 'care', label: 'Care' },
  { key: 'support', label: 'Support' },
  { key: 'pdp', label: 'PDP' },
] as const

export const categoryLabel = (key: string) => CATEGORIES.find((c) => c.key === key)?.label ?? 'Other'

export const CATEGORY_TONE: Record<string, BadgeTone> = {
  auth: 'info',
  data_access: 'error',
  users: 'neutral',
  content: 'primary',
  engine: 'warning',
  billing: 'success',
  roles: 'warning',
  care: 'primary',
  support: 'info',
  pdp: 'error',
}

export const RISK_TONE: Record<Risk, BadgeTone> = { high: 'error', med: 'warning', low: 'success' }
export const RISK_LABEL: Record<Risk, string> = { high: 'High', med: 'Med', low: 'Low' }

export const RANGES: { value: Range; label: string; hours: number }[] = [
  { value: '24h', label: 'Last 24 hours', hours: 24 },
  { value: '7d', label: 'Last 7 days', hours: 24 * 7 },
  { value: '30d', label: 'Last 30 days', hours: 24 * 30 },
  { value: '90d', label: 'Last 90 days', hours: 24 * 90 },
]

export const RISK_OPTIONS = [
  { value: '', label: 'Any risk' },
  { value: 'high', label: 'High risk' },
  { value: 'med', label: 'Medium risk' },
  { value: 'low', label: 'Low risk' },
]

export const SEVERITY_TONE = { high: 'error', medium: 'warning', low: 'neutral' } as const

export const ALERT_STATUS: Record<string, { label: string; tone: BadgeTone }> = {
  open: { label: 'Open', tone: 'error' },
  in_progress: { label: 'In progress', tone: 'warning' },
  closed: { label: 'Closed', tone: 'success' },
}

export const DSR_TYPE: Record<PdpRequest['type'], string> = {
  access: 'Access',
  correction: 'Correction',
  deletion: 'Deletion',
  portability: 'Export (portability)',
}

export const DSR_STATUS: Record<PdpRequest['status'], { label: string; tone: BadgeTone }> = {
  new: { label: 'New', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'warning' },
  blocked: { label: 'Blocked', tone: 'error' },
  completed: { label: 'Completed', tone: 'success' },
}

export const SYSTEM_STATES: { value: SystemState; label: string; tone: BadgeTone }[] = [
  { value: 'pending', label: 'Pending', tone: 'neutral' },
  { value: 'scheduled', label: 'Scheduled', tone: 'info' },
  { value: 'notified', label: 'Notified', tone: 'warning' },
  { value: 'deleted', label: 'Deleted', tone: 'success' },
  { value: 'anonymised', label: 'Anonymised', tone: 'success' },
  { value: 'retained', label: 'Retained by law', tone: 'primary' },
]

export const RESOLUTIONS = [
  { value: 'legitimate', label: 'Legitimate', description: 'Expected work; close the alert' },
  { value: 'follow_up', label: 'Needs follow-up', description: 'Keep it open while you check' },
  { value: 'misuse', label: 'Confirmed misuse', description: 'Close and escalate to the DPO' },
] as const

export const CONTAINMENT = [
  { kind: 'reauth', title: 'Require re-authentication', description: 'Force passkey + 2FA now' },
  { kind: 'suspend_unmask', title: 'Suspend unmask permission', description: '24h · until DPO review' },
  { kind: 'notify', title: 'Notify DPO & Super admins', description: 'Logged as a notification' },
] as const

export const ACCESS_LABEL: Record<string, { label: string; tone: BadgeTone }> = {
  viewed: { label: 'Viewed', tone: 'info' },
  edited: { label: 'Viewed & edited', tone: 'warning' },
  none: { label: 'Not accessed', tone: 'neutral' },
}
