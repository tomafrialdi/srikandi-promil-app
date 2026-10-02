import { Bell, Clock, DeviceMobile, EnvelopeSimple, Lightning, PaperPlaneTilt, type Icon } from '@phosphor-icons/react'
import type { BadgeTone } from '../../../shared/ui'
import type { FailureReason, NotificationChannel, NotificationKind, NotificationStatus } from '../types'

export const PAGE_SIZE = 8

export const CHANNEL_META: Record<NotificationChannel, { label: string; icon: Icon }> = {
  push: { label: 'Push', icon: Bell },
  in_app: { label: 'In-app', icon: DeviceMobile },
  email: { label: 'Email', icon: EnvelopeSimple },
}

export const KIND_LABEL: Record<NotificationKind, string> = { trigger: 'Trigger', scheduled: 'Scheduled', one_off: 'One-off' }
export const KIND_ICON: Record<NotificationKind, Icon> = { trigger: Lightning, scheduled: Clock, one_off: PaperPlaneTilt }

export const STATUS_BADGE: Record<NotificationStatus, { label: string; tone: BadgeTone; dot: string }> = {
  draft: { label: 'Draft', tone: 'neutral', dot: 'var(--ink-faint)' },
  active: { label: 'Active', tone: 'success', dot: 'var(--success)' },
  paused: { label: 'Paused', tone: 'warning', dot: 'var(--warning)' },
  scheduled: { label: 'Scheduled', tone: 'info', dot: 'var(--secondary)' },
  sending: { label: 'Sending', tone: 'primary', dot: 'var(--primary)' },
  sent: { label: 'Sent', tone: 'neutral', dot: 'var(--ink-muted)' },
  failed: { label: 'Failed', tone: 'error', dot: 'var(--error)' },
}

export const FAILURE_LABEL: Record<FailureReason, string> = {
  expired_apns_token: 'Expired APNs token',
  app_uninstalled: 'App uninstalled',
  fcm_throttled: 'FCM quota / throttled',
  invalid_deep_link: 'Invalid deep link',
  missing_push_credentials: 'Push credentials not set up',
  provider_error: 'Push provider error',
}

/** Quiet hours are 21:00–07:00: pushes are held until 07:00. */
export const isQuietHour = (hour: number) => hour >= 21 || hour < 7
