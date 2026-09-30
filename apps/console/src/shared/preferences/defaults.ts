import type { AccountPrefs } from './types'

export const NOTIFICATION_EVENTS = [
  { key: 'security', label: 'Security alerts (unusual unmask, blocked logins)', note: 'Always on for Super admins', locked: true },
  { key: 'approvals', label: 'Approvals waiting for me (roles, prices, engine)' },
  { key: 'engine', label: 'Engine canary health & rollbacks' },
  { key: 'tickets', label: 'Support tickets breaching SLA' },
  { key: 'community', label: 'Community reports · urgent (self-harm)' },
  { key: 'dsr', label: 'Data subject requests (UU PDP)' },
  { key: 'kpi', label: 'Weekly KPI digest', note: 'Mondays 08:00' },
  { key: 'announcements', label: 'Product announcements' },
] as const

const events = Object.fromEntries(
  NOTIFICATION_EVENTS.map((e) => [e.key, { email: true, slack: e.key === 'security' || e.key === 'community', push: e.key === 'security' || e.key === 'community' }]),
)

export const DEFAULT_PREFS: AccountPrefs = {
  display: {
    theme: 'light',
    density: 'comfortable',
    language: 'English',
    content_language: 'Bahasa Indonesia',
    timezone: 'Asia/Jakarta',
    date_format: 'd MMM yyyy',
    currency: 'IDR',
    landing: '/',
    date_range: '90d',
    mask_exports: true,
    shortcuts: true,
  },
  notifications: {
    channels: { email: true, slack: false, push: false, sms: false },
    events,
    quiet: { enabled: true, from: '22:00', to: '07:00', tz: 'Asia/Jakarta' },
  },
}

/** Saved prefs may be partial (older versions): fill the gaps from the defaults. */
export function withDefaults(saved: Partial<AccountPrefs> | null | undefined): AccountPrefs {
  return {
    display: { ...DEFAULT_PREFS.display, ...saved?.display },
    notifications: {
      channels: { ...DEFAULT_PREFS.notifications.channels, ...saved?.notifications?.channels },
      events: { ...DEFAULT_PREFS.notifications.events, ...saved?.notifications?.events },
      quiet: { ...DEFAULT_PREFS.notifications.quiet, ...saved?.notifications?.quiet },
    },
  }
}
