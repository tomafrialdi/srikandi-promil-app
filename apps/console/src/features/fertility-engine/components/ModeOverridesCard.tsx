import { ArrowRight, Stethoscope } from '@phosphor-icons/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '../../../shared/ui'
import { cn } from '../../../shared/lib/cn'
import { COLORS, MODES, slugOf } from '../engine/fields'
import { approvalsLine, fmtWeight } from '../lib'
import type { Approval, EngineConfig, ModeKey } from '../types'

const ROW_KEYS = ['lh_rule', 'cycle_len', 'late_alert', 'min_signals']

interface ModeOverridesCardProps {
  config?: EngineConfig
  approvals: Approval[]
}

/** Compact "what differs from TTC" view; the full editor is the mode page. */
export function ModeOverridesCard({ config, approvals }: ModeOverridesCardProps) {
  const [mode, setMode] = useState<ModeKey>('pcos')
  const ttc = config?.modes.ttc
  const cur = config?.modes[mode]
  const tone = cur ? COLORS[cur.meta.color] : COLORS.primary

  const rows: Array<{ label: string; sub?: string; value: string; changed: boolean }> = []
  if (cur && ttc) {
    const cal = cur.weights.calendar
    rows.push({
      label: 'Calendar prior weight',
      sub: cal !== ttc.weights.calendar ? `was ${fmtWeight(ttc.weights.calendar)}` : undefined,
      value: cal === 0 && mode === 'iui_ivf' ? 'off' : fmtWeight(cal),
      changed: cal !== ttc.weights.calendar,
    })
    const params = [...cur.params.filter((p) => ROW_KEYS.includes(p.key)), ...cur.params.filter((p) => !ROW_KEYS.includes(p.key))].slice(0, 4)
    for (const p of params) {
      const base = ttc.params.find((x) => x.key === p.key)
      rows.push({ label: p.label, sub: p.note ?? (p.base ? `TTC: ${p.base}` : base && base.value !== p.value ? `TTC: ${base.value}` : undefined), value: p.value, changed: !!base && base.value !== p.value })
    }
  }
  const line = approvalsLine(approvals)

  return (
    <Card className="gap-3">
      <CardHeader
        title="Mode overrides"
        action={
          <Link to={`/fertility-engine/modes/${slugOf(mode)}`} className="inline-flex items-center gap-1 text-12 font-bold text-primary hover:underline">
            Open {cur?.meta.label ?? 'mode'} rules <ArrowRight size={12} weight="bold" />
          </Link>
        }
      />
      <div className="inline-flex gap-0.5 self-start rounded-lg bg-surface-alt p-[3px]" role="tablist" aria-label="Mode">
        {MODES.map((m) => (
          <button key={m.key} type="button" role="tab" aria-selected={m.key === mode} className={cn('rounded-md px-3 py-1.5 text-12 font-bold', m.key === mode ? 'bg-card shadow-[0_1px_2px_rgba(26,26,24,0.08)]' : 'text-ink-muted')} onClick={() => setMode(m.key)}>
            {m.label}
          </button>
        ))}
      </div>
      <ul className="m-0 flex list-none flex-col p-0">
        {rows.map((r) => (
          <li key={r.label} className="flex items-center justify-between gap-3 border-t border-border py-3">
            <span className="flex min-w-0 flex-col">
              <span className="text-13 font-bold">{r.label}</span>
              {r.sub && <span className="text-11" style={{ color: r.changed ? tone.hex : 'var(--ink-muted)' }}>{r.sub}</span>}
            </span>
            <span
              className="max-w-[55%] truncate rounded-lg border px-2.5 py-1.5 font-mono text-12 font-semibold"
              style={r.changed ? { background: tone.soft, borderColor: tone.hex, color: 'var(--ink)' } : { background: 'var(--surface-alt)', borderColor: 'transparent' }}
            >
              {r.value}
            </span>
          </li>
        ))}
      </ul>
      {line && (
        <div className="flex items-start gap-2.5 rounded-xl bg-warning-soft px-3.5 py-3 text-12 leading-snug font-semibold text-warning-ink">
          <Stethoscope size={16} className="mt-px flex-none" />
          {line}
        </div>
      )}
    </Card>
  )
}
