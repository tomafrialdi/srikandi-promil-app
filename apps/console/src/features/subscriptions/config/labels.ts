import type { BadgeTone } from '../../../shared/ui'
import type { PaymentChannel, PromoStatus, TransactionStatus } from '../types'

export const CHANNEL_LABEL: Record<PaymentChannel, string> = {
  gopay: 'GoPay',
  qris: 'QRIS',
  ovo_dana: 'OVO / DANA',
  card: 'Card',
  google_play: 'Google Play',
  apple_iap: 'Apple IAP',
  clinic_invoice: 'Clinic invoice',
}

export const CHANNEL_COLOR: Record<PaymentChannel, string> = {
  gopay: 'var(--success)',
  qris: 'var(--secondary)',
  google_play: 'var(--warning)',
  apple_iap: 'var(--ink)',
  ovo_dana: 'var(--primary)',
  card: 'var(--purple)',
  clinic_invoice: 'var(--ink-faint)',
}

export const TX_STATUS: Record<TransactionStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: 'Paid', tone: 'success' },
  pending: { label: 'Pending', tone: 'warning' },
  failed: { label: 'Failed', tone: 'error' },
  refunded: { label: 'Refunded', tone: 'neutral' },
  refund_requested: { label: 'Refund requested', tone: 'warning' },
  sponsored: { label: 'Sponsored', tone: 'info' },
}

export const PROMO_STATUS: Record<PromoStatus, { label: string; tone: BadgeTone }> = {
  active: { label: 'Active', tone: 'success' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  paused: { label: 'Paused', tone: 'warning' },
  expired: { label: 'Expired', tone: 'neutral' },
  limit_reached: { label: 'Limit reached', tone: 'error' },
  draft: { label: 'Draft', tone: 'neutral' },
}

export const CHANNEL_FILTER_OPTIONS = [
  { value: '', label: 'Channel: All' },
  ...(Object.entries(CHANNEL_LABEL) as Array<[PaymentChannel, string]>).map(([value, label]) => ({ value, label })),
]

export const PLAN_FILTER_OPTIONS = [
  { value: '', label: 'Plan: All' },
  { value: 'plus_monthly', label: 'Plus Monthly' },
  { value: 'plus_yearly', label: 'Plus Yearly' },
  { value: 'clinic_sponsored', label: 'Clinic-sponsored' },
]

export const PROMO_FILTER_OPTIONS = [
  { value: '', label: 'Promo: Any' },
  { value: 'any', label: 'With a promo' },
  { value: 'none', label: 'No promo' },
]

export const TX_PAGE_SIZE = 10
