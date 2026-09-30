export type ModeKey = 'ttc' | 'pcos' | 'iui_ivf' | 'after_loss'
export type SignalKey = 'lh' | 'cf' | 'bbt' | 'calendar' | 'skin' | 'protocol'
export type ColorKey = 'primary' | 'pink' | 'blue' | 'green' | 'amber' | 'purple' | 'gray' | 'red'
export type StatusCategory = 'menstrual' | 'follicular' | 'fertile' | 'luteal' | 'pregnancy' | 'other'
export type VersionStatus = 'draft' | 'in_review' | 'canary' | 'live' | 'archived' | 'rolled_back'
export type Decision = 'pending' | 'approved' | 'rejected'

export type Weights = Record<SignalKey, number>

export interface Cond {
  field: string
  op: string
  value: string
}
/** OR of AND-groups: [[a, b], [c]] = (a AND b) OR c. */
export type Groups = Cond[][]

export interface TriggerItem {
  key: string
  type: 'push' | 'partner' | 'reminder' | 'email'
  title: string
  text: string
  detail: string
  enabled: boolean
}

export interface StatusExperience {
  copy: Record<'en' | 'id', { headline: string; subtitle: string; ring: string; discreet: string }>
  calendar_marker: string
  tone: string
  celebration: boolean
  hide_after_loss: boolean
}

export interface StatusOutputs {
  cycle_history: boolean
  doctor_report: boolean
  analytics_event: boolean
  clinic_webhook: boolean
}

export interface StatusDef {
  key: string
  name: string
  color: ColorKey
  icon: string
  order: number
  category: StatusCategory
  modes: ModeKey[]
  description: string
  entry: Groups
  exit: Groups
  copy: string
  default: boolean
  counts_as: string[]
  counts_mode?: string
  experience?: StatusExperience
  triggers?: TriggerItem[]
  outputs?: StatusOutputs
  content_tags?: string[]
}

export interface PipelineStep {
  key: string
  title: string
  icon: string
  items: string[]
}

export interface Param {
  key: string
  label: string
  value: string
  hint?: string
  base?: string
  note?: string
}

export interface Toggle {
  key: string
  title: string
  detail: string
  enabled: boolean
}

export type OverrideKind = 'same' | 'rule' | 'rename' | 'hidden' | 'extra'

export interface StatusOverride {
  status: string
  kind: OverrideKind
  rule?: string
  entry?: Groups
  copy?: string
  rename?: string
  name?: string
  color?: ColorKey
}

export interface ModeConfig {
  meta: { label: string; title: string; color: ColorKey; icon: string; description: string }
  weights: Weights
  params: Param[]
  status_overrides: StatusOverride[]
  notifications: Toggle[]
  features: Toggle[]
}

export interface EngineConfig {
  pipeline: { p95_ms: number; runs: string; steps: PipelineStep[] }
  statuses: StatusDef[]
  modes: Record<ModeKey, ModeConfig>
}

export interface EngineVersion {
  id: string
  version: string
  status: VersionStatus
  rollout_pct: number
  summary: string | null
  notes: string | null
  auto_rollback: boolean
  golden: { pass: number; total: number; failed: number } | null
  signed_off_by: string | null
  created_at: string
  updated_at: string
  submitted_at: string | null
  canary_at: string | null
  live_at: string | null
  archived_at: string | null
  author: string | null
  config?: EngineConfig
}

export interface Approval {
  reviewer_id: string
  name: string
  credentials: string
  decision: Decision
  decided_at: string | null
  mine: boolean
}

export interface Metric {
  key: string
  label: string
  sub: string | null
  value: string
  chip: string | null
  tone: 'success' | 'warning' | 'error' | 'info' | 'neutral'
}

export interface EngineEvent {
  id: number
  mode: ModeKey | null
  kind: string
  tone: 'success' | 'info' | 'warning' | 'error'
  title: string
  detail: string | null
  at: string
}

export interface EngineState {
  me: { can_edit: boolean; can_release: boolean; is_reviewer: boolean }
  versions: EngineVersion[]
  subject: (EngineVersion & { config: EngineConfig }) | null
  live: (EngineVersion & { config: EngineConfig }) | null
  approvals: Approval[]
  users_now: Record<string, number>
  mode_users: Record<ModeKey, number>
  programs: { iui: number; ivf: number }
  metrics: Record<string, Metric[]>
  events: EngineEvent[]
  canary_window_days: number
}

/** 0 = no log, 1 = low, 2 = high, 3 = peak. */
export type Level = 0 | 1 | 2 | 3

export interface Signals {
  lh: Level[]
  cf: Level[]
  bbt: Array<number | null>
}

export interface GoldenCase {
  key: string
  mode: ModeKey
  label: string
  description: string
  signals: Signals
  truth_ov: number
}

export type DraftOp =
  | { op: 'set_weights'; mode: ModeKey; weights: Weights }
  | { op: 'set_params'; mode: ModeKey; params: Array<{ key: string; value: string }> }
  | { op: 'set_toggle'; mode: ModeKey; group: 'notifications' | 'features'; key: string; enabled: boolean }
  | { op: 'save_override'; mode: ModeKey; override: StatusOverride }
  | { op: 'save_status'; status: StatusDef }
  | { op: 'delete_status'; key: string }
