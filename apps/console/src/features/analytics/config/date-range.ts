export interface DateRange {
  /** Inclusive, YYYY-MM-DD (Jakarta calendar days). */
  from: string
  to: string
  preset: RangePresetKey
  label: string
}

export type RangePresetKey = '7d' | '30d' | '90d' | '180d'

export const RANGE_PRESETS: Array<{ key: RangePresetKey; days: number; label: string }> = [
  { key: '7d', days: 7, label: 'Last 7 days' },
  { key: '30d', days: 30, label: 'Last 30 days' },
  { key: '90d', days: 90, label: 'Last 90 days' },
  { key: '180d', days: 180, label: 'Last 180 days' },
]

export const DEFAULT_RANGE: RangePresetKey = '90d'

const jakartaDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const shortDateYear = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

function addDays(isoDay: string, days: number): string {
  const d = new Date(`${isoDay}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function isRangePreset(value: string | null): value is RangePresetKey {
  return RANGE_PRESETS.some((p) => p.key === value)
}

/** Ranges end on the last *complete* day (yesterday, Jakarta) so daily charts are never half-filled. */
export function resolveRange(preset: RangePresetKey, now = new Date()): DateRange {
  const days = RANGE_PRESETS.find((p) => p.key === preset)?.days ?? 90
  const to = addDays(jakartaDay.format(now), -1)
  const from = addDays(to, -(days - 1))
  const label = `${shortDate.format(new Date(`${from}T00:00:00Z`))} – ${shortDateYear.format(new Date(`${to}T00:00:00Z`))}`
  return { from, to, preset, label }
}
