import type { EngineConfig, GoldenCase } from '../types'
import { simulate, type SimResult } from './simulate'

export type CaseChange = 'improved' | 'changed' | 'unchanged' | 'regressed'

export interface CaseResult {
  case: GoldenCase
  a: SimResult
  b: SimResult
  change: CaseChange
  /** The new version gets this case right. */
  pass: boolean
}

const miss = 99
const errOf = (r: SimResult) => (r.error == null ? miss : Math.abs(r.error))

/** Runs every golden case against two configs (a = reference, b = candidate). */
export function runSuite(cases: GoldenCase[], a: EngineConfig, b: EngineConfig): CaseResult[] {
  return cases.map((c) => {
    const ra = simulate(a, c.mode, c.signals, c.truth_ov)
    const rb = simulate(b, c.mode, c.signals, c.truth_ov)
    const same = ra.days.every((d, i) => d.status === rb.days[i]?.status)
    const change: CaseChange = errOf(rb) < errOf(ra) ? 'improved' : errOf(rb) > errOf(ra) ? 'regressed' : same ? 'unchanged' : 'changed'
    return { case: c, a: ra, b: rb, change, pass: rb.verdict === 'correct' }
  })
}

/** A case only blocks a release when it passed on the reference version and fails on the candidate. */
export function suiteSummary(results: CaseResult[]) {
  const pass = results.filter((r) => r.pass).length
  const blocking = results.filter((r) => !r.pass && r.a.verdict === 'correct')
  return { pass, total: results.length, failed: blocking.length, blocking }
}
