import { emptyCampaign } from '../config/editor'
import type { AudienceRule, CampaignForm, CampaignRecord, Delivery } from '../types'

const KIND_TO_DELIVERY: Record<CampaignRecord['kind'], Delivery> = { one_off: 'now', scheduled: 'scheduled', trigger: 'trigger' }
const DELIVERY_TO_KIND: Record<Delivery, string> = { now: 'one_off', scheduled: 'scheduled', trigger: 'trigger' }

function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function recordToForm(r: CampaignRecord): CampaignForm {
  const base = emptyCampaign()
  return {
    ...base,
    name: r.name,
    channel: r.channel,
    delivery: KIND_TO_DELIVERY[r.kind],
    rules: r.audience_rules,
    language: r.language,
    title: r.title,
    body: r.body,
    discreet_body: r.discreet_body,
    deep_link: r.deep_link,
    category: r.category,
    trigger_event: r.trigger_event ?? base.trigger_event,
    send_time: r.send_time ?? base.send_time,
    send_at: toLocalInput(r.send_at),
    quiet_hours: r.quiet_hours,
    max_one_per_day: r.max_one_per_day,
    ab_test: r.ab_test,
  }
}

/** "Fertile · TTC/PCOS" style label shown in the campaign list. */
export function audienceLabel(rules: AudienceRule[]): string {
  const parts: string[] = []
  for (const rule of rules) {
    if (rule.field === 'cycle_phase' && typeof rule.value === 'string' && rule.value) parts.push(rule.value.split(' ')[0]!)
    if (rule.field === 'tracking_mode' && Array.isArray(rule.value) && rule.value.length > 0) parts.push(rule.value.map((v) => (v === 'iui' ? 'IUI/IVF' : v.toUpperCase())).join('/'))
    if (rule.field === 'plan' && rule.value && rule.value !== 'all') parts.push(rule.value === 'free' ? 'Free' : 'Plus')
    if (rule.field === 'last_active' && rule.value) parts.push(`active ${rule.value}d`)
  }
  return parts.length > 0 ? parts.join(' · ') : 'Everyone'
}

export function formToPayload(f: CampaignForm): Record<string, unknown> {
  return {
    name: f.name.trim(),
    channel: f.channel,
    kind: DELIVERY_TO_KIND[f.delivery],
    audience_rules: f.rules,
    audience_label: audienceLabel(f.rules),
    language: f.language,
    title: f.title,
    body: f.body,
    discreet_body: f.discreet_body,
    deep_link: f.deep_link,
    category: f.category,
    trigger_event: f.delivery === 'trigger' ? f.trigger_event : null,
    send_time: f.delivery === 'trigger' ? f.send_time : null,
    send_at: f.delivery === 'scheduled' && f.send_at ? new Date(f.send_at).toISOString() : null,
    quiet_hours: f.quiet_hours,
    max_one_per_day: f.max_one_per_day,
    ab_test: f.ab_test,
  }
}
