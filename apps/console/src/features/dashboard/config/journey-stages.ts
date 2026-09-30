import { Baby, HandHeart, Hourglass, Moon, Plant, Sparkle, Syringe, type Icon } from '@phosphor-icons/react'
import type { JourneyStageKey } from '../types'

export interface StageMeta {
  label: string
  description: string
  icon: Icon
  /** Solid colour used for the stacked bar and icon. */
  color: string
  /** Tinted tile behind the icon. */
  tint: string
}

export const JOURNEY_STAGES: Record<JourneyStageKey, StageMeta> = {
  getting_started: {
    label: 'Getting started',
    description: '< 1 full cycle logged',
    icon: Plant,
    color: '#a6a49b',
    tint: '#a6a49b26',
  },
  trying: {
    label: 'Trying · tracking',
    description: 'Follicular / fertile phase',
    icon: Sparkle,
    color: '#c13d68',
    tint: '#c13d6826',
  },
  two_week_wait: {
    label: 'Two-week wait',
    description: 'Ovulation confirmed',
    icon: Hourglass,
    color: '#2574c4',
    tint: '#2574c426',
  },
  in_treatment: {
    label: 'In treatment',
    description: 'IUI / IVF / Clomid',
    icon: Syringe,
    color: '#e0a030',
    tint: '#e0a03026',
  },
  pregnant: {
    label: 'Pregnant',
    description: 'Conceived & in pregnancy mode',
    icon: Baby,
    color: '#3f9950',
    tint: '#3f995026',
  },
  after_loss: {
    label: 'After loss',
    description: 'Gentle mode',
    icon: HandHeart,
    color: '#8e6fbf',
    tint: '#8e6fbf26',
  },
  inactive: {
    label: 'Inactive',
    description: 'No log in 30+ days',
    icon: Moon,
    color: '#e7e4dc',
    tint: '#e7e4dc66',
  },
}
