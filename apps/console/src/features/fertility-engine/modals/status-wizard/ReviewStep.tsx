import { Warning } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { cn } from '../../../../shared/lib/cn'
import { ModalSection, Notice } from '../../../../shared/ui'
import { runSuite, suiteSummary } from '../../engine/golden'
import { statusImpact, withStatus } from '../../engine/overlap'
import type { EngineConfig, GoldenCase } from '../../types'
import { toStatus, type StatusForm } from './status-form'

interface StepProps {
  form: StatusForm
  config: EngineConfig
  cases: GoldenCase[]
  draft: string
}

const TILE = {
  success: 'bg-success-soft text-success',
  info: 'bg-secondary-soft text-secondary',
  pink: 'bg-primary-soft text-primary',
}

export function ReviewStep({ form, config, cases, draft }: StepProps) {
  const status = useMemo(() => toStatus(form), [form])
  const next = useMemo(() => withStatus(config, status), [config, status])
  const results = useMemo(() => runSuite(cases, config, next), [cases, config, next])
  const summary = suiteSummary(results)
  const impact = useMemo(() => statusImpact(next, status.key, cases), [next, status.key, cases])
  const above = next.statuses.find((s) => s.order === (next.statuses.find((x) => x.key === status.key)?.order ?? 0) - 1)
  const conflicts = above ? impact.overlap(above.key) : 0

  return (
    <>
      <div className="grid grid-cols-2 gap-3 min-[701px]:grid-cols-4">
        <div className={cn('flex flex-col gap-0.5 rounded-xl p-3', TILE.success)}>
          <span className="text-11 font-bold">Golden tests</span>
          <span className="text-15 font-extrabold text-ink">{summary.pass} / {summary.total} pass</span>
        </div>
        <div className={cn('flex flex-col gap-0.5 rounded-xl p-3', TILE.info)}>
          <span className="text-11 font-bold">Cases entering it</span>
          <span className="text-15 font-extrabold text-ink">{impact.casesHit} / {cases.length}</span>
        </div>
        <div className={cn('flex flex-col gap-0.5 rounded-xl p-3', TILE.pink)}>
          <span className="text-11 font-bold">Cycle days affected</span>
          <span className="text-15 font-extrabold text-ink">{impact.daysHit} days</span>
        </div>
        <div className={cn('flex flex-col gap-0.5 rounded-xl p-3', conflicts === 0 ? TILE.success : 'bg-warning-soft text-warning-ink')}>
          <span className="text-11 font-bold">Conflicts</span>
          <span className="text-15 font-extrabold text-ink">{conflicts} with {above?.name ?? 'the status above'}</span>
        </div>
      </div>

      <ModalSection label="Simulator results">
        <ul className="m-0 flex shrink-0 list-none flex-col overflow-hidden rounded-xl border border-border p-0">
          {results.map((r) => {
            const day = impact.firstDay[r.case.key]
            const verdict = r.change === 'regressed' ? { t: 'fail', c: 'bg-error-soft text-error' } : r.change === 'improved' || r.change === 'changed' ? { t: 'review', c: 'bg-warning-soft text-warning-ink' } : { t: 'pass', c: 'bg-success-soft text-success' }
            return (
              <li key={r.case.key} className="grid min-h-10 grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-3.5 py-2 last:border-b-0">
                <span className="truncate text-12 font-semibold">{r.case.key}</span>
                <span className="truncate text-12 font-medium text-ink-muted">{day != null ? `Enters CD ${day}` : 'Never enters'}{r.change === 'regressed' ? ' · prediction got worse' : ''}</span>
                <span className={cn('rounded-full px-2.5 py-0.5 text-11 font-bold', verdict.c)}>{verdict.t}</span>
              </li>
            )
          })}
        </ul>
        {summary.failed > 0 ? (
          <Notice tone="error" icon={<Warning size={16} />}>
            {summary.failed} failing case{summary.failed === 1 ? '' : 's'}: {summary.blocking.map((b) => b.case.key).join(', ')}. You can still save the draft, but it can't be submitted for review until this is fixed.
          </Notice>
        ) : (
          <Notice icon={<Warning size={16} />}>No regressions. Saving puts this into {draft}; it goes live only after 2 medical approvals and a 5% canary.</Notice>
        )}
      </ModalSection>
    </>
  )
}
