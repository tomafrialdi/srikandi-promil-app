import type { BadgeTone } from '../ui'

export type PlanKey = 'free' | 'trial' | 'plus_monthly' | 'plus_yearly' | 'clinic_sponsored'
export type ModeKey = 'ttc' | 'pcos' | 'iui' | 'ivf' | 'after_loss' | 'pregnant'

export const PLAN_LABEL: Record<PlanKey, string> = {
  free: 'Free',
  trial: 'Trial',
  plus_monthly: 'Plus monthly',
  plus_yearly: 'Plus yearly',
  clinic_sponsored: 'Clinic-sponsored',
}

export const PLAN_BADGE: Record<PlanKey, { label: string; tone: BadgeTone }> = {
  free: { label: 'Free', tone: 'neutral' },
  trial: { label: 'Trial', tone: 'warning' },
  plus_monthly: { label: 'Plus', tone: 'primary' },
  plus_yearly: { label: 'Plus', tone: 'primary' },
  clinic_sponsored: { label: 'Clinic', tone: 'info' },
}

export const MODE_LABEL: Record<ModeKey, string> = {
  ttc: 'TTC',
  pcos: 'PCOS',
  iui: 'IUI',
  ivf: 'IVF',
  after_loss: 'After loss',
  pregnant: 'Pregnant',
}
