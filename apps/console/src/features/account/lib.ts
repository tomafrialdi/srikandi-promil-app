const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Jakarta' })
const dateTimeFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })
const clock = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })
const dayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })

export const formatDate = (iso: string | null | undefined) => (iso ? dateFormat.format(new Date(iso)) : '—')

/** "Today 07:12" or "20 May, 02:47" */
export function formatWhen(iso: string): string {
  const at = new Date(iso)
  return dayKey.format(at) === dayKey.format(new Date()) ? `Today ${clock.format(at)}` : dateTimeFormat.format(at)
}

export const daysSince = (iso: string | null | undefined) => (iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : null)

/** Small user-agent summary: "Chrome · macOS". */
export function describeUserAgent(ua: string | null): string {
  if (!ua) return 'Unknown device'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Browser'
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS'
  return `${browser} · ${os}`
}

const ACTIVITY: Record<string, string> = {
  'auth.sign_in': 'Signed in',
  'auth.sign_out': 'Signed out',
  'auth.password_change': 'Password changed',
  'account.profile_update': 'Profile updated',
  'account.session_revoke': 'Session revoked',
  'account.backup_codes_regenerate': 'Backup codes regenerated',
  'account.token_create': 'API token created',
  'account.token_revoke': 'API token revoked',
  'account.deactivation_request': 'Deactivation requested',
}
export const activityLabel = (action: string) => ACTIVITY[action] ?? action.replace(/[._]/g, ' ')

/** "12 min ago", "2 days ago". */
export function ago(iso: string | null): string {
  if (!iso) return 'never'
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} days ago`
}
