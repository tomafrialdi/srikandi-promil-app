import type { Cond, Groups, StatusDef } from '../types'
import { FIELD_BY_KEY } from './fields'

const OP_TEXT: Record<string, string> = { '=': '=', '≠': '!=', '≥': '>=', '≤': '<=', '>': '>', '<': '<', between: 'in' }

/** "lh = high", "score ≥ 0.55" — used in the status table. */
export function condText(c: Cond): string {
  return `${c.field} ${c.op} ${c.value}`
}

/** [[a, b], [c]] -> "(a AND b) OR c" (parentheses only when a group has several conditions and there are several groups). */
export function groupsText(groups: Groups): string {
  const parts = groups.map((group) => {
    const text = group.map(condText).join(' AND ')
    return group.length > 1 && groups.length > 1 ? `(${text})` : text
  })
  return parts.join(' OR ')
}

/** Code-style preview shown in the wizard. */
function sourceCond(c: Cond): string {
  const op = OP_TEXT[c.op] ?? c.op
  if (c.op === 'between') return `${c.field} in ${c.value.replace(/\s*[-–]\s*/, '..')}`
  if (/ OR /.test(c.value)) return `${c.field} in [${c.value.split(/ OR /).map((v) => v.trim()).join(', ')}]`
  return `${c.field} ${op} ${c.value}`
}

export function ruleSource(status: Pick<StatusDef, 'key' | 'entry' | 'exit' | 'order' | 'modes'>): string {
  const join = (groups: Groups) =>
    groups
      .map((g) => {
        const text = g.map(sourceCond).join(' AND ')
        return g.length > 1 && groups.length > 1 ? `(${text})` : text
      })
      .join('\n          OR ')
  return [
    `status ${status.key} {`,
    `  enter when ${status.entry.length ? join(status.entry) : '(nothing yet)'}`,
    status.exit.length ? `  exit  when ${join(status.exit)}` : null,
    `  order ${status.order} · modes [${status.modes.join(', ')}]`,
    '}',
  ]
    .filter(Boolean)
    .join('\n')
}

export function usedSignals(status: Pick<StatusDef, 'entry' | 'exit'>): string[] {
  const set = new Set<string>()
  for (const g of [...status.entry, ...status.exit]) {
    for (const c of g) {
      const f = FIELD_BY_KEY[c.field]
      if (f && f.signal !== 'derived') set.add(f.signal)
    }
  }
  return [...set]
}

export function defaultRuleText(status: StatusDef): string {
  return status.default ? 'default' : groupsText(status.entry)
}

export function exitRuleText(status: StatusDef): string {
  return status.exit.length ? groupsText(status.exit) : '—'
}
