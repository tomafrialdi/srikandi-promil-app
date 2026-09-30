import type { ModeKey, PlanKey } from '../../shared/lib/labels'

export type UserStatusDisplay = 'active' | 'inactive' | 'suspended' | 'deletion_requested'

/* ── List ─────────────────────────────────────────────── */
export interface UsersSummary {
  counts: { all: number; free: number; paid: number; trial: number; new: number; suspended: number }
  mini: {
    new_week: number
    new_week_prev: number
    active_30d: number
    active_pct: number | null
    churn_risk: number
    deletion_requests: number
    deletion_due_days: number | null
  }
  cities: string[]
}

export interface UserRow {
  id: string
  ref: string
  name: string
  email: string
  city: string | null
  plan: PlanKey
  mode: ModeKey
  status: UserStatusDisplay
  phase: string
  logs_7d: number
  joined: string
  last_active_at: string | null
}

export interface UsersList {
  total: number
  rows: UserRow[]
}

export interface UsersFilters {
  tab: string
  search: string
  plan: string
  mode: string
  city: string
  status: string
}

/* ── Detail ───────────────────────────────────────────── */
export interface UserDetail {
  profile: {
    id: string
    ref: string
    name: string
    email: string
    phone: string
    city: string | null
    province: string | null
    age: number | null
    plan: PlanKey
    mode: ModeKey
    status: 'active' | 'suspended'
    suspended_reason: string | null
    deletion_requested: boolean
    joined: string
    signup_method: string
    trying_months: number | null
    cycles_tracked: number
    streak_days: number
    partner: string | null
  }
  tracking: {
    cycle_day: number | null
    cycle_length: number
    fertile_from: number | null
    ovulation_day: number | null
    engine_headline: string | null
    engine_detail: string | null
    signals: Array<{ key: string; label: string; value: number; hint: string }>
  }
  engine: {
    rule_set: string
    mode: ModeKey
    run_at: string
    status: string
    headline: string
    confidence: number
    signals_used: number
    ovulation_day: number
    ovulation_date: string
    window: string
    test_date: string
    contribution: Array<{ label: string; pct: number }>
    flags: string | null
  } | null
  cycles: Array<{ no: number; current: boolean; length: string; ovulation: string; luteal: string; outcome: string }>
  medications: {
    counts: { all: number; active: number; purchased: number; suggested: number; stopped: number }
    items: Array<{
      id: string
      name: string
      schedule: string
      status: 'active' | 'completed' | 'scheduled' | 'suggested' | 'stopped'
      purchase_status: string
      adherence: number | null
    }>
  }
  doctors: {
    counts: { all: number; visited: number; upcoming: number; recommended: number }
    items: Array<{
      id: string
      title: string
      relation: 'visited' | 'upcoming' | 'recommended'
      primary: boolean
      summary: Array<string | null>
    }>
  }
  clinics: {
    total: number
    items: Array<{
      id: string
      name: string
      city: string
      status: 'visited' | 'recommended' | 'saved' | 'dismissed'
      program: string | null
      note: string | null
      distance_km: number | null
      ivf_lab: boolean
      bpjs: boolean
    }>
  }
  subscription: {
    plan: PlanKey
    label: string
    price_idr: number
    period_months: number
    auto_renew: boolean
    next_renewal: string | null
    payment: string | null
    lifetime_idr: number
    pending_plan: PlanKey | null
    pending_plan_at: string | null
  }
  devices: {
    app: string
    device: string | null
    integrations: Array<{ kind: string; label: string; status: string; note: string | null }>
  }
  privacy: { health: boolean; research: boolean; marketing: boolean; discreet: boolean }
  activity: Array<{ text: string | null; at: string }>
}

/* ── Modals ───────────────────────────────────────────── */
export interface EngineLog {
  name: string
  cycle_no: number
  mode: ModeKey
  rule_set: string
  run_at: string
  status: string
  confidence: number
  predicted_ovulation: string
  overrides_count: number
  day_by_day: Array<{ cd: number; date: string; bbt: number | null; lh: string | null; fluid: string | null; score: number; output: string }>
  decision_trace: Array<{ step: string; body: string }>
  overrides: Array<{ at: string; by: string; from: string; to: string; ticket: string }>
  logged_by: string | null
  reason: string
}

export interface MedicationDetail {
  user_name: string
  id: string
  name: string
  schedule: string
  source: string
  status: string
  purchase_status: string
  adherence: number | null
  detail: {
    dose: string
    purpose: string
    rx: boolean
    prescribed_by: string | null
    doctor_note: string | null
    next_cycle: string | null
    reminder: { time: string; template: string; channel: string; snoozes: string; partner_sees: string }
    dose_log: Array<{ cd: string; at: string }>
    purchases: Array<{ item: string; ref: string; seller: string; price_idr: number; status: string }>
    side_effects: string[]
    catalogue: { id: string; bpom: string }
  }
  logged_by: string | null
  reason: string
}

export interface DoctorCare {
  user_name: string
  doctor: string
  relation: string
  primary: boolean
  detail: {
    clinic_line?: string
    primary_since?: string
    consent?: string
    stats?: { visits: number; teleconsults: number; spent_idr: number }
    timeline?: Array<{ title: string; meta: string; status: string }>
    shared?: { reports: string; live_data: string; notes: string }
    review?: { stars: number; date: string; quote: string }
  }
  others: Array<{ title: string; relation: string; summary: Array<string | null> }>
}

export interface ClinicJourney {
  user_name: string
  counts: { all: number; visited: number; recommended: number; saved: number; dismissed: number }
  current: {
    name: string
    city: string
    program: string | null
    rating: number
    detail: {
      address: string
      distance_km: number
      coverage: string
      stages: string[]
      stage_index: number
      visits: number
      paid_idr: number
      next: string
      source: string
      bookings: Array<{ date: string; title: string; amount_idr: number; status: string }>
    }
  } | null
  others: Array<{ name: string; city: string; status: string; note: string | null; rating: number; bpjs: boolean; ivf_lab: boolean }>
}

export interface PlanQuote {
  current: { plan: PlanKey; label: string; price_idr: number; payment: string | null; renews: string | null; days_left: number; active: boolean }
  target: { plan: PlanKey; label: string }
  promo: { code: string; description: string; audience: string; used: number; max: number; valid_until: string } | null
  promo_error: string | null
  lines: Array<{ label: string; amount: number }>
  apply_when: 'immediately' | 'next_renewal'
  due_now: number
  refund: number
  needs_approval: boolean
  valid_promos: string[]
}

export interface PlanCatalogItem {
  plan: PlanKey
  label: string
  price_idr: number
  period_months: number
  tagline: string
}

/* ── Invite admins ────────────────────────────────────── */
export interface RoleCatalog {
  roles: Array<{
    role: string
    label: string
    summary: string
    approvals: number
    permissions: Array<{ area: string; level: string }>
  }>
  allowed_domains: string[]
  departments: string[]
  team: Array<{ id: string; name: string }>
  me: string
  my_role: string
}
