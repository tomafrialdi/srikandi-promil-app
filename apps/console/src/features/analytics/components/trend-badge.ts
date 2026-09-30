import type { BadgeTone } from '../../../shared/ui'

export interface TrendBadge {
  tone: BadgeTone
  text: string
}

interface Options {
  unit?: '%' | ' pts' | 's' | ''
  digits?: number
  /** Lower is better (e.g. churn, CAC): a decrease is shown as good. */
  inverse?: boolean
  /** Prefix for the value, e.g. "Rp ". */
  prefix?: string
  /** Custom formatter for the absolute value (overrides digits/prefix). */
  format?: (absolute: number) => string
}

/** "↑ 5.2%" / "↓ 0.1" style badge for a signed change; null when there is nothing to compare. */
export function trendBadge(delta: number | null | undefined, options: Options = {}): TrendBadge | null {
  if (delta == null || Number.isNaN(delta)) return null
  const { unit = '', digits = 1, inverse = false, prefix = '', format } = options
  const rising = delta >= 0
  const good = inverse ? !rising : rising
  const tone: BadgeTone = delta === 0 ? 'neutral' : good ? 'success' : 'warning'
  const value = format ? format(Math.abs(delta)) : `${prefix}${Number(Math.abs(delta).toFixed(digits))}${unit}`
  return { tone, text: `${rising ? '↑' : '↓'} ${value}` }
}
