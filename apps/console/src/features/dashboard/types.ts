/** Shapes returned by the `dashboard_overview` RPC (see supabase/migrations/*dashboard*.sql). */

export type PlanType = 'free' | 'trial' | 'plus_monthly' | 'plus_yearly'
export type TrackingMode = 'ttc' | 'pcos' | 'iui' | 'ivf' | 'after_loss' | 'pregnant'
export type JourneyStageKey =
  | 'getting_started'
  | 'trying'
  | 'two_week_wait'
  | 'in_treatment'
  | 'pregnant'
  | 'after_loss'
  | 'inactive'
export type AttentionSeverity = 'error' | 'warning' | 'info' | 'primary'

export interface Kpis {
  total_users: number
  free_users: number
  paid_users: number
  trial_users: number
  daily_active: number
  monthly_active: number
  mrr_idr: number
  total_delta_pct: number | null
  paid_delta_pct: number | null
  mrr_delta_pct: number | null
}

export interface GrowthPoint {
  /** ISO date of the first day of the month. */
  month: string
  free: number
  paid: number
}

export interface PlanSplit {
  plans: Array<{ plan: PlanType; count: number }>
  paid_pct: number | null
  trial_conversion_pct: number | null
}

export interface Journey {
  total: number
  stages: Array<{ stage: JourneyStageKey; count: number }>
}

export interface Outcomes {
  conceived_total: number
  conceived_this_month: number
  conceived_prev_month: number
  conceived_within_6_cycles_pct: number | null
  avg_cycles_to_conceive: number | null
  median_cycles_to_conceive: number | null
  referred_to_specialist: number
}

export interface Locations {
  total: number
  provinces: Array<{ name: string; count: number }>
  others: { count: number; provinces: number }
  java_share_pct: number | null
  top_city: { name: string; count: number } | null
  fastest_growing_city: { name: string; growth_pct: number } | null
}

export interface AgeDistribution {
  median_age: number | null
  buckets: Array<{ label: string; count: number }> | null
}

export interface Funnel {
  cohort_size: number
  steps: Array<{ key: string; label: string; count: number }>
}

export interface FeatureAdoption {
  feature: string
  pct: number
}

export interface RecentSignup {
  id: string
  full_name: string
  email: string
  plan: PlanType
  tracking_mode: TrackingMode
  city: string | null
  created_at: string
}

export interface AttentionItem {
  id: string
  title: string
  detail: string
  icon: string
  severity: AttentionSeverity
}

export interface DashboardOverview {
  kpis: Kpis
  user_growth: GrowthPoint[]
  plan_split: PlanSplit
  journey: Journey
  outcomes: Outcomes
  locations: Locations
  age_distribution: AgeDistribution
  funnel: Funnel
  feature_adoption: FeatureAdoption[]
  recent_signups: RecentSignup[]
  attention: AttentionItem[]
}
