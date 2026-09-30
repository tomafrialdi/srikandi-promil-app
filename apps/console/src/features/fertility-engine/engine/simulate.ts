import type { ColorKey, EngineConfig, Groups, ModeKey, Signals, StatusDef } from '../types'
import { FIELD_BY_KEY } from './fields'

/** Number of cycle days the simulator grid covers. */
export const SIM_DAYS = 24

type Val = string | number | boolean
export type Fields = Record<string, Val>

const LH_NAMES = ['none', 'low', 'high', 'peak']
const CM_NAMES = ['dry', 'sticky', 'watery', 'egg_white']

function ordinal(field: string, value: string): number {
  return FIELD_BY_KEY[field]?.options?.indexOf(value.trim()) ?? -1
}

/** Evaluates one condition against the derived fields of a day. Unknown fields never match. */
export function evalCond(c: { field: string; op: string; value: string }, fields: Fields): boolean {
  const actual = fields[c.field]
  const def = FIELD_BY_KEY[c.field]
  if (actual === undefined || !def) return false

  if (c.op === 'between') {
    const [lo, hi] = c.value.split(/\s*(?:[-–]|\.\.)\s*/).map(Number)
    return typeof actual === 'number' && lo !== undefined && hi !== undefined && actual >= lo && actual <= hi
  }
  const alternatives = c.value.split(/\s+OR\s+/i)
  const one = (raw: string): boolean => {
    if (def.type === 'bool') return (c.op === '=') === (String(actual) === raw.trim())
    if (def.type === 'enum') {
      const a = ordinal(c.field, String(actual))
      const b = ordinal(c.field, raw)
      if (b < 0) return false
      return c.op === '=' ? a === b : c.op === '≠' ? a !== b : c.op === '≥' ? a >= b : c.op === '≤' ? a <= b : c.op === '>' ? a > b : a < b
    }
    const b = parseFloat(raw)
    const a = Number(actual)
    if (Number.isNaN(b)) return false
    return c.op === '=' ? a === b : c.op === '≠' ? a !== b : c.op === '≥' ? a >= b : c.op === '≤' ? a <= b : c.op === '>' ? a > b : a < b
  }
  return c.op === '≠' ? alternatives.every(one) : alternatives.some(one)
}

/** An empty group list means "never" here; the default status is handled separately. */
export function evalGroups(groups: Groups, fields: Fields): boolean {
  return groups.some((g) => g.length > 0 && g.every((c) => evalCond(c, fields)))
}

interface RuleEntry {
  key: string
  name: string
  color: ColorKey
  order: number
  entry: Groups
  exit: Groups
  isDefault: boolean
}

/** The status list a mode actually runs: overrides applied, hidden statuses dropped, mode-only statuses before the default. */
export function rulesetFor(config: EngineConfig, mode: ModeKey): RuleEntry[] {
  const overrides = new Map(config.modes[mode].status_overrides.map((o) => [o.status, o]))
  const base = config.statuses.filter((s) => s.modes.includes(mode)).sort((a, b) => a.order - b.order)
  const list: RuleEntry[] = base
    .filter((s) => overrides.get(s.key)?.kind !== 'hidden')
    .map((s: StatusDef) => {
      const o = overrides.get(s.key)
      return { key: s.key, name: o?.rename ?? s.name, color: s.color, order: s.order, entry: o?.entry ?? s.entry, exit: s.exit, isDefault: s.default }
    })
  const extras: RuleEntry[] = config.modes[mode].status_overrides
    .filter((o) => o.kind === 'extra')
    .map((o, i) => ({ key: o.status, name: o.name ?? o.status, color: o.color ?? 'gray', order: 900 + i, entry: o.entry ?? [], exit: [], isDefault: false }))
  const at = list.findIndex((r) => r.isDefault)
  return at < 0 ? [...list, ...extras] : [...list.slice(0, at), ...extras, ...list.slice(at)]
}

export interface DayResult {
  cd: number
  status: string
  name: string
  color: ColorKey
  score: number
  fields: Fields
}

export type Verdict = 'correct' | 'early' | 'late' | 'missed' | 'unknown'

export interface SimResult {
  days: DayResult[]
  firstPeak: number | null
  predictedOv: number | null
  confidence: number
  verdict: Verdict
  /** Days between the prediction and the clinician-confirmed ovulation (negative = early). */
  error: number | null
}

/** Replays a signal sequence through the status rules of one config, day by day. */
export function simulate(config: EngineConfig, mode: ModeKey, signals: Signals, truthOv?: number): SimResult {
  const w = config.modes[mode].weights
  const rules = rulesetFor(config, mode)
  const bbtOn = mode !== 'iui_ivf'
  const early = signals.bbt.slice(0, 6).filter((v): v is number => v != null)
  const baseline = early.length ? early.reduce((a, b) => a + b, 0) / early.length : null
  const calendarOv = 14

  let prev: RuleEntry | undefined
  let streak = 0
  let lastPeak: number | null = null
  let run = 0
  let runStart = 0
  let confirmed = false
  let shiftStart: number | null = null
  const days: DayResult[] = []

  for (let d = 1; d <= SIM_DAYS; d++) {
    const lh = signals.lh[d - 1] ?? 0
    const cf = signals.cf[d - 1] ?? 0
    const b = signals.bbt[d - 1] ?? null

    streak = lh >= 2 ? streak + 1 : 0
    if (lh === 3) lastPeak = d
    const elevated = bbtOn && baseline != null && b != null && b >= baseline + 0.2 - 1e-9
    if (elevated) {
      if (run === 0) runStart = d
      run += 1
    } else {
      run = 0
    }
    if (!confirmed && run >= 3) {
      confirmed = true
      shiftStart = runStart
    }
    const peakSeen = lastPeak != null
    const ovConfirmed = confirmed || (peakSeen && d - lastPeak! >= 2 && cf <= 1)
    const ovEst = confirmed && shiftStart != null ? shiftStart - 2 : peakSeen ? lastPeak! + 1 : calendarOv
    const score =
      w.lh * (lh / 3) + w.cf * (cf / 3) + w.bbt * (confirmed ? 1 : run > 0 ? 0.5 : 0) + w.calendar * Math.exp(-((d - calendarOv) ** 2) / 18)

    const fields: Fields = {
      lh: LH_NAMES[lh] ?? 'none',
      cm: CM_NAMES[cf] ?? 'dry',
      flow: d <= 5 ? 'light' : 'none',
      cd: d,
      score: Math.round(score * 100) / 100,
      days_to_ov: ovEst - d,
      dpo: ovConfirmed ? d - ovEst : -99,
      bbt_shift_days: run,
      bbt_shift_delta: baseline != null && b != null ? Math.round((b - baseline) * 100) / 100 : 0,
      bbt_shift_confirmed: confirmed,
      lh_peak_days_ago: peakSeen ? d - lastPeak! : 99,
      lh_high_streak: streak,
      cm_after_peak: CM_NAMES[cf] ?? 'dry',
      ovulation_confirmed: ovConfirmed,
      period_started: false,
      positive_test: false,
      hcg: 0,
      fever_flag: false,
      pregnancy_mode: false,
      test_result: 'none',
      days_since_peak: peakSeen ? d - lastPeak! : 99,
      flow_none_days: Math.max(0, d - 5),
      cycles_since_loss: 2,
      days_since_procedure: -1,
      status: prev?.key ?? 'low_fertility',
    }

    const entered = rules.find((r) => (r.isDefault ? true : evalGroups(r.entry, fields)))
    let current = entered
    if (prev && !prev.isDefault && prev.exit.length > 0 && !evalGroups(prev.exit, fields) && (!entered || entered.order > prev.order)) {
      current = prev
    }
    const chosen = current ?? rules[rules.length - 1]
    if (chosen) {
      days.push({ cd: d, status: chosen.key, name: chosen.name, color: chosen.color, score: fields.score as number, fields })
      prev = chosen
    }
  }

  const peak = days.find((x) => x.status === 'peak')?.cd ?? null
  const predictedOv = peak != null ? peak + 1 : null
  const signalsUsed = [signals.lh.some((v) => v > 0), signals.cf.some((v) => v > 0), signals.bbt.some((v) => v != null)].filter(Boolean).length
  let confidence = 0.45 + 0.13 * signalsUsed + (predictedOv != null ? 0.06 : 0)
  if (predictedOv != null && shiftStart != null && Math.abs(predictedOv - (shiftStart - 2)) > 1) confidence -= 0.2
  confidence = Math.min(0.96, Math.max(0.3, confidence))

  let verdict: Verdict = 'unknown'
  let error: number | null = null
  if (truthOv != null) {
    if (predictedOv == null) verdict = 'missed'
    else {
      error = predictedOv - truthOv
      verdict = Math.abs(error) <= 1 ? 'correct' : error < 0 ? 'early' : 'late'
    }
  }
  return { days, firstPeak: peak, predictedOv, confidence: Math.round(confidence * 100), verdict, error }
}

/** Plain-language facts about a signal sequence, for the note under the grid. */
export function describeSignals(signals: Signals): { lhRises: number[]; shiftStart: number | null } {
  const lhRises: number[] = []
  signals.lh.forEach((lvl, i) => {
    if (lvl === 3 && (signals.lh[i - 1] ?? 0) < 3) lhRises.push(i + 1)
  })
  const early = signals.bbt.slice(0, 6).filter((v): v is number => v != null)
  const baseline = early.length ? early.reduce((a, b) => a + b, 0) / early.length : null
  let run = 0
  let start = 0
  let shiftStart: number | null = null
  for (let i = 0; i < signals.bbt.length && shiftStart == null; i++) {
    const b = signals.bbt[i]
    if (baseline != null && b != null && b >= baseline + 0.2 - 1e-9) {
      if (run === 0) start = i + 1
      run += 1
      if (run >= 3) shiftStart = start
    } else run = 0
  }
  return { lhRises, shiftStart }
}
