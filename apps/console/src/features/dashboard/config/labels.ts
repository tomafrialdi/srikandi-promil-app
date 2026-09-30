import { Flag, FileText, Lifebuoy, Pulse, type Icon } from '@phosphor-icons/react'
import type { BadgeTone } from '../../../shared/ui'
import type { AttentionSeverity, PlanType, TrackingMode } from '../types'

export const PLAN_LABEL: Record<PlanType, string> = {
  free: 'Free',
  trial: 'Trial',
  plus_monthly: 'Plus monthly',
  plus_yearly: 'Plus yearly',
}

export const PLAN_BADGE: Record<PlanType, { label: string; tone: BadgeTone }> = {
  free: { label: 'Free', tone: 'neutral' },
  trial: { label: 'Trial', tone: 'warning' },
  plus_monthly: { label: 'Plus', tone: 'primary' },
  plus_yearly: { label: 'Plus', tone: 'primary' },
}

export const PLAN_COLOR: Record<PlanType, string> = {
  free: 'var(--secondary)',
  plus_yearly: 'var(--primary)',
  plus_monthly: 'var(--pink)',
  trial: 'var(--warning)',
}

export const MODE_LABEL: Record<TrackingMode, string> = {
  ttc: 'TTC',
  pcos: 'PCOS',
  iui: 'IUI',
  ivf: 'IVF',
  after_loss: 'After loss',
  pregnant: 'Pregnant',
}

/** Icon names are stored in `attention_items.icon`. */
export const ATTENTION_ICON: Record<string, Icon> = {
  flag: Flag,
  lifebuoy: Lifebuoy,
  activity: Pulse,
  file: FileText,
}

export const ATTENTION_TONE: Record<AttentionSeverity, { background: string; color: string }> = {
  error: { background: 'var(--error-soft)', color: 'var(--error)' },
  warning: { background: 'var(--warning-soft)', color: 'var(--warning-ink)' },
  info: { background: 'var(--secondary-soft)', color: 'var(--secondary)' },
  primary: { background: 'var(--primary-soft)', color: 'var(--primary)' },
}
