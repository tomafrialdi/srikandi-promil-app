import type { PlanKey } from '../../shared/lib/labels'

export type PaymentChannel = 'gopay' | 'qris' | 'ovo_dana' | 'card' | 'google_play' | 'apple_iap' | 'clinic_invoice'
export type TransactionStatus = 'paid' | 'pending' | 'failed' | 'refunded' | 'refund_requested' | 'sponsored'
export type PromoStatus = 'active' | 'scheduled' | 'paused' | 'expired' | 'limit_reached' | 'draft'
export type DiscountType = 'percentage' | 'fixed' | 'extend_trial' | 'sponsored'

/* ── Overview ─────────────────────────────────────────── */
export interface PromoRow {
  code: string
  offer: string
  sub: string | null
  used: number
  max: number | null
  valid: string
  status: PromoStatus
}

export interface SubscriptionsOverview {
  kpis: {
    mrr: number
    mrr_delta_pct: number | null
    arr: number
    paying: number
    paying_delta: number
    churn_pct: number | null
    churn_delta: number | null
    arppu: number | null
    arppu_prev: number | null
  }
  mrr_chart: Array<{ month: string; monthly: number; yearly: number }>
  payment_mix: { total: number; rows: Array<{ channel: PaymentChannel; pct: number | null }> }
  plans: Array<{
    plan: PlanKey
    label: string
    badge: string | null
    price_idr: number
    period_months: number
    savings: string | null
    subscribers: number
    clinics?: number
  }>
  promos: { summary: { active: number; scheduled: number; expired: number }; rows: PromoRow[] }
  code_usage: {
    discounted_30d: number
    rows: Array<{
      name: string
      code: string
      plan: string
      at: string
      discount_idr: number
      outcome: 'applied' | 'rejected'
      note: string | null
    }>
  }
  recent_transactions: Array<{
    invoice: string
    user: string
    plan: PlanKey
    channel: PaymentChannel
    amount_idr: number
    status: TransactionStatus
    retry: number
    at: string
  }>
}

/* ── Promo codes ──────────────────────────────────────── */
export interface PromosSummary {
  counts: { all: number; active: number; scheduled: number; paused: number; expired: number }
  redemptions_30d: number
  redemptions_delta_pct: number | null
  discount_30d: number
  revenue_promo_users_30d: number
  roi: number | null
  flagged: number
}

export interface PromoDetail {
  code: string
  status: PromoStatus
  stored_status: 'draft' | 'active' | 'paused'
  offer: string
  description: string
  internal_note: string | null
  audience: string | null
  discount_type: DiscountType
  discount_pct: number
  fixed_amount_idr: number | null
  trial_extend_days: number | null
  duration_kind: 'first_billing' | 'months' | 'always'
  duration_months: number
  max_discount_idr: number | null
  plans: PlanKey[]
  channels: string[]
  eligibility: string
  max_uses: number | null
  used_count: number
  per_user_limit: number
  starts_at: string | null
  ends_at: string | null
  combinable: boolean
  days_left: number | null
  created: string
  created_by: string | null
  locked: boolean
  per_day: Array<{ day: string; count: number }>
  performance: { redemptions: number; revenue_idr: number; discount_idr: number; flagged: number }
  history: Array<{ at: string; actor: string; text: string }>
  example: { plan: PlanKey; label: string; price_idr: number } | null
}

/* ── Transactions ─────────────────────────────────────── */
export interface TransactionsSummary {
  gross: number
  gross_delta_pct: number | null
  net: number
  fees: number
  refunds_amount: number
  refunds_count: number
  failed: number
  counts: { all: number; paid: number; pending: number; failed: number; refunded: number }
}

export interface TransactionRow {
  invoice: string
  user_id: string
  name: string
  email: string
  plan: PlanKey
  channel: PaymentChannel
  promo: string | null
  amount_idr: number
  net_idr: number
  status: TransactionStatus
  retry: number
  at: string
}

export interface TransactionsList {
  total: number
  rows: TransactionRow[]
}

export interface TransactionFilters {
  tab: string
  search: string
  channel: string
  plan: string
  promo: string
}

export interface Receipt {
  invoice: string
  status: TransactionStatus
  order_id: string
  channel: PaymentChannel
  user: { id: string; ref: string; name: string; email: string }
  invoice_date: string
  paid_on: string | null
  payment_method: string
  plan_label: string
  period: string
  list_amount_idr: number
  discount_idr: number
  amount_idr: number
  promo: { code: string; label: string } | null
  ppn_idr: number
  fee_idr: number
  net_idr: number
  fee_pct: number | null
  settlement: string
  retry: number
  refund_reason: string | null
  timeline: Array<{ time: string; text: string }>
}

/* ── Plan editor ──────────────────────────────────────── */
export interface EditablePlan {
  plan: PlanKey
  label: string
  plan_id: string | null
  billing_label: string | null
  trial_days: number
  grace_days: number
  price_idr: number
  price_google_idr: number | null
  price_apple_idr: number | null
  google_tier: string | null
  apple_tier: string | null
  period_months: number
  badge_label: string | null
  savings_label: string | null
  features: Array<{ label: string; included: boolean }>
  subscribers: number
  updated_at: string
  pending_request: { id: number; payload: Record<string, unknown>; migrate: boolean } | null
  approver: string | null
}

export interface PlanEditor {
  my_role: string
  plans: EditablePlan[]
}
