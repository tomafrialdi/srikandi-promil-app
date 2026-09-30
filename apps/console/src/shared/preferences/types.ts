export type Density = 'comfortable' | 'compact'

export interface DisplayPrefs {
  theme: 'light'
  density: Density
  language: string
  content_language: string
  timezone: string
  date_format: string
  currency: string
  /** Route opened right after sign-in. */
  landing: string
  /** Analytics date-range preset used when the URL has none. */
  date_range: string
  mask_exports: boolean
  shortcuts: boolean
}

export interface NotificationPrefs {
  channels: { email: boolean; slack: boolean; push: boolean; sms: boolean }
  events: Record<string, { email: boolean; slack: boolean; push: boolean }>
  quiet: { enabled: boolean; from: string; to: string; tz: string }
}

export interface AccountPrefs {
  display: DisplayPrefs
  notifications: NotificationPrefs
}
