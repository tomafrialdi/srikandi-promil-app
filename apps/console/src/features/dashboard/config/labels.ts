import { Flag, FileText, Lifebuoy, Pulse, type Icon } from '@phosphor-icons/react'
import type { AttentionSeverity, PlanType } from '../types'

export { PLAN_BADGE, PLAN_LABEL } from '../../../shared/lib/labels'

export const PLAN_COLOR: Record<PlanType, string> = {
  free: 'var(--secondary)',
  plus_yearly: 'var(--primary)',
  plus_monthly: 'var(--pink)',
  trial: 'var(--warning)',
  clinic_sponsored: 'var(--secondary)',
}

export { MODE_LABEL } from '../../../shared/lib/labels'

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
