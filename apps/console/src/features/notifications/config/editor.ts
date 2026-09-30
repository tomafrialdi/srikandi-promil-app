import type { CampaignForm } from '../types'

export const PHASE_OPTIONS = ['Menstrual', 'Follicular', 'Fertile window (day 1)', 'Fertile window', '2WW', 'Pregnant']
export const MODE_OPTIONS = [
  { value: 'ttc', label: 'TTC' },
  { value: 'pcos', label: 'PCOS' },
  { value: 'iui', label: 'IUI/IVF' },
]
export const PLAN_OPTIONS = [
  { value: 'all', label: 'All plans' },
  { value: 'free', label: 'Free' },
  { value: 'plus', label: 'Plus' },
]
export const TRIGGER_EVENTS = [
  'Engine status → Fertile window opens',
  'Engine status → 2WW day 7',
  'Engine status → 2WW day 12',
  'Cycle day 1 starts',
  'User signs up · day 7 without partner',
  'Subscription trial ends in 2 days',
]
export const SEND_TIMES = ['07:00 user local time', '09:00 user local time', '12:00 user local time', '19:00 user local time']
export const VARIABLES = ['{first_name}', '{cycle_day}', '{partner_name}', '{days_to_test}']
export const SAMPLE: Record<string, string> = { '{first_name}': 'Amara', '{cycle_day}': '12', '{partner_name}': 'Bima', '{days_to_test}': '2' }

export const FIELD_LABEL = { cycle_phase: 'Cycle phase', tracking_mode: 'Tracking mode', plan: 'Plan', last_active: 'Last active' } as const
export const FIELD_OP = { cycle_phase: 'is', tracking_mode: 'is any of', plan: 'is', last_active: 'within' } as const

export const DELIVERY_OPTIONS = [
  { value: 'now', label: 'Send now' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'trigger', label: 'Triggered by event' },
]

export function emptyCampaign(): CampaignForm {
  return {
    name: '',
    channel: 'push',
    delivery: 'now',
    rules: [
      { field: 'tracking_mode', op: 'is any of', value: [] },
      { field: 'plan', op: 'is', value: 'all' },
      { field: 'last_active', op: 'within', value: 30 },
    ],
    language: 'en',
    title: '',
    body: '',
    discreet_body: 'Daily reminder 🌸 Tap to check in',
    deep_link: '',
    category: '',
    trigger_event: TRIGGER_EVENTS[0]!,
    send_time: SEND_TIMES[0]!,
    send_at: '',
    quiet_hours: true,
    max_one_per_day: true,
    ab_test: false,
  }
}
