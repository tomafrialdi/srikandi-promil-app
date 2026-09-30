export type Risk = 'low' | 'med' | 'high'

export interface AuditActor {
  name: string
  role: string | null
  id: string | null
}

export interface AuditEvent {
  id: number
  evt: string
  at: string
  actor: AuditActor
  category: string
  risk: Risk
  action: string
  summary: string | null
  resource: string | null
  ip: string | null
  device: string | null
  flagged: boolean
}

export interface AuditList {
  rows: AuditEvent[]
  total: number
  head: string | null
}

export interface AlertSummary {
  id: string
  number: number
  severity: 'high' | 'medium' | 'low'
  title: string
  detail: string
  at: string
  status: 'open' | 'in_progress' | 'closed'
}

export interface AuditSummary {
  events: number
  events_prev: number
  health_access: number
  unmasked: number
  failed_logins: number
  flagged_ips: number
  config_changes: number
  config_areas: string[]
  chain: { ok: boolean; at: string; rows: number; broken_at: number | null } | null
  head: string | null
  alerts: AlertSummary[]
  dsr_due: { id: string; number: number; type: string; subject_ref: string; due_at: string; received_at: string } | null
  can_act: boolean
  can_export: boolean
  can_revert: boolean
}

export interface RelatedEvent {
  id: number
  at: string
  text: string
  self: boolean
  category: string
}

export interface AuditEventDetail extends AuditEvent {
  metadata: Record<string, unknown>
  hash: string
  prev_hash: string | null
  user_id: string | null
  related: RelatedEvent[]
  flag: { at: string; by: string | null; note: string | null } | null
}

export interface AlertDetail {
  id: string
  number: number
  rule_key: string
  severity: 'high' | 'medium' | 'low'
  title: string
  detail: string
  subject: string | null
  status: 'open' | 'in_progress' | 'closed'
  resolution: 'legitimate' | 'follow_up' | 'misuse' | null
  note: string | null
  created_at: string
  containment: { kind: string; at: string; by: string | null }[]
  actor: { id: string; name: string; role: string; email: string } | null
  assigned: string | null
  unmask_block_until: string | null
  hourly: number[]
  profiles: { at: string; resource: string | null; ticket: string | null }[]
}

export type SystemState = 'pending' | 'scheduled' | 'notified' | 'deleted' | 'anonymised' | 'retained'

export interface PdpSystem {
  name: string
  state: SystemState
  note?: string
}

export interface PdpRequest {
  id: string
  number: number
  type: 'access' | 'correction' | 'deletion' | 'portability'
  subject_ref: string
  user_id: string | null
  status: 'new' | 'in_progress' | 'blocked' | 'completed'
  status_note: string | null
  received_at: string
  due_at: string
  completed_at: string | null
  identity_check: string
  plan_note: string | null
  owner: string | null
  systems: PdpSystem[]
  timeline: { at: string | null; text: string; state: 'done' | 'pending'; by?: string }[]
  certificate_at: string | null
}

export interface PdpDetail extends PdpRequest {
  plan: string | null
  email: string | null
  invoices: number
}

export interface PdpList {
  open: number
  rows: PdpRequest[]
}

export interface SavedView {
  id: string
  name: string
  filters: ViewFilters
  shared: boolean
  mine: boolean
  owner: string | null
}

export type Range = '24h' | '7d' | '30d' | '90d'

/** What the page filters on; also what a saved view stores. */
export interface ViewFilters {
  category?: string
  risk?: string
  search?: string
  range?: Range
}

/** Explicit period used by the export dialog. */
export interface ExportScope {
  from: string
  to: string
  category: string
}
