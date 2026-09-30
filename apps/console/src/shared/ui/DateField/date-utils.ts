/** Dates are plain local strings ("2026-05-21", "2026-05-21T14:30"), exactly what <input type="date|datetime-local"> used. */
export interface YMD {
  y: number
  /** 0-based month */
  m: number
  d: number
}

export const pad = (n: number) => String(n).padStart(2, '0')
export const toIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

export function parseDate(value: string | undefined | null): YMD | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '')
  if (!match) return null
  const parsed = { y: Number(match[1]), m: Number(match[2]) - 1, d: Number(match[3]) }
  return new Date(parsed.y, parsed.m, parsed.d).getMonth() === parsed.m ? parsed : null
}

export const todayIso = () => {
  const now = new Date()
  return toIso(now.getFullYear(), now.getMonth(), now.getDate())
}

export const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate()
/** Weeks start on Monday: 0 = Mon … 6 = Sun. */
export const weekdayIndex = (y: number, m: number, d: number) => (new Date(y, m, d).getDay() + 6) % 7

export function addDays(iso: string, days: number): string {
  const p = parseDate(iso)!
  const next = new Date(p.y, p.m, p.d + days)
  return toIso(next.getFullYear(), next.getMonth(), next.getDate())
}

/** Same day-of-month in another month, clamped (31 Jan + 1 month → 28 Feb). */
export function addMonths(iso: string, months: number): string {
  const p = parseDate(iso)!
  const target = new Date(p.y, p.m + months, 1)
  return toIso(target.getFullYear(), target.getMonth(), Math.min(p.d, daysInMonth(target.getFullYear(), target.getMonth())))
}

const dayFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
export const MONTHS = Array.from({ length: 12 }, (_, m) => new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date(2000, m, 1)))
export const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

export function formatValue(value: string, withTime: boolean): string {
  const p = parseDate(value)
  if (!p) return ''
  const text = dayFormat.format(new Date(p.y, p.m, p.d))
  const time = /T(\d{2}:\d{2})/.exec(value)?.[1]
  return withTime && time ? `${text} · ${time}` : text
}
