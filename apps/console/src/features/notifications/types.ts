export type NotificationChannel = 'push' | 'in_app' | 'email'
export type NotificationKind = 'trigger' | 'scheduled' | 'one_off'
export type NotificationStatus = 'draft' | 'active' | 'paused' | 'scheduled' | 'sending' | 'sent' | 'failed'
export type FailureReason = 'expired_apns_token' | 'app_uninstalled' | 'fcm_throttled' | 'invalid_deep_link'

export interface NotificationsSummary {
  sent_30d: number
  campaigns_30d: number
  delivery_rate: number | null
  open_rate: number | null
  optout_rate: number | null
  counts: { all: number; active: number; scheduled: number; sent: number; drafts: number; failed: number }
}

export interface CampaignRow {
  id: string
  name: string
  channel: NotificationChannel
  kind: NotificationKind
  status: NotificationStatus
  audience: string
  sent: number
  delivered_pct: number | null
  opened_pct: number | null
  progress_pct: number | null
  last_run_at: string | null
  send_at: string | null
}

export interface CampaignList {
  total: number
  rows: CampaignRow[]
}

export interface HourlyOpens {
  hours: number[]
  best_hour: number
}

export interface FailureSummary {
  total: number
  reasons: Array<{ reason: FailureReason; pct: number }>
  worst: { id: string; name: string; reason: FailureReason; pct: number } | null
}

/* ── Editor ─────────────────────────────────────────── */
export type RuleField = 'cycle_phase' | 'tracking_mode' | 'plan' | 'last_active'
export interface AudienceRule {
  field: RuleField
  op: string
  value: string | string[] | number
}

export type Delivery = 'now' | 'scheduled' | 'trigger'

export interface CampaignForm {
  name: string
  channel: NotificationChannel
  delivery: Delivery
  rules: AudienceRule[]
  language: 'en' | 'id'
  title: string
  body: string
  discreet_body: string
  deep_link: string
  category: string
  trigger_event: string
  send_time: string
  send_at: string
  quiet_hours: boolean
  max_one_per_day: boolean
  ab_test: boolean
}

export interface CampaignRecord {
  id: string
  name: string
  channel: NotificationChannel
  kind: NotificationKind
  status: NotificationStatus
  audience_rules: AudienceRule[]
  language: 'en' | 'id'
  title: string
  body: string
  discreet_body: string
  deep_link: string
  category: string
  trigger_event: string | null
  send_time: string | null
  send_at: string | null
  quiet_hours: boolean
  max_one_per_day: boolean
  ab_test: boolean
  updated_at: string
  updated_by: string | null
}
