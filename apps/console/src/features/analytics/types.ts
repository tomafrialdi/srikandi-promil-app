/** Shapes returned by the analytics_* RPCs (see supabase/migrations/*analytics*.sql). */

export type Channel = 'organic' | 'tiktok' | 'instagram' | 'clinic_qr' | 'google_ads' | 'partner_invite'
export type TrackingDepth = 'lh_cf_bbt' | 'lh_cf' | 'lh_only' | 'calendar_only'

export interface Metric {
  value: number | null
  delta?: number | null
}

/* ── Overview ─────────────────────────────────────────── */
export interface OverviewData {
  kpis: {
    dau: Metric & { spark: number[] }
    wau: Metric & { spark: number[] }
    mau: Metric & { spark: number[] }
    stickiness: Metric & { spark: number[] }
    logs_per_user_day: Metric & { spark: number[] }
  }
  daily_logs: Array<{ date: string; lh: number; bbt: number; cervical: number; mood: number }>
  platform: {
    total: number
    android_pct: number | null
    ios_pct: number | null
    versions: Array<{ key: string; label: string; pct: number | null }>
  }
  retention_cohorts: Array<{ cohort: string; users: number; weeks: Array<number | null> }>
  channels: Array<{ channel: Channel; new_users: number; cac_idr: number | null }>
  signals_vs_outcome: {
    sample_size: number
    rows: Array<{ depth: TrackingDepth; median_cycles: number }>
  }
}

/* ── Retention ────────────────────────────────────────── */
export interface RetentionData {
  kpis: {
    day1: Metric
    day7: Metric
    day30: Metric
    week12: { value: number | null; previous: number | null }
    monthly_churn: Metric
  }
  curve: Array<{
    segment: 'partner_linked' | 'solo' | 'calendar_only'
    points: Array<{ week: number; pct: number | null }>
  }>
  exit_reasons: {
    total: number
    rows: Array<{ reason: string; count: number }>
  }
  weekly_cohorts: Array<{ week_start: string; users: number; weeks: Array<number | null> }>
  segments: Array<{
    key: string
    users: number
    w4: number | null
    w12: number | null
    churn: number | null
  }>
  win_back: {
    resurrected: number
    resurrected_prev: number
    top_source: { source: string; share_pct: number } | null
    winback_ctr_pct: number | null
    best_campaign: string | null
  }
}

/* ── Engagement ───────────────────────────────────────── */
export interface EngagementData {
  kpis: {
    sessions_per_user_day: Metric
    avg_session_seconds: Metric
    signals_per_day: Metric
    streak_7_pct: Metric
    push_open_rate: Metric
  }
  dau_trend: Array<{ date: string; dau: number }>
  heatmap: Array<{ dow: number; hour: number; count: number }>
  features: Array<{
    feature: string
    plus_only: boolean
    users: number
    pct_of_mau: number | null
    uses_per_user_week: number | null
    trend_pct: number | null
  }>
  streaks: Array<{ label: string; count: number }>
  top_content: Array<{ title: string; reads: number; avg_seconds: number }>
}

/* ── Acquisition ──────────────────────────────────────── */
export interface AcquisitionData {
  kpis: {
    installs: { value: number; delta_pct: number | null }
    signups: { value: number; of_installs_pct: number | null }
    blended_cac: Metric
    ltv_cac: { value: number | null }
    payback_months: { value: number | null }
  }
  weekly_installs: Array<{ week_start: string; counts: Record<Channel, number> }>
  funnel: { steps: Array<{ key: string; label: string; count: number }> }
  channels: Array<{
    channel: Channel
    installs: number
    signup_pct: number | null
    trial_pct: number | null
    paid_pct: number | null
    spend_idr: number
    cac_idr: number | null
    ltv_cac: number | null
  }>
  campaigns: Array<{ channel: Channel; campaign: string; conversions: number }>
  regions: Array<{ region: string; pct: number | null; growth_pct: number | null }>
}

/* ── Health outcomes ──────────────────────────────────── */
export interface HealthData {
  kpis: {
    conceived_total: number
    conceived_this_month: number
    conceived_prev_month: number
    within_6_cycles_pct: number | null
    median_cycles: number | null
    mean_cycles: number | null
    ovulation_confirmed_pct: number | null
  }
  pregnancies_per_month: Array<{ month: string; count: number }>
  time_to_pregnancy: { within_6_pct: number | null; rows: Array<{ cycle: number; pct: number | null }> }
  by_mode: Array<{
    mode: string
    label: string
    users: number
    conceived_pct: number | null
    median_cycles: number | null
    ovulation_confirmed_pct: number | null
    referred_pct: number | null
  }>
  by_age: Array<{ label: string; pct: number | null }>
  signals: { rows: Array<{ depth: TrackingDepth; median_cycles: number }> }
  care: {
    pregnancy_losses: number
    counsellor_sessions: number
    counsellor_sessions_delta_pct: number | null
    wellbeing_triggers: number
  }
}

/* ── Revenue ──────────────────────────────────────────── */
export interface RevenueData {
  kpis: {
    mrr: { value: number; delta_pct: number | null }
    nrr: { value: number | null; expansion_beats_churn: boolean }
    arpu: Metric
    ltv: { value: number | null; lifetime_months: number | null }
    trial_to_paid: Metric
  }
  mrr_movement: {
    start: number
    new: number
    upgrades: number
    reactivations: number
    downgrades: number
    churn: number
    end: number
  }
  revenue_by_plan: { month: string; rows: Array<{ key: string; label: string; amount: number }> }
  revenue_trend: Array<{ month: string; subscriptions: number; b2b_clinic: number; teleconsult: number }>
  ltv_by_channel: Array<{ channel: Channel; ltv: number }>
  trial_funnel: {
    started: number
    active_day5: number
    saw_paywall: number
    converted: number
    strong_start_convert_pct: number | null
    weak_start_convert_pct: number | null
  }
  churn_reasons: { total: number; rows: Array<{ reason: string; count: number }> }
}
