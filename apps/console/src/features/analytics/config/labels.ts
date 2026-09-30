import type { Channel, TrackingDepth } from '../types'

export const CHANNEL_LABEL: Record<Channel, string> = {
  organic: 'Organic / store search',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  clinic_qr: 'Clinic referral (QR)',
  google_ads: 'Google Ads',
  partner_invite: 'Partner invite',
}

export const CHANNEL_SHORT_LABEL: Record<Channel, string> = {
  organic: 'Organic',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  clinic_qr: 'Clinic referral',
  google_ads: 'Google Ads',
  partner_invite: 'Partner invite',
}

export const CHANNEL_COLOR: Record<Channel, string> = {
  organic: '#3f9950',
  tiktok: '#1a1a18',
  instagram: '#c13d68',
  clinic_qr: '#2574c4',
  google_ads: '#e0a030',
  partner_invite: '#8e6fbf',
}

export const CHANNEL_ORDER: Channel[] = ['organic', 'tiktok', 'instagram', 'clinic_qr', 'google_ads', 'partner_invite']

export const DEPTH_LABEL: Record<TrackingDepth, string> = {
  lh_cf_bbt: 'LH + cervical fluid + BBT',
  lh_cf: 'LH + cervical fluid',
  lh_only: 'LH test only',
  calendar_only: 'Calendar only (no signals)',
}

export const EXIT_REASON_LABEL: Record<string, { label: string; color: string }> = {
  got_pregnant: { label: 'Got pregnant 🎉', color: 'var(--success)' },
  taking_break: { label: 'Taking a break', color: 'rgba(193, 61, 104, 0.6)' },
  too_expensive: { label: 'Too expensive (Plus)', color: 'rgba(193, 61, 104, 0.6)' },
  switched_app: { label: "Switched to doctor's app", color: 'rgba(193, 61, 104, 0.6)' },
  too_many_notifications: { label: 'Notifications too many', color: 'rgba(193, 61, 104, 0.6)' },
  after_loss_paused: { label: 'After loss — paused', color: 'var(--purple)' },
  other: { label: 'Other', color: 'var(--ink-faint)' },
}

export const CANCEL_REASON_LABEL: Record<string, { label: string; color: string }> = {
  got_pregnant: { label: 'Got pregnant 🎉', color: 'var(--success)' },
  price: { label: 'Price', color: 'rgba(193, 61, 104, 0.6)' },
  not_using_enough: { label: 'Not using enough', color: 'rgba(193, 61, 104, 0.6)' },
  payment_failed: { label: 'Payment failed', color: 'var(--warning)' },
  other: { label: 'Other', color: 'var(--ink-faint)' },
}

export const RETURN_SOURCE_LABEL: Record<string, string> = {
  push_period: 'Period started push',
  push_fertile: 'Fertile window push',
  push_recap: 'Cycle recap push',
  push_other: 'Other push',
}

export const SEGMENT_LABEL: Record<string, string> = {
  plus: 'Plus (paid)',
  free: 'Free',
  pcos: 'PCOS mode',
  iui_ivf: 'IUI / IVF',
  after_loss: 'After loss',
  age_35_plus: 'Age 35+',
}
