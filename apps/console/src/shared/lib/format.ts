const numberFormat = new Intl.NumberFormat('en-US')

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value == null) return '—'
  return `${Number(value.toFixed(digits))}%`
}

/** "↑ +4.2%" / "↓ -1.0%" */
export function formatDelta(value: number | null | undefined): string {
  if (value == null) return '—'
  const arrow = value >= 0 ? '↑' : '↓'
  const sign = value >= 0 ? '+' : ''
  return `${arrow} ${sign}${value}%`
}

/** 911_100_000 -> "Rp 911.1jt" */
export function formatIdrCompact(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(1)}M`
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)}jt`
  if (value >= 1_000) return `Rp ${(value / 1_000).toFixed(1)}rb`
  return `Rp ${value}`
}

/** 12000 -> "12K" */
export function formatCompact(value: number): string {
  return value >= 1000 ? `${Number((value / 1000).toFixed(1))}K` : String(value)
}

export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return `${days} d ago`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function toPercentOf(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0
}
