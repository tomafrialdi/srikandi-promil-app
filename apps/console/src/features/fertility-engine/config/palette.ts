import {
  Baby, Check, CheckCircle, Drop, Egg, Funnel, Heart, Hourglass, Moon, Pulse, Sigma, Sparkle, Sun, Syringe, Target, Thermometer, Tray, PaperPlaneTilt, GitBranch,
  type Icon,
} from '@phosphor-icons/react'

/** Icons a status (or mode) may use; stored by name in the config. */
export const ICONS: Record<string, Icon> = {
  baby: Baby,
  drop: Drop,
  sparkle: Sparkle,
  sun: Sun,
  hourglass: Hourglass,
  moon: Moon,
  egg: Egg,
  'check-circle': CheckCircle,
  thermometer: Thermometer,
  heart: Heart,
  pulse: Pulse,
  syringe: Syringe,
  target: Target,
  tray: Tray,
  funnel: Funnel,
  sigma: Sigma,
  flow: GitBranch,
  send: PaperPlaneTilt,
  check: Check,
}

export const STATUS_ICON_CHOICES = ['egg', 'sparkle', 'check-circle', 'sun', 'thermometer', 'moon', 'heart', 'drop', 'hourglass', 'baby']

export const iconFor = (name: string): Icon => ICONS[name] ?? Pulse

