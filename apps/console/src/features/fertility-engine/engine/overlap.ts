import type { EngineConfig, GoldenCase, StatusDef } from '../types'
import { evalGroups, simulate } from './simulate'

/** Returns config with `status` inserted (or replaced) at the requested position. `status.order` = order of the status it goes before. */
export function withStatus(config: EngineConfig, status: StatusDef): EngineConfig {
  const others = config.statuses.filter((s) => s.key !== status.key).sort((a, b) => a.order - b.order)
  let at = others.findIndex((s) => s.order === status.order)
  if (at < 0) at = others.findIndex((s) => s.default)
  if (at < 0) at = others.length
  const list = [...others.slice(0, at), status, ...others.slice(at)].map((s, i) => ({ ...s, order: i + 1 }))
  return { ...config, statuses: list }
}

export interface StatusImpact {
  /** Cases where the status fires at least once. */
  casesHit: number
  /** Total case-days on which it fires. */
  daysHit: number
  /** First day per case the status shows up (null = never). */
  firstDay: Record<string, number | null>
  /** Cases where the status' entry rule and `otherKey`'s entry rule are true on the same day. */
  overlap: (otherKey: string) => number
}

/** How a status behaves on the golden cases (config must already contain it). */
export function statusImpact(config: EngineConfig, key: string, cases: GoldenCase[]): StatusImpact {
  const status = config.statuses.find((s) => s.key === key)
  const runs = cases.map((c) => ({ c, res: simulate(config, c.mode, c.signals, c.truth_ov) }))
  const firstDay: Record<string, number | null> = {}
  let casesHit = 0
  let daysHit = 0
  for (const { c, res } of runs) {
    const hit = res.days.filter((d) => d.status === key)
    firstDay[c.key] = hit[0]?.cd ?? null
    if (hit.length) casesHit += 1
    daysHit += hit.length
  }
  return {
    casesHit,
    daysHit,
    firstDay,
    overlap: (otherKey) => {
      const other = config.statuses.find((s) => s.key === otherKey)
      if (!status || !other) return 0
      return runs.filter(({ res }) => res.days.some((d) => evalGroups(status.entry, d.fields) && evalGroups(other.entry, d.fields))).length
    },
  }
}
