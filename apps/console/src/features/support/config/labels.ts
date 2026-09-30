import { DeviceMobile, Globe, WhatsappLogo, type Icon } from '@phosphor-icons/react'
import type { Category, Channel, Priority } from '../types'

export const PRIORITY: Record<Priority, { label: string; fg: string; bg: string }> = {
  high: { label: 'High', fg: 'var(--error)', bg: 'var(--error-soft)' },
  medium: { label: 'Medium', fg: 'var(--warning-ink)', bg: 'var(--warning-soft)' },
  low: { label: 'Low', fg: 'var(--ink-muted)', bg: 'var(--surface-alt)' },
}
export const PRIORITY_OPTIONS = (['high', 'medium', 'low'] as Priority[]).map((p) => ({ value: p, label: PRIORITY[p].label }))

export const CHANNEL: Record<Channel, { label: string; icon: Icon }> = {
  app: { label: 'App', icon: DeviceMobile },
  web: { label: 'Web', icon: Globe },
  whatsapp: { label: 'WhatsApp', icon: WhatsappLogo },
}
export const CHANNEL_OPTIONS = (Object.keys(CHANNEL) as Channel[]).map((c) => ({ value: c, label: CHANNEL[c].label }))

export const CATEGORY: Record<Category, string> = {
  bug: 'Bug',
  billing: 'Billing',
  privacy: 'Privacy',
  partner: 'Partner',
  integrations: 'Integrations',
  account: 'Account',
  medical: 'Medical',
  other: 'Other',
}
export const CATEGORY_OPTIONS = (Object.keys(CATEGORY) as Category[]).map((c) => ({ value: c, label: CATEGORY[c] }))

export const STATUS_FILTER = [
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'any', label: 'Any status' },
]

export const PLAN_LABEL: Record<string, string> = { free: 'Free', trial: 'Trial', plus_monthly: 'Plus', plus_yearly: 'Plus', clinic_sponsored: 'Plus (clinic)' }
export const PLATFORM_LABEL: Record<string, string> = { ios: 'iOS', android: 'Android' }
export const SUGGESTED_TAGS = ['bug', 'billing', 'refund', 'ios', 'android', 'urgent', 'privacy']
