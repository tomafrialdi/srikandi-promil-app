import type { SelectOption } from '../../../shared/ui'

const options = (values: number[], label: (n: number) => string): SelectOption[] => values.map((n) => ({ value: String(n), label: label(n) }))

export const MIN_LENGTH = options([8, 10, 12, 14, 16], (n) => `${n} characters`)
export const ROTATION = options([0, 30, 60, 90, 180], (n) => (n === 0 ? 'Never' : `Every ${n} days`))
export const HISTORY = options([0, 3, 5, 10], (n) => (n === 0 ? 'No history check' : `Last ${n} can’t be reused`))

export const IDLE = options([10, 15, 30, 60], (n) => `${n} minutes`)
export const ABSOLUTE = options([4, 8, 12, 24], (n) => `${n} hours`)
export const CONCURRENT = options([1, 2, 3, 5], (n) => `${n} per member`)

export const FAILED_LOGINS = options([3, 5, 10], (n) => `${n} attempts`)
export const LOCK_MINUTES = options([5, 15, 30, 60], (n) => `${n} minutes`)
export const AUTOBLOCK = options([10, 20, 50, 100], (n) => `${n} fails / hour`)

export const PURGE_DAYS = options([7, 14, 30, 60, 90], (n) => `${n} days`)
export const ATTACHMENT_DAYS = options([30, 90, 180, 365], (n) => `${n} days`)

/** Shown in the Authentication tab; the rules themselves are enforced by the auth layer. */
export const PRIVILEGED_RULES = [
  { who: 'Super admin, Admin', rule: 'Passkey or security key required (no TOTP)' },
  { who: 'Medical reviewer, Engine engineer', rule: 'Re-authenticate before approving changes' },
  { who: 'Anyone unmasking health data', rule: 'Re-authenticate every 4 hours' },
]

export const UNMASK_RULES = [
  { need: 'Have “unmask with reason” permission', detail: 'Support agent, Admin, Super admin' },
  { need: 'Link a ticket or reason', detail: 'Free-text reasons are rejected' },
  { need: 'Re-authenticate', detail: 'Every 4 hours' },
  { need: 'Accept auto-remask', detail: 'After 10 minutes' },
]

/** Readable names for the change keys stored on a request (fallback: the last key, spaced out). */
export const CHANGE_LABEL: Record<string, string> = {
  'authentication.sso': 'Google SSO',
  'authentication.passkeys': 'Passkeys',
  'authentication.sms_fallback': 'SMS fallback',
  'authentication.min_length': 'Minimum password length',
  'authentication.rotation_days': 'Password rotation',
  'authentication.history': 'Password history',
  'authentication.block_breached': 'Breached passwords',
  'network.ip_restricted': 'IP restriction',
  'network.ip_allowlist': 'IP allowlist',
  'network.indonesia_only': 'Indonesia-only sign-in',
}

export function changeLabel(key: string): string {
  if (CHANGE_LABEL[key]) return CHANGE_LABEL[key]
  const last = key.split('.').pop() ?? key
  const text = last.replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}
